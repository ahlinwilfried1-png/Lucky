import React, { useEffect, useState } from "react";
import { 
  Wallet, 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Users, 
  Gift, 
  MessageSquare, 
  User as UserIcon, 
  History, 
  Bell, 
  ChevronRight, 
  Copy, 
  Check, 
  Upload, 
  Globe, 
  ExternalLink,
  Zap,
  LogOut,
  ShieldAlert,
  Megaphone,
  Sprout,
  Headphones
} from "lucide-react";
import { 
  fetchUserProfile, 
  submitDeposit, 
  requestWithdrawal, 
  purchaseProduct, 
  claimBonusCode, 
  claimDailyGift, 
  fetchUserNotifications, 
  markNotificationsAsRead, 
  sendChatMessage, 
  fetchChatHistory,
  fetchAdminProducts,
  fetchPlatformSettings
} from "../api";
import { User, Investment, Deposit, Withdrawal, Notification, ChatMessage, Product } from "../types";

interface DashboardViewProps {
  userId: string;
  onLogout: () => void;
  lang: "fr" | "en";
  onNavigate: (view: "home" | "login" | "register" | "dashboard" | "admin") => void;
}

export default function DashboardView({ userId, onLogout, lang, onNavigate }: DashboardViewProps) {
  // Navigation inside dashboard (tab bar at the bottom)
  // "home" (Accueil), "products" (Produits), "team" (Équipe), "profile" (Profil)
  const [activeTab, setActiveTab] = useState<"home" | "products" | "team" | "profile">("home");

  // User Profile information
  const [profile, setProfile] = useState<User | null>(null);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [referralStats, setReferralStats] = useState({
    level1Count: 0,
    level2Count: 0,
    level3Count: 0,
    totalInvited: 0,
    bonusEarned: 0,
    level1List: [] as any[],
    level2List: [] as any[],
    level3List: [] as any[]
  });

  // Fetchable static products
  const [productsList, setProductsList] = useState<Product[]>([]);

  // Sub-views launched from Profile tab
  const [activeSubView, setActiveSubView] = useState<"none" | "deposit" | "withdraw" | "history" | "chat" | "bonus" | "notifications">("none");

  // Notifications live
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  // States
  const [refCopied, setRefCopied] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formMsg, setFormMsg] = useState("");
  const [formErr, setFormErr] = useState("");

  // Form states for Dépôt
  const [depositAmount, setDepositAmount] = useState("");
  const [depositReference, setDepositReference] = useState("");
  const [depositProvider, setDepositProvider] = useState("MTN Mobile Money");
  const [depositCapture, setDepositCapture] = useState(""); // base64 string
  const [depositWhatsapp, setDepositWhatsapp] = useState("");

  // Form states for Retrait
  const [withdrawalAmount, setWithdrawalAmount] = useState("");
  const [withdrawalPhone, setWithdrawalPhone] = useState("");
  const [withdrawalProvider, setWithdrawalProvider] = useState("Tmoney");

  // Code Bonus promotional coupon state
  const [bonusCodeInput, setBonusCodeInput] = useState("");

  // Chat message support states
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");

  // Platform configs (social links) for "casque bleue" support panel
  const [platformSettings, setPlatformSettings] = useState<{ whatsappGroupLink: string; telegramChannelLink: string }>({
    whatsappGroupLink: "https://chat.whatsapp.com/ExempleGroupeInvesta",
    telegramChannelLink: "https://t.me/InvestaPremiumCanal"
  });
  const [supportPopupOpen, setSupportPopupOpen] = useState(false);

  // Live motivational notification tickers
  const [activeMotivation, setActiveMotivation] = useState<{ text: string; type: "deposit" | "withdrawal" | "referral" | "bonus"; name: string; amount: string; time: string } | null>(null);
  const [motivationVisible, setMotivationVisible] = useState(false);

  // Testimonials state & constant (va-et-vient slideshow)
  const testimonialsList = [
    {
      id: 1,
      name: "Mamadou S.",
      phone: "+221 77•• •• 52",
      country: "Sénégal 🇸🇳",
      text: "Grâce à iAgri, mon épargne grandit en sécurité. Mon investissement de 50 000 FCFA sur la ferme avicole me rapporte chaque jour !",
      amount: "50 000 F",
      avatar: "MS",
      stars: 5
    },
    {
      id: 2,
      name: "Amina T.",
      phone: "+229 97•• •• 14",
      country: "Bénin 🇧🇯",
      text: "Service client impeccable et très réactif. Retrait de 45 000 FCFA reçu en 5 minutes chrono sur mon numéro MTN Momo !",
      amount: "45 000 F",
      avatar: "AT",
      stars: 5
    },
    {
      id: 3,
      name: "Christian K.",
      phone: "+225 05•• •• 88",
      country: "Côte d'Ivoire 🇨🇮",
      text: "J'étais un peu sceptique au début. Après mon premier retrait de 75 000 FCFA via Wave, j'ai directement réinvesti sur la riziculture !",
      amount: "75 000 F",
      avatar: "CK",
      stars: 5
    },
    {
      id: 4,
      name: "Fatoumata B.",
      phone: "+223 76•• •• 44",
      country: "Mali 🇲🇱",
      text: "Un projet d'agriculture africain concret et très transparent. Les rendements quotidiens tombent à l'heure. Je recommande iAgri.",
      amount: "250 000 F",
      avatar: "FB",
      stars: 5
    },
    {
      id: 5,
      name: "Emeka O.",
      phone: "+228 90•• •• 45",
      country: "Togo 🇹🇬",
      text: "Le système de parrainage fonctionne à merveille. J'ai parrainé mes proches et reçu plus de 15 000 FCFA de cadeaux bonus !",
      amount: "15 000 F",
      avatar: "EO",
      stars: 5
    }
  ];

  const [testiIndex, setTestiIndex] = useState(0);
  const [testiDir, setTestiDir] = useState(1); // 1 for right, -1 for left (va-et-vient)

  // Custom modal states to bypass iframe/sandboxed popup restrictions
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"alert" | "confirm">("alert");
  const [modalTitle, setModalTitle] = useState("");
  const [modalMessage, setModalMessage] = useState("");
  const [modalConfirmAction, setModalConfirmAction] = useState<{ action: () => void } | null>(null);

  const triggerAlert = (title: string, message: string) => {
    setModalTitle(title);
    setModalMessage(message);
    setModalType("alert");
    setModalConfirmAction(null);
    setModalOpen(true);
  };

  const triggerConfirm = (title: string, message: string, onConfirm: () => void) => {
    setModalTitle(title);
    setModalMessage(message);
    setModalType("confirm");
    setModalConfirmAction({ action: onConfirm });
    setModalOpen(true);
  };

  // Auto refresh profile helper
  const loadProfile = () => {
    setProfileLoading(true);
    fetchUserProfile(userId).then(data => {
      setProfile(data.user);
      setInvestments(data.investments);
      setDeposits(data.deposits);
      setWithdrawals(data.withdrawals);
      setReferralStats(data.referralStats);
      setProfileLoading(false);
    }).catch(err => {
      console.error(err);
      setProfileLoading(false);
    });

    // Load available product plans
    fetchAdminProducts().then(data => {
      setProductsList(data.products || []);
    }).catch(err => console.error("Plan products fetch fail:", err));

    // Load platform settings (social links etc. for casque support)
    fetchPlatformSettings().then(data => {
      if (data && data.whatsappGroupLink) {
        setPlatformSettings(data);
      }
    }).catch(err => console.error("Could not fetch settings:", err));

    // Load notifications
    fetchUserNotifications(userId).then(data => {
      setNotifications(data.notifications);
      setUnreadNotifications(data.unreadCount);
    }).catch(err => console.error(err));
  };

  useEffect(() => {
    loadProfile();

    // Setup periodic automatic payout claim verification on profile
    const refInterval = setInterval(() => {
      fetchUserProfile(userId).then(data => {
        setProfile(data.user);
        setInvestments(data.investments);
      }).catch(e => {});
    }, 12000);

    return () => clearInterval(refInterval);
  }, [userId]);

  // Handle cyclic motivational activity notifications
  useEffect(() => {
    const MOTIVATION_POOL = [
      { name: "+229 97•• •• 14", type: "deposit" as const, amount: "50 000 FCFA", text: "Investisseur +229 97•• •• 14 vient d'investir 50 000 FCFA sur le projet Élevage Avicole 🐔 !", time: "À l'instant" },
      { name: "+225 05•• •• 88", type: "withdrawal" as const, amount: "12 500 FCFA", text: "Retrait de 12 500 FCFA approuvé avec succès pour +225 05•• •• 88 via Wave 💰 !", time: "Il y a 1 min" },
      { name: "+229 63•• •• 41", type: "deposit" as const, amount: "100 000 FCFA", text: "Investisseur +229 63•• •• 41 vient de recharger son compte avec succès 💳 !", time: "À l'instant" },
      { name: "+228 90•• •• 45", type: "bonus" as const, amount: "2 000 FCFA", text: "Félicitations à +228 90•• •• 45 qui a réclamé un coupon cadeau de 2 000 FCFA 🎁 !", time: "Il y a 2 min" },
      { name: "+229 61•• •• 90", type: "deposit" as const, amount: "150 000 FCFA", text: "Investisseur +229 61•• •• 90 vient d'investir 150 000 FCFA sur la Riziculture irriguée 🌾 !", time: "Il y a 3 min" },
      { name: "+229 95•• •• 71", type: "withdrawal" as const, amount: "45 000 FCFA", text: "Retrait de 45 000 FCFA payé par MTN Momo pour +229 95•• •• 71 ⚡ !", time: "Il y a 4 min" },
      { name: "+223 76•• •• 44", type: "deposit" as const, amount: "250 000 FCFA", text: "Investisseur +223 76•• •• 44 vient d'investir 250 000 FCFA sur le Maraîchage Moderne 🍅 !", time: "À l'instant" },
      { name: "+228 92•• •• 19", type: "withdrawal" as const, amount: "75 000 FCFA", text: "Retrait de 75 000 FCFA approuvé pour +228 92•• •• 19 via Moov Money 💸 !", time: "Il y a 5 min" },
      { name: "+229 96•• •• 02", type: "referral" as const, amount: "15 000 FCFA", text: "Félicitations à +229 96•• •• 02 qui a reçu un bonus de parrainage de 15 000 FCFA 🤝 !", time: "Il y a 6 min" },
      { name: "+225 07•• •• 56", type: "deposit" as const, amount: "500 000 FCFA", text: "Investisseur +225 07•• •• 56 vient d'investir 500 000 FCFA sur la Ferme Piscicole 🐟 !", time: "À l'instant" },
      { name: "+221 78•• •• 13", type: "withdrawal" as const, amount: "120 000 FCFA", text: "Retrait de 120 000 FCFA payé instantanément à +221 78•• •• 13 💰 !", time: "Il y a 7 min" },
      { name: "+229 55•• •• 89", type: "deposit" as const, amount: "20 000 FCFA", text: "Investisseur +229 55•• •• 89 vient de recharger 20 000 FCFA 💳 !", time: "Il y a 8 min" },
      { name: "+228 91•• •• 41", type: "deposit" as const, amount: "10 000 FCFA", text: "Investisseur +228 91•• •• 41 vient d'activer un plan d'Élevage de Lapins 🐰 !", time: "À l'instant" },
      { name: "+225 01•• •• 33", type: "withdrawal" as const, amount: "28 000 FCFA", text: "Retrait de 28 000 FCFA payé avec succès à +225 01•• •• 33 par Wave Pay 💳 !", time: "Il y a 10 min" }
    ];

    // Show first one after 3.5 seconds
    const initialTimeout = setTimeout(() => {
      const first = MOTIVATION_POOL[Math.floor(Math.random() * MOTIVATION_POOL.length)];
      setActiveMotivation(first);
      setMotivationVisible(true);
      
      const hideTimeout = setTimeout(() => setMotivationVisible(false), 6000);
      return () => clearTimeout(hideTimeout);
    }, 3500);

    const intervalId = setInterval(() => {
      const item = MOTIVATION_POOL[Math.floor(Math.random() * MOTIVATION_POOL.length)];
      setActiveMotivation(item);
      setMotivationVisible(true);
      
      setTimeout(() => {
        setMotivationVisible(false);
      }, 6000);
    }, 15000);

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(intervalId);
    };
  }, []);

  // Automated va-et-vient testimonials scroller effect
  useEffect(() => {
    const testiInterval = setInterval(() => {
      setTestiIndex((prev) => {
        let nextDir = testiDir;
        let nextIndex = prev + testiDir;
        if (nextIndex >= testimonialsList.length) {
          nextDir = -1;
          nextIndex = prev - 1;
        } else if (nextIndex < 0) {
          nextDir = 1;
          nextIndex = prev + 1;
        }
        setTestiDir(nextDir);
        return nextIndex >= 0 && nextIndex < testimonialsList.length ? nextIndex : 0;
      });
    }, 4500); // Transitions every 4.5 seconds

    return () => clearInterval(testiInterval);
  }, [testiDir, testimonialsList.length]);

  // Realtime countdown ticker for VIP payments
  const [countdowns, setCountdowns] = useState<Record<string, string>>({});

  useEffect(() => {
    if (investments.length === 0) return;

    const tick = () => {
      const now = new Date().getTime();
      const nextMap: Record<string, string> = {};

      investments.forEach((inv) => {
        const lastClaimDate = new Date(inv.lastClaimDate).getTime();
        const nextClaimDate = lastClaimDate + 24 * 60 * 60 * 1000;
        const diffMs = nextClaimDate - now;

        if (diffMs <= 0) {
          nextMap[inv.id] = lang === "fr" ? "Versement en cours..." : "Processing...";
        } else {
          const hours = Math.floor(diffMs / (1000 * 60 * 60));
          const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
          const secs = Math.floor((diffMs % (1000 * 60)) / 1000);
          nextMap[inv.id] = `${hours.toString().padStart(2, "0")}h ${mins.toString().padStart(2, "0")}m ${secs.toString().padStart(2, "0")}s`;
        }
      });

      setCountdowns(nextMap);
    };

    tick();
    const intervalId = setInterval(tick, 1000);
    return () => clearInterval(intervalId);
  }, [investments, lang]);

  // Handle files encoding to base64 for upload screenshots
  const handleCaptureFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setDepositCapture(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Generate a mock payment transaction reference to guide MTN transaction confirmation
  const generateRandomReference = () => {
    const rand = "TXN" + Math.floor(Math.random() * 9000000 + 1000000);
    setDepositReference(rand);
  };

  // Submit deposit reference
  const handleDepositSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormMsg("");
    setFormErr("");
    
    if (!depositAmount || !depositReference || !depositProvider) {
      setFormErr(lang === "fr" ? "Tous les champs de paiement sont requis." : "Please fill out basic fields.");
      return;
    }

    if (parseFloat(depositAmount) < 1000) {
      setFormErr(lang === "fr" ? "Le montant minimum de dépôt est de 1 000 FCFA." : "Minimum deposit amount is 1,000 FCFA.");
      return;
    }

    setSubmitting(true);
    try {
      await submitDeposit({
        userId,
        amount: depositAmount,
        reference: depositReference,
        provider: depositProvider,
        captureBase64: depositCapture,
        whatsapp: depositWhatsapp
      });
      setFormMsg(lang === "fr" ? "Félicitations! Dépôt soumis avec succès. Les administrateurs examinent votre demande (généralement sous 15 minutes)." : "Deposit submitted. Awaiting quick admin approval.");
      
      // reset form
      setDepositAmount("");
      setDepositReference("");
      setDepositCapture("");
      setDepositWhatsapp("");
      
      // refresh lists
      loadProfile();
    } catch (err: any) {
      setFormErr(err.message || "Erreur de dépôt.");
    } finally {
      setSubmitting(false);
    }
  };

  // Click handle purchase
  const handleBuyProduct = async (product: Product) => {
    if (!profile) return;
    if (profile.balance < product.price) {
      triggerAlert(
        lang === "fr" ? "Solde insuffisant ❌" : "Insufficient Balance ❌",
        lang === "fr"
          ? `Votre solde principal est de ${profile.balance.toLocaleString()} FCFA, mais ce plan coûte ${product.price.toLocaleString()} FCFA. Veuillez effectuer un dépôt ou accumuler plus d'intérêts d'abord.`
          : `Your balance is ${profile.balance.toLocaleString()} FCFA, but this plan costs ${product.price.toLocaleString()} FCFA. Please make a deposit first.`
      );
      setActiveSubView("deposit");
      setActiveTab("profile");
      return;
    }

    triggerConfirm(
      lang === "fr" ? "Confirmer l'allocation ⚡" : "Confirm Plan Activation ⚡",
      lang === "fr"
        ? `Êtes-vous sûr de vouloir activer le Plan d'investissement "${product.name}" d'une valeur de ${product.price.toLocaleString()} FCFA ? Le montant sera débité immédiatement.`
        : `Are you sure you want to activate investment Plan "${product.name}" for ${product.price.toLocaleString()} FCFA?`,
      async () => {
        try {
          await purchaseProduct(userId, product.id);
          triggerAlert(
            lang === "fr" ? "Succès de l'investissement 🎉" : "Activation Successful 🎉",
            lang === "fr"
              ? `Félicitations ! Le plan d'investissement "${product.name}" est maintenant actif. Vos gains quotidiens de +${product.dailyReturn} FCFA démarreront sous 24 heures.`
              : `Congratulations! Plan "${product.name}" is now active.`
          );
          loadProfile();
          setActiveTab("home");
        } catch (err: any) {
          triggerAlert(
            lang === "fr" ? "Erreur système" : "System Error",
            err.message || "Impossible d'initier l'investissement."
          );
        }
      }
    );
  };

  // Submit withdrawal
  const handleWithdrawalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormMsg("");
    setFormErr("");

    if (!withdrawalAmount || !withdrawalPhone || !withdrawalProvider) {
      setFormErr(lang === "fr" ? "Veuillez remplir l'intégralité du formulaire." : "Fill in all fields.");
      return;
    }

    if (!profile) return;
    const amt = parseFloat(withdrawalAmount);
    if (amt < 1000) {
      setFormErr(lang === "fr" ? "Le montant minimum de retrait est de 1 000 FCFA." : "Minimum lock is 1,000 FCFA.");
      return;
    }

    if (profile.balance < amt) {
      setFormErr(lang === "fr" ? "Le solde restant de gains est insuffisant." : "Inadequate wallet balance.");
      return;
    }

    setSubmitting(true);
    try {
      const formattedPhone = withdrawalPhone.startsWith("+") 
        ? withdrawalPhone 
        : `+228${withdrawalPhone.replace(/\s/g, "")}`;

      await requestWithdrawal({
        userId,
        amount: withdrawalAmount,
        whatsapp: formattedPhone,
        provider: withdrawalProvider
      });
      setFormMsg(lang === "fr" ? "Demande de retrait encodée avec succès ! Le montant a été retenu et sera envoyé après validation administrative." : "Withdrawal requested. Awaiting administrator payout.");
      setWithdrawalAmount("");
      setWithdrawalPhone("");
      loadProfile();
    } catch (err: any) {
      setFormErr(err.message || "Erreur de retrait");
    } finally {
      setSubmitting(false);
    }
  };

  // Submit Code Bonus claiming
  const handleRedeemBonus = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormMsg("");
    setFormErr("");
    if (!bonusCodeInput) return;

    setSubmitting(true);
    try {
      const rep = await claimBonusCode(userId, bonusCodeInput);
      setFormMsg(rep.message || "Bonus réclamé !");
      setBonusCodeInput("");
      loadProfile();
    } catch (err: any) {
      setFormErr(err.message || "Code invalide.");
    } finally {
      setSubmitting(false);
    }
  };

  // Claim free Daily checkin Gift
  const handleClaimDailyGift = async () => {
    setFormMsg("");
    setFormErr("");
    try {
      const res = await claimDailyGift(userId);
      triggerAlert(
        lang === "fr" ? "Cadeau d'activité journalier 🎁" : "Daily Gift 🎁",
        lang === "fr" 
          ? `Super ! Vous avez reçu un cadeau d'activité journalier de +${res.reward} FCFA !` 
          : `Amazing! Collected +${res.reward} FCFA check-in gift!`
      );
      loadProfile();
    } catch (err: any) {
      triggerAlert(
        lang === "fr" ? "Déjà réclamé ⚠️" : "Already Claimed ⚠️",
        lang === "fr" 
          ? "Vous avez déjà collecté votre cadeau d'activité aujourd'hui. Revenez demain !" 
          : "Daily gift already claimed for today!"
      );
    }
  };

  // Load and Send messages
  const loadChatHistory = () => {
    fetchChatHistory(userId).then(data => {
      setChatMessages(data.history || []);
    }).catch(err => console.error(err));
  };

  useEffect(() => {
    if (activeSubView === "chat") {
      loadChatHistory();
      const chatPoll = setInterval(loadChatHistory, 5000);
      return () => clearInterval(chatPoll);
    }
  }, [activeSubView]);

  const handleSendChatMsg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    try {
      await sendChatMessage(userId, "user", chatInput);
      setChatInput("");
      loadChatHistory();
      // auto scroll to bottom simulation
    } catch (e) {
      console.warn(e);
    }
  };

  // Mark all unread notifications as read
  const handleReadNotifications = () => {
    markNotificationsAsRead(userId).then(() => {
      setUnreadNotifications(0);
    }).catch(e => {});
  };

  useEffect(() => {
    if (activeSubView === "notifications") {
      handleReadNotifications();
    }
  }, [activeSubView]);

  // Copy referral affiliate code link
  const handleCopyLink = () => {
    if (!profile) return;
    const link = `${window.location.origin}/?ref=${profile.referralCode}`;
    navigator.clipboard.writeText(link).then(() => {
      setRefCopied(true);
      setTimeout(() => setRefCopied(false), 2000);
    });
  };

  if (profileLoading && !profile) {
    return (
      <div className="min-h-screen bg-[#F3F6FC] text-[#1E293B] flex flex-col justify-center items-center">
        <div className="w-10 h-10 border-4 border-[#0066FF] border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-xs font-mono tracking-widest text-[#0066FF] font-bold">CONNEXION SÉCURISÉE EN COURS...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F3F6FC] text-[#1E293B] pb-24 relative select-none">
      
      {/* Header Profile Dashboard Banner */}
      <header className="sticky top-0 z-40 bg-[#0066FF] px-4 py-4 border-b border-[#0052FF] shadow-md">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center shadow-md">
              <UserIcon className="w-5 h-5 text-[#0066FF]" />
            </div>
            <div>
              <h1 className="text-xs font-bold text-white uppercase">{profile?.name}</h1>
              <span className="text-[10px] text-blue-100 font-mono tracking-wider">{profile?.whatsapp}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Direct Admin toggle link if user is administrator */}
            {profile?.isAdmin && (
              <button
                onClick={() => onNavigate("admin")}
                className="flex items-center gap-1 bg-gradient-to-r from-red-600 to-red-500 text-white font-mono text-[9px] font-bold px-2 py-1 rounded shadow-md border border-red-400/20"
              >
                <ShieldAlert className="w-3 h-3" />
                <span>ADMIN PANEL</span>
              </button>
            )}

            <button 
              onClick={() => {
                setActiveSubView("notifications");
                setActiveTab("profile");
              }}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 relative text-white shrink-0"
            >
              <Bell className="w-4 h-4" />
              {unreadNotifications > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#FF7800] animate-ping"></span>
              )}
            </button>
            <button 
              onClick={onLogout}
              className="p-2 rounded-lg bg-red-600/20 hover:bg-red-600 text-white shrink-0 border border-red-500/10 text-xs"
              title="Déconnexion"
            >
              <LogOut className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area constrained for beautiful mobile view feel */}
      <main className="max-w-xl mx-auto px-4 py-6">
        
        {/* ==================== SUB ROUTING OVERLAYS ==================== */}

        {activeSubView !== "none" ? (
          <div>
            <button 
              onClick={() => setActiveSubView("none")}
              className="mb-4 inline-flex items-center gap-1 text-xs text-[#D4AF37] hover:underline font-mono"
            >
              ← Retour au Dashboard
            </button>

            {/* ERROR AND SUCCESS MSG BARS */}
            {formErr && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400 font-mono">
                ⚠️ {formErr}
              </div>
            )}
            {formMsg && (
              <div className="mb-4 p-3 bg-[#103D2E]/80 border border-emerald-500/20 rounded-xl text-xs text-emerald-400 font-mono">
                ✓ {formMsg}
              </div>
            )}

            {/* Dépôt View */}
            {activeSubView === "deposit" && (
              <div className="bg-[#0A0E17] border border-white/5 rounded-3xl p-6 space-y-4 gold-glow font-sans">
                <div className="flex items-center gap-2 border-b border-white/5 pb-3">
                  <ArrowUpRight className="w-5 h-5 text-[#D4AF37]" />
                  <h2 className="text-sm font-bold uppercase font-mono tracking-wider text-slate-100">Faire une Recharge Mobile Money</h2>
                </div>

                <div className="bg-[#D4AF37]/10 border border-[#D4AF37]/20 rounded-2xl p-4 text-xs space-y-2 text-[#D4AF37]">
                  <p className="font-bold">Instructions de Paiement :</p>
                  <p>1. Effectuez un transfert vers l'un de nos numéros officiels selon votre réseau :</p>
                  <ul className="list-disc pl-4 space-y-1 font-mono text-[11px]">
                    <li>MTN Mobile Money : <span className="font-bold text-white">+229 900 11 222</span></li>
                    <li>Orange Money : <span className="font-bold text-white">+221 771 23 456</span></li>
                    <li>Wave / Flooz : <span className="font-bold text-white">+228 990 00 123</span></li>
                  </ul>
                  <p className="text-[10px] text-slate-300">2. Prenez une capture d'écran nette du reçu de transfert avec le numéro de référence visible.</p>
                </div>

                <form onSubmit={handleDepositSubmit} className="space-y-4">
                  <div>
                    <label className="block text-[11px] font-mono text-slate-400 uppercase mb-1.5 font-semibold">Réseau Opérateur *</label>
                    <select
                      value={depositProvider}
                      onChange={(e) => setDepositProvider(e.target.value)}
                      className="w-full bg-[#020617] border border-white/10 rounded-xl py-2.5 px-3 text-xs focus:border-[#D4AF37] outline-none font-mono text-slate-100"
                    >
                      <option value="MTN Mobile Money">MTN Mobile Money</option>
                      <option value="Orange Money">Orange Money</option>
                      <option value="Wave Transfer">Wave Transfer</option>
                      <option value="Flooz Money">Moov/Flooz Money</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono text-slate-400 uppercase mb-1.5 font-semibold">Montant de la Recharge (FCFA) *</label>
                    <input
                      type="number"
                      placeholder="Min. 1 000 FCFA"
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(e.target.value)}
                      className="w-full bg-[#020617] border border-white/10 rounded-xl py-2.5 px-3 text-xs focus:border-[#D4AF37] outline-none font-mono text-slate-100"
                      required
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="block text-[11px] font-mono text-slate-400 uppercase font-semibold">Référence de Transaction *</label>
                      <button
                        type="button"
                        onClick={generateRandomReference}
                        className="text-[10px] text-[#D4AF37] hover:underline focus:outline-none"
                      >
                        Générer référence automatique
                      </button>
                    </div>
                    <input
                      type="text"
                      placeholder="Saisissez la référence du reçu du paiement"
                      value={depositReference}
                      onChange={(e) => setDepositReference(e.target.value)}
                      className="w-full bg-[#020617] border border-white/10 rounded-xl py-2.5 px-3 text-xs focus:border-[#D4AF37] outline-none font-mono text-slate-100"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono text-slate-400 uppercase mb-1.5 font-semibold">Optionnel: Votre numéro Whatsapp de transaction</label>
                    <input
                      type="text"
                      placeholder="Laisser vide pour utiliser le numéro de compte"
                      value={depositWhatsapp}
                      onChange={(e) => setDepositWhatsapp(e.target.value)}
                      className="w-full bg-[#020617] border border-white/10 rounded-xl py-2.5 px-3 text-xs focus:border-[#D4AF37] outline-none font-mono text-slate-100"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono text-gray-400 uppercase mb-1.5 font-semibold">Copie écran du reçu de Recharge *</label>
                    <div className="border border-dashed border-white/15 hover:border-[#D4AF37]/50 rounded-2xl p-6 text-center cursor-pointer transition relative">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleCaptureFileChange}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                      />
                      <div className="space-y-1.5 text-xs">
                        <Upload className="w-5 h-5 text-slate-400 mx-auto" />
                        <p className="font-mono text-[10px] text-slate-400">Glisser-déposer ou cliquer pour chercher le reçu</p>
                        {depositCapture && (
                          <p className="text-emerald-400 font-semibold font-mono text-[10px]">✓ Capture enregistrée</p>
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-3.5 rounded-xl bg-[#D4AF37] hover:bg-[#B8962F] text-black font-bold text-xs tracking-wide shadow-lg shadow-amber-500/10 transition disabled:opacity-50 cursor-pointer"
                  >
                    {submitting ? "Traitement crypté..." : "Envoyer Preuve de Recharge"}
                  </button>
                </form>
              </div>
            )}

            {/* Retrait View */}
            {activeSubView === "withdraw" && (
              <div className="bg-[#0A0E17] border border-white/5 rounded-3xl p-6 space-y-4 gold-glow">
                <div className="flex items-center gap-2 border-b border-white/5 pb-3">
                  <ArrowDownLeft className="w-5 h-5 text-[#D4AF37]" />
                  <h2 className="text-sm font-bold uppercase font-mono tracking-wider text-slate-100">Demander un Retrait</h2>
                </div>

                <div className="bg-[#020617] border border-white/5 rounded-2xl p-4 flex justify-between items-center text-xs">
                  <div>
                    <span className="text-slate-400 block uppercase text-[10px]">Votre solde retirable</span>
                    <span className="text-lg font-bold text-[#D4AF37]">{profile?.balance.toLocaleString()} FCFA</span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] bg-[#D4AF37]/10 text-[#D4AF37] font-mono">RETRAIT DE 1K À 500K</span>
                </div>

                <form onSubmit={handleWithdrawalSubmit} className="space-y-4">
                  <div>
                    <label className="block text-[11px] font-mono text-slate-400 uppercase mb-1.5 font-semibold">Opérateur Mobile Money *</label>
                    <select
                      value={withdrawalProvider}
                      onChange={(e) => setWithdrawalProvider(e.target.value)}
                      className="w-full bg-[#020617] border border-white/10 rounded-xl py-2.5 px-3 text-xs focus:border-[#D4AF37] outline-none font-mono text-slate-100 cursor-pointer"
                    >
                      <option value="Tmoney">Tmoney (Togocom)</option>
                      <option value="Moov Money">Moov Money (Flooz)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono text-slate-400 uppercase mb-1.5 font-semibold">Numéro de Réception du Paiement *</label>
                    <div className="relative flex items-center">
                      <div className="absolute left-1 top-0 bottom-0 flex items-center bg-[#1E293B]/20 border-r border-white/10 px-3 text-xs text-slate-400 font-mono rounded-l-xl">
                        <span className="mr-1.5 select-none text-base">🇹🇬</span>
                        <span className="font-semibold">+228</span>
                      </div>
                      <input
                        type="text"
                        placeholder="Ex: 90123456"
                        value={withdrawalPhone}
                        onChange={(e) => {
                          const cleaned = e.target.value.replace(/[^0-9]/g, "");
                          setWithdrawalPhone(cleaned);
                        }}
                        className="w-full bg-[#020617] border border-white/10 rounded-xl py-2.5 pl-24 pr-3 text-xs focus:border-[#D4AF37] outline-none font-mono text-slate-100"
                        required
                      />
                    </div>
                    <p className="text-[10px] text-slate-500 font-mono mt-1">Saisissez votre numéro national à 8 chiffres (L'indicateur +228 est appliqué).</p>
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono text-slate-400 uppercase mb-1.5 font-semibold">Montant du Retrait (FCFA) *</label>
                    <input
                      type="number"
                      placeholder="Min. 1 000 FCFA"
                      value={withdrawalAmount}
                      onChange={(e) => setWithdrawalAmount(e.target.value)}
                      className="w-full bg-[#020617] border border-white/10 rounded-xl py-2.5 px-3 text-xs focus:border-[#D4AF37] outline-none font-mono text-slate-100"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-3.5 rounded-xl bg-[#D4AF37] hover:bg-[#B8962F] text-black font-bold text-xs tracking-wide transition disabled:opacity-50 cursor-pointer"
                  >
                    {submitting ? "Traitement sécurisé..." : "Confirmer la Demande"}
                  </button>
                </form>
              </div>
            )}

            {/* History logs with interactive filters */}
            {activeSubView === "history" && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b border-white/5 pb-2">
                  <History className="w-5 h-5 text-amber-500" />
                  <h2 className="text-sm font-bold uppercase font-mono tracking-wider">Vos Historiques de Transactions</h2>
                </div>

                <div className="bg-[#091032] border border-white/5 rounded-2xl p-4">
                  <h3 className="text-xs font-bold font-mono text-[#FBBF24] mb-3 uppercase">Recharges Mobile Money</h3>
                  {deposits.length === 0 ? (
                    <p className="text-xs text-gray-500">Aucune recharge effectuée pour le moment.</p>
                  ) : (
                    <div className="space-y-3 font-mono text-xs">
                      {deposits.map(d => (
                        <div key={d.id} className="p-3 rounded-xl bg-white/5 border border-white/5 flex justify-between items-center">
                          <div>
                            <p className="font-bold text-white">{d.amount.toLocaleString()} FCFA</p>
                            <span className="block text-[10px] text-gray-400">{d.provider} • {d.reference}</span>
                          </div>
                          <div>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              d.status === "approved" ? "bg-emerald-500/10 text-emerald-400" :
                              d.status === "rejected" ? "bg-rose-500/10 text-rose-400" : "bg-amber-500/10 text-amber-500"
                            }`}>
                              {d.status === "approved" ? "Validé" : d.status === "rejected" ? "Rejeté" : "En cours"}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="bg-[#091032] border border-white/5 rounded-2xl p-4">
                  <h3 className="text-xs font-bold font-mono text-[#FBBF24] mb-3 uppercase">Demandes de Retraits</h3>
                  {withdrawals.length === 0 ? (
                    <p className="text-xs text-gray-500">Aucune demande de retrait effectuée.</p>
                  ) : (
                    <div className="space-y-3 font-mono text-xs">
                      {withdrawals.map(w => (
                        <div key={w.id} className="p-3 rounded-xl bg-white/5 border border-white/5 flex justify-between items-center">
                          <div>
                            <p className="font-bold text-white">{w.amount.toLocaleString()} FCFA</p>
                            <span className="block text-[10px] text-gray-400">{w.provider} • {w.whatsapp}</span>
                          </div>
                          <div>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              w.status === "approved" ? "bg-emerald-500/10 text-emerald-400" :
                              w.status === "rejected" ? "bg-rose-500/10 text-rose-400" : "bg-amber-500/10 text-amber-500"
                            }`}>
                              {w.status === "approved" ? "Payé" : w.status === "rejected" ? "Refusé" : "En attente"}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Chat View Support directly inside the container */}
            {activeSubView === "chat" && (
              <div className="bg-[#091032] border border-white/5 rounded-2xl p-4 flex flex-col h-[400px] justify-between">
                <div>
                  <div className="flex items-center gap-2 border-b border-white/10 pb-3">
                    <MessageSquare className="w-5 h-5 text-amber-500" />
                    <div>
                      <h2 className="text-xs font-bold uppercase font-mono text-white">Support Client iAgri</h2>
                      <p className="text-[10px] text-gray-400">Temps de réponse moyen : &lt; 5 minutes</p>
                    </div>
                  </div>
                </div>

                {/* Messages scroll pool */}
                <div className="flex-1 overflow-y-auto py-3 space-y-3 px-2">
                  {chatMessages.length === 0 ? (
                    <div className="text-center py-6 text-gray-500 text-xs text-light space-y-1">
                      <p>Bonjour ! Posez votre question ici pour recevoir l'aide de notre service d'administration financière.</p>
                    </div>
                  ) : (
                    chatMessages.map(msg => {
                      const isAdmin = msg.sender === "admin";
                      return (
                        <div key={msg.id} className={`flex ${isAdmin ? 'justify-start' : 'justify-end'}`}>
                          <div className={`max-w-[80%] rounded-xl px-3 py-2 text-xs ${
                            isAdmin ? 'bg-amber-500/10 text-white border border-amber-500/15' : 'bg-[#15256D] text-white'
                          }`}>
                            <p className="leading-relaxed whitespace-pre-wrap">{msg.message}</p>
                            <span className="block text-[8px] text-gray-400 mt-1 text-right font-mono">
                              {new Date(msg.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                <form onSubmit={handleSendChatMsg} className="flex gap-2 pt-2 border-t border-white/10">
                  <input
                    type="text"
                    placeholder="Écrivez votre message..."
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    className="flex-grow bg-[#03061A] border border-white/10 rounded-xl px-3 py-2 text-xs focus:border-amber-500 outline-none"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-black font-semibold text-xs rounded-xl"
                  >
                    Envoyer
                  </button>
                </form>
              </div>
            )}

            {/* Redeem Bonus Coupon Codes & Daily checkins */}
            {activeSubView === "bonus" && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b border-white/5 pb-2">
                  <Gift className="w-5 h-5 text-amber-500" />
                  <h2 className="text-sm font-bold uppercase font-mono tracking-wider">Récompenses & Bonus</h2>
                </div>

                {/* Free instant daily gift */}
                <div className="bg-[#0A1137]/60 border border-amber-500/20 rounded-2xl p-5 text-center space-y-3">
                  <h3 className="text-xs font-bold font-mono text-amber-500 uppercase tracking-widest">🎁 Récompense Quotidienne Gratuite</h3>
                  <p className="text-xs text-gray-300">Réclamez votre bonus d'activité journalier gratuit. Un crédit entre 50 FCFA et 150 FCFA offert à tous nos membres.</p>
                  <button
                    onClick={handleClaimDailyGift}
                    className="px-6 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 text-black font-bold text-xs shadow-lg shadow-amber-500/10"
                  >
                    Réclamer mes pièces gratuites
                  </button>
                </div>

                {/* Redeem bonus code */}
                <div className="bg-[#091032] border border-white/5 rounded-2xl p-5 space-y-4">
                  <h3 className="text-xs font-bold font-mono text-[#FBBF24] uppercase tracking-widest">Entrer un Code Bonus Cadeau</h3>
                  
                  <form onSubmit={handleRedeemBonus} className="space-y-3">
                    <div>
                      <label className="block text-[10px] font-mono text-gray-400 mb-1">Code Promo / Événement</label>
                      <input
                        type="text"
                        placeholder="Ex: CADEAU2026"
                        value={bonusCodeInput}
                        onChange={(e) => setBonusCodeInput(e.target.value)}
                        className="w-full bg-[#03061A] border border-white/10 rounded-xl py-2 px-3 text-xs focus:border-amber-500 outline-none font-mono"
                        required
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-black font-semibold text-xs transition"
                    >
                      {submitting ? "Validation..." : "Activer le Code Cadeau"}
                    </button>
                  </form>
                </div>
              </div>
            )}

            {/* Notifications panel list */}
            {activeSubView === "notifications" && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b border-white/5 pb-2">
                  <Bell className="w-5 h-5 text-amber-500" />
                  <h2 className="text-sm font-bold uppercase font-mono tracking-wider">Alertes & Notifications en direct</h2>
                </div>

                {notifications.length === 0 ? (
                  <p className="text-xs text-gray-500 text-center py-6">Aucune notification enregistrée.</p>
                ) : (
                  <div className="space-y-3">
                    {notifications.map(n => (
                      <div key={n.id} className="bg-[#091032] border border-white/5 rounded-xl p-4 space-y-1.5">
                        <div className="flex justify-between items-start">
                          <span className="text-xs font-bold text-white uppercase block font-mono">{n.title}</span>
                          <span className="text-[9px] text-gray-500 font-mono">
                            {new Date(n.date).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-xs text-gray-300 leading-relaxed">{n.message}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div>
            {/* ==================== CORE TAB 1: HOME (ACCUEIL) ==================== */}
            {activeTab === "home" && (
              <div className="space-y-6">
                
                {/* Total balances indicator block */}
                <div className="bg-white border border-blue-100 rounded-3xl p-5 sm:p-6 relative overflow-hidden shadow-sm">
                  {/* Subtle clean abstract graphics backdrop */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl pointer-events-none"></div>

                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Solde disponible</span>
                      <span className="text-3xl font-extrabold font-mono tracking-tight text-[#1E293B] mt-1 block">
                        {profile?.balance.toLocaleString()} <span className="text-xs font-bold text-[#FF7800]">FCFA</span>
                      </span>
                    </div>

                    <div className="px-2.5 py-1 rounded bg-[#0066FF]/10 text-[#0066FF] font-mono text-[10px] font-bold border border-[#0066FF]/15 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#0066FF] animate-pulse"></span>
                      VIP VERIFIÉ
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-3.5 pb-3.5 border-y border-slate-100 text-xs">
                    <div>
                      <span className="text-[11px] font-bold text-slate-500 uppercase block">Revenus quotidiens</span>
                      <span className="text-sm font-bold text-emerald-600 font-mono mt-0.5 block">
                         +{profile?.dailyEarnings.toLocaleString()} F / jour
                      </span>
                    </div>
                    <div>
                      <span className="text-[11px] font-bold text-slate-500 uppercase block">Cumul des gains</span>
                      <span className="text-sm font-bold text-[#FF7800] font-mono mt-0.5 block">
                        {profile?.totalEarnings.toLocaleString()} F
                      </span>
                    </div>
                  </div>

                  {/* Sleek CTA deposit/withdraw entries */}
                  <div className="grid grid-cols-2 gap-3 mt-4">
                    <button
                      onClick={() => setActiveSubView("deposit")}
                      className="py-2.5 rounded-xl bg-[#0066FF] hover:bg-[#0052FF] text-white font-bold text-xs tracking-wider shadow-md flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95"
                    >
                      <ArrowUpRight className="w-4 h-4 shrink-0" />
                      <span>Recharge</span>
                    </button>
                    <button
                      onClick={() => setActiveSubView("withdraw")}
                      className="py-2.5 rounded-xl bg-[#FF7800] hover:bg-[#FF881E] text-white font-bold text-xs tracking-wider shadow-md flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95"
                    >
                      <ArrowDownLeft className="w-4 h-4 shrink-0" />
                      <span>Retrait</span>
                    </button>
                  </div>
                </div>

                {/* Testimonials slideshow with va-et-vient effect */}
                <div className="bg-[#0A122C]/90 border border-[#0066FF]/20 rounded-3xl p-5 text-white relative overflow-hidden shadow-lg">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl pointer-events-none"></div>

                  <div className="flex justify-between items-center pb-3 mb-3 border-b border-white/5">
                    <div className="flex items-center gap-2 animate-pulse">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                      <h4 className="text-[11px] font-extrabold uppercase tracking-widest font-mono text-[#D4AF37]">Témoignages Réels • Va-et-Vient</h4>
                    </div>
                    {/* Direction indicator */}
                    <div className="flex items-center gap-1.5 font-mono text-[9px] text-slate-400 bg-white/5 px-2.5 py-1 rounded-full border border-white/5">
                      <span className={`w-1.5 h-1.5 rounded-full bg-amber-500 ${testiDir === -1 ? 'animate-ping' : ''}`}></span>
                      <span>{testiDir === 1 ? "➡️ Retour Droite" : "⬅️ Retour Gauche"}</span>
                    </div>
                  </div>

                  {/* Slider container with beautiful cross-fade style */}
                  <div className="relative min-h-[145px] flex flex-col justify-between">
                    {/* Testimonial Active Slide */}
                    <div 
                      key={testiIndex} 
                      className="animate-fade-in transition-all duration-300"
                    >
                      <div className="flex items-center justify-between gap-2.5 mb-2.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#0066FF] to-[#00A3FF] flex items-center justify-center font-bold text-white text-xs border border-white/10 shadow-sm uppercase font-mono">
                            {testimonialsList[testiIndex].avatar}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-extrabold text-slate-100 text-[12px]">{testimonialsList[testiIndex].name}</span>
                              <span className="text-[9px] text-emerald-400 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 font-mono">Investisseur ✓</span>
                            </div>
                            <div className="flex items-center gap-2 text-[9px] text-slate-400 font-mono">
                              <span>{testimonialsList[testiIndex].phone}</span>
                              <span>•</span>
                              <span>{testimonialsList[testiIndex].country}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-0.5 text-amber-400">
                          {Array.from({ length: testimonialsList[testiIndex].stars }).map((_, i) => (
                            <span key={i} className="text-xs">★</span>
                          ))}
                        </div>
                      </div>

                      {/* Text */}
                      <p className="text-[12.5px] text-slate-200 italic leading-relaxed font-sans font-light bg-white/5 p-3 rounded-2xl border border-white/5">
                        « {testimonialsList[testiIndex].text} »
                      </p>
                    </div>

                    {/* Progress Dots / Navigation dots */}
                    <div className="flex justify-between items-center mt-3.5 pt-3 border-t border-white/5">
                      <div className="flex gap-1.5">
                        {testimonialsList.map((_, idx) => (
                          <button
                            key={idx}
                            onClick={() => {
                              setTestiIndex(idx);
                              setTestiDir(idx === testimonialsList.length - 1 ? -1 : idx === 0 ? 1 : testiDir);
                            }}
                            className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                              idx === testiIndex 
                                ? "w-6 bg-gradient-to-r from-amber-400 to-[#D4AF37]" 
                                : "w-1.5 bg-slate-600 hover:bg-slate-400"
                            }`}
                          />
                        ))}
                      </div>

                      <span className="text-[10px] font-mono font-bold text-amber-400/90 bg-amber-500/10 border border-amber-500/25 px-2 py-0.5 rounded-md tracking-wider">
                        Revenu reçu: {testimonialsList[testiIndex].amount}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Sub-menu lists shortcut buttons - highly visible history, support, pointage, promo code, and infos */}
                <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-5 gap-3 font-semibold text-xs text-center">
                  <button 
                    onClick={() => setActiveSubView("history")}
                    className="p-4 bg-white border border-slate-200/60 rounded-2xl hover:bg-slate-50 transition duration-200 shadow-sm cursor-pointer hover:shadow-md flex flex-col items-center justify-center gap-2"
                  >
                    <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center border border-blue-100">
                      <History className="w-5.5 h-5.5 text-[#0066FF]" />
                    </div>
                    <span className="text-slate-800 font-bold font-mono text-[11px] block">Historique</span>
                  </button>

                  <button 
                    onClick={() => setActiveSubView("chat")}
                    className="p-4 bg-white border border-slate-200/60 rounded-2xl hover:bg-slate-50 transition duration-200 shadow-sm cursor-pointer hover:shadow-md flex flex-col items-center justify-center gap-2"
                  >
                    <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center border border-orange-100">
                      <MessageSquare className="w-5.5 h-5.5 text-[#FF7800]" />
                    </div>
                    <span className="text-slate-800 font-bold font-mono text-[11px] block">Support live</span>
                  </button>

                  <button 
                    onClick={handleClaimDailyGift}
                    className="p-4 bg-white border border-slate-200/60 rounded-2xl hover:bg-slate-50 transition duration-200 shadow-sm cursor-pointer hover:shadow-md flex flex-col items-center justify-center gap-2 animate-pulse"
                  >
                    <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center border border-orange-100">
                      <Gift className="w-5.5 h-5.5 text-[#FF7800]" />
                    </div>
                    <span className="text-slate-800 font-bold font-mono text-[11px] block">Pointage</span>
                  </button>

                  <button 
                    onClick={() => setActiveSubView("bonus")}
                    className="p-4 bg-white border border-slate-200/60 rounded-2xl hover:bg-slate-50 transition duration-200 shadow-sm cursor-pointer hover:shadow-md flex flex-col items-center justify-center gap-2"
                  >
                    <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center border border-blue-100">
                      <Zap className="w-5.5 h-5.5 text-[#0066FF]" />
                    </div>
                    <span className="text-slate-800 font-bold font-mono text-[11px] block">Promo Code</span>
                  </button>

                  <button 
                    onClick={() => {
                      setActiveSubView("notifications");
                    }}
                    className="p-4 bg-white border border-slate-200/60 rounded-2xl hover:bg-slate-50 transition duration-200 shadow-sm relative cursor-pointer hover:shadow-md flex flex-col items-center justify-center gap-2 col-span-2 sm:col-span-1"
                  >
                    <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center border border-blue-100">
                      <Bell className="w-5.5 h-5.5 text-[#0066FF]" />
                    </div>
                    <span className="text-slate-800 font-bold font-mono text-[11px] block">Infos</span>
                    {unreadNotifications > 0 && (
                      <span className="absolute top-3 right-4.5 w-2.5 h-2.5 rounded-full bg-[#FF7800] animate-ping"></span>
                    )}
                  </button>
                </div>

                {/* Live transaction notifications banner */}
                <div className="bg-[#0A0E17] border border-white/5 rounded-2xl py-3 px-4 flex items-center gap-2.5 shadow-md text-sm select-none">
                  <Bell className="w-4.5 h-4.5 text-[#D4AF37] animate-bounce shrink-0" />
                  <span className="text-slate-200 font-semibold truncate leading-none">
                     t1 a rechargé 10,000 FCFA
                  </span>
                </div>

                {/* Active user lease cards */}
                <div className="space-y-3 font-sans">
                  <div className="flex justify-between items-center px-1">
                    <h3 className="text-sm font-bold font-mono uppercase tracking-wider text-slate-300">Vos Plans Actifs ({investments.length})</h3>
                    <button 
                      onClick={() => setActiveTab("products")} 
                      className="text-xs text-[#D4AF37] hover:underline cursor-pointer font-bold"
                    >
                      Souscrire à un VIP +
                    </button>
                  </div>

                  {investments.length === 0 ? (
                    <div className="bg-[#0A0E17]/40 rounded-[32px] border border-white/5 p-6 text-center text-sm space-y-3">
                      <p className="text-slate-400">Vous n'avez pas encore activé de plan d'investissement VIP.</p>
                      <button
                        onClick={() => setActiveTab("products")}
                        className="px-4 py-2.5 bg-[#D4AF37]/10 border border-[#D4AF37]/20 text-[#D4AF37] text-[11px] font-bold rounded-xl transition hover:bg-[#D4AF37] hover:text-black font-mono cursor-pointer"
                      >
                        VOIR LES PRODUITS VIP
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {investments.map(inv => {
                        return (
                          <div key={inv.id} className="bg-[#0A0E17] border border-white/5 rounded-3xl p-5 space-y-4 gold-glow">
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="text-sm font-bold text-white">{inv.planName}</h4>
                                <span className="text-xs font-mono text-slate-400 block mt-1 font-light">Acheté le : {new Date(inv.purchaseDate).toLocaleDateString()}</span>
                              </div>
                              <span className="px-2.5 py-1 rounded text-xs font-mono bg-emerald-500/10 text-emerald-400 font-extrabold uppercase tracking-wider">
                                GAINS EN COURS
                              </span>
                            </div>

                            <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                              <div>
                                <span className="text-[11px] text-slate-400 block uppercase font-bold text-amber-500">Intérêt Quotidien</span>
                                <span className="font-bold text-emerald-400 text-sm">+{inv.dailyReturn} FCFA/jour</span>
                              </div>
                              <div>
                                <span className="text-[11px] text-slate-400 block uppercase font-bold text-amber-500">Gains déjà accumulés</span>
                                <span className="font-bold text-white text-sm">{(inv.daysActive * inv.dailyReturn).toLocaleString()} / {inv.totalReturn.toLocaleString()} F</span>
                              </div>
                            </div>

                            {/* Active bar progress to look high fidelity */}
                            <div className="space-y-2">
                              <div className="flex justify-between text-xs font-mono text-slate-300">
                                <span className="font-bold">Rendement Planifié : {inv.daysActive} jours sur 10</span>
                                <span className="font-bold text-emerald-400">{Math.round((inv.daysActive / 10) * 100)}%</span>
                              </div>
                              <div className="w-full bg-[#020617] h-2 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-gradient-to-r from-[#D4AF37] to-yellow-400 rounded-full"
                                  style={{ width: `${Math.min(100, (inv.daysActive / 10) * 100)}%` }}
                                ></div>
                              </div>
                              
                              {/* Realtime countdown ticket indicator */}
                              <div className="pt-1.5 flex justify-between items-center text-[11px] font-sans">
                                <span className="text-slate-400 font-semibold">Prochain versement (24h) :</span>
                                <span className="text-[#D4AF37] font-bold bg-[#D4AF37]/10 px-2 py-0.5 rounded border border-[#D4AF37]/15 font-mono animate-pulse">
                                  {countdowns[inv.id] || "00h 00m 00s"}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Important Platform announcements banner */}
                <div className="bg-[#0A0E17] border border-[#D4AF37]/10 rounded-2xl p-4 flex gap-3 items-start relative overflow-hidden">
                  <div className="p-2 rounded-xl bg-[#D4AF37]/10 text-[#D4AF37] shrink-0 border border-[#D4AF37]/10">
                    <Megaphone className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">Conseil d'Équipe</h4>
                    <p className="text-xs text-slate-300 leading-relaxed mt-1">Invitez des partenaires pour maximiser vos gains ! Vous recevez cumulativement 20% au Niveau 1, 2% au Niveau 2, et 1% au Niveau 3 sur chacune de leurs souscriptions financières.</p>
                  </div>
                </div>

              </div>
            )}

            {/* ==================== CORE TAB 2: PRODUCTS (PRODUITS) ==================== */}
            {activeTab === "products" && (
              <div className="space-y-5">
                {/* Clean products purchased list and revenue metrics matching user specifications directly */}
                <div className="bg-white rounded-[24px] p-5 border border-slate-100 shadow-sm flex items-center justify-between text-slate-800">
                  <div className="flex flex-col text-left space-y-0.5">
                    <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider block">Produits achetés</span>
                    <span className="text-2xl font-black text-[#02A3FC] block">{investments.length}</span>
                  </div>
                  <div className="w-[1.5px] h-10 bg-slate-100"></div>
                  <div className="flex flex-col text-right space-y-0.5">
                    <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider block">Revenus</span>
                    <span className="text-2xl font-black text-[#02A3FC] block">
                      {profile?.totalEarnings.toLocaleString()} <span className="text-xs font-bold text-slate-400">FCFA</span>
                    </span>
                  </div>
                </div>

                <div className="text-center mb-1">
                  <h2 className="text-xs font-bold uppercase tracking-widest text-[#D4AF37] font-sans">Offres d'acquisition d'actifs technologiques</h2>
                  <p className="text-[10px] text-slate-400 mt-1 font-light">Sélectionnez la catégorie d'allocation financière correspondant à vos objectifs de rendement annuel.</p>
                </div>

                {productsList.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-6">Aucun produit configuré.</p>
                ) : (
                  <div className="space-y-4 font-sans">
                    {productsList.map(prod => {
                      return (
                        <div 
                          key={prod.id} 
                          className="bg-[#0A0E17] border border-[#D4AF37]/20 rounded-[32px] p-6 relative overflow-hidden group hover:border-[#D4AF37] transition duration-300 gold-glow"
                        >
                          {prod.badge && (
                            <div className="absolute top-0 right-0 bg-gradient-to-r from-[#D4AF37] to-yellow-400 text-black font-mono text-[9px] font-bold px-3 py-1 rounded-bl-xl uppercase tracking-wider scale-95 origin-top-right">
                              {prod.badge}
                            </div>
                          )}

                          <div className="space-y-1.5">
                            <h3 className="text-sm font-extrabold text-white uppercase tracking-wide">{prod.name}</h3>
                            <div className="flex items-center gap-1.5">
                              <span className="text-xl font-bold font-mono tracking-tight text-[#D4AF37]">{prod.price.toLocaleString()} FCFA</span>
                              <span className="text-[10px] text-slate-400 font-mono font-light">prix fixe de location</span>
                            </div>
                          </div>

                          <div className="grid grid-cols-3 gap-2 py-4 border-y border-white/5 mt-4 text-xs font-mono text-slate-300">
                            <div>
                              <span className="text-[9px] text-slate-500 block uppercase">Revenus / jour</span>
                              <span className="font-bold text-emerald-400">+{prod.dailyReturn} F</span>
                            </div>
                            <div>
                              <span className="text-[9px] text-slate-500 block uppercase">Durée Contrat</span>
                              <span className="font-bold text-white">{prod.durationDays} Jours</span>
                            </div>
                            <div>
                              <span className="text-[9px] text-slate-500 block uppercase">Gains Totaux</span>
                              <span className="font-bold text-emerald-400">{prod.totalReturn.toLocaleString()} F</span>
                            </div>
                          </div>

                          <div className="pt-4 flex justify-between items-center">
                            <span className="text-[10px] font-mono text-[#D4AF37] flex items-center gap-1">
                              <Zap className="w-3.5 h-3.5 fill-[#D4AF37]" /> Rendement garanti 100%
                            </span>

                            <button
                              onClick={() => handleBuyProduct(prod)}
                              className="px-5 py-2.5 rounded-xl bg-[#D4AF37] hover:bg-[#B8962F] text-black text-xs font-bold font-mono tracking-wider transition shadow-lg shadow-[#D4AF37]/10 active:scale-95 cursor-pointer"
                            >
                              Activer le Plan ⚡
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ==================== CORE TAB 3: TEAM (ÉQUIPE) ==================== */}
            {activeTab === "team" && (
              <div className="space-y-6">
                
                <div className="text-center mb-1 font-sans">
                  <h2 className="text-xs font-bold uppercase tracking-widest font-mono text-[#D4AF37]">🔥 PROGRAMME D'AFFILIATION MLM UNIQUE</h2>
                  <p className="text-[10px] text-slate-400 mt-1 font-light">Établissez votre propre réseau d'investisseurs et gagnez de fortes commissions.</p>
                </div>

                {/* Invite link card */}
                <div className="bg-[#0A0E17] border border-white/5 rounded-[32px] p-6 space-y-4 gold-glow">
                  <h3 className="text-xs font-bold font-mono text-white uppercase tracking-wider">Votre Lien d'Invitation Personnel</h3>
                  
                  <div className="bg-[#020617] border border-white/10 rounded-xl p-3 flex justify-between items-center">
                    <span className="text-xs text-[#D4AF37] font-mono truncate mr-3 select-all">
                      {window.location.origin}/?ref={profile?.referralCode}
                    </span>
                    <button
                      onClick={handleCopyLink}
                      className="p-2 rounded-xl bg-[#D4AF37] hover:bg-[#B8962F] text-black transition shrink-0 cursor-pointer"
                    >
                      {refCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-2.5 pt-2 font-mono text-center text-xs">
                    <div className="bg-white/5 p-2.5 rounded-xl border border-white/5">
                      <span className="text-xs text-slate-400 block uppercase font-bold text-amber-500">Niv 1 (20%)</span>
                      <span className="text-xl font-black text-white block mt-1">{referralStats.level1Count}</span>
                    </div>
                    <div className="bg-white/5 p-2.5 rounded-xl border border-white/5">
                      <span className="text-xs text-slate-400 block uppercase font-bold text-amber-500">Niv 2 (2%)</span>
                      <span className="text-xl font-black text-white block mt-1">{referralStats.level2Count}</span>
                    </div>
                    <div className="bg-white/5 p-2.5 rounded-xl border border-white/5">
                      <span className="text-xs text-slate-400 block uppercase font-bold text-amber-500">Niv 3 (1%)</span>
                      <span className="text-xl font-black text-white block mt-1">{referralStats.level3Count || 0}</span>
                    </div>
                  </div>

                  <div className="bg-[#D4AF37]/5 rounded-xl p-3.5 border border-[#D4AF37]/10 text-center">
                    <span className="text-xs font-mono text-slate-400 block uppercase font-bold">Total des Commissions MLM Perçues</span>
                    <span className="text-2xl font-black font-mono text-emerald-500 block mt-1">{referralStats.bonusEarned.toLocaleString()} FCFA</span>
                  </div>
                </div>

                {/* Affiliate Lists */}
                <div className="bg-[#091032] border border-white/5 rounded-2xl p-4 space-y-3 font-mono">
                  <h3 className="text-sm font-bold font-mono text-[#FBBF24] uppercase border-b border-white/5 pb-2">Membres du Réseau Niveau 1 ({referralStats.level1List.length})</h3>
                  
                  {referralStats.level1List.length === 0 ? (
                    <p className="text-xs text-slate-400 italic font-mono">Aucun partenaire inscrit au Niveau 1.</p>
                  ) : (
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {referralStats.level1List.map((userL1, i) => (
                        <div key={i} className="flex justify-between items-center text-xs font-mono py-1.5 border-b border-white/5 last:border-0">
                          <div>
                            <span className="font-bold text-white block text-sm">{userL1.name}</span>
                            <span className="text-[11px] text-gray-400">{userL1.country} • Rejoint le {new Date(userL1.date).toLocaleDateString()}</span>
                          </div>
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-400 font-bold font-mono uppercase">
                            ACTIF
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="bg-[#091032] border border-white/5 rounded-2xl p-4 space-y-3">
                  <h3 className="text-sm font-bold font-mono text-[#FBBF24] uppercase border-b border-white/5 pb-2">Membres du Réseau Niveau 2 ({referralStats.level2List.length})</h3>
                  
                  {referralStats.level2List.length === 0 ? (
                    <p className="text-xs text-gray-500 italic">Aucun invité indirect représenté au Niveau 2.</p>
                  ) : (
                    <div className="space-y-2 max-h-40 overflow-y-auto font-mono text-xs">
                      {referralStats.level2List.map((userL2, i) => (
                        <div key={i} className="flex justify-between items-center py-1.5 border-b border-white/5 last:border-0">
                          <div>
                            <span className="font-bold text-white block text-sm">{userL2.name}</span>
                            <span className="text-[11px] text-slate-400">{userL2.country} • {new Date(userL2.date).toLocaleDateString()}</span>
                          </div>
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-400 font-bold uppercase">
                            ACTIF
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="bg-[#091032] border border-white/5 rounded-2xl p-4 space-y-3">
                  <h3 className="text-sm font-bold font-mono text-[#FBBF24] uppercase border-b border-white/5 pb-2">Membres du Réseau Niveau 3 ({referralStats.level3List?.length || 0})</h3>
                  
                  {(!referralStats.level3List || referralStats.level3List.length === 0) ? (
                    <p className="text-xs text-gray-500 italic">Aucun invité indirect représenté au Niveau 3.</p>
                  ) : (
                    <div className="space-y-2 max-h-40 overflow-y-auto font-mono text-xs">
                      {referralStats.level3List.map((userL3, i) => (
                        <div key={i} className="flex justify-between items-center py-1.5 border-b border-white/5 last:border-0">
                          <div>
                            <span className="font-bold text-white block text-sm">{userL3.name}</span>
                            <span className="text-[11px] text-slate-400">{userL3.country} • {new Date(userL3.date).toLocaleDateString()}</span>
                          </div>
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-400 font-bold uppercase">
                            ACTIF
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            )}

            {/* ==================== CORE TAB 4: PROFILE (PROFIL) ==================== */}
            {activeTab === "profile" && (
              <div className="space-y-6">
                
                {/* Visual identity premium badge */}
                <div className="bg-gradient-to-r from-amber-500/10 to-yellow-600/10 border border-amber-500/20 rounded-2xl p-5 flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-400 flex items-center justify-center text-black font-bold text-xl uppercase shadow-md shadow-amber-500/15">
                    {profile?.name.substr(0,2)}
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-white uppercase">{profile?.name}</h3>
                    <p className="text-xs text-amber-500 font-mono">CODE PARRAIN : <span className="font-bold border-b border-amber-500 pb-0.5">{profile?.referralCode}</span></p>
                    <span className="text-[10px] text-gray-400 font-mono uppercase tracking-wider block mt-1">{profile?.country} • Membre depuis {profile ? new Date(profile.created_at).toLocaleDateString() : ""}</span>
                  </div>
                </div>

                {/* Sub routing paths */}
                <div className="bg-[#091032] border border-white/5 rounded-2xl overflow-hidden font-mono text-xs">
                  <button 
                    onClick={() => setActiveSubView("deposit")}
                    className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-white/5 transition border-b border-white/5"
                  >
                    <div className="flex items-center gap-3">
                      <ArrowUpRight className="w-4 h-4 text-emerald-400" />
                      <span>Faire un dépôt Mobile Money</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-500" />
                  </button>

                  <button 
                    onClick={() => setActiveSubView("withdraw")}
                    className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-white/5 transition border-b border-white/5"
                  >
                    <div className="flex items-center gap-3">
                      <ArrowDownLeft className="w-4 h-4 text-rose-400" />
                      <span>Formulaire Retrait Momo</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-500" />
                  </button>

                  <button 
                    onClick={() => setActiveSubView("history")}
                    className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-white/5 transition border-b border-white/5"
                  >
                    <div className="flex items-center gap-3">
                      <History className="w-4 h-4 text-amber-500" />
                      <span>Historique transactions</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-500" />
                  </button>

                  <button 
                    onClick={() => setActiveSubView("chat")}
                    className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-white/5 transition border-b border-white/5"
                  >
                    <div className="flex items-center gap-3">
                      <MessageSquare className="w-4 h-4 text-amber-500" />
                      <span>Support Chat officiel</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-500" />
                  </button>

                  <button 
                    onClick={() => setActiveSubView("bonus")}
                    className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-white/5 transition border-b border-white/5"
                  >
                    <div className="flex items-center gap-3">
                      <Gift className="w-4 h-4 text-[#FBBF24]" />
                      <span>Saisir un Code Cadeau Bonus</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-500" />
                  </button>

                  <button 
                    onClick={() => setActiveSubView("notifications")}
                    className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-white/5 transition"
                  >
                    <div className="flex items-center gap-3">
                      <Bell className="w-4 h-4 text-[#FBBF24]" />
                      <span>Mes notifications ({unreadNotifications})</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-500" />
                  </button>
                </div>

                {/* Simulated quick developer balance multiplier in mock preview environments if needed */}
                <div className="bg-amber-500/5 border border-amber-500/10 rounded-xl p-4 text-center">
                  <p className="text-[10px] text-gray-400 font-mono uppercase mb-2">Simulateur d'activité</p>
                  <button
                    onClick={loadProfile}
                    className="w-full py-2.5 rounded-lg bg-[#0E1B4E] hover:bg-[#15276D] transition text-xs font-semibold font-mono"
                  >
                    Rafraîchir les gains en direct 🔄
                  </button>
                </div>

              </div>
            )}

          </div>
        )}

      </main>

      {/* Sticky Bottom Native-feeling navigation tab-bar */}
      <nav id="sticky_mobile_nav" className="fixed bottom-0 left-0 right-0 z-50 bg-[#0A0E17]/95 backdrop-blur-lg border-t border-white/5 py-3.5 shadow-2xl">
        <div className="max-w-xl mx-auto flex justify-around items-center">
          
          <button 
            id="tab_nav_accueil"
            onClick={() => {
              setActiveTab("home");
              setActiveSubView("none");
            }}
            className={`flex flex-col items-center gap-1.5 text-center transition ${
              activeTab === "home" && activeSubView === "none" ? "text-[#D4AF37]" : "text-slate-400 hover:text-white"
            }`}
          >
            <Wallet className="w-5.5 h-5.5" />
            <span className="text-[11.5px] font-bold font-mono uppercase tracking-wide">Accueil</span>
          </button>

          <button 
            id="tab_nav_produits"
            onClick={() => {
              setActiveTab("products");
              setActiveSubView("none");
            }}
            className={`flex flex-col items-center gap-1.5 text-center transition ${
              activeTab === "products" && activeSubView === "none" ? "text-[#D4AF37]" : "text-slate-400 hover:text-white"
            }`}
          >
            <TrendingUp className="w-5.5 h-5.5" />
            <span className="text-[11.5px] font-bold font-mono uppercase tracking-wide">Produits</span>
          </button>

          <button 
            id="tab_nav_equipe"
            onClick={() => {
              setActiveTab("team");
              setActiveSubView("none");
            }}
            className={`flex flex-col items-center gap-1.5 text-center transition ${
              activeTab === "team" && activeSubView === "none" ? "text-[#D4AF37]" : "text-slate-400 hover:text-white"
            }`}
          >
            <Users className="w-5.5 h-5.5" />
            <span className="text-[11.5px] font-bold font-mono uppercase tracking-wide">Équipe</span>
          </button>

          <button 
            id="tab_nav_profil"
            onClick={() => {
              setActiveTab("profile");
              setActiveSubView("none");
            }}
            className={`flex flex-col items-center gap-1.5 text-center transition ${
              activeTab === "profile" && activeSubView === "none" ? "text-[#D4AF37]" : "text-slate-400 hover:text-white"
            }`}
          >
            <UserIcon className="w-5.5 h-5.5" />
            <span className="text-[11.5px] font-bold font-mono uppercase tracking-wide">Profil</span>
          </button>

        </div>
      </nav>

      {/* Floating Support Button ("Casque Bleue") */}
      <div className="fixed bottom-24 right-5 z-40 flex flex-col items-end">
        {supportPopupOpen && (
          <div className="mb-3 w-72 bg-[#090E20]/95 backdrop-blur-md border border-blue-500/30 rounded-2xl p-4 shadow-2xl animate-fade-in text-white text-left font-sans relative">
            <div className="absolute top-0 left-0 right-0 h-1 bg-blue-500 rounded-t-2xl"></div>
            
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-1.5 mt-1">
                <Headphones className="w-4 h-4 text-blue-400" />
                <span className="text-xs font-bold uppercase tracking-wider font-mono">Assistance iAgri</span>
              </div>
              <button 
                onClick={() => setSupportPopupOpen(false)}
                className="text-gray-400 hover:text-white text-xs font-bold px-1.5 py-0.5 rounded cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-[11px] text-gray-300 mb-3 leading-relaxed">
              Rejoignez nos canaux officiels pour les nouveautés, codes cadeaux et l'aide de la communauté.
            </p>

            <div className="space-y-2.5 font-mono text-xs">
              <a 
                href={platformSettings.whatsappGroupLink} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center justify-between p-2.5 bg-emerald-600/20 hover:bg-emerald-600/35 border border-emerald-500/30 rounded-xl transition text-emerald-300 font-bold"
              >
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                  Groupe WhatsApp
                </span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              <a 
                href={platformSettings.telegramChannelLink} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center justify-between p-2.5 bg-blue-600/20 hover:bg-blue-600/35 border border-blue-500/30 rounded-xl transition text-blue-300 font-bold"
              >
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping"></span>
                  Canal Telegram
                </span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              <button 
                onClick={() => {
                  setActiveSubView("chat");
                  setSupportPopupOpen(false);
                }}
                className="w-full flex items-center justify-between p-2.5 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 rounded-xl transition text-amber-400 font-bold cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <MessageSquare className="w-3.5 h-3.5" />
                  Chat de Support Direct
                </span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        <button
          onClick={() => setSupportPopupOpen(!supportPopupOpen)}
          className="w-14 h-14 bg-gradient-to-tr from-[#0052FF] to-[#00A3FF] text-white rounded-full flex items-center justify-center shadow-lg shadow-blue-500/40 border border-blue-400/30 hover:scale-105 active:scale-95 transition-all relative cursor-pointer"
          title="Assistance Client (Casque Bleu)"
        >
          <Headphones className="w-6 h-6 animate-pulse" />
          <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-red-500 border border-white animate-ping"></span>
        </button>
      </div>

      {/* Dynamic Motivational Live Activity Popups ("Telle personne a rechargé/retiré...") */}
      {activeMotivation && (
        <div className={`fixed left-4 right-4 md:right-auto md:left-5 md:w-96 z-50 bg-[#070D1E]/95 border border-amber-500/20 rounded-2xl p-4 shadow-2xl transition-all duration-500 transform ${
          motivationVisible 
            ? "bottom-24 md:bottom-6 md:translate-y-0 opacity-100 scale-100" 
            : "bottom-0 md:-bottom-20 pointer-events-none opacity-0 scale-95"
        }`}>
          <div className="flex items-start gap-3">
            <div className="p-2 bg-gradient-to-tr from-amber-500/20 to-yellow-500/20 rounded-xl border border-amber-500/30 flex-shrink-0">
              {activeMotivation.type === "deposit" && <ArrowUpRight className="w-5 h-5 text-emerald-400" />}
              {activeMotivation.type === "withdrawal" && <ArrowDownLeft className="w-5 h-5 text-red-400" />}
              {activeMotivation.type === "referral" && <Users className="w-5 h-5 text-purple-400" />}
              {activeMotivation.type === "bonus" && <Gift className="w-5 h-5 text-blue-400" />}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1 text-[10px] font-mono font-bold uppercase tracking-widest text-[#D4AF37]">
                <span>
                  {activeMotivation.type === "deposit" && "⚡ Recharge confirmée"}
                  {activeMotivation.type === "withdrawal" && "💸 Retrait approuvé"}
                  {activeMotivation.type === "referral" && "🤝 Commission versée"}
                  {activeMotivation.type === "bonus" && "🎁 Coupon réclamé"}
                </span>
                <span className="text-slate-400 uppercase font-normal">{activeMotivation.time}</span>
              </div>
              <p className="text-xs font-semibold text-white mt-1 leading-normal font-sans">
                {activeMotivation.text}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Custom Modal overlay for Dialogs / Alerts / Confirms */}
      {modalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-sm bg-white rounded-3xl border border-[#D4AF37]/40 p-6 shadow-2xl relative text-slate-900 overflow-hidden gold-glow">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#D4AF37] to-amber-500"></div>
            
            <h3 className="text-base font-black font-mono text-[#C59B27] uppercase tracking-wider mb-2 pt-2 pb-2 border-b border-slate-100 flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-[#D4AF37] fill-[#D4AF37]" />
              {modalTitle}
            </h3>
            
            <p className="text-sm text-slate-700 leading-relaxed font-sans font-medium mt-3 mb-6">
              {modalMessage}
            </p>
            
            <div className="flex gap-3 justify-end font-mono">
              {modalType === "confirm" && (
                <button
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold uppercase tracking-wider transition cursor-pointer active:scale-95"
                >
                  {lang === "fr" ? "Annuler" : "Cancel"}
                </button>
              )}
              <button
                onClick={() => {
                  setModalOpen(false);
                  if (modalConfirmAction && modalConfirmAction.action) {
                    modalConfirmAction.action();
                  }
                }}
                className="px-5 py-2.5 bg-gradient-to-r from-[#D4AF37] to-amber-400 hover:opacity-90 text-black text-xs font-black rounded-xl uppercase tracking-wider transition-all shadow-md shadow-amber-500/10 cursor-pointer active:scale-95"
              >
                {modalType === "confirm" ? (lang === "fr" ? "Confirmer" : "Confirm") : "OK"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
