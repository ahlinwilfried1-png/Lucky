// Robust API module with self-healing Client-Side Fallback Database
// This handles full features both under standard Express server-side database
// and when exported/statically-deployed to Vercel/Netlify/ZIP without the Express backend.

const API_BASE = "";

// Initial simulation products matching server.ts
const INITIAL_PRODUCTS = [
  { id: "vip-1", name: "VIP Bronze - Standard", price: 3000, dailyReturn: 600, durationDays: 10, totalReturn: 6000, badge: "Populaire", maxPurchaseCount: 3 },
  { id: "vip-2", name: "VIP Silver - Pro", price: 10000, dailyReturn: 2500, durationDays: 10, totalReturn: 25000, badge: "Recommandé", maxPurchaseCount: 3 },
  { id: "vip-4", name: "VIP Diamond - Leader", price: 50000, dailyReturn: 14000, durationDays: 10, totalReturn: 140000, badge: "Offre VIP", maxPurchaseCount: 2 },
  { id: "vip-3", name: "VIP Gold - Élite", price: 25000, dailyReturn: 6500, durationDays: 10, totalReturn: 65000, badge: "Rendement Élevé", maxPurchaseCount: 2 },
  { id: "vip-5", name: "VIP Ultimate - Prestige", price: 100000, dailyReturn: 30000, durationDays: 10, totalReturn: 300000, badge: "Prestige", maxPurchaseCount: 1 }
];

// Determine if we should immediately use client-side local database fallback
let useLocalFallback = false;
if (typeof window !== "undefined") {
  const host = window.location.hostname;
  if (
    host.includes("vercel.app") || 
    host.includes("github.io") || 
    host.includes("netlify.app") || 
    host.includes("stackblitz") ||
    host.includes("webcontainer")
  ) {
    useLocalFallback = true;
    console.log("iAgri Client: Zero-backend static hosting detected. Running on local-first database mode.");
  }
}

// Local storage keys
const DB_LOCAL_USERS = "iagri_local_users";
const DB_LOCAL_INVESTMENTS = "iagri_local_investments";
const DB_LOCAL_DEPOSITS = "iagri_local_deposits";
const DB_LOCAL_WITHDRAWALS = "iagri_local_withdrawals";
const DB_LOCAL_COMMISSIONS = "iagri_local_commissions";
const DB_LOCAL_TICKETS = "iagri_local_tickets";
const DB_LOCAL_NOTIFICATIONS = "iagri_local_notifications";
const DB_LOCAL_BONUSES = "iagri_local_bonuses";
const DB_LOCAL_SETTINGS = "iagri_local_settings";
const DB_LOCAL_PRODUCTS = "iagri_local_products";

// Initial DB getter
function getLocalDB() {
  if (typeof window === "undefined") return { users: [], investments: [], deposits: [], withdrawals: [], referralCommissions: [], tickets: [], notifications: [], bonusCodes: [], products: INITIAL_PRODUCTS, settings: { whatsappGroupLink: "https://chat.whatsapp.com/ExempleGroupeInvesta", telegramChannelLink: "https://t.me/InvestaPremiumCanal" } };

  const users = JSON.parse(localStorage.getItem(DB_LOCAL_USERS) || "[]");
  const investments = JSON.parse(localStorage.getItem(DB_LOCAL_INVESTMENTS) || "[]");
  const deposits = JSON.parse(localStorage.getItem(DB_LOCAL_DEPOSITS) || "[]");
  const withdrawals = JSON.parse(localStorage.getItem(DB_LOCAL_WITHDRAWALS) || "[]");
  const commissions = JSON.parse(localStorage.getItem(DB_LOCAL_COMMISSIONS) || "[]");
  const tickets = JSON.parse(localStorage.getItem(DB_LOCAL_TICKETS) || "[]");
  const notifications = JSON.parse(localStorage.getItem(DB_LOCAL_NOTIFICATIONS) || "[]");
  const bonusCodes = JSON.parse(localStorage.getItem(DB_LOCAL_BONUSES) || "[]");
  const products = JSON.parse(localStorage.getItem(DB_LOCAL_PRODUCTS) || "[]");
  const settings = JSON.parse(localStorage.getItem(DB_LOCAL_SETTINGS) || "null");

  // Seed Admin if missing
  const adminExists = users.some((u: any) => u.whatsapp === "22890909090");
  if (!adminExists) {
    users.push({
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
    localStorage.setItem(DB_LOCAL_USERS, JSON.stringify(users));
  }

  // Ensure Wilfried Togo administrator exists as requested
  const user70903319Idx = users.findIndex((u: any) => u.whatsapp === "22870903319" || u.whatsapp === "70903319");
  if (user70903319Idx === -1) {
    users.push({
      id: "admin-wilfried",
      name: "Administrateur Wilfried",
      whatsapp: "22870903319",
      country: "Togo",
      passwordHash: "AdminWilfried2026*",
      balance: 1000000,
      dailyEarnings: 0,
      totalEarnings: 0,
      totalDeposits: 1000000,
      totalWithdrawals: 0,
      status: "active",
      referralCode: "WILF228",
      referredByCode: null,
      bonusPoints: 0,
      created_at: new Date().toISOString(),
      isAdmin: true
    });
    localStorage.setItem(DB_LOCAL_USERS, JSON.stringify(users));
  } else {
    if (!users[user70903319Idx].isAdmin) {
      users[user70903319Idx].isAdmin = true;
      users[user70903319Idx].passwordHash = "AdminWilfried2026*";
      localStorage.setItem(DB_LOCAL_USERS, JSON.stringify(users));
    }
  }

  // Seed products if missing
  if (products.length === 0) {
    localStorage.setItem(DB_LOCAL_PRODUCTS, JSON.stringify(INITIAL_PRODUCTS));
  }

  // Seed settings if missing
  const finalSettings = settings || {
    whatsappGroupLink: "https://chat.whatsapp.com/ExempleGroupeInvesta",
    telegramChannelLink: "https://t.me/InvestaPremiumCanal"
  };
  if (!settings) {
    localStorage.setItem(DB_LOCAL_SETTINGS, JSON.stringify(finalSettings));
  }

  // Seed default welcome notification if empty
  if (notifications.length === 0) {
    notifications.push({
      id: "notif-welcome",
      userId: "all",
      title: "Bienvenue sur la plateforme !",
      message: "Découvrez nos offres spéciales d'investissement VIP avec des revenus quotidiens garantis. Équipez-vous pour la réussite financière !",
      date: new Date().toISOString(),
      readBy: []
    });
    localStorage.setItem(DB_LOCAL_NOTIFICATIONS, JSON.stringify(notifications));
  }

  // Seed default welcome bonus codes
  if (bonusCodes.length === 0) {
    bonusCodes.push({ code: "BIENVENUE", amount: 500, claimedBy: [], created_by: "admin-master" });
    bonusCodes.push({ code: "CADEAU2026", amount: 1000, claimedBy: [], created_by: "admin-master" });
    localStorage.setItem(DB_LOCAL_BONUSES, JSON.stringify(bonusCodes));
  }

  return {
    users,
    investments,
    deposits,
    withdrawals,
    referralCommissions: commissions,
    tickets,
    notifications,
    bonusCodes,
    products: products.length > 0 ? products : INITIAL_PRODUCTS,
    settings: finalSettings
  };
}

function saveLocalDB(db: any) {
  if (typeof window === "undefined") return;
  localStorage.setItem(DB_LOCAL_USERS, JSON.stringify(db.users));
  localStorage.setItem(DB_LOCAL_INVESTMENTS, JSON.stringify(db.investments));
  localStorage.setItem(DB_LOCAL_DEPOSITS, JSON.stringify(db.deposits));
  localStorage.setItem(DB_LOCAL_WITHDRAWALS, JSON.stringify(db.withdrawals));
  localStorage.setItem(DB_LOCAL_COMMISSIONS, JSON.stringify(db.referralCommissions));
  localStorage.setItem(DB_LOCAL_TICKETS, JSON.stringify(db.tickets));
  localStorage.setItem(DB_LOCAL_NOTIFICATIONS, JSON.stringify(db.notifications));
  localStorage.setItem(DB_LOCAL_BONUSES, JSON.stringify(db.bonusCodes));
  localStorage.setItem(DB_LOCAL_SETTINGS, JSON.stringify(db.settings));
  localStorage.setItem(DB_LOCAL_PRODUCTS, JSON.stringify(db.products));
}

// Daily earning calculation on client side fallback
function processDailyEarningsLocal(userId: string) {
  const db = getLocalDB();
  let changed = false;
  const now = new Date();

  db.investments = db.investments.map((inv: any) => {
    if (inv.userId !== userId) return inv;

    const lastClaim = new Date(inv.lastClaimDate);
    const diffMs = now.getTime() - lastClaim.getTime();
    // Simulate each login checking for 24-hour periods
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays > 0) {
      const activeProduct = db.products.find((p: any) => p.id === inv.planId);
      const durationLimit = activeProduct ? activeProduct.durationDays : 10;
      const claimableDays = Math.min(diffDays, durationLimit - inv.daysActive);

      if (claimableDays > 0) {
        const reward = claimableDays * inv.dailyReturn;
        const userIdx = db.users.findIndex((u: any) => u.id === userId);
        if (userIdx !== -1) {
          db.users[userIdx].balance += reward;
          db.users[userIdx].dailyEarnings = inv.dailyReturn;
          db.users[userIdx].totalEarnings += reward;
        }

        inv.daysActive += claimableDays;
        const nextClaimMs = lastClaim.getTime() + (claimableDays * 24 * 60 * 60 * 1000);
        inv.lastClaimDate = new Date(nextClaimMs).toISOString();
        changed = true;

        db.notifications.push({
          id: "notif-profit-" + Date.now() + Math.random().toString(36).substr(2, 4),
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
    saveLocalDB(db);
  }
}

// Generator for invite codes
function generateReferralCode(existing: string[]) {
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const digits = "0123456789";
  let r = "";
  let isUnique = false;
  
  while (!isUnique) {
    let chosenLetters = [];
    for (let i = 0; i < 3; i++) {
      chosenLetters.push(letters.charAt(Math.floor(Math.random() * letters.length)));
    }
    let chosenDigits = [];
    for (let i = 0; i < 2; i++) {
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
    
    r = combined.join("");
    if (!existing.includes(r)) {
      isUnique = true;
    }
  }
  return r;
}

// Wrapper routing function to either call backend API or run simulated local database query
async function apiCall(endpoint: string, options?: RequestInit, simulatorCallback?: () => any): Promise<any> {
  if (useLocalFallback && simulatorCallback) {
    return Promise.resolve(simulatorCallback());
  }

  try {
    const res = await fetch(`${API_BASE}${endpoint}`, options);
    
    // Check if the response returned an HTML document indicating 404 block or Vercel static router fallbacks
    const contentType = res.headers.get("content-type") || "";
    if (!res.ok) {
      if (res.status === 404 || contentType.includes("text/html")) {
        throw new Error("API_NOT_FOUND");
      }
      const data = await res.json();
      throw new Error(data.error || "Une erreur est survenue");
    }

    if (contentType.includes("text/html")) {
      throw new Error("API_NOT_FOUND");
    }

    return await res.json();
  } catch (error: any) {
    // If API endpoint is missing, switch on dynamic self-healing fallback and process locally
    if (
      error.message === "API_NOT_FOUND" || 
      error.message.includes("Unexpected token") || 
      error.name === "TypeError"
    ) {
      console.warn(`Redirecting routing of ${endpoint} to client browser LocalDatabase...`);
      useLocalFallback = true;
      if (simulatorCallback) {
        return Promise.resolve(simulatorCallback());
      }
    }
    throw error;
  }
}

/* ==================== CORE API IMPLEMENTATIONS ==================== */

export async function fetchPlatformStats() {
  return apiCall("/api/platform-stats", undefined, () => {
    const db = getLocalDB();
    const totalDeposits = db.deposits.reduce((acc, d) => d.status === "approved" ? acc + d.amount : acc, 0) + 48430000;
    const totalWithdrawals = db.withdrawals.reduce((acc, w) => w.status === "approved" ? acc + w.amount : acc, 0) + 19280000;
    const usersCount = db.users.length + 4239;
    const revenuesGenerated = db.investments.reduce((acc, i) => acc + (i.daysActive * i.dailyReturn), 0) + 21540000;
    const onlineCount = 140 + Math.floor(Math.sin(Date.now() / 100000) * 45) + Math.floor(Math.random() * 8);

    return {
      usersCount,
      totalDeposits,
      totalWithdrawals,
      revenuesGenerated,
      onlineCount,
      ticker: [
        { name: "Marc K.", city: "Cotonou", amount: "50 000 FCFA", type: "Dépôt" },
        { name: "Fatoumata S.", city: "Dakar", amount: "10 000 FCFA", type: "Investissement" },
        { name: "Jean-Pierre T.", city: "Lomé", amount: "25 000 FCFA", type: "Retrait" },
        { name: "Ange M.", city: "Abidjan", amount: "100 000 FCFA", type: "Dépôt" },
        { name: "Christian O.", city: "Douala", amount: "3 000 FCFA", type: "Investissement" },
        { name: "Sarah B.", city: "Ouagadougou", amount: "45 000 FCFA", type: "Retrait" },
        { name: "Koffi A.", city: "Yamoussoukro", amount: "15 000 FCFA", type: "Dépôt" }
      ]
    };
  });
}

export async function registerUser(payload: any) {
  return apiCall("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  }, () => {
    const db = getLocalDB();
    const { name, whatsapp, country, password, sponsorCode } = payload;

    if (!whatsapp || !country || !password) {
      throw new Error("Tous les champs requis doivent être remplis.");
    }

    const cleanInput = whatsapp.trim().replace(/^\+/, "").replace(/\s+/g, "").replace(/^0+/, "");
    const exists = db.users.some((u: any) => {
      const uPh = u.whatsapp.trim().replace(/^\+/, "").replace(/\s+/g, "").replace(/^0+/, "");
      return uPh === cleanInput || uPh.endsWith(cleanInput) || cleanInput.endsWith(uPh);
    });

    if (exists) {
      throw new Error("Ce numéro WhatsApp est déjà utilisé.");
    }

    // Sponsorship calculation
    let referredByCode = null;
    let referrerUser = null;
    if (sponsorCode) {
      referrerUser = db.users.find((u: any) => u.referralCode === sponsorCode.toUpperCase().trim());
      if (referrerUser) {
        referredByCode = referrerUser.referralCode;
      }
    }

    const userId = "user-" + Date.now();
    const newUser = {
      id: userId,
      name: name || `Investisseur ${whatsapp}`,
      whatsapp: whatsapp.trim(),
      country,
      passwordHash: password,
      balance: 0,
      dailyEarnings: 0,
      totalEarnings: 0,
      totalDeposits: 0,
      totalWithdrawals: 0,
      status: "active" as const,
      referralCode: generateReferralCode(db.users.map((u: any) => u.referralCode)),
      referredByCode,
      bonusPoints: 0,
      created_at: new Date().toISOString()
    };

    db.users.push(newUser);

    // Add onboarding message
    db.notifications.push({
      id: "notif-welcome-" + userId,
      userId: userId,
      title: "Inscription réussie",
      message: `Heureux de vous compter parmi nous, ${newUser.name} ! Profitez d'un bonus de bienvenue en insérant le code BIENVENUE dans la section correspondante !`,
      date: new Date().toISOString(),
      readBy: []
    });

    if (referrerUser) {
      db.notifications.push({
        id: "notif-sponsor-" + Date.now(),
        userId: referrerUser.id,
        title: "Nouvel invité enregistré",
        message: `Félicitations, ${newUser.name} s'est inscrit sous votre lien de parrainage (Niveau 1) !`,
        date: new Date().toISOString(),
        readBy: []
      });
    }

    saveLocalDB(db);

    return {
      success: true,
      userId: newUser.id,
      name: newUser.name,
      whatsapp: newUser.whatsapp,
      isAdmin: false
    };
  });
}

export async function loginUser(payload: any) {
  return apiCall("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  }, () => {
    const db = getLocalDB();
    const { whatsapp, password } = payload;

    if (!whatsapp || !password) {
      throw new Error("Veuillez entrer votre numéro WhatsApp et mot de passe.");
    }

    const cleanInput = whatsapp.trim().replace(/^\+/, "").replace(/\s+/g, "").replace(/^0+/, "");
    const user = db.users.find((u: any) => {
      const uPh = u.whatsapp.trim().replace(/^\+/, "").replace(/\s+/g, "").replace(/^0+/, "");
      return uPh === cleanInput || uPh.endsWith(cleanInput) || cleanInput.endsWith(uPh);
    });

    if (!user) {
      throw new Error("Identifiants incorrects ou compte inexistant.");
    }

    if (user.status === "blocked") {
      throw new Error("Votre compte a été bloqué par un administrateur.");
    }

    if (user.passwordHash !== password) {
      throw new Error("Mot de passe incorrect.");
    }

    // Process passives
    processDailyEarningsLocal(user.id);

    return {
      success: true,
      user: {
        id: user.id,
        name: user.name,
        whatsapp: user.whatsapp,
        country: user.country,
        referralCode: user.referralCode,
        isAdmin: !!user.isAdmin
      }
    };
  });
}

export async function resetPassword(payload: any) {
  return apiCall("/api/auth/reset-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  }, () => {
    const db = getLocalDB();
    const { whatsapp, newPassword } = payload;
    
    const userIndex = db.users.findIndex((u: any) => u.whatsapp.trim() === whatsapp.trim());
    if (userIndex === -1) {
      throw new Error("Aucun utilisateur trouvé avec ce numéro.");
    }

    db.users[userIndex].passwordHash = newPassword;
    saveLocalDB(db);
    return { success: true, message: "Mot de passe réinitialisé avec succès !" };
  });
}

export async function fetchUserProfile(userId: string) {
  return apiCall(`/api/user/profile/${userId}`, undefined, () => {
    processDailyEarningsLocal(userId);
    const db = getLocalDB();

    const user = db.users.find((u: any) => u.id === userId);
    if (!user) {
      throw new Error("Utilisateur non trouvé.");
    }

    const investments = db.investments.filter((i: any) => i.userId === userId);
    const deposits = db.deposits.filter((d: any) => d.userId === userId);
    const withdrawals = db.withdrawals.filter((w: any) => w.userId === userId);

    const level1Invitees = db.users.filter((u: any) => u.referredByCode === user.referralCode);
    const level1Codes = level1Invitees.map((u: any) => u.referralCode);
    const level2Invitees = db.users.filter((u: any) => u.referredByCode !== null && level1Codes.includes(u.referredByCode));
    const level2Codes = level2Invitees.map((u: any) => u.referralCode);
    const level3Invitees = db.users.filter((u: any) => u.referredByCode !== null && level2Codes.includes(u.referredByCode));

    const totalLevel1DepositAmount = db.deposits
      .filter((d: any) => d.status === "approved" && level1Invitees.some((inv: any) => inv.id === d.userId))
      .reduce((sum: number, d: any) => sum + d.amount, 0);

    const referralBonusEarned = db.referralCommissions
      .filter((c: any) => c.toUserId === userId)
      .reduce((sum: number, c: any) => sum + c.amount, 0);

    return {
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
      investments,
      deposits,
      withdrawals,
      referralStats: {
        level1Count: level1Invitees.length,
        level2Count: level2Invitees.length,
        level3Count: level3Invitees.length,
        totalInvited: level1Invitees.length + level2Invitees.length + level3Invitees.length,
        bonusEarned: referralBonusEarned,
        level1List: level1Invitees.map((u: any) => ({ name: u.name, date: u.created_at, country: u.country, status: u.status })),
        level2List: level2Invitees.map((u: any) => ({ name: u.name, date: u.created_at, country: u.country, status: u.status })),
        level3List: level3Invitees.map((u: any) => ({ name: u.name, date: u.created_at, country: u.country, status: u.status }))
      }
    };
  });
}

export async function submitDeposit(payload: any) {
  return apiCall("/api/user/deposit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  }, () => {
    const db = getLocalDB();
    const { userId, amount, reference, paymentCapture, provider } = payload;

    if (!userId || !amount || !reference) {
      throw new Error("Tous les détails de dépôt sont obligatoires.");
    }

    const user = db.users.find((u: any) => u.id === userId);
    if (!user) {
      throw new Error("Utilisateur non authentifié.");
    }

    const nDeposit = {
      id: "dep-" + Date.now(),
      userId,
      whatsapp: user.whatsapp,
      amount: parseFloat(amount),
      reference,
      paymentCapture: paymentCapture || "",
      provider: provider || "Mobile Money",
      status: "pending" as const,
      date: new Date().toISOString()
    };

    db.deposits.push(nDeposit);
    saveLocalDB(db);

    return { success: true, message: "Dépôt soumis avec succès, en attente de vérification administrative." };
  });
}

export async function requestWithdrawal(payload: any) {
  return apiCall("/api/user/withdraw", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  }, () => {
    const db = getLocalDB();
    const { userId, amount, provider } = payload;

    const parsedAmount = parseFloat(amount);
    if (!userId || isNaN(parsedAmount) || parsedAmount <= 0) {
      throw new Error("Veuillez saisir un montant de retrait valide.");
    }

    const uIdx = db.users.findIndex((u: any) => u.id === userId);
    if (uIdx === -1) {
      throw new Error("Utilisateur introuvable.");
    }

    const activeUser = db.users[uIdx];
    if (activeUser.balance < parsedAmount) {
      throw new Error("Solde insuffisant pour ce retrait.");
    }

    if (parsedAmount < 1000) {
      throw new Error("Le montant minimum de retrait est de 1000 FCFA.");
    }

    // Debit user balance first
    activeUser.balance -= parsedAmount;

    const nWithdrawal = {
      id: "with-" + Date.now(),
      userId,
      whatsapp: activeUser.whatsapp,
      amount: parsedAmount,
      provider: provider || "Mobile Money",
      status: "pending" as const,
      date: new Date().toISOString()
    };

    db.withdrawals.push(nWithdrawal);
    saveLocalDB(db);

    return { success: true, message: "Demande de retrait enregistrée avec succès. Traitement sous 2 à 24 heures." };
  });
}

export async function purchaseProduct(userId: string, productId: string) {
  return apiCall("/api/user/buy-product", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, productId })
  }, () => {
    const db = getLocalDB();
    
    const product = db.products.find((p: any) => p.id === productId);
    if (!product) {
      throw new Error("Produit ou Plan d'investissement non trouvé.");
    }

    const maxAllowed = product.maxPurchaseCount !== undefined ? product.maxPurchaseCount : 3;
    const currentPurchased = db.investments.filter((i: any) => i.userId === userId && i.planId === productId).length;
    if (currentPurchased >= maxAllowed) {
      throw new Error(`Limite de souscription atteinte ⚠️ ! Vous ne pouvez souscrire au plan "${product.name}" que ${maxAllowed} fois au maximum. Vous l'avez déjà activé ${currentPurchased} fois.`);
    }

    const uIdx = db.users.findIndex((u: any) => u.id === userId);
    if (uIdx === -1) {
      throw new Error("Utilisateur introuvable.");
    }

    const user = db.users[uIdx];
    if (user.balance < product.price) {
      throw new Error(`Solde insuffisant pour ce plan (${product.price} FCFA requis). Veuillez d'abord faire un dépôt Mobile Money.`);
    }

    // Debit user
    user.balance -= product.price;

    const nInvestment = {
      id: "inv-" + Date.now(),
      userId,
      planId: productId,
      planName: product.name,
      price: product.price,
      dailyReturn: product.dailyReturn,
      totalWeeks: 1,
      daysActive: 0,
      totalReturn: product.totalReturn,
      purchaseDate: new Date().toISOString(),
      lastClaimDate: new Date().toISOString()
    };

    db.investments.push(nInvestment);

    // Apply commissions to sponsor hierarchy
    let currentSponsorCode = user.referredByCode;
    let level: 1|2|3 = 1;

    const commissionRates = { 1: 0.12, 2: 0.05, 3: 0.02 }; // 12% - 5% - 2%

    while (currentSponsorCode && level <= 3) {
      const rate = commissionRates[level];
      const sponsorIdx = db.users.findIndex((u: any) => u.referralCode === currentSponsorCode);
      if (sponsorIdx !== -1) {
        const sponsor = db.users[sponsorIdx];
        const gain = parseFloat((product.price * rate).toFixed(2));
        
        sponsor.balance += gain;
        sponsor.bonusPoints += Math.floor(gain / 10);

        db.referralCommissions.push({
          id: `comm-${Date.now()}-${level}`,
          fromUserId: userId,
          toUserId: sponsor.id,
          amount: gain,
          level,
          date: new Date().toISOString()
        });

        db.notifications.push({
          id: `notif-comm-${Date.now()}-${level}`,
          userId: sponsor.id,
          title: `Commission de parrainage (Niveau ${level})`,
          message: `Vous avez reçu un bonus de ${gain} FCFA suite à l'achat du plan ${product.name} par votre sous-affilié ${user.name}.`,
          date: new Date().toISOString(),
          readBy: []
        });

        currentSponsorCode = sponsor.referredByCode;
        level++;
      } else {
        break;
      }
    }

    saveLocalDB(db);

    return { success: true, message: `Félicitations! Vous venez d'activer votre plan ${product.name}. Vos gains de ${product.dailyReturn} FCFA tomberont toutes les 24h.` };
  });
}

export async function claimBonusCode(userId: string, code: string) {
  return apiCall("/api/user/redeem-bonus", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, code })
  }, () => {
    const db = getLocalDB();
    const cleanC = code.toUpperCase().trim();

    const bonus = db.bonusCodes.find((b: any) => b.code === cleanC);
    if (!bonus) {
      throw new Error("Code promo ou bonus non valide ou expiré.");
    }

    if (bonus.claimedBy.includes(userId)) {
      throw new Error("Vous avez déjà réclamé les avantages de ce code.");
    }

    if (bonus.usageLimit !== undefined && bonus.claimedBy.length >= bonus.usageLimit) {
      throw new Error("La limite maximale d'utilisateurs autorisés pour ce code bonus a été dépassée.");
    }

    const uIdx = db.users.findIndex((u: any) => u.id === userId);
    if (uIdx === -1) {
      throw new Error("Utilisateur inexistant.");
    }

    // Credit user
    db.users[uIdx].balance += bonus.amount;
    bonus.claimedBy.push(userId);

    db.notifications.push({
      id: "notif-bonus-" + Date.now(),
      userId,
      title: "Code Cadeau Validé",
      message: `Votre code cadeau "${cleanC}" a été validé ! Votre compte a été crédité de ${bonus.amount} FCFA de bonus d'évaluation d'investissement. L'agriculture africaine vous salue !`,
      date: new Date().toISOString(),
      readBy: []
    });

    saveLocalDB(db);
    return { success: true, amount: bonus.amount };
  });
}

export async function claimDailyGift(userId: string) {
  return apiCall("/api/user/daily-reward", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId })
  }, () => {
    const db = getLocalDB();
    const nowStr = new Date().toDateString();

    const uIdx = db.users.findIndex((u: any) => u.id === userId);
    if (uIdx === -1) {
      throw new Error("Utilisateur inexistant.");
    }

    const user = db.users[uIdx];
    if (user.lastDailyCheckin === nowStr) {
      throw new Error("Vous avez déjà effectué votre pointage quotidien de récoltes aujourd'hui ! Revenez demain 🌾.");
    }

    // Daily reward amount between 50 and 200 FCFA
    const reward = 50 + Math.floor(Math.random() * 151);
    user.balance += reward;
    user.lastDailyCheckin = nowStr;

    db.notifications.push({
      id: "notif-daily-" + Date.now(),
      userId,
      title: "Pointage de Moisson Quotidien",
      message: `Félicitations! Votre pointage de présence aux champs a été validé. Vous recevez un bonus de moisson de ${reward} FCFA. Continuez l'investissement !`,
      date: new Date().toISOString(),
      readBy: []
    });

    saveLocalDB(db);
    return { success: true, reward };
  });
}

export async function fetchUserNotifications(userId: string) {
  return apiCall(`/api/user/notifications/${userId}`, undefined, () => {
    const db = getLocalDB();
    return db.notifications.filter((n: any) => n.userId === "all" || n.userId === userId);
  });
}

export async function markNotificationsAsRead(userId: string) {
  return apiCall("/api/user/notifications/read", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId })
  }, () => {
    const db = getLocalDB();
    db.notifications = db.notifications.map((n: any) => {
      if ((n.userId === "all" || n.userId === userId) && !n.readBy.includes(userId)) {
        n.readBy.push(userId);
      }
      return n;
    });
    saveLocalDB(db);
    return { success: true };
  });
}

export async function sendChatMessage(userId: string, sender: string, message: string) {
  return apiCall("/api/chat/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, sender, message })
  }, () => {
    const db = getLocalDB();
    const nTicket = {
      id: "ticket-" + Date.now(),
      userId,
      sender: sender as "user" | "admin",
      message,
      date: new Date().toISOString()
    };
    db.tickets.push(nTicket);
    saveLocalDB(db);
    return { success: true, ticket: nTicket };
  });
}

export async function fetchChatHistory(userId: string) {
  return apiCall(`/api/chat/history/${userId}`, undefined, () => {
    const db = getLocalDB();
    return db.tickets.filter((t: any) => t.userId === userId);
  });
}

/* ==================== ADMIN ENDPOINTS Fallbacks ==================== */

export async function fetchAdminStats() {
  return apiCall("/api/admin/stats", undefined, () => {
    const db = getLocalDB();
    const totalUsers = db.users.length;
    const totalDeposited = db.deposits.reduce((acc, d) => d.status === "approved" ? acc + d.amount : acc, 0);
    const pendingDeposits = db.deposits.reduce((acc, d) => d.status === "pending" ? acc + d.amount : acc, 0);
    const totalWithdrawn = db.withdrawals.reduce((acc, w) => w.status === "approved" ? acc + w.amount : acc, 0);
    const pendingWithdrawals = db.withdrawals.reduce((acc, w) => w.status === "pending" ? acc + w.amount : acc, 0);
    const investmentsActive = db.investments.length;

    return {
      totalUsers,
      totalDeposited,
      pendingDeposits,
      totalWithdrawn,
      pendingWithdrawals,
      investmentsActive
    };
  });
}

export async function fetchAdminUsers() {
  return apiCall("/api/admin/users", undefined, () => {
    const db = getLocalDB();
    return db.users;
  });
}

export async function executeAdminUserAction(payload: any) {
  return apiCall("/api/admin/users/action", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  }, () => {
    const db = getLocalDB();
    const { userId, action, amount } = payload;
    const uIdx = db.users.findIndex((u: any) => u.id === userId);
    if (uIdx === -1) throw new Error("Utilisateur introuvable");

    if (action === "block") {
      db.users[uIdx].status = "blocked";
    } else if (action === "unblock") {
      db.users[uIdx].status = "active";
    } else if (action === "add_balance") {
      const val = parseFloat(amount || "0");
      db.users[uIdx].balance += val;
      db.users[uIdx].totalDeposits += val;
    } else if (action === "deduct_balance") {
      const val = parseFloat(amount || "0");
      db.users[uIdx].balance = Math.max(0, db.users[uIdx].balance - val);
    }

    saveLocalDB(db);
    return { success: true };
  });
}

export async function fetchAdminDeposits() {
  return apiCall("/api/admin/deposits", undefined, () => {
    const db = getLocalDB();
    return db.deposits;
  });
}

export async function executeAdminDepositAction(depositId: string, action: "approve" | "reject") {
  return apiCall("/api/admin/deposits/action", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ depositId, action })
  }, () => {
    const db = getLocalDB();
    const dIdx = db.deposits.findIndex((d: any) => d.id === depositId);
    if (dIdx === -1) throw new Error("Dépôt introuvable");

    db.deposits[dIdx].status = action === "approve" ? "approved" : "rejected";

    if (action === "approve") {
      const depObj = db.deposits[dIdx];
      const uIdx = db.users.findIndex((u: any) => u.id === depObj.userId);
      if (uIdx !== -1) {
        db.users[uIdx].balance += depObj.amount;
        db.users[uIdx].totalDeposits += depObj.amount;

        db.notifications.push({
          id: "notif-dep-app-" + Date.now(),
          userId: depObj.userId,
          title: "Dépôt validé avec succès",
          message: `Votre versement de ${depObj.amount} FCFA a été approuvé par l'administrateur. Les fonds sont présents sur votre compte !`,
          date: new Date().toISOString(),
          readBy: []
        });
      }
    }

    saveLocalDB(db);
    return { success: true };
  });
}

export async function fetchAdminWithdrawals() {
  return apiCall("/api/admin/withdrawals", undefined, () => {
    const db = getLocalDB();
    return db.withdrawals;
  });
}

export async function executeAdminWithdrawalAction(withdrawalId: string, action: "approve" | "reject") {
  return apiCall("/api/admin/withdrawals/action", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ withdrawalId, action })
  }, () => {
    const db = getLocalDB();
    const wIdx = db.withdrawals.findIndex((w: any) => w.id === withdrawalId);
    if (wIdx === -1) throw new Error("Retrait introuvable");

    db.withdrawals[wIdx].status = action === "approve" ? "approved" : "rejected";

    const withObj = db.withdrawals[wIdx];
    const uIdx = db.users.findIndex((u: any) => u.id === withObj.userId);

    if (action === "approve" && uIdx !== -1) {
      db.users[uIdx].totalWithdrawals += withObj.amount;
      db.notifications.push({
        id: "notif-with-app-" + Date.now(),
        userId: withObj.userId,
        title: "Retrait traité 📲",
        message: `Félicitations! Votre demande de retrait de ${withObj.amount} FCFA a été exécutée par virement Mobile Money. Retrouvez vos liquidités sur votre téléphone !`,
        date: new Date().toISOString(),
        readBy: []
      });
    } else if (action === "reject" && uIdx !== -1) {
      // Refund the user
      db.users[uIdx].balance += withObj.amount;
      db.notifications.push({
        id: "notif-with-rej-" + Date.now(),
        userId: withObj.userId,
        title: "Retrait rejeté",
        message: `Votre demande de retrait de ${withObj.amount} FCFA a été rejetée par l'administrateur. Vos fonds vous ont été recrédités.`,
        date: new Date().toISOString(),
        readBy: []
      });
    }

    saveLocalDB(db);
    return { success: true };
  });
}

export async function fetchAdminProducts() {
  return apiCall("/api/admin/products", undefined, () => {
    const db = getLocalDB();
    return { products: db.products };
  });
}

export async function createAdminProduct(payload: any) {
  return apiCall("/api/admin/products", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  }, () => {
    const db = getLocalDB();
    const { name, price, dailyReturn, durationDays, badge, maxPurchaseCount } = payload;

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
    saveLocalDB(db);

    return { success: true, product: newProduct };
  });
}

export async function deleteAdminProduct(productId: string) {
  return apiCall(`/api/admin/products/${productId}`, {
    method: "DELETE"
  }, () => {
    const db = getLocalDB();
    db.products = db.products.filter((p: any) => p.id !== productId);
    saveLocalDB(db);
    return { success: true, message: "Produit supprimé avec succès." };
  });
}

export async function updateAdminProduct(productId: string, payload: any) {
  return apiCall(`/api/admin/products/${productId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  }, () => {
    const db = getLocalDB();
    const { name, price, dailyReturn, durationDays, badge, maxPurchaseCount } = payload;
    const pIdx = db.products.findIndex((p: any) => p.id === productId);
    if (pIdx === -1) throw new Error("Produit introuvable");

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

    saveLocalDB(db);
    return { success: true, product: db.products[pIdx] };
  });
}

export async function triggerAdminGlobalNotification(payload: any) {
  return apiCall("/api/admin/notify-all", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  }, () => {
    const db = getLocalDB();
    const { title, message } = payload;

    const globNotif = {
      id: "notif-glob-" + Date.now(),
      userId: "all",
      title,
      message,
      date: new Date().toISOString(),
      readBy: []
    };

    db.notifications.push(globNotif);
    saveLocalDB(db);
    return { success: true, notification: globNotif };
  });
}

export async function generateAdminBonusCode(payload: any) {
  return apiCall("/api/admin/bonus-codes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  }, () => {
    const db = getLocalDB();
    const { code, amount, usageLimit } = payload;

    const cleanC = code.toUpperCase().trim();
    const exists = db.bonusCodes.some((b: any) => b.code === cleanC);
    if (exists) throw new Error("Ce code bonus existe déjà.");

    const nBonus = {
      code: cleanC,
      amount: parseFloat(amount),
      usageLimit: usageLimit ? parseInt(usageLimit) : undefined,
      claimedBy: [],
      created_by: "admin-master"
    };

    db.bonusCodes.push(nBonus);
    saveLocalDB(db);
    return { success: true, bonusCode: nBonus };
  });
}

export async function fetchAdminBonusCodes() {
  return apiCall("/api/admin/bonus-codes", undefined, () => {
    const db = getLocalDB();
    return { bonusCodes: db.bonusCodes };
  });
}

export async function fetchAdminChats() {
  return apiCall("/api/admin/chats", undefined, () => {
    const db = getLocalDB();
    return {
      chats: db.users.filter((u: any) => !u.isAdmin).map((u: any) => {
        const userMsgs = db.tickets.filter((t: any) => t.userId === u.id);
        const lastMsg = userMsgs[userMsgs.length - 1];
        return {
          userId: u.id,
          userName: u.name,
          whatsapp: u.whatsapp,
          msgCount: userMsgs.length,
          lastMessage: lastMsg ? lastMsg.message : "Pas encore de message",
          lastMessageDate: lastMsg ? lastMsg.date : u.created_at
        };
      }).filter((c: any) => c.msgCount > 0).sort((a: any, b: any) => new Date(b.lastMessageDate).getTime() - new Date(a.lastMessageDate).getTime())
    };
  });
}

export async function fetchPlatformSettings() {
  return apiCall("/api/public/settings", undefined, () => {
    const db = getLocalDB();
    return db.settings;
  });
}

export async function updatePlatformSettings(payload: any) {
  return apiCall("/api/admin/settings", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  }, () => {
    const db = getLocalDB();
    const { whatsappGroupLink, telegramChannelLink } = payload;

    db.settings = {
      whatsappGroupLink: whatsappGroupLink || "https://chat.whatsapp.com/ExempleGroupeInvesta",
      telegramChannelLink: telegramChannelLink || "https://t.me/InvestaPremiumCanal"
    };

    saveLocalDB(db);
    return { success: true, settings: db.settings };
  });
}
