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
  Headphones,
  Download,
  Info
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
  fetchPlatformSettings,
  uploadUserWithdrawalProof,
  fetchPublicWithdrawalProofs
} from "../api";
import { User, Investment, Deposit, Withdrawal, Notification, ChatMessage, Product } from "../types";
import { supabase } from "../supabase";

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

  // Public community withdrawal proofs state
  const [publicProofs, setPublicProofs] = useState<any[]>([]);
  const [selectedProofs, setSelectedProofs] = useState<Record<string, string>>({});

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
      phone: "+228 91•• •• 52",
      country: "Togo 🇹🇬",
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
      phone: "+229 96•• •• 88",
      country: "Bénin 🇧🇯",
      text: "J'étais un peu sceptique au début. Après mon premier retrait de 75 000 FCFA via Wave, j'ai directement réinvesti sur la riziculture !",
      amount: "75 000 F",
      avatar: "CK",
      stars: 5
    },
    {
      id: 4,
      name: "Fatoumata B.",
      phone: "+228 92•• •• 44",
      country: "Togo 🇹🇬",
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

  const [uploadingProofId, setUploadingProofId] = useState<string | null>(null);

  const handleUserSelectProof = (withdrawalId: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setSelectedProofs(prev => ({
        ...prev,
        [withdrawalId]: base64
      }));
    };
    reader.onerror = () => {
      triggerAlert("Erreur", "Une erreur est survenue lors de la lecture de l'image.");
    };
    reader.readAsDataURL(file);
  };

  const handleUserSubmitProof = async (withdrawalId: string) => {
    const base64 = selectedProofs[withdrawalId];
    if (!base64) return;

    setUploadingProofId(withdrawalId);
    try {
      await uploadUserWithdrawalProof(withdrawalId, base64);
      triggerAlert(
        "Preuve Transmise ✔️",
        "Merci ! Votre capture d'écran de preuve de retrait a bien été enregistrée et publiée avec succès."
      );
      setSelectedProofs(prev => {
        const copy = { ...prev };
        delete copy[withdrawalId];
        return copy;
      });
      loadProfile();
    } catch (err: any) {
      triggerAlert("Erreur de chargement", err.message || "Impossible d'envoyer la preuve de retrait.");
    } finally {
      setUploadingProofId(null);
    }
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

    // Load public community withdrawal proofs
    fetchPublicWithdrawalProofs().then(data => {
      setPublicProofs(data.proofs || []);
    }).catch(err => console.error("Plan public proofs fetch fail:", err));
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

  // Supabase Real-time subscriptions for instant server-client synchronisation
  useEffect(() => {
    if (!supabase || !userId) return;

    // 1. Subscribe to users profile changes
    const usersChannel = supabase
      .channel(`user-profile-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "users",
          filter: `id=eq.${userId}`
        },
        (payload) => {
          console.log("Supabase Realtime: User profile updated!", payload.new);
          setProfile((prev: any) => {
            if (!prev) return prev;
            return {
              ...prev,
              balance: Number(payload.new.balance),
              dailyEarnings: Number(payload.new.daily_earnings),
              totalEarnings: Number(payload.new.total_earnings),
              totalDeposits: Number(payload.new.total_deposits),
              totalWithdrawals: Number(payload.new.total_withdrawals),
              status: payload.new.status,
              bonusPoints: Number(payload.new.bonus_points),
              lastDailyCheckin: payload.new.last_daily_checkin
            };
          });
        }
      )
      .subscribe();

    // 2. Subscribe to support tickets for instant chat updates
    const ticketsChannel = supabase
      .channel(`user-chat-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "tickets",
          filter: `user_id=eq.${userId}`
        },
        () => {
          console.log("Supabase Realtime: New chat message received!");
          loadChatHistory();
        }
      )
      .subscribe();

    // 3. Subscribe to notifications
    const notificationsChannel = supabase
      .channel(`user-notifications-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications"
        },
        (payload) => {
          if (payload.new.user_id === "all" || payload.new.user_id === userId) {
            console.log("Supabase Realtime: New notification received!");
            fetchUserNotifications(userId).then(data => {
              setNotifications(data.notifications);
              setUnreadNotifications(data.unreadCount);
            }).catch(() => {});
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(usersChannel);
      supabase.removeChannel(ticketsChannel);
      supabase.removeChannel(notificationsChannel);
    };
  }, [userId]);

  // Handle cyclic motivational activity notifications
  useEffect(() => {
    const MOTIVATION_POOL = [
      { name: "+229 97•• •• 14", type: "deposit" as const, amount: "50 000 FCFA", text: "Investisseur +229 97•• •• 14 vient d'investir 50 000 FCFA sur le projet Élevage Avicole 🐔 !", time: "À l'instant" },
      { name: "+228 99•• •• 88", type: "withdrawal" as const, amount: "12 500 FCFA", text: "Retrait de 12 500 FCFA approuvé avec succès pour +228 99•• •• 88 via Wave 💰 !", time: "Il y a 1 min" },
      { name: "+229 63•• •• 41", type: "deposit" as const, amount: "100 000 FCFA", text: "Investisseur +229 63•• •• 41 vient de recharger son compte avec succès 💳 !", time: "À l'instant" },
      { name: "+228 90•• •• 45", type: "bonus" as const, amount: "2 000 FCFA", text: "Félicitations à +228 90•• •• 45 qui a réclamé un coupon cadeau de 2 000 FCFA 🎁 !", time: "Il y a 2 min" },
      { name: "+229 61•• •• 90", type: "deposit" as const, amount: "150 000 FCFA", text: "Investisseur +229 61•• •• 90 vient d'investir 150 000 FCFA sur la Riziculture irriguée 🌾 !", time: "Il y a 3 min" },
      { name: "+229 95•• •• 71", type: "withdrawal" as const, amount: "45 000 FCFA", text: "Retrait de 45 000 FCFA payé par MTN Momo pour +229 95•• •• 71 ⚡ !", time: "Il y a 4 min" },
      { name: "+229 91•• •• 44", type: "deposit" as const, amount: "250 000 FCFA", text: "Investisseur +229 91•• •• 44 vient d'investir 250 000 FCFA sur le Maraîchage Moderne 🍅 !", time: "À l'instant" },
      { name: "+228 92•• •• 19", type: "withdrawal" as const, amount: "75 000 FCFA", text: "Retrait de 75 000 FCFA approuvé pour +228 92•• •• 19 via Moov Money 💸 !", time: "Il y a 5 min" },
      { name: "+229 96•• •• 02", type: "referral" as const, amount: "15 000 FCFA", text: "Félicitations à +229 96•• •• 02 qui a reçu un bonus de parrainage de 15 000 FCFA 🤝 !", time: "Il y a 6 min" },
      { name: "+228 93•• •• 56", type: "deposit" as const, amount: "500 000 FCFA", text: "Investisseur +228 93•• •• 56 vient d'investir 500 000 FCFA sur la Ferme Piscicole 🐟 !", time: "À l'instant" },
      { name: "+229 94•• •• 13", type: "withdrawal" as const, amount: "120 000 FCFA", text: "Retrait de 120 000 FCFA payé instantanément à +229 94•• •• 13 💰 !", time: "Il y a 7 min" },
      { name: "+229 55•• •• 89", type: "deposit" as const, amount: "20 000 FCFA", text: "Investisseur +229 55•• •• 89 vient de recharger 20 000 FCFA 💳 !", time: "Il y a 8 min" },
      { name: "+228 91•• •• 41", type: "deposit" as const, amount: "10 000 FCFA", text: "Investisseur +228 91•• •• 41 vient d'activer un plan d'Élevage de Lapins 🐰 !", time: "À l'instant" },
      { name: "+228 92•• •• 33", type: "withdrawal" as const, amount: "28 000 FCFA", text: "Retrait de 28 000 FCFA payé avec succès à +228 92•• •• 33 par Wave Pay 💳 !", time: "Il y a 10 min" }
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
        const durationLimit = inv.durationDays || (inv.totalReturn / inv.dailyReturn) || 10;
        if (inv.daysActive >= durationLimit) {
          nextMap[inv.id] = lang === "fr" ? "Terminé (Rendement total collecté) ✅" : "Completed ✅";
          return;
        }

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
                    <li>Orange Money : <span className="font-bold text-white">+229 950 11 333</span></li>
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
            {activeSubView === "withdraw" && (() => {
              const pendingProofWithdrawal = withdrawals.find(w => w.status === "approved" && !w.paymentProof);
              const targetWithdrawal = pendingProofWithdrawal || withdrawals.find(w => w.status === "approved");
              
              return (
                <div className="space-y-6">
                  {/* Formulaire de Demande */}
                  <div className="bg-[#0A0E17] border border-white/5 rounded-3xl p-6 space-y-4 gold-glow">
                    <div className="flex items-center gap-2 border-b border-white/5 pb-3">
                      <ArrowDownLeft className="w-5 h-5 text-[#D4AF37]" />
                      <h2 className="text-sm font-bold uppercase font-mono tracking-wider text-slate-100">Demander un Retrait</h2>
                    </div>

                    <div className="bg-[#020617] border border-white/5 rounded-2xl p-4 flex justify-between items-center text-xs">
                      <div>
                        <span className="text-slate-400 block uppercase text-[10px]">Votre solde retirable</span>
                        <span className="text-lg font-bold text-[#D4AF37]">{(profile?.balance ?? 0).toLocaleString()} FCFA</span>
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
                        className="w-full py-3.5 rounded-xl bg-[#D4AF37] hover:bg-[#B8962F] text-black font-bold text-xs tracking-wide transition disabled:opacity-50 cursor-pointer animate-pulse-subtle"
                      >
                        {submitting ? "Traitement sécurisé..." : "Confirmer la Demande"}
                      </button>
                    </form>

                    <div className="pt-4 border-t border-white/5">
                      <p className="text-[10px] text-[#FF5A5A] font-medium text-center uppercase tracking-wider">
                        🔒 Transactions sécurisées bout-en-bout
                      </p>
                    </div>
                  </div>

                  {/* DESIGN ET DIRECTIVES EXACTES SELON LA CAPTURE D'ÉCRAN */}
                  <div className="bg-[#0A0E17] border border-white/5 rounded-3xl p-6 space-y-6">
                    {/* Carte de Téléversement de Preuve */}
                    <div className="bg-[#051124] border border-[#0d274d] rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl select-none">
                      <div className="space-y-1 text-center sm:text-left">
                        <h4 className="text-white font-extrabold text-[14px] sm:text-[15px] leading-relaxed font-sans">
                          Televersez votre propre <br className="hidden sm:inline" />
                          justificatif de retrait pour <br className="hidden sm:inline" />
                          obtenir des recompenses en <br className="hidden sm:inline" />
                          cash
                        </h4>
                      </div>
                      <div className="flex flex-col items-center gap-2">
                        {targetWithdrawal ? (
                          <>
                            <input
                              type="file"
                              accept="image/*"
                              id={`user-proof-input-direct-${targetWithdrawal.id}`}
                              onChange={(e) => handleUserSelectProof(targetWithdrawal.id, e)}
                              className="hidden"
                            />
                            <button
                              type="button"
                              onClick={() => document.getElementById(`user-proof-input-direct-${targetWithdrawal.id}`)?.click()}
                              className="bg-white hover:bg-slate-100 text-[#FE5D50] hover:scale-[1.02] active:scale-[0.98] transition px-6 py-3 rounded-full font-extrabold text-xs flex items-center gap-1.5 whitespace-nowrap cursor-pointer shadow-lg shadow-black/10 font-sans"
                            >
                              <Upload className="w-4 h-4 text-[#FE5D50]" />
                              <span>Televerser la preuve</span>
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            onClick={() => triggerAlert("Information", "Vous devez avoir une demande de retrait validée (Payé) par l'administrateur pour pouvoir téléverser votre justificatif et obtenir vos récompenses.")}
                            className="bg-white/40 text-[#FE5D50]/60 transition px-6 py-3 rounded-full font-extrabold text-xs flex items-center gap-1.5 whitespace-nowrap cursor-not-allowed font-sans"
                          >
                            <Upload className="w-4 h-4 text-[#FE5D50]/60" />
                            <span>Televerser la preuve</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Zone de prévisualisation si fichier sélectionné */}
                    {targetWithdrawal && selectedProofs[targetWithdrawal.id] && (
                      <div className="p-4 rounded-2xl bg-black/40 border border-emerald-500/20 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-emerald-400 font-bold text-[10px] uppercase font-mono tracking-wider">
                            ✨ Justificatif sélectionné ({targetWithdrawal.amount.toLocaleString()} FCFA) :
                          </span>
                          <button
                            type="button"
                            className="text-gray-400 hover:text-white text-xs font-mono font-bold"
                            onClick={() => setSelectedProofs(prev => {
                              const copy = { ...prev };
                              delete copy[targetWithdrawal.id];
                              return copy;
                            })}
                          >
                            X Annuler
                          </button>
                        </div>
                        <div className="rounded overflow-hidden max-h-48 bg-black">
                          <img src={selectedProofs[targetWithdrawal.id]} alt="Preview" className="max-h-40 w-full object-contain mx-auto" />
                        </div>
                        <button
                          type="button"
                          onClick={() => handleUserSubmitProof(targetWithdrawal.id)}
                          disabled={uploadingProofId === targetWithdrawal.id}
                          className="w-full py-2.5 bg-[#22C55E] hover:bg-[#16a34a] text-black font-extrabold text-xs rounded-xl uppercase transition font-mono tracking-wider"
                        >
                          {uploadingProofId === targetWithdrawal.id ? "⌛ Envoi du fichier..." : "✅ Publier et obtenir ma récompense"}
                        </button>
                      </div>
                    )}

                    {/* Règles de Retrait (Structure et Textes exacts) */}
                    <div className="space-y-6 pt-2 text-[13px] text-slate-300 select-none">
                      <div className="space-y-4">
                        <h3 className="text-white font-extrabold text-[15px] tracking-wide border-b border-white/5 pb-2 font-sans">
                          Règles de retrait :
                        </h3>
                        
                        <div className="space-y-1.5 font-sans">
                          <h4 className="text-slate-200 font-bold text-[13.5px]">Horaires de retrait :</h4>
                          <p className="text-slate-400 leading-relaxed font-normal text-xs">
                            Nous proposons un service de retrait du lundi au dimanche. Vous pouvez effectuer un retrait tous les jours de 9h00 à 21h00.
                          </p>
                        </div>

                        <div className="space-y-1.5 font-sans">
                          <h4 className="text-slate-200 font-bold text-[13.5px]">Montant du retrait :</h4>
                          <p className="text-slate-400 leading-relaxed font-normal text-xs">
                            Le montant minimum de retrait est de 1 000 F suisses. Pour un traitement efficace, chaque demande de retrait doit atteindre ou dépasser ce montant.
                          </p>
                        </div>
                      </div>

                      <p className="text-slate-400 leading-relaxed font-normal text-xs pt-3 border-t border-white/5 font-sans">
                        Nous nous engageons à vous offrir une expérience de retrait rapide et sécurisée. N'hésitez pas à contacter notre service client pour toute question ou assistance.
                      </p>
                    </div>
                  </div>

                  {/* Vos Transactions & Preuves de Retrait Individuelles (Collapsible pour rester complet) */}
                  <div className="bg-[#0A0E17] border border-white/5 rounded-3xl p-5 space-y-3.5">
                    <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
                      <div className="flex items-center gap-1.5">
                        <span className="text-emerald-400 text-sm">📁</span>
                        <h3 className="text-xs font-bold uppercase font-mono tracking-wider text-slate-100">Vos Demandes & Justificatifs</h3>
                      </div>
                      <span className="text-[10px] bg-emerald-500/15 text-emerald-400 font-mono px-2 py-0.5 rounded-full uppercase font-bold">
                        {withdrawals.length} Demandes
                      </span>
                    </div>

                    {withdrawals.length === 0 ? (
                      <p className="text-xs text-gray-500 font-mono text-center py-4">Aucune demande de retrait effectuée.</p>
                    ) : (
                      <div className="space-y-3 font-mono text-xs max-h-[250px] overflow-y-auto pr-1">
                        {withdrawals.map(w => (
                          <div key={w.id} className="p-3 rounded-2xl bg-[#020617] border border-white/5 flex flex-col gap-2">
                            <div className="flex justify-between items-center w-full">
                              <div>
                                <p className="font-bold text-white text-xs">{w.amount.toLocaleString()} FCFA</p>
                                <span className="block text-[9px] text-gray-400 mt-0.5">{w.provider} • {w.whatsapp}</span>
                              </div>
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                w.status === "approved" ? "bg-emerald-500/10 text-emerald-400" :
                                w.status === "rejected" ? "bg-rose-500/10 text-rose-400" : "bg-amber-500/10 text-amber-500"
                              }`}>
                                {w.status === "approved" ? "Payé ✔️" : w.status === "rejected" ? "Refusé ❌" : "En cours ⌛"}
                              </span>
                            </div>

                            {w.paymentProof ? (
                              <div className="mt-1 border-t border-white/5 pt-1.5 flex flex-col gap-1.5">
                                <span className="text-[9px] text-[#22C55E] font-bold uppercase flex items-center gap-1 font-sans">
                                  🔗 Justificatif officiel :
                                </span>
                                {w.paymentProof.startsWith("data:") || w.paymentProof.startsWith("http") ? (
                                  <div className="relative rounded-lg overflow-hidden border border-emerald-500/20 bg-black/40 max-h-36">
                                    <img 
                                      src={w.paymentProof} 
                                      alt="Preuve" 
                                      className="max-h-32 w-full object-contain cursor-zoom-in"
                                      onClick={() => window.open(w.paymentProof, '_blank')}
                                      referrerPolicy="no-referrer"
                                    />
                                  </div>
                                ) : (
                                  <p className="text-[10px] text-[#22C55E] bg-emerald-500/5 p-2 rounded-xl border border-emerald-500/10 whitespace-pre-wrap font-mono">
                                    {w.paymentProof}
                                  </p>
                                )}
                              </div>
                            ) : null}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Preuves publiques de la Communauté */}
                  <div className="bg-[#0A0E17] border border-white/5 rounded-3xl p-6 space-y-4">
                    <div className="flex items-center justify-between border-b border-white/5 pb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-amber-400 text-sm">🌍</span>
                        <h3 className="text-xs font-bold uppercase font-mono tracking-wider text-slate-100">Preuves de la Communauté</h3>
                      </div>
                      <span className="text-[10px] bg-emerald-500/10 text-emerald-400 font-mono px-2 py-0.5 rounded-full uppercase font-bold animate-pulse">
                        {publicProofs.length} Publiées
                      </span>
                    </div>

                    {publicProofs.length === 0 ? (
                      <p className="text-xs text-slate-500 font-mono text-center py-6 select-none">
                        Aucune capture de retrait n'a été partagée par la communauté pour le moment. Soyez le premier !
                      </p>
                    ) : (
                      <div className="space-y-4 font-mono text-xs max-h-[400px] overflow-y-auto pr-1">
                        {publicProofs.map((p, idx) => (
                          <div key={p.id || idx} className="p-3 rounded-2xl bg-[#020617] border border-emerald-500/10 flex flex-col gap-2.5 key-proof">
                            <div className="flex justify-between items-start w-full">
                              <div>
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="font-bold text-slate-100">{p.userName}</span>
                                  <span className="text-[10px] text-slate-500 font-normal">({p.userPhone})</span>
                                </div>
                                <span className="block text-[9.5px] text-slate-400 mt-1">
                                  Retrait {p.provider} • {new Date(p.created_at).toLocaleDateString("fr-FR", {
                                    day: "2-digit",
                                    month: "2-digit",
                                    year: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit"
                                  })}
                                </span>
                              </div>
                              <div className="text-right">
                                <span className="text-emerald-400 font-extrabold text-xs block">+{p.amount.toLocaleString()} FCFA</span>
                                <span className="inline-block text-[8.5px] bg-emerald-500/10 text-emerald-400 font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider mt-1">
                                  Reçu ✔️
                                </span>
                              </div>
                            </div>

                            {p.paymentProof && (p.paymentProof.startsWith("data:") || p.paymentProof.startsWith("http")) ? (
                              <div className="relative rounded-lg overflow-hidden border border-white/5 bg-black/40">
                                <img 
                                  src={p.paymentProof} 
                                  alt={`Preuve de retrait de ${p.userName}`} 
                                  className="max-h-48 w-full object-contain cursor-zoom-in transition hover:opacity-95 duration-200"
                                  onClick={() => window.open(p.paymentProof, "_blank")}
                                  referrerPolicy="no-referrer"
                                />
                              </div>
                            ) : p.paymentProof ? (
                              <p className="text-[11px] text-[#22C55E] bg-emerald-500/5 p-2.5 rounded-xl border border-emerald-500/10 whitespace-pre-wrap leading-normal font-sans">
                                {p.paymentProof}
                              </p>
                            ) : null}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}

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
                        <div key={w.id} className="p-3 rounded-xl bg-white/5 border border-white/5 flex flex-col gap-2">
                          <div className="flex justify-between items-center w-full">
                            <div>
                              <p className="font-bold text-white">{w.amount.toLocaleString()} FCFA</p>
                              <span className="block text-[10px] text-gray-400">{w.provider} • {w.whatsapp}</span>
                            </div>
                            <div>
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                w.status === "approved" ? "bg-emerald-500/10 text-emerald-400" :
                                w.status === "rejected" ? "bg-rose-500/10 text-rose-400" : "bg-amber-500/10 text-amber-500"
                              }`}>
                                {w.status === "approved" ? "Payé ✔️" : w.status === "rejected" ? "Refusé ❌" : "En cours ⌛"}
                              </span>
                            </div>
                          </div>

                          {w.paymentProof ? (
                            <div className="mt-1 border-t border-white/5 pt-2 flex flex-col gap-1.5">
                              <span className="text-[10px] text-[#22C55E] font-bold uppercase flex items-center gap-1 font-sans">
                                🔗 Preuve de Retrait officielle :
                              </span>
                              {w.paymentProof.startsWith("data:") || w.paymentProof.startsWith("http") ? (
                                <div className="relative rounded-lg overflow-hidden border border-emerald-500/20 bg-black/40">
                                  <img 
                                    src={w.paymentProof} 
                                    alt="Preuve du transfert" 
                                    className="max-h-48 w-full object-contain cursor-pointer transition hover:opacity-95"
                                    onClick={() => window.open(w.paymentProof, '_blank')}
                                    referrerPolicy="no-referrer"
                                  />
                                </div>
                              ) : (
                                <p className="text-[11px] text-white/95 bg-emerald-500/5 p-2 rounded border border-emerald-500/10 whitespace-pre-wrap font-mono">
                                  {w.paymentProof}
                                </p>
                              )}

                              {w.status === "approved" && (
                                <div className="mt-2 text-right">
                                  {selectedProofs[w.id] ? (
                                    <div className="inline-flex flex-col items-end gap-2 bg-[#020617] p-2.5 rounded-xl border border-emerald-500/25">
                                      <div className="relative rounded overflow-hidden border border-white/10 max-w-[120px]">
                                        <img src={selectedProofs[w.id]} alt="Nouvel aperçu" className="max-h-20 object-contain" />
                                        <button
                                          type="button"
                                          onClick={() => setSelectedProofs(prev => {
                                            const copy = { ...prev };
                                            delete copy[w.id];
                                            return copy;
                                          })}
                                          className="absolute top-0.5 right-0.5 bg-rose-600 hover:bg-rose-700 text-white rounded-full p-0.5 text-[8px] leading-none transition"
                                          title="Annuler"
                                          id={`cancel-history-change-${w.id}`}
                                        >
                                          ❌
                                        </button>
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => handleUserSubmitProof(w.id)}
                                        disabled={uploadingProofId === w.id}
                                        id={`confirm-history-change-btn-${w.id}`}
                                        className="px-2.5 py-1 bg-[#22C55E] hover:bg-[#16a34a] text-black font-extrabold rounded text-[9px] uppercase tracking-wider font-mono transition"
                                      >
                                        {uploadingProofId === w.id ? "⌛..." : "✅ Enregistrer"}
                                      </button>
                                    </div>
                                  ) : (
                                    <div>
                                      <input
                                        type="file"
                                        accept="image/*"
                                        id={`user-proof-history-change-${w.id}`}
                                        onChange={(e) => handleUserSelectProof(w.id, e)}
                                        className="hidden"
                                        disabled={uploadingProofId === w.id}
                                      />
                                      <label
                                        htmlFor={`user-proof-history-change-${w.id}`}
                                        className="inline-flex px-2.5 py-1 bg-white/5 border border-white/10 hover:border-emerald-500/30 text-slate-400 hover:text-[#22C55E] rounded-lg text-[9px] font-bold cursor-pointer transition font-mono items-center gap-1 justify-center whitespace-nowrap"
                                      >
                                        {uploadingProofId === w.id ? "⌛..." : "🔄 Changer ma Capture"}
                                      </label>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          ) : w.status === "approved" ? (
                            <div className="mt-2 bg-emerald-500/5 border border-dashed border-emerald-500/20 rounded-xl p-3 text-center space-y-2 animate-pulse-subtle">
                              <span className="text-[9.5px] text-[#D4AF37] font-bold uppercase block font-mono">
                                📢 PUBLIER VOTRE CAPTURE DE RÉCEPTION
                              </span>
                              <p className="text-[9.5px] text-slate-300">
                                Félicitations ! Votre retrait est payé. Veuillez sélectionner et publier la capture d'écran du reçu (MoMo) reçu pour valider publiquement votre gain.
                              </p>

                              {selectedProofs[w.id] ? (
                                <div className="space-y-3 pt-1">
                                  <div className="relative rounded-xl overflow-hidden border border-emerald-500/30 max-w-[200px] mx-auto bg-black/40">
                                    <img src={selectedProofs[w.id]} alt="Aperçu" className="max-h-32 w-full object-contain mx-auto" />
                                    <button
                                      type="button"
                                      onClick={() => setSelectedProofs(prev => {
                                        const copy = { ...prev };
                                        delete copy[w.id];
                                        return copy;
                                      })}
                                      className="absolute top-1 right-1 bg-rose-600 hover:bg-rose-700 text-white rounded-full p-1 transition"
                                      title="Annuler"
                                      id={`cancel-history-proof-${w.id}`}
                                    >
                                      ❌
                                    </button>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => handleUserSubmitProof(w.id)}
                                    disabled={uploadingProofId === w.id}
                                    id={`submit-history-proof-btn-${w.id}`}
                                    className="w-full px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-black font-extrabold rounded-xl text-xs transition flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/20 font-mono uppercase"
                                  >
                                    {uploadingProofId === w.id ? "⌛ Publication..." : "✅ Publier ma Capture"}
                                  </button>
                                </div>
                              ) : (
                                <div className="flex justify-center">
                                  <input
                                    type="file"
                                    accept="image/*"
                                    id={`user-proof-history-${w.id}`}
                                    onChange={(e) => handleUserSelectProof(w.id, e)}
                                    className="hidden"
                                    disabled={uploadingProofId === w.id}
                                  />
                                  <label
                                    htmlFor={`user-proof-history-${w.id}`}
                                    className="px-3 py-1 bg-gradient-to-r from-emerald-500 to-teal-600 text-black font-extrabold rounded-lg text-[10px] cursor-pointer hover:from-emerald-600 transition flex items-center gap-1 font-mono uppercase"
                                  >
                                    📸 Sélectionner ma Capture
                                  </label>
                                </div>
                              )}
                            </div>
                          ) : null}
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

            {/* À propos de nous panel */}
            {activeSubView === "aboutus" && (
              <div className="bg-[#0A0E17]/90 border border-white/5 rounded-3xl p-6 space-y-6 font-sans text-white">
                <div className="flex items-center gap-2 border-b border-white/5 pb-3">
                  <Info className="w-5 h-5 text-white" />
                  <h2 className="text-sm font-bold uppercase font-mono tracking-wider text-white">À Propos de nous</h2>
                </div>

                <div className="space-y-4 text-xs leading-relaxed">
                  <div className="p-4 rounded-2xl bg-gradient-to-r from-white/5 to-white/5 border border-white/10">
                    <h3 className="font-bold text-white font-mono text-xs uppercase mb-2">Notre Vision & Mission</h3>
                    <p className="text-white">
                      Nous sommes une plateforme innovante d'investissement agro-écologique engagée à connecter les investisseurs avec l'agriculture durable en Afrique. Notre mission est de démocratiser le financement agricole tout en garantissant des rendements quotidiens stables et sécurisés pour nos membres.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <h3 className="font-bold text-white font-mono text-xs uppercase">Pourquoi nous faire confiance ?</h3>
                    
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="bg-[#091032] p-3.5 rounded-xl border border-white/5">
                        <span className="font-extrabold text-white block mb-1">🌱 Projets Réels</span>
                        <p className="text-[11px] text-white">Chaque FCFA investi est injecté dans des cultures biologiques concrètes : soja bio, riziculture de pointe et élevages durables.</p>
                      </div>

                      <div className="bg-[#091032] p-3.5 rounded-xl border border-white/5">
                        <span className="font-extrabold text-white block mb-1">🔒 Sécurité absolue</span>
                        <p className="text-[11px] text-white">Vos fonds sont protégés par nos réserves d'assurance de récolte et les retraits de gains par Mobile Money sont traités instantanément.</p>
                      </div>

                      <div className="bg-[#091032] p-3.5 rounded-xl border border-white/5">
                        <span className="font-extrabold text-white block mb-1">📈 Rendement Garanti</span>
                        <p className="text-[11px] text-white">Grâce à des cycles de production optimisés, nous vous offrons des retours sur investissement clairs, traçables et performants.</p>
                      </div>

                      <div className="bg-[#091032] p-3.5 rounded-xl border border-white/5">
                        <span className="font-extrabold text-white block mb-1">🌍 Impact Positif</span>
                        <p className="text-[11px] text-white">En investissant avec nous, vous soutenez les agriculteurs locaux africains et participez activement à l'indépendance alimentaire.</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-white/5 border border-white/5 text-[11px] text-white font-mono text-center">
                    <span className="block font-bold text-white mb-1">Besoin d'aide ou d'informations supplémentaires ?</span>
                    Rejoignez notre réseau officiel ou discutez en direct avec un conseiller disponible 24h/24 & 7j/7 depuis l'onglet Support.
                  </div>
                </div>
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
                        {(profile?.balance ?? 0).toLocaleString()} <span className="text-xs font-bold text-[#FF7800]">FCFA</span>
                      </span>
                    </div>

                    <div className="px-2.5 py-1 rounded bg-[#0066FF] text-white font-mono text-[10px] font-bold shadow-sm shadow-[#0066FF]/25 flex items-center gap-1.5 animate-pulse-subtle">
                      <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
                      VIP VERIFIÉ
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-3.5 pb-3.5 border-y border-slate-100 text-xs">
                    <div>
                      <span className="text-[11px] font-bold text-slate-500 uppercase block">Revenus quotidiens</span>
                      <span className="text-sm font-bold text-emerald-600 font-mono mt-0.5 block">
                         +{(profile?.dailyEarnings ?? 0).toLocaleString()} F / jour
                      </span>
                    </div>
                    <div>
                      <span className="text-[11px] font-bold text-slate-500 uppercase block">Cumul des gains</span>
                      <span className="text-sm font-bold text-[#FF7800] font-mono mt-0.5 block">
                        {(profile?.totalEarnings ?? 0).toLocaleString()} F
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
                            {(() => {
                              const durationLimit = inv.durationDays || (inv.totalReturn / inv.dailyReturn) || 10;
                              const isFinished = inv.daysActive >= durationLimit;
                              const getNextClaimTimeStr = (lastClaimIso: string) => {
                                const nextDate = new Date(new Date(lastClaimIso).getTime() + 24 * 60 * 60 * 1000);
                                return nextDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' (' + nextDate.toLocaleDateString([], { day: '2-digit', month: '2-digit' }) + ')';
                              };

                              return (
                                <div className="space-y-2">
                                  <div className="flex justify-between text-xs font-mono text-slate-300">
                                    <span className="font-bold">Rendement Planifié : {inv.daysActive} jours sur {durationLimit}</span>
                                    <span className="font-bold text-emerald-400">{Math.round((inv.daysActive / durationLimit) * 100)}%</span>
                                  </div>
                                  <div className="w-full bg-[#020617] h-2 rounded-full overflow-hidden">
                                    <div 
                                      className="h-full bg-gradient-to-r from-[#D4AF37] to-yellow-400 rounded-full"
                                      style={{ width: `${Math.min(100, (inv.daysActive / durationLimit) * 100)}%` }}
                                    ></div>
                                  </div>
                                  
                                  {/* Realtime countdown ticket indicator */}
                                  <div className="pt-2 flex flex-col gap-1.5 text-[11px] font-sans border-t border-white/5 mt-1.5 text-left">
                                    {!isFinished && (
                                      <div className="flex justify-between items-center">
                                        <span className="text-slate-400 font-semibold">Heure exacte du gain :</span>
                                        <span className="text-white font-bold font-mono">
                                          {getNextClaimTimeStr(inv.lastClaimDate)}
                                        </span>
                                      </div>
                                    )}
                                    <div className="flex justify-between items-center">
                                      <span className="text-slate-400 font-semibold">Prochain versement (24h) :</span>
                                      <span className="text-[#D4AF37] font-bold bg-[#D4AF37]/10 px-2 py-0.5 rounded border border-[#D4AF37]/15 font-mono animate-pulse">
                                        {countdowns[inv.id] || "00h 00m 00s"}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              );
                            })()}
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
                      {(profile?.totalEarnings ?? 0).toLocaleString()} <span className="text-xs font-bold text-slate-400">FCFA</span>
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
                          className={`bg-[#0A0E17] border rounded-[32px] p-6 relative overflow-hidden group transition duration-300 ${
                            prod.isBlocked 
                              ? "border-red-500/20 bg-gradient-to-b from-[#140a0c] to-[#0A0E17] opacity-95" 
                              : "border-[#D4AF37]/20 hover:border-[#D4AF37] gold-glow"
                          }`}
                        >
                          {prod.isBlocked ? (
                            <div className="absolute top-0 right-0 bg-red-600 text-white font-mono text-[9px] font-extrabold px-3 py-1 bg-red-600 rounded-bl-xl uppercase tracking-widest animate-pulse shadow-lg select-none">
                              Indisponible 🚫
                            </div>
                          ) : prod.badge ? (
                            <div className="absolute top-0 right-0 bg-gradient-to-r from-[#D4AF37] to-yellow-400 text-black font-mono text-[9px] font-bold px-3 py-1 rounded-bl-xl uppercase tracking-wider scale-95 origin-top-right">
                              {prod.badge}
                            </div>
                          ) : null}

                          <div className="space-y-1.5">
                            <div className="flex justify-between items-start gap-2">
                              <h3 className="text-sm font-extrabold text-white uppercase tracking-wide">{prod.name}</h3>
                              {prod.isBlocked ? (
                                <span className="text-[9px] font-mono font-extrabold px-2 py-0.5 rounded shrink-0 bg-red-500/15 text-red-400 border border-red-500/20 uppercase tracking-wide">
                                  Indisponible 🚫
                                </span>
                              ) : (() => {
                                const maxAllowed = prod.maxPurchaseCount !== undefined ? prod.maxPurchaseCount : 3;
                                const activePurchases = investments.filter(inv => inv.planId === prod.id).length;
                                return (
                                  <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded shrink-0 ${
                                    activePurchases >= maxAllowed 
                                      ? "bg-rose-500/10 text-rose-400 border border-rose-500/10" 
                                      : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/10"
                                  }`}>
                                    Achat: {activePurchases}/{maxAllowed}
                                  </span>
                                );
                              })()}
                            </div>
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

                            {(() => {
                              if (prod.isBlocked) {
                                return (
                                  <span className="px-5 py-2.5 rounded-xl text-xs font-bold font-mono tracking-widest bg-red-900/20 text-red-400 border border-red-500/15 shadow-none uppercase select-none cursor-not-allowed">
                                    Indisponible 🚫
                                  </span>
                                );
                              }
                              const maxAllowed = prod.maxPurchaseCount !== undefined ? prod.maxPurchaseCount : 3;
                              const activePurchases = investments.filter(inv => inv.planId === prod.id).length;
                              const limitReached = activePurchases >= maxAllowed;
                              
                              return (
                                <button
                                  onClick={() => !limitReached && handleBuyProduct(prod)}
                                  disabled={limitReached}
                                  className={`px-5 py-2.5 rounded-xl text-xs font-bold font-mono tracking-wider transition shadow-lg cursor-pointer ${
                                    limitReached 
                                      ? "bg-slate-800 text-slate-500 border border-slate-700 shadow-none cursor-not-allowed opacity-50" 
                                      : "bg-[#D4AF37] hover:bg-[#B8962F] text-black shadow-[#D4AF37]/10 active:scale-95"
                                  }`}
                                >
                                  {limitReached ? "Limite atteinte 🔒" : "Activer le Plan ⚡"}
                                </button>
                              );
                            })()}
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
                  <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex justify-between items-center mb-1">
                    <div>
                      <span className="text-[10px] text-amber-500 uppercase tracking-wider block font-bold font-mono">CODE PARRAIN</span>
                      <span className="text-lg font-black text-white font-mono tracking-widest block">{profile?.referralCode}</span>
                    </div>
                    <button
                      onClick={() => {
                        if (profile?.referralCode) {
                          navigator.clipboard.writeText(profile.referralCode);
                          triggerAlert(lang === "fr" ? "Succès" : "Success", lang === "fr" ? "Code de parrainage copié !" : "Referral code copied!");
                        }
                      }}
                      className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-black font-bold font-sans text-[10px] transition cursor-pointer"
                    >
                      COPIER
                    </button>
                  </div>

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
                    <span className="text-xs font-mono text-white block uppercase font-bold">Total des Commissions MLM Perçues</span>
                    <span className="text-2xl font-black font-mono text-white block mt-1">{referralStats.bonusEarned.toLocaleString()} FCFA</span>
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
                    {profile?.name ? profile.name.substring(0, 2) : "I"}
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-white uppercase">{profile?.name}</h3>
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
                    className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-white/5 transition border-b border-white/5"
                  >
                    <div className="flex items-center gap-3">
                      <Bell className="w-4 h-4 text-[#FBBF24]" />
                      <span>Mes notifications ({unreadNotifications})</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-500" />
                  </button>

                  <button 
                    onClick={() => setActiveSubView("aboutus")}
                    className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-white/5 transition border-b border-white/5"
                  >
                    <div className="flex items-center gap-3">
                      <Info className="w-4 h-4 text-amber-500" />
                      <span>À propos de nous (iAgri)</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-500" />
                  </button>

                  <a 
                    href="/application-momo.apk" 
                    download="application-momo.apk"
                    className="w-full px-5 py-5 flex items-center justify-between text-left bg-gradient-to-r from-emerald-500/10 to-teal-500/10 hover:from-emerald-500/20 hover:to-teal-500/20 transition group text-emerald-400 font-bold"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-emerald-500/15 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition">
                        <Download className="w-4 h-4" />
                      </div>
                      <div className="flex flex-col font-sans">
                        <span className="text-xs font-black text-white">Télécharger l'Application mobile (.APK)</span>
                        <span className="text-[9px] text-[#02A3FC] font-mono font-normal block mt-0.5">Accès instantané sécurisé MoMo Pay 📲</span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-emerald-400" />
                  </a>
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
        <div className={`fixed left-4 right-4 md:right-auto md:left-5 md:w-96 z-50 motivation-toast p-4 transition-all duration-500 transform ${
          motivationVisible 
            ? "bottom-24 md:bottom-6 md:translate-y-0 opacity-100 scale-100" 
            : "bottom-0 md:-bottom-20 pointer-events-none opacity-0 scale-95"
        }`}>
          <div className="flex items-start gap-4">
            <div className="p-2.5 bg-gradient-to-tr from-amber-500/20 to-yellow-500/20 rounded-xl border border-amber-500/30 flex-shrink-0">
              {activeMotivation.type === "deposit" && <ArrowUpRight className="w-5 h-5 text-emerald-400" />}
              {activeMotivation.type === "withdrawal" && <ArrowDownLeft className="w-5 h-5 text-red-500" />}
              {activeMotivation.type === "referral" && <Users className="w-5 h-5 text-purple-400" />}
              {activeMotivation.type === "bonus" && <Gift className="w-5 h-5 text-blue-400" />}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1 text-[10px] font-mono font-bold uppercase tracking-widest">
                <span className="motivation-toast-title">
                  {activeMotivation.type === "deposit" && "⚡ Recharge confirmée"}
                  {activeMotivation.type === "withdrawal" && "💸 Retrait approuvé"}
                  {activeMotivation.type === "referral" && "🤝 Commission versée"}
                  {activeMotivation.type === "bonus" && "🎁 Coupon réclamé"}
                </span>
                <span className="motivation-toast-time">{activeMotivation.time}</span>
              </div>
              <p className="motivation-toast-desc text-xs mt-1.5 leading-relaxed font-sans">
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
