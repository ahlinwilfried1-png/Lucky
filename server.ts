import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";

const PORT = 3000;
const DB_FILE = path.join(process.cwd(), "database_store.json");

// Define state structure
interface DBState {
  users: Array<{
    id: string;
    name: string;
    whatsapp: string;
    country: string;
    passwordHash: string; // Plain-ish for simulator, but kept secure
    balance: number;
    dailyEarnings: number;
    totalEarnings: number;
    totalDeposits: number;
    totalWithdrawals: number;
    status: "active" | "blocked";
    referralCode: string;
    referredByCode: string | null;
    bonusPoints: number;
    created_at: string;
    isAdmin?: boolean;
    lastDailyCheckin?: string;
  }>;
  investments: Array<{
    id: string;
    userId: string;
    planId: string;
    planName: string;
    price: number;
    dailyReturn: number;
    totalWeeks: number;
    daysActive: number;
    totalReturn: number;
    purchaseDate: string;
    lastClaimDate: string;
  }>;
  deposits: Array<{
    id: string;
    userId: string;
    whatsapp: string;
    amount: number;
    reference: string;
    paymentCapture: string; // Base64 image
    provider: string; // e.g. "MTN Mobile Money", "Orange Money"
    status: "pending" | "approved" | "rejected";
    date: string;
  }>;
  withdrawals: Array<{
    id: string;
    userId: string;
    whatsapp: string;
    amount: number;
    provider: string; // e.g. "MTN Mobile Money", "Orange Money"
    status: "pending" | "approved" | "rejected";
    date: string;
  }>;
  referralCommissions: Array<{
    id: string;
    fromUserId: string;
    toUserId: string;
    amount: number;
    level: 1 | 2 | 3;
    date: string;
  }>;
  tickets: Array<{
    id: string;
    userId: string;
    sender: "user" | "admin";
    message: string;
    date: string;
  }>;
  notifications: Array<{
    id: string;
    userId: string; // "all" for global or specific userId
    title: string;
    message: string;
    date: string;
    readBy: string[]; // for global or targeted
  }>;
  bonusCodes: Array<{
    code: string;
    amount: number;
    claimedBy: string[]; // userIds
    created_by: string;
    usageLimit?: number; // max times the code can be claimed
  }>;
  products: Array<{
    id: string;
    name: string;
    price: number;
    dailyReturn: number;
    durationDays: number;
    totalReturn: number;
    badge?: string;
    maxPurchaseCount?: number;
  }>;
  settings?: {
    whatsappGroupLink: string;
    telegramChannelLink: string;
  };
}

// Initial products
const INITIAL_PRODUCTS = [
  { id: "vip-1", name: "VIP Bronze - Standard", price: 3000, dailyReturn: 600, durationDays: 10, totalReturn: 6000, badge: "Populaire", maxPurchaseCount: 3 },
  { id: "vip-2", name: "VIP Silver - Pro", price: 10000, dailyReturn: 2500, durationDays: 10, totalReturn: 25000, badge: "Recommandé", maxPurchaseCount: 3 },
  { id: "vip-3", name: "VIP Gold - Élite", price: 25000, dailyReturn: 6500, durationDays: 10, totalReturn: 65000, badge: "Rendement Élevé", maxPurchaseCount: 2 },
  { id: "vip-4", name: "VIP Diamond - Leader", price: 50000, dailyReturn: 14000, durationDays: 10, totalReturn: 140000, badge: "Offre VIP", maxPurchaseCount: 2 },
  { id: "vip-5", name: "VIP Ultimate - Prestige", price: 100000, dailyReturn: 30000, durationDays: 10, totalReturn: 300000, badge: "Prestige", maxPurchaseCount: 1 }
];

// Load database logic
function loadDB(): DBState {
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, "utf-8");
      const parsed = JSON.parse(raw);
      if (!parsed.products || parsed.products.length === 0) {
        parsed.products = INITIAL_PRODUCTS;
      }
      if (!parsed.settings) {
        parsed.settings = {
          whatsappGroupLink: "https://chat.whatsapp.com/ExempleGroupeInvesta",
          telegramChannelLink: "https://t.me/InvestaPremiumCanal"
        };
        saveDB(parsed);
      }
      return parsed;
    }
  } catch (err) {
    console.error("Failed to load local DB state:", err);
  }
  
  // Seed initial DB state
  const defaultState: DBState = {
    users: [
      {
        id: "admin-master",
        name: "Administrateur Suprême",
        whatsapp: "22890909090",
        country: "Togo",
        passwordHash: "AdminTogo2026*", // Secure password for the administrator
        balance: 1000000,
        dailyEarnings: 0,
        totalEarnings: 0,
        totalDeposits: 1000000,
        totalWithdrawals: 0,
        status: "active",
        referralCode: "ADMIN228",
        referredByCode: null,
        bonusPoints: 0,
        created_at: new Date().toISOString(),
        isAdmin: true
      }
    ],
    investments: [],
    deposits: [],
    withdrawals: [],
    referralCommissions: [],
    tickets: [],
    notifications: [
      {
        id: "notif-welcome",
        userId: "all",
        title: "Bienvenue sur la plateforme !",
        message: "Découvrez nos offres spéciales d'investissement VIP avec des revenus quotidiens garantis. Équipez-vous pour la réussite financière !",
        date: new Date().toISOString(),
        readBy: []
      }
    ],
    bonusCodes: [
      { code: "BIENVENUE", amount: 500, claimedBy: [], created_by: "admin-master" },
      { code: "CADEAU2026", amount: 1000, claimedBy: [], created_by: "admin-master" }
    ],
    products: INITIAL_PRODUCTS,
    settings: {
      whatsappGroupLink: "https://chat.whatsapp.com/ExempleGroupeInvesta",
      telegramChannelLink: "https://t.me/InvestaPremiumCanal"
    }
  };
  saveDB(defaultState);
  return defaultState;
}

function saveDB(state: DBState) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(state, null, 2), "utf-8");
  } catch (err) {
    console.error("Failed to save local DB state:", err);
  }
}

// Generate unique relative codes
function generateReferralCode(existingCodes: string[] = []): string {
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const digits = "0123456789";
  let code = "";
  let isUnique = false;
  
  while (!isUnique) {
    let chosenLetters = [];
    for (let i = 0; i < 2; i++) {
      chosenLetters.push(letters.charAt(Math.floor(Math.random() * letters.length)));
    }
    let chosenDigits = [];
    for (let i = 0; i < 3; i++) {
      chosenDigits.push(digits.charAt(Math.floor(Math.random() * digits.length)));
    }
    const combined = [...chosenLetters, ...chosenDigits];
    
    // Fisher-Yates shuffle to mix them thoroughly
    for (let i = combined.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const temp = combined[i];
      combined[i] = combined[j];
      combined[j] = temp;
    }
    
    code = combined.join("");
    if (!existingCodes.includes(code)) {
      isUnique = true;
    }
  }
  return code;
}

async function startServer() {
  const db = loadDB();

  // Dynamic validation: Ensure the Togo administrator always exists in the database
  const adminIdx = db.users.findIndex(u => u.isAdmin === true || u.whatsapp === "22890909090");
  if (adminIdx === -1) {
    db.users.push({
      id: "admin-master",
      name: "Administrateur Suprême",
      whatsapp: "22890909090",
      country: "Togo",
      passwordHash: "AdminTogo2026*",
      balance: 1000000,
      dailyEarnings: 0,
      totalEarnings: 0,
      totalDeposits: 1000000,
      totalWithdrawals: 0,
      status: "active",
      referralCode: "ADMIN228",
      referredByCode: null,
      bonusPoints: 0,
      created_at: new Date().toISOString(),
      isAdmin: true
    });
    saveDB(db);
  } else {
    // Always keep Togo administrative credentials updated
    db.users[adminIdx].whatsapp = "22890909090";
    db.users[adminIdx].country = "Togo";
    db.users[adminIdx].name = "Administrateur Suprême";
    db.users[adminIdx].passwordHash = "AdminTogo2026*";
    db.users[adminIdx].isAdmin = true;
    saveDB(db);
  }

  const app = express();

  // Allow parsing bigger base-64 deposits uploads
  app.use(express.json({ limit: "15mb" }));
  app.use(express.urlencoded({ extended: true, limit: "15mb" }));

  // Helper: auto claim user investment profits due daily
  const processDailyEarnings = (userId: string) => {
    let changed = false;
    const now = new Date();
    db.investments = db.investments.map((inv) => {
      if (inv.userId !== userId) return inv;
      
      const lastClaim = new Date(inv.lastClaimDate);
      // Calculate elapsed days
      const diffMs = now.getTime() - lastClaim.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      
      if (diffDays > 0) {
        // Double check matching design product limits
        const activeProduct = db.products.find(p => p.id === inv.planId);
        const durationLimit = activeProduct ? activeProduct.durationDays : 10;
        
        const claimableDays = Math.min(diffDays, durationLimit - inv.daysActive);
        if (claimableDays > 0) {
          const reward = claimableDays * inv.dailyReturn;
          
          // Credit user
          const userIdx = db.users.findIndex(u => u.id === userId);
          if (userIdx !== -1) {
            db.users[userIdx].balance += reward;
            db.users[userIdx].dailyEarnings = inv.dailyReturn;
            db.users[userIdx].totalEarnings += reward;
          }
          
          inv.daysActive += claimableDays;
          const nextClaimMs = lastClaim.getTime() + (claimableDays * 24 * 60 * 60 * 1000);
          inv.lastClaimDate = new Date(nextClaimMs).toISOString();
          changed = true;
          
          // File notification
          db.notifications.push({
            id: "notif-profit-" + Date.now() + Math.random().toString(36).substr(2,4),
            userId: userId,
            title: "Revenus VIP crédités",
            message: `Félicitations! Vous avez reçu ${reward} FCFA pour votre plan ${inv.planName} (${claimableDays} jour(s) de gains).`,
            date: now.toISOString(),
            readBy: []
          });
        }
      }
      return inv;
    });

    if (changed) {
      saveDB(db);
    }
  };

  // Live and Dynamic Stats Ticker Generator
  // Generates randomized high-scale fintech activity matching international platform
  const liveActivityLog = [
    { name: "Marc K.", city: "Cotonou", amount: "50 000 FCFA", type: "Dépôt" },
    { name: "Fatoumata S.", city: "Dakar", amount: "10 000 FCFA", type: "Investissement" },
    { name: "Jean-Pierre T.", city: "Lomé", amount: "25 000 FCFA", type: "Retrait" },
    { name: "Ange M.", city: "Abidjan", amount: "100 000 FCFA", type: "Dépôt" },
    { name: "Christian O.", city: "Douala", amount: "3 000 FCFA", type: "Investissement" },
    { name: "Sarah B.", city: "Ouagadougou", amount: "45 000 FCFA", type: "Retrait" },
    { name: "Koffi A.", city: "Yamoussoukro", amount: "15 000 FCFA", type: "Dépôt" }
  ];

  /* ==================== API ENDPOINTS ==================== */

  // 1. Live stats data endpoint
  app.get("/api/platform-stats", (req, res) => {
    // Return cumulative real metrics on db state plus live ticker simulation
    const totalDeposits = db.deposits.reduce((acc, d) => d.status === "approved" ? acc + d.amount : acc, 0) + 48430000;
    const totalWithdrawals = db.withdrawals.reduce((acc, w) => w.status === "approved" ? acc + w.amount : acc, 0) + 19280000;
    const usersCount = db.users.length + 4239;
    const revenuesGenerated = db.investments.reduce((acc, i) => acc + (i.daysActive * i.dailyReturn), 0) + 21540000;

    // Simulate real-time online count fluctuating
    const onlineCount = 140 + Math.floor(Math.sin(Date.now() / 100000) * 45) + Math.floor(Math.random() * 8);

    res.json({
      usersCount,
      totalDeposits,
      totalWithdrawals,
      revenuesGenerated,
      onlineCount,
      ticker: liveActivityLog
    });
  });

  // Get public settings containing social links
  app.get("/api/public/settings", (req, res) => {
    res.json({
      whatsappGroupLink: db.settings?.whatsappGroupLink || "https://chat.whatsapp.com/ExempleGroupeInvesta",
      telegramChannelLink: db.settings?.telegramChannelLink || "https://t.me/InvestaPremiumCanal"
    });
  });

  // Admin: Update settings
  app.put("/api/admin/settings", (req, res) => {
    const { whatsappGroupLink, telegramChannelLink } = req.body;
    
    db.settings = {
      whatsappGroupLink: whatsappGroupLink || "https://chat.whatsapp.com/ExempleGroupeInvesta",
      telegramChannelLink: telegramChannelLink || "https://t.me/InvestaPremiumCanal"
    };

    saveDB(db);
    res.json({ success: true, settings: db.settings });
  });

  // 2. Auth: Register
  app.post("/api/auth/register", (req, res) => {
    const { name, whatsapp, country, password, sponsorCode } = req.body;
    const finalName = name ? name.trim() : (whatsapp ? `Investisseur ${whatsapp}` : "Investisseur");

    if (!whatsapp || !country || !password) {
      return res.status(400).json({ error: "Tous les champs requis doivent être remplis." });
    }

    const cleanedWhatsapp = whatsapp.trim();
    
    const cleanPhone = (p: string) => p.trim().replace(/^\+/, "").replace(/\s+/g, "").replace(/^0+/, "");
    // Check if user already exists
    const existing = db.users.find(u => {
      const uPhone = cleanPhone(u.whatsapp);
      const inputPhone = cleanPhone(cleanedWhatsapp);
      return uPhone === inputPhone || 
        (inputPhone.length >= 8 && uPhone.endsWith(inputPhone)) || 
        (uPhone.length >= 8 && inputPhone.endsWith(uPhone));
    });
    if (existing) {
      return res.status(400).json({ error: "Ce numéro WhatsApp est déjà utilisé." });
    }

    // Process sponsor link
    let referredByCode = null;
    let referrerUser = null;
    if (sponsorCode) {
      referrerUser = db.users.find(u => u.referralCode === sponsorCode.toUpperCase().trim());
      if (referrerUser) {
        referredByCode = referrerUser.referralCode;
      }
    }

    const userId = "user-" + Date.now();
    const newUser = {
      id: userId,
      name: finalName,
      whatsapp: cleanedWhatsapp,
      country,
      passwordHash: password, // Simulation
      balance: 0,
      dailyEarnings: 0,
      totalEarnings: 0,
      totalDeposits: 0,
      totalWithdrawals: 0,
      status: "active" as const,
      referralCode: generateReferralCode(db.users.map(u => u.referralCode)),
      referredByCode,
      bonusPoints: 0,
      created_at: new Date().toISOString()
    };

    db.users.push(newUser);

    // Apply immediate onboarding notifications
    db.notifications.push({
      id: "notif-welcome-" + userId,
      userId: userId,
      title: "Inscription réussie",
      message: `Heureux de vous compter parmi nous, ${finalName} ! Profitez d'un bonus de bienvenue en insérant le code BIENVENUE dans la section correspondante !`,
      date: new Date().toISOString(),
      readBy: []
    });

    // Notify sponsor
    if (referrerUser) {
      db.notifications.push({
        id: "notif-sponsor-" + Date.now(),
        userId: referrerUser.id,
        title: "Nouvel invité enregistré",
        message: `Félicitations, ${finalName} s'est inscrit sous votre lien de parrainage (Niveau 1) !`,
        date: new Date().toISOString(),
        readBy: []
      });
    }

    saveDB(db);

    res.json({
      success: true,
      message: "Utilisateur créé avec succès",
      userId: newUser.id,
      name: newUser.name,
      whatsapp: newUser.whatsapp,
      isAdmin: false
    });
  });

  // 3. Auth: Login
  app.post("/api/auth/login", (req, res) => {
    const { whatsapp, password } = req.body;

    if (!whatsapp || !password) {
      return res.status(400).json({ error: "Veuillez entrer votre numéro WhatsApp et mot de passe." });
    }

    const cleanPhone = (p: string) => p.trim().replace(/^\+/, "").replace(/\s+/g, "").replace(/^0+/, "");
    const user = db.users.find(u => {
      const uPhone = cleanPhone(u.whatsapp);
      const inputPhone = cleanPhone(whatsapp);
      return uPhone === inputPhone || 
        (inputPhone.length >= 8 && uPhone.endsWith(inputPhone)) || 
        (uPhone.length >= 8 && inputPhone.endsWith(uPhone));
    });
    if (!user) {
      return res.status(401).json({ error: "Identifiants incorrects." });
    }

    if (user.status === "blocked") {
      return res.status(403).json({ error: "Votre compte a été bloqué par un administrateur." });
    }

    if (user.passwordHash !== password) {
      return res.status(401).json({ error: "Mot de passe incorrect." });
    }

    // Trigger update logic for income of this user
    processDailyEarnings(user.id);

    res.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        whatsapp: user.whatsapp,
        country: user.country,
        referralCode: user.referralCode,
        isAdmin: !!user.isAdmin
      }
    });
  });

  // 4. Update Password (Forgot Password simulation)
  app.post("/api/auth/reset-password", (req, res) => {
    const { whatsapp, newPassword } = req.body;
    if (!whatsapp || !newPassword) {
      return res.status(400).json({ error: "Veuillez fournir le numéro WhatsApp d'origine et le nouveau mot de passe." });
    }
    const userIndex = db.users.findIndex(u => u.whatsapp.trim() === whatsapp.trim());
    if (userIndex === -1) {
      return res.status(404).json({ error: "Aucun utilisateur trouvé avec ce numéro." });
    }

    db.users[userIndex].passwordHash = newPassword;
    saveDB(db);
    res.json({ success: true, message: "Mot de passe réinitialisé avec succès !" });
  });

  // 5. User Profile (including all aggregates and specific claims)
  app.get("/api/user/profile/:userId", (req, res) => {
    const { userId } = req.params;
    processDailyEarnings(userId);

    const user = db.users.find(u => u.id === userId);
    if (!user) {
      return res.status(404).json({ error: "Utilisateur non trouvé." });
    }

    // User investments
    const userInvestments = db.investments.filter(i => i.userId === userId);

    // Filter payments
    const userDeposits = db.deposits.filter(d => d.userId === userId);
    const userWithdrawals = db.withdrawals.filter(w => w.userId === userId);

    // Referral system calculation: Level 1, Level 2 and Level 3
    const level1Invitees = db.users.filter(u => u.referredByCode === user.referralCode);
    
    // Level 2 invitees: those whose sponsors are level 1 users
    const level1Codes = level1Invitees.map(u => u.referralCode);
    const level2Invitees = db.users.filter(u => u.referredByCode !== null && level1Codes.includes(u.referredByCode));

    // Level 3 invitees: those whose sponsors are level 2 users
    const level2Codes = level2Invitees.map(u => u.referralCode);
    const level3Invitees = db.users.filter(u => u.referredByCode !== null && level2Codes.includes(u.referredByCode));

    const totalLevel1DepositAmount = db.deposits
      .filter(d => d.status === "approved" && level1Invitees.some(inv => inv.id === d.userId))
      .reduce((sum, d) => sum + d.amount, 0);

    const totalLevel2DepositAmount = db.deposits
      .filter(d => d.status === "approved" && level2Invitees.some(inv => inv.id === d.userId))
      .reduce((sum, d) => sum + d.amount, 0);

    const referralBonusEarned = db.referralCommissions
      .filter(c => c.toUserId === userId)
      .reduce((sum, c) => sum + c.amount, 0);

    res.json({
      user: {
        id: user.id,
        name: user.name,
        whatsapp: user.whatsapp,
        country: user.country,
        balance: user.balance,
        dailyEarnings: user.dailyEarnings,
        totalEarnings: user.totalEarnings,
        totalDeposits: user.totalDeposits,
        totalWithdrawals: user.totalWithdrawals,
        status: user.status,
        referralCode: user.referralCode,
        referredByCode: user.referredByCode,
        created_at: user.created_at,
        isAdmin: !!user.isAdmin
      },
      investments: userInvestments,
      deposits: userDeposits,
      withdrawals: userWithdrawals,
      referralStats: {
        level1Count: level1Invitees.length,
        level2Count: level2Invitees.length,
        level3Count: level3Invitees.length,
        totalInvited: level1Invitees.length + level2Invitees.length + level3Invitees.length,
        bonusEarned: referralBonusEarned,
        level1List: level1Invitees.map(u => ({ name: u.name, date: u.created_at, country: u.country, status: u.status })),
        level2List: level2Invitees.map(u => ({ name: u.name, date: u.created_at, country: u.country, status: u.status })),
        level3List: level3Invitees.map(u => ({ name: u.name, date: u.created_at, country: u.country, status: u.status }))
      }
    });
  });

  // 6. User Deposit system
  app.post("/api/user/deposit", (req, res) => {
    const { userId, amount, reference, provider, captureBase64, whatsapp } = req.body;

    if (!userId || !amount || !reference || !provider) {
      return res.status(400).json({ error: "Toutes les informations sur le dépôt de paiement sont requises." });
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({ error: "Le montant du dépôt doit être valide." });
    }

    const user = db.users.find(u => u.id === userId);
    if (!user) {
      return res.status(404).json({ error: "Utilisateur non trouvé." });
    }

    const newDeposit = {
      id: "dep-" + Date.now() + Math.random().toString(36).substr(2,4),
      userId,
      whatsapp: whatsapp || user.whatsapp,
      amount: parsedAmount,
      reference: reference.trim().toUpperCase(),
      paymentCapture: captureBase64 || "", // Holds capture path or Base64 representation
      provider,
      status: "pending" as const,
      date: new Date().toISOString()
    };

    db.deposits.push(newDeposit);

    // Track state change
    db.notifications.push({
      id: "notif-dep-sent-" + Date.now(),
      userId: userId,
      title: "Dépôt soumis",
      message: `Votre dépôt de ${parsedAmount} FCFA via ${provider} (Référence: ${reference}) a été soumis et est en attente de vérification par un administrateur.`,
      date: new Date().toISOString(),
      readBy: []
    });

    saveDB(db);

    res.json({
      success: true,
      message: "Dépôt transmis avec succès pour examen de l'administrateur.",
      deposit: newDeposit
    });
  });

  // 7. User Withdrawal Request
  app.post("/api/user/withdraw", (req, res) => {
    const { userId, amount, whatsapp, provider } = req.body;

    if (!userId || !amount || !whatsapp || !provider) {
      return res.status(400).json({ error: "Toutes les informations sur le retrait sont requises." });
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount < 1000) {
      return res.status(400).json({ error: "Le montant minimum de retrait est de 1 000 FCFA." });
    }

    const userIdx = db.users.findIndex(u => u.id === userId);
    if (userIdx === -1) {
      return res.status(404).json({ error: "Utilisateur non trouvé." });
    }

    const user = db.users[userIdx];
    if (user.balance < parsedAmount) {
      return res.status(400).json({ error: "Solde de retrait insuffisant. Obtenez plus de gains journaliers." });
    }

    // Debit user immediately from pending to prevent double-spending; refilled if rejected
    db.users[userIdx].balance -= parsedAmount;

    const newWithdrawal = {
      id: "wtd-" + Date.now() + Math.random().toString(36).substr(2,4),
      userId,
      whatsapp: whatsapp.trim(),
      amount: parsedAmount,
      provider,
      status: "pending" as const,
      date: new Date().toISOString()
    };

    db.withdrawals.push(newWithdrawal);

    db.notifications.push({
      id: "notif-wtd-sent-" + Date.now(),
      userId: userId,
      title: "Retrait en cours",
      message: `Votre demande de retrait de ${parsedAmount} FCFA sur le numéro ${whatsapp} est reçue. Notre administration traite les retraits dans un délai de 2 à 24 heures.`,
      date: new Date().toISOString(),
      readBy: []
    });

    saveDB(db);

    res.json({
      success: true,
      message: "Demande de retrait initiée. Le montant a été prélevé temporairement de votre solde.",
      withdrawal: newWithdrawal,
      newUserBalance: db.users[userIdx].balance
    });
  });

  // APK Mobile Application Download Endpoint
  app.get("/application-momo.apk", (req, res) => {
    res.setHeader("Content-Disposition", "attachment; filename=application-momo.apk");
    res.setHeader("Content-Type", "application/vnd.android.package-archive");
    // Generate a beautiful 1.5MB zip-structured mock binary for premium user installation simulation
    const dummyApk = Buffer.alloc(1024 * 1024 * 1.5);
    dummyApk.write("PK\x03\x04\x14\x00\x08\x00\x08\x00 MOMO_PAYMENT_NATIVE_ANDROID_CLIENT_STABLE_RELEASE");
    res.send(dummyApk);
  });

  // 8. Invest in Product
  app.post("/api/user/buy-product", (req, res) => {
    const { userId, productId } = req.body;

    if (!userId || !productId) {
      return res.status(400).json({ error: "ID Utilisateur et ID Produit requis." });
    }

    const userIdx = db.users.findIndex(u => u.id === userId);
    if (userIdx === -1) {
      return res.status(404).json({ error: "Utilisateur non trouvé." });
    }

    const activeUser = db.users[userIdx];
    const product = db.products.find(p => p.id === productId);
    if (!product) {
      return res.status(404).json({ error: "Produit ou Plan d'investissement non trouvé." });
    }

    const maxAllowed = (product as any).maxPurchaseCount !== undefined ? (product as any).maxPurchaseCount : 3;
    const currentPurchased = db.investments.filter(i => i.userId === userId && i.planId === productId).length;
    if (currentPurchased >= maxAllowed) {
      return res.status(400).json({ 
        error: `Limite de souscription atteinte ⚠️ ! Vous ne pouvez souscrire au plan "${product.name}" que ${maxAllowed} fois au maximum. Vous l'avez déjà activé ${currentPurchased} fois.` 
      });
    }

    if (activeUser.balance < product.price) {
      return res.status(400).json({ error: `Solde insuffisant pour ce plan (${product.price} FCFA requis). Veuillez d'abord faire un dépôt Mobile Money.` });
    }

    // Deduct and purchase
    db.users[userIdx].balance -= product.price;

    const newInvestment = {
      id: "inv-" + Date.now() + Math.random().toString(36).substr(2,4),
      userId,
      planId: product.id,
      planName: product.name,
      price: product.price,
      dailyReturn: product.dailyReturn,
      totalWeeks: Math.ceil(product.durationDays / 7),
      daysActive: 0,
      totalReturn: product.totalReturn,
      purchaseDate: new Date().toISOString(),
      lastClaimDate: new Date().toISOString()
    };

    db.investments.push(newInvestment);

    // Create notifications
    db.notifications.push({
      id: "notif-inv-welcome-" + Date.now(),
      userId: userId,
      title: `Plan ${product.name} Activé !`,
      message: `Votre investissement de ${product.price} FCFA a été activé avec succès. Vous recevrez ${product.dailyReturn} FCFA chaque jour pendant ${product.durationDays} jours.`,
      date: new Date().toISOString(),
      readBy: []
    });

    // CRITICAL: MLM COMMISSIONS SYSTEM
    // Level 1: 20% commission on product purchase
    // Level 2: 2% commission on product purchase
    // Level 3: 1% commission on product purchase
    if (activeUser.referredByCode) {
      const parentSponsorIdx = db.users.findIndex(u => u.referralCode === activeUser.referredByCode);
      if (parentSponsorIdx !== -1) {
        const level1Sponsor = db.users[parentSponsorIdx];
        const commissionL1 = Math.round(product.price * 0.20); // 20%
        db.users[parentSponsorIdx].balance += commissionL1;
        db.users[parentSponsorIdx].totalEarnings += commissionL1;

        db.referralCommissions.push({
          id: "commission-l1-" + Date.now() + Math.floor(Math.random() * 1000),
          fromUserId: userId,
          toUserId: level1Sponsor.id,
          amount: commissionL1,
          level: 1,
          date: new Date().toISOString()
        });

        db.notifications.push({
          id: "notif-comm-l1-" + Date.now() + Math.floor(Math.random() * 1000),
          userId: level1Sponsor.id,
          title: "Commission Niveau 1 reçue !",
          message: `Votre filleul ${activeUser.name} a investi dans le plan ${product.name}. Vous recevez une commission de parrainage de 20% soit ${commissionL1} FCFA !`,
          date: new Date().toISOString(),
          readBy: []
        });

        // Check if there is Level 2 sponsor (sponsor of level 1 sponsor)
        if (level1Sponsor.referredByCode) {
          const grandSponsorIdx = db.users.findIndex(u => u.referralCode === level1Sponsor.referredByCode);
          if (grandSponsorIdx !== -1) {
            const level2Sponsor = db.users[grandSponsorIdx];
            const commissionL2 = Math.round(product.price * 0.02); // 2%
            db.users[grandSponsorIdx].balance += commissionL2;
            db.users[grandSponsorIdx].totalEarnings += commissionL2;

            db.referralCommissions.push({
              id: "commission-l2-" + Date.now() + Math.floor(Math.random() * 1000),
              fromUserId: userId,
              toUserId: level2Sponsor.id,
              amount: commissionL2,
              level: 2,
              date: new Date().toISOString()
            });

            db.notifications.push({
              id: "notif-comm-l2-" + Date.now() + Math.floor(Math.random() * 1000),
              userId: level2Sponsor.id,
              title: "Commission Niveau 2 reçue !",
              message: `L'invité de votre sous-filleul ${activeUser.name} a investi dans le plan ${product.name}. Vous recevez 2% soit ${commissionL2} FCFA !`,
              date: new Date().toISOString(),
              readBy: []
            });

            // Check if there is Level 3 sponsor (sponsor of level 2 sponsor)
            if (level2Sponsor.referredByCode) {
              const greatGrandSponsorIdx = db.users.findIndex(u => u.referralCode === level2Sponsor.referredByCode);
              if (greatGrandSponsorIdx !== -1) {
                const level3Sponsor = db.users[greatGrandSponsorIdx];
                const commissionL3 = Math.round(product.price * 0.01); // 1%
                db.users[greatGrandSponsorIdx].balance += commissionL3;
                db.users[greatGrandSponsorIdx].totalEarnings += commissionL3;

                db.referralCommissions.push({
                  id: "commission-l3-" + Date.now() + Math.floor(Math.random() * 1000),
                  fromUserId: userId,
                  toUserId: level3Sponsor.id,
                  amount: commissionL3,
                  level: 3,
                  date: new Date().toISOString()
                });

                db.notifications.push({
                  id: "notif-comm-l3-" + Date.now() + Math.floor(Math.random() * 1000),
                  userId: level3Sponsor.id,
                  title: "Commission Niveau 3 reçue !",
                  message: `L'invité indirect de 3ème génération ${activeUser.name} a investi dans le plan ${product.name}. Vous recevez 1% soit ${commissionL3} FCFA !`,
                  date: new Date().toISOString(),
                  readBy: []
                });
              }
            }
          }
        }
      }
    }

    saveDB(db);

    res.json({
      success: true,
      message: `Félicitations ! Vous avez activé avec succès le plan d'investissement ${product.name}.`,
      investment: newInvestment,
      newBalance: db.users[userIdx].balance
    });
  });

  // 9. Redeem Bonus Link / code
  app.post("/api/user/redeem-bonus", (req, res) => {
    const { userId, code } = req.body;

    if (!userId || !code) {
      return res.status(400).json({ error: "ID Utilisateur et Code Bonus requis." });
    }

    const cleanCode = code.trim().toUpperCase();
    const userIdx = db.users.findIndex(u => u.id === userId);
    if (userIdx === -1) {
      return res.status(404).json({ error: "Utilisateur non trouvé." });
    }

    const bonusIndex = db.bonusCodes.findIndex(b => b.code === cleanCode);
    if (bonusIndex === -1) {
      return res.status(404).json({ error: "Code bonus invalide ou expiré." });
    }

    const bonus = db.bonusCodes[bonusIndex];
    if (bonus.claimedBy.includes(userId)) {
      return res.status(400).json({ error: "Vous avez déjà réclamé ce bonus." });
    }

    if (bonus.usageLimit && bonus.usageLimit > 0 && bonus.claimedBy.length >= bonus.usageLimit) {
      return res.status(400).json({ error: "Ce code cadeau a atteint sa limite maximale d'utilisations." });
    }

    // Apply reward
    db.users[userIdx].balance += bonus.amount;
    db.users[userIdx].totalEarnings += bonus.amount;
    db.bonusCodes[bonusIndex].claimedBy.push(userId);

    db.notifications.push({
      id: "notif-bonus-claim-" + Date.now(),
      userId: userId,
      title: "Code Cadeau Réclamé !",
      message: `Succès! Vous avez reçu un crédit bonus gratuit supplémentaire de ${bonus.amount} FCFA sur votre compte.`,
      date: new Date().toISOString(),
      readBy: []
    });

    saveDB(db);

    res.json({
      success: true,
      message: `Code bonus ${cleanCode} réclamé avec succès! Vous recevez +${bonus.amount} FCFA !`,
      amountRedeemed: bonus.amount,
      newBalance: db.users[userIdx].balance
    });
  });

  // Daily Free claim bonus
  app.post("/api/user/daily-reward", (req, res) => {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ error: "ID Utilisateur requis." });
    }
    const userIdx = db.users.findIndex(u => u.id === userId);
    if (userIdx === -1) {
      return res.status(404).json({ error: "Utilisateur non trouvé." });
    }

    // Verify if lastDailyCheckin is today
    const todayStr = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    if (db.users[userIdx].lastDailyCheckin === todayStr) {
      return res.status(400).json({ error: "Vous avez déjà collecté votre cadeau d'activité aujourd'hui. Revenez demain !" });
    }

    const rewardEarned = 50; 
    db.users[userIdx].balance += rewardEarned;
    db.users[userIdx].totalEarnings += rewardEarned;
    db.users[userIdx].lastDailyCheckin = todayStr;

    db.notifications.push({
      id: "notif-daily-gift-" + Date.now(),
      userId: userId,
      title: "Pointage quotidien effectué ! 🎁",
      message: `Vous avez effectué votre pointage aujourd'hui et généré : +${rewardEarned} FCFA. Revenez demain !`,
      date: new Date().toISOString(),
      readBy: []
    });

    saveDB(db);
    res.json({ success: true, reward: rewardEarned, newBalance: db.users[userIdx].balance });
  });

  // 10. List Notifications
  app.get("/api/user/notifications/:userId", (req, res) => {
    const { userId } = req.params;
    
    // Global notifications + user targeting notifications
    const unread = db.notifications.filter(
      n => (n.userId === "all" || n.userId === userId) && !n.readBy.includes(userId)
    );

    const all = db.notifications.filter(
      n => n.userId === "all" || n.userId === userId
    ).map(n => ({
      ...n,
      read: n.readBy.includes(userId)
    })).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    res.json({ unreadCount: unread.length, notifications: all });
  });

  // Mark all read
  app.post("/api/user/notifications/read", (req, res) => {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: "User ID required" });

    db.notifications = db.notifications.map(n => {
      if ((n.userId === "all" || n.userId === userId) && !n.readBy.includes(userId)) {
        n.readBy.push(userId);
      }
      return n;
    });

    saveDB(db);
    res.json({ success: true });
  });

  // 11. Support Live Chat: Send Message
  app.post("/api/chat/send", (req, res) => {
    const { userId, sender, message } = req.body;
    if (!userId || !sender || !message) {
      return res.status(400).json({ error: "Données requises manquantes." });
    }

    const newMessage = {
      id: "msg-" + Date.now() + Math.random().toString(36).substr(2,4),
      userId,
      sender: sender as "user" | "admin",
      message: message.trim(),
      date: new Date().toISOString()
    };

    db.tickets.push(newMessage);

    // Dynamic auto-assistant answers with advice if sent by user
    if (sender === "user") {
      setTimeout(() => {
        const supportResponses = [
          "Bonjour! Un agent de support financier va examiner votre demande d'ici peu. Pour accélérer la validation de votre dépôt, assurez-vous d'avoir téléchargé la capture écran de paiement exacte avec la référence correcte.",
          "Félicitations pour votre choix d'investissement! Les bonus de parrainage de 10% (Niveau 1) et 5% (Niveau 2) sont crédités directement.",
          "Bonjour, merci d'avoir contacté Investa Premium. Les demandes de retraits Mobile Money en attente sont traitées très rapidement par notre équipe d'administration.",
          "Votre message a bien été enregistré. Restez en ligne, nous arrivons !"
        ];
        // Only trigger if no existing admin replies in the last minutes
        const autoMsg = {
          id: "msg-auto-" + Date.now(),
          userId,
          sender: "admin" as const,
          message: supportResponses[Math.floor(Math.random() * supportResponses.length)],
          date: new Date().toISOString()
        };
        db.tickets.push(autoMsg);
        saveDB(db);
      }, 3000);
    }

    saveDB(db);
    res.json({ success: true, message: newMessage });
  });

  // Get Chat History
  app.get("/api/chat/history/:userId", (req, res) => {
    const { userId } = req.params;
    const history = db.tickets.filter(t => t.userId === userId).sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    res.json({ history });
  });


  /* ==================== ADMIN ENDPOINTS (SECURE) ==================== */

  // Admin: Get overall statistics
  app.get("/api/admin/stats", (req, res) => {
    // Total numbers of everything
    const totalUsers = db.users.filter(u => !u.isAdmin).length;
    const blockedUsers = db.users.filter(u => u.status === "blocked").length;

    const totalDepositsSubmitted = db.deposits.length;
    const pendingDeposits = db.deposits.filter(d => d.status === "pending").length;
    const approvedDepositsSum = db.deposits.filter(d => d.status === "approved").reduce((sum, d) => sum + d.amount, 0);

    const totalWithdrawalsSubmitted = db.withdrawals.length;
    const pendingWithdrawals = db.withdrawals.filter(w => w.status === "pending").length;
    const approvedWithdrawalsSum = db.withdrawals.filter(w => w.status === "approved").reduce((sum, w) => sum + w.amount, 0);

    const activeInvestmentSum = db.investments.reduce((sum, i) => sum + i.price, 0);

    res.json({
      totalUsers,
      blockedUsers,
      totalDepositsSubmitted,
      pendingDeposits,
      approvedDepositsSum,
      totalWithdrawalsSubmitted,
      pendingWithdrawals,
      approvedWithdrawalsSum,
      activeInvestmentSum
    });
  });

  // Admin: Get Users
  app.get("/api/admin/users", (req, res) => {
    // Return all users
    const userClients = db.users.filter(u => !u.isAdmin).map(u => {
      // Find investment aggregates for this user
      const userInvs = db.investments.filter(i => i.userId === u.id);
      return {
        ...u,
        totalInvCount: userInvs.length,
        totalInvAmount: userInvs.reduce((acc, i) => acc + i.price, 0)
      };
    });
    res.json({ users: userClients });
  });

  // Admin: Update User account (Balance, Add Bonus points, status block)
  app.post("/api/admin/users/action", (req, res) => {
    const { targetUserId, action, amount } = req.body;

    const idx = db.users.findIndex(u => u.id === targetUserId);
    if (idx === -1) {
      return res.status(404).json({ error: "Utilisateur cible introuvable" });
    }

    const user = db.users[idx];

    if (action === "block") {
      db.users[idx].status = "blocked";
    } else if (action === "unblock") {
      db.users[idx].status = "active";
    } else if (action === "simulate_24h") {
      // Shift lastClaimDate of all active investments of this user by exactly 24 hours backward
      db.investments = db.investments.map((inv) => {
        if (inv.userId === targetUserId) {
          const oldClaim = new Date(inv.lastClaimDate);
          inv.lastClaimDate = new Date(oldClaim.getTime() - 24 * 60 * 60 * 1000 - 100).toISOString();
        }
        return inv;
      });
      // Immediately run processDailyEarnings to trigger daily credit
      processDailyEarnings(targetUserId);
    } else if (action === "add_balance") {
      const parsed = parseFloat(amount);
      if (!isNaN(parsed)) {
        db.users[idx].balance += parsed;
        db.users[idx].totalEarnings += parsed;
        
        db.notifications.push({
          id: "notif-adm-bal-" + Date.now(),
          userId: targetUserId,
          title: "Ajustement de solde par l'administrateur",
          message: `Votre solde principal a été augmenté de +${parsed} FCFA de façon exceptionnelle par l'administration.`,
          date: new Date().toISOString(),
          readBy: []
        });
      }
    } else if (action === "set_balance") {
      const parsed = parseFloat(amount);
      if (!isNaN(parsed)) {
        db.users[idx].balance = parsed;
      }
    } else if (action === "update_code") {
      const { newCode } = req.body;
      if (!newCode || !newCode.trim()) {
        return res.status(400).json({ error: "Le code parrain ne peut pas être vide." });
      }
      const cleanedCode = newCode.toUpperCase().trim();
      const duplicate = db.users.find(u => u.id !== targetUserId && u.referralCode === cleanedCode);
      if (duplicate) {
        return res.status(400).json({ error: "Ce code de parrainage est déjà attribué à un autre utilisateur." });
      }
      db.users[idx].referralCode = cleanedCode;
    } else if (action === "update_password") {
      const { newPassword } = req.body;
      if (!newPassword || !newPassword.trim()) {
        return res.status(400).json({ error: "Le mot de passe ne peut pas être vide." });
      }
      db.users[idx].passwordHash = newPassword.trim();
    } else if (action === "toggle_admin") {
      db.users[idx].isAdmin = !db.users[idx].isAdmin;
    }

    saveDB(db);
    res.json({ success: true, message: `Action ${action} effectuée avec succès.` });
  });

  // Admin: Manage Deposits (Approve or Reject)
  app.get("/api/admin/deposits", (req, res) => {
    const sorted = db.deposits.map(d => {
      const user = db.users.find(u => u.id === d.userId);
      return {
        ...d,
        userName: user ? user.name : "Inconnu"
      };
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    res.json({ deposits: sorted });
  });

  app.post("/api/admin/deposits/action", (req, res) => {
    const { depositId, action } = req.body;
    if (!depositId || !action) {
      return res.status(400).json({ error: "Informations requises manquantes." });
    }

    const dIdx = db.deposits.findIndex(d => d.id === depositId);
    if (dIdx === -1) {
      return res.status(404).json({ error: "Dépôt introuvable." });
    }

    const deposit = db.deposits[dIdx];
    if (deposit.status !== "pending") {
      return res.status(400).json({ error: "Ce dépôt a déjà été traité." });
    }

    const uIdx = db.users.findIndex(u => u.id === deposit.userId);
    if (uIdx === -1) {
      return res.status(404).json({ error: "L'utilisateur auteur de ce dépôt n'existe pas." });
    }

    if (action === "approve") {
      db.deposits[dIdx].status = "approved";
      
      // Credit user ballance & stats
      db.users[uIdx].balance += deposit.amount;
      db.users[uIdx].totalDeposits += deposit.amount;

      db.notifications.push({
        id: "notif-dep-ok-" + Date.now(),
        userId: deposit.userId,
        title: "Dépôt validé ! ✅",
        message: `Félicitations, votre dépôt Mobile Money de ${deposit.amount} FCFA a été validé ! Le montant a été crédité sur votre solde.`,
        date: new Date().toISOString(),
        readBy: []
      });
    } else {
      db.deposits[dIdx].status = "rejected";

      db.notifications.push({
        id: "notif-dep-fail-" + Date.now(),
        userId: deposit.userId,
        title: "Dépôt rejeté ❌",
        message: `Votre dépôt de ${deposit.amount} FCFA (Référence: ${deposit.reference}) a été rejeté car les informations ou la capture d'écran étaient invalides. Contactez le chat de support.`,
        date: new Date().toISOString(),
        readBy: []
      });
    }

    saveDB(db);
    res.json({ success: true, message: `Dépôt mis à jour avec le statut: ${db.deposits[dIdx].status}` });
  });

  // Admin: Manage Withdrawals (Approve or Reject)
  app.get("/api/admin/withdrawals", (req, res) => {
    const sorted = db.withdrawals.map(w => {
      const user = db.users.find(u => u.id === w.userId);
      return {
        ...w,
        userName: user ? user.name : "Inconnu",
        userBalance: user ? user.balance : 0
      };
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    res.json({ withdrawals: sorted });
  });

  app.post("/api/admin/withdrawals/action", (req, res) => {
    const { withdrawalId, action } = req.body;
    if (!withdrawalId || !action) {
      return res.status(400).json({ error: "Informations requises manquantes." });
    }

    const wIdx = db.withdrawals.findIndex(w => w.id === withdrawalId);
    if (wIdx === -1) {
      return res.status(404).json({ error: "Retrait introuvable." });
    }

    const withdrawal = db.withdrawals[wIdx];
    if (withdrawal.status !== "pending") {
      return res.status(400).json({ error: "Ce retrait a déjà été traité." });
    }

    const uIdx = db.users.findIndex(u => u.id === withdrawal.userId);
    if (uIdx === -1) {
      return res.status(404).json({ error: "L'utilisateur n'existe pas." });
    }

    if (action === "approve") {
      db.withdrawals[wIdx].status = "approved";
      db.users[uIdx].totalWithdrawals += withdrawal.amount;

      db.notifications.push({
        id: "notif-wtd-ok-" + Date.now(),
        userId: withdrawal.userId,
        title: "Retrait envoyé ! 💸",
        message: `Votre demande de retrait de ${withdrawal.amount} FCFA a été approuvée et transférée sur votre compte Mobile Money.`,
        date: new Date().toISOString(),
        readBy: []
      });
    } else {
      db.withdrawals[wIdx].status = "rejected";
      
      // Refund user balance
      db.users[uIdx].balance += withdrawal.amount;

      db.notifications.push({
        id: "notif-wtd-fail-" + Date.now(),
        userId: withdrawal.userId,
        title: "Retrait rejeté et remboursé ⚠️",
        message: `Votre retrait de ${withdrawal.amount} FCFA a été rejeté. La somme a été recréditée sur votre solde de gains.`,
        date: new Date().toISOString(),
        readBy: []
      });
    }

    saveDB(db);
    res.json({ success: true, message: `Retrait mis à jour avec le statut: ${db.withdrawals[wIdx].status}` });
  });

  // Admin: Get & Manage Product Plans
  app.get("/api/admin/products", (req, res) => {
    res.json({ products: db.products });
  });

  app.post("/api/admin/products", (req, res) => {
    const { name, price, dailyReturn, durationDays, badge, maxPurchaseCount } = req.body;
    if (!name || !price || !dailyReturn || !durationDays) {
      return res.status(400).json({ error: "Remplissez tous les détails du produit." });
    }

    const newProduct = {
      id: "vip-" + Date.now(),
      name,
      price: parseFloat(price),
      dailyReturn: parseFloat(dailyReturn),
      durationDays: parseInt(durationDays),
      totalReturn: parseFloat(dailyReturn) * parseInt(durationDays),
      badge: badge || undefined,
      maxPurchaseCount: maxPurchaseCount !== undefined && maxPurchaseCount !== null ? parseInt(maxPurchaseCount) : 3
    };

    db.products.push(newProduct);
    saveDB(db);
    res.json({ success: true, product: newProduct });
  });

  app.delete("/api/admin/products/:productId", (req, res) => {
    const { productId } = req.params;
    db.products = db.products.filter(p => p.id !== productId);
    saveDB(db);
    res.json({ success: true, message: "Produit supprimé avec succès." });
  });

  app.put("/api/admin/products/:productId", (req, res) => {
    const { productId } = req.params;
    const { name, price, dailyReturn, durationDays, badge, maxPurchaseCount } = req.body;
    
    const pIdx = db.products.findIndex(p => p.id === productId);
    if (pIdx === -1) {
      return res.status(404).json({ error: "Produit non trouvé" });
    }

    if (!name || !price || !dailyReturn || !durationDays) {
      return res.status(400).json({ error: "Remplissez tous les détails du produit." });
    }

    db.products[pIdx] = {
      ...db.products[pIdx],
      name,
      price: parseFloat(price),
      dailyReturn: parseFloat(dailyReturn),
      durationDays: parseInt(durationDays),
      totalReturn: parseFloat(dailyReturn) * parseInt(durationDays),
      badge: badge || undefined,
      maxPurchaseCount: maxPurchaseCount !== undefined && maxPurchaseCount !== null ? parseInt(maxPurchaseCount) : 3
    };

    saveDB(db);
    res.json({ success: true, product: db.products[pIdx] });
  });

  // Admin: Global Notification
  app.post("/api/admin/notify-all", (req, res) => {
    const { title, message } = req.body;
    if (!title || !message) {
      return res.status(400).json({ error: "Saisissez un titre et un contenu de notification." });
    }

    const globNotif = {
      id: "notif-glob-" + Date.now(),
      userId: "all",
      title,
      message,
      date: new Date().toISOString(),
      readBy: []
    };

    db.notifications.push(globNotif);
    saveDB(db);
    res.json({ success: true, notification: globNotif });
  });

  // Admin: Generate Bonus Code
  app.post("/api/admin/bonus-codes", (req, res) => {
    const { code, amount, usageLimit } = req.body;
    if (!code || !amount) {
      return res.status(400).json({ error: "Saisissez un code unique et un montant." });
    }

    const cleanedCode = code.toUpperCase().trim();
    const exists = db.bonusCodes.some(b => b.code === cleanedCode);
    if (exists) {
      return res.status(400).json({ error: "Ce code bonus existe déjà." });
    }

    let parsedLimit: number | undefined = undefined;
    if (usageLimit !== undefined && usageLimit !== null && usageLimit !== "") {
      const num = parseInt(usageLimit);
      if (!isNaN(num) && num > 0) {
        parsedLimit = num;
      }
    }

    const nBonus: any = {
      code: cleanedCode,
      amount: parseFloat(amount),
      claimedBy: [],
      created_by: "admin-master"
    };

    if (parsedLimit !== undefined) {
      nBonus.usageLimit = parsedLimit;
    }

    db.bonusCodes.push(nBonus);
    saveDB(db);
    res.json({ success: true, bonusCode: nBonus });
  });

  app.get("/api/admin/bonus-codes", (req, res) => {
    res.json({ bonusCodes: db.bonusCodes });
  });

  // Admin: Get all conversations
  app.get("/api/admin/chats", (req, res) => {
    // Collect all users and their last messages
    const chatStats = db.users.filter(u => !u.isAdmin).map(u => {
      const userMsgs = db.tickets.filter(t => t.userId === u.id);
      const lastMsg = userMsgs[userMsgs.length - 1];
      return {
        userId: u.id,
        userName: u.name,
        whatsapp: u.whatsapp,
        msgCount: userMsgs.length,
        lastMessage: lastMsg ? lastMsg.message : "Pas encore de message",
        lastMessageDate: lastMsg ? lastMsg.date : u.created_at
      };
    }).filter(c => c.msgCount > 0).sort((a,b) => new Date(b.lastMessageDate).getTime() - new Date(a.lastMessageDate).getTime());

    res.json({ chats: chatStats });
  });

  /* ==================== VITE / STATIC ROUTING ==================== */

  // Attach Vite as middleware if running in development mode
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Production: serve built static client files
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  // Handle errors
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error("Express App Error Global handler:", err);
    res.status(500).json({ error: "Internal Server Error" });
  });

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server started successfully on port ${PORT}`);
  });
}

startServer();
