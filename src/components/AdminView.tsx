import React, { useEffect, useState } from "react";
import { 
  Users, 
  ArrowUpRight, 
  ArrowDownLeft, 
  TrendingUp, 
  ShieldCheck, 
  UserX, 
  UserCheck, 
  PlusSquare, 
  Trash2, 
  Megaphone, 
  Gift, 
  MessageSquare,
  Activity,
  UserPlus,
  RefreshCw,
  X,
  CreditCard,
  ChevronRight,
  ExternalLink,
  Search,
  Pencil
} from "lucide-react";
import { 
  fetchAdminStats, 
  fetchAdminUsers, 
  executeAdminUserAction, 
  fetchAdminDeposits, 
  executeAdminDepositAction, 
  fetchAdminWithdrawals, 
  executeAdminWithdrawalAction, 
  fetchAdminProducts, 
  createAdminProduct, 
  deleteAdminProduct, 
  updateAdminProduct,
  triggerAdminGlobalNotification, 
  generateAdminBonusCode, 
  fetchAdminBonusCodes,
  fetchAdminChats,
  sendChatMessage,
  fetchChatHistory,
  fetchPlatformSettings,
  updatePlatformSettings
} from "../api";

interface AdminViewProps {
  adminUserId: string;
  onExit: () => void;
  lang: "fr" | "en";
}

export default function AdminView({ adminUserId, onExit, lang }: AdminViewProps) {
  // Navigation tabs inside admin panel
  // "stats", "users", "deposits", "withdrawals", "products", "bonus", "chat"
  const [activeSegment, setActiveSegment] = useState<"stats" | "users" | "deposits" | "withdrawals" | "products" | "bonus" | "chat">("stats");

  // Admin stats
  const [stats, setStats] = useState({
    totalUsers: 0,
    blockedUsers: 0,
    totalDepositsSubmitted: 0,
    pendingDeposits: 0,
    approvedDepositsSum: 0,
    totalWithdrawalsSubmitted: 0,
    pendingWithdrawals: 0,
    approvedWithdrawalsSum: 0,
    activeInvestmentSum: 0
  });

  // Lists
  const [users, setUsers] = useState<any[]>([]);
  const [userSearchTerm, setUserSearchTerm] = useState("");
  const [deposits, setDeposits] = useState<any[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);

  // Simple client-side search filtering
  const filteredUsers = users.filter((u) => {
    if (!userSearchTerm) return true;
    const term = userSearchTerm.toLowerCase();
    return (
      (u.name && u.name.toLowerCase().includes(term)) ||
      (u.whatsapp && u.whatsapp.toLowerCase().includes(term)) ||
      (u.country && u.country.toLowerCase().includes(term)) ||
      (u.referralCode && u.referralCode.toLowerCase().includes(term))
    );
  });
  const [products, setProducts] = useState<any[]>([]);
  const [bonusCodes, setBonusCodes] = useState<any[]>([]);
  const [chats, setChats] = useState<any[]>([]);

  // Reusable custom confirmation modal replacing window.confirm for iframe runtime safety
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
  });

  const requestConfirmation = (title: string, message: string, onConfirm: () => void) => {
    setConfirmModal({
      isOpen: true,
      title,
      message,
      onConfirm: () => {
        onConfirm();
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  // Selected User edits
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [adjustmentAmt, setAdjustmentAmt] = useState("");
  const [editingCodeUserId, setEditingCodeUserId] = useState<string | null>(null);
  const [editCodeVal, setEditCodeVal] = useState("");
  const [editingPassUserId, setEditingPassUserId] = useState<string | null>(null);
  const [editPassVal, setEditPassVal] = useState("");

  // Create Product Form States
  const [newProdName, setNewProdName] = useState("");
  const [newProdPrice, setNewProdPrice] = useState("");
  const [newProdReturn, setNewProdReturn] = useState("");
  const [newProdDuration, setNewProdDuration] = useState("10");
  const [newProdBadge, setNewProdBadge] = useState("");

  // Edit Product States
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [editProdName, setEditProdName] = useState("");
  const [editProdPrice, setEditProdPrice] = useState("");
  const [editProdReturn, setEditProdReturn] = useState("");
  const [editProdDuration, setEditProdDuration] = useState("");
  const [editProdBadge, setEditProdBadge] = useState("");

  // Create Global Announcement Form States
  const [globalNotifTitle, setGlobalNotifTitle] = useState("");
  const [globalNotifMessage, setGlobalNotifMessage] = useState("");

  // Create Bonus Code Form States
  const [newBonusCode, setNewBonusCode] = useState("");
  const [newBonusAmount, setNewBonusAmount] = useState("");
  const [newBonusLimit, setNewBonusLimit] = useState("");

  // Support links config states
  const [adminWhatsappGroupLink, setAdminWhatsappGroupLink] = useState("");
  const [adminTelegramChannelLink, setAdminTelegramChannelLink] = useState("");

  // Active chat conversation states
  const [activeChatUserId, setActiveChatUserId] = useState<string | null>(null);
  const [activeChatUserName, setActiveChatUserName] = useState("");
  const [activeChatHistory, setActiveChatHistory] = useState<any[]>([]);
  const [adminChatReply, setAdminChatReply] = useState("");

  // State loggers
  const [notifyMsg, setNotifyMsg] = useState("");
  const [notifyErr, setNotifyErr] = useState("");
  const [loading, setLoading] = useState(false);

  // Load Admin metrics
  const reloadAdminStats = () => {
    setLoading(true);
    fetchAdminStats().then(data => {
      setStats(data);
      setLoading(false);
    }).catch(e => console.error(e));
  };

  const reloadUsers = () => {
    fetchAdminUsers().then(data => {
      setUsers(data.users || []);
    }).catch(e => console.error(e));
  };

  const reloadDeposits = () => {
    fetchAdminDeposits().then(data => {
      setDeposits(data.deposits || []);
    }).catch(e => console.error(e));
  };

  const reloadWithdrawals = () => {
    fetchAdminWithdrawals().then(data => {
      setWithdrawals(data.withdrawals || []);
    }).catch(e => console.error(e));
  };

  const reloadProducts = () => {
    fetchAdminProducts().then(data => {
      setProducts(data.products || []);
    }).catch(e => console.error(e));
  };

  const reloadBonusCodes = () => {
    fetchAdminBonusCodes().then(data => {
      setBonusCodes(data.bonusCodes || []);
    }).catch(e => console.error(e));
  };

  const reloadChats = () => {
    fetchAdminChats().then(data => {
      setChats(data.chats || []);
    }).catch(e => console.error(e));
  };

  const reloadPlatformSettings = () => {
    fetchPlatformSettings().then(data => {
      setAdminWhatsappGroupLink(data.whatsappGroupLink || "");
      setAdminTelegramChannelLink(data.telegramChannelLink || "");
    }).catch(e => console.error(e));
  };

  const handleUpdateSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setNotifyMsg("");
    setNotifyErr("");
    updatePlatformSettings({
      whatsappGroupLink: adminWhatsappGroupLink,
      telegramChannelLink: adminTelegramChannelLink
    }).then(res => {
      if (res.success) {
        setNotifyMsg("Lien du groupe WhatsApp et Canal Telegram mis à jour !");
      } else {
        setNotifyErr("Une erreur est survenue.");
      }
    }).catch(err => {
      setNotifyErr("Erreur réseau du serveur.");
    });
  };

  // Run initial reads
  useEffect(() => {
    reloadAdminStats();
    reloadUsers();
    reloadDeposits();
    reloadWithdrawals();
    reloadProducts();
    reloadBonusCodes();
    reloadChats();
    reloadPlatformSettings();
  }, [activeSegment]);

  // Handle active sub conversation loading
  useEffect(() => {
    if (activeChatUserId) {
      const chatInterval = setInterval(() => {
        fetchChatHistory(activeChatUserId).then(data => {
          setActiveChatHistory(data.history || []);
        });
      }, 3000);
      return () => clearInterval(chatInterval);
    }
  }, [activeChatUserId]);

  const selectConversation = (userId: string, userName: string) => {
    setActiveChatUserId(userId);
    setActiveChatUserName(userName);
    fetchChatHistory(userId).then(data => {
      setActiveChatHistory(data.history || []);
    });
  };

  // Submit reply message from administrator
  const handleAdminChatSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminChatReply.trim() || !activeChatUserId) return;

    try {
      await sendChatMessage(activeChatUserId, "admin", adminChatReply.trim());
      setAdminChatReply("");
      fetchChatHistory(activeChatUserId).then(data => {
        setActiveChatHistory(data.history || []);
      });
    } catch (e) {
      console.warn(e);
    }
  };

  // Block or Unlock user accounts
  const handleToggleBlockUser = async (targetUserId: string, currentStatus: string) => {
    const action = currentStatus === "blocked" ? "unblock" : "block";
    requestConfirmation(
      "Modifier statut de l'utilisateur",
      `Voulez-vous modifier le statut de cet utilisateur à: ${action === "block" ? "BLOQUÉ 🚫" : "ACTIF ✅"} ?`,
      async () => {
        try {
          const res = await executeAdminUserAction({ targetUserId, action });
          setNotifyMsg(res.message || "Statut mis à jour !");
          reloadUsers();
        } catch (err: any) {
          setNotifyErr(err.message || "Erreur.");
        }
      }
    );
  };

  // Toggle Admin role
  const handleToggleAdmin = async (targetUserId: string, currentIsAdmin: boolean) => {
    const word = currentIsAdmin ? "DESTITUER" : "NOMMER";
    requestConfirmation(
      `${word === "NOMMER" ? "Nommer administrateur" : "Destituer de l'administration"}`,
      `Êtes-vous sûr de vouloir ${word === "NOMMER" ? "donner des droits d'administrateur" : "retirer les droits d'administrateur"} à cet utilisateur ?`,
      async () => {
        try {
          const res = await executeAdminUserAction({ targetUserId, action: "toggle_admin" });
          setNotifyMsg(res.message || "Rôle mis à jour !");
          reloadUsers();
        } catch (err: any) {
          setNotifyErr(err.message || "Erreur.");
        }
      }
    );
  };

  // Simulate 24 hours passage for testing real-time earnings
  const handleSimulate24h = async (targetUserId: string) => {
    requestConfirmation(
      "Simuler l'écoulement de 24 Heures",
      "Voulez-vous simuler l'écoulement de 24 Heures pour cet utilisateur ? Ses investissements VIP recevront instantanément leurs gains quotidiens.",
      async () => {
        try {
          const res = await executeAdminUserAction({ targetUserId, action: "simulate_24h" });
          setNotifyMsg(res.message || "Simulation de gain créditée sous 24h !");
          reloadUsers();
        } catch (err: any) {
          setNotifyErr(err.message || "Erreur de simulation.");
        }
      }
    );
  };

  // Add customized balance adjusting
  const handleAddBalanceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !adjustmentAmt) return;

    try {
      const res = await executeAdminUserAction({
        targetUserId: selectedUser.id,
        action: "add_balance",
        amount: adjustmentAmt
      });
      setNotifyMsg(`Succès! Wallet de ${selectedUser.name} augmenté de ${adjustmentAmt} FCFA.`);
      setAdjustmentAmt("");
      setSelectedUser(null);
      reloadUsers();
    } catch (err: any) {
      setNotifyErr(err.message || "Erreur de mise à jour");
    }
  };

  // Update user referral code
  const handleUpdateCodeSubmit = async (e: React.FormEvent, userId: string) => {
    e.preventDefault();
    if (!editCodeVal.trim()) return;

    try {
      const res = await executeAdminUserAction({
        targetUserId: userId,
        action: "update_code",
        newCode: editCodeVal.trim()
      });
      if (res.error) {
        setNotifyErr(res.error);
      } else {
        setNotifyMsg("Code de parrainage mis à jour avec succès !");
        setEditingCodeUserId(null);
        setEditCodeVal("");
        reloadUsers();
      }
    } catch (err: any) {
      setNotifyErr(err.message || "Erreur de mise à jour");
    }
  };

  // Update user password
  const handleUpdatePasswordSubmit = async (e: React.FormEvent, userId: string) => {
    e.preventDefault();
    if (!editPassVal.trim()) return;

    try {
      const res = await executeAdminUserAction({
        targetUserId: userId,
        action: "update_password",
        newPassword: editPassVal.trim()
      });
      if (res.error) {
        setNotifyErr(res.error);
      } else {
        setNotifyMsg("Mot de passe de l'utilisateur mis à jour avec succès !");
        setEditingPassUserId(null);
        setEditPassVal("");
        reloadUsers();
      }
    } catch (err: any) {
      setNotifyErr(err.message || "Erreur de mise à jour");
    }
  };

  // Process deposit verification
  const handleProcessDeposit = async (depositId: string, action: "approve" | "reject") => {
    const word = action === "approve" ? "VALIDER" : "REJETER";
    requestConfirmation(
      `${word === "VALIDER" ? "Validation" : "Rejet"} du dépôt`,
      `Êtes-vous sûr de vouloir ${word} ce dépôt Mobile Money ?`,
      async () => {
        try {
          const res = await executeAdminDepositAction(depositId, action);
          setNotifyMsg(res.message || "Résultat du paiement enregistré.");
          reloadDeposits();
          reloadAdminStats();
        } catch (err: any) {
          setNotifyErr(err.message);
        }
      }
    );
  };

  // Process withdrawal checkout
  const handleProcessWithdrawal = async (withdrawalId: string, action: "approve" | "reject") => {
    const word = action === "approve" ? "PAYER" : "REFUSER ET REMBOURSER";
    requestConfirmation(
      `${action === "approve" ? "Validation de Paiement" : "Refus de Retrait"}`,
      `Êtes-vous sûr de vouloir ${word} cette demande de retrait ?`,
      async () => {
        try {
          const res = await executeAdminWithdrawalAction(withdrawalId, action);
          setNotifyMsg(res.message || "Résultat du retrait enregistré.");
          reloadWithdrawals();
          reloadAdminStats();
        } catch (err: any) {
          setNotifyErr(err.message);
        }
      }
    );
  };

  // Create investment plan VIP Product type
  const handleCreateProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setNotifyMsg("");
    setNotifyErr("");

    if (!newProdName || !newProdPrice || !newProdReturn) {
      setNotifyErr("Champs obligatoires manquants.");
      return;
    }

    try {
      const res = await createAdminProduct({
        name: newProdName,
        price: newProdPrice,
        dailyReturn: newProdReturn,
        durationDays: newProdDuration,
        badge: newProdBadge || undefined
      });

      if (res.success) {
        setNotifyMsg(`Le produit ${newProdName} a été configuré avec succès.`);
        setNewProdName("");
        setNewProdPrice("");
        setNewProdReturn("");
        setNewProdBadge("");
        reloadProducts();
      }
    } catch (err: any) {
      setNotifyErr(err.message || "Échec.");
    }
  };

  // Delete product plan
  const handleDeleteProduct = async (prodId: string) => {
    requestConfirmation(
      "Suppression du Plan VIP",
      "Supprimer définitivement ce plan VIP ? ",
      async () => {
        try {
          await deleteAdminProduct(prodId);
          setNotifyMsg("Produit éliminé !");
          reloadProducts();
        } catch (err: any) {
          setNotifyErr(err.message);
        }
      }
    );
  };

  // Update existing product details
  const handleUpdateProductSubmit = async (e: React.FormEvent, prodId: string) => {
    e.preventDefault();
    setNotifyMsg("");
    setNotifyErr("");

    if (!editProdName || !editProdPrice || !editProdReturn || !editProdDuration) {
      setNotifyErr("Champs obligatoires manquants.");
      return;
    }

    try {
      const res = await updateAdminProduct(prodId, {
        name: editProdName,
        price: editProdPrice,
        dailyReturn: editProdReturn,
        durationDays: editProdDuration,
        badge: editProdBadge || undefined
      });

      if (res.success) {
        setNotifyMsg("Produit mis à jour avec succès !");
        setEditingProductId(null);
        reloadProducts();
      } else if (res.error) {
        setNotifyErr(res.error);
      }
    } catch (err: any) {
      setNotifyErr(err.message || "Erreur de mise à jour");
    }
  };

  // Dispatch Global Alarm announcements
  const handleGlobalNotificationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setNotifyMsg("");
    setNotifyErr("");

    if (!globalNotifTitle || !globalNotifMessage) return;

    try {
      const res = await triggerAdminGlobalNotification({
        title: globalNotifTitle,
        message: globalNotifMessage
      });
      setNotifyMsg("Alerte globale diffusée en temps réel auprès de tous les investisseurs !");
      setGlobalNotifTitle("");
      setGlobalNotifMessage("");
    } catch (e: any) {
      setNotifyErr(e.message);
    }
  };

  // Generate Coupon Bonus
  const handleCreateBonusCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setNotifyMsg("");
    setNotifyErr("");
    if (!newBonusCode || !newBonusAmount) return;

    try {
      const res = await generateAdminBonusCode({
        code: newBonusCode,
        amount: newBonusAmount,
        usageLimit: newBonusLimit || undefined
      });
      if (res.error) {
        setNotifyErr(res.error);
      } else {
        setNotifyMsg(`Code bonus ${newBonusCode} de ${newBonusAmount} FCFA généré avec succès.`);
        setNewBonusCode("");
        setNewBonusAmount("");
        setNewBonusLimit("");
        reloadBonusCodes();
      }
    } catch (err: any) {
      setNotifyErr(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-[#F3F6FC] text-[#1E293B]">
      
      {/* Admin header */}
      <header className="bg-[#1E293B] px-4 py-4 border-b border-red-500/25 sticky top-0 z-40 text-white shadow-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-red-600 flex items-center justify-center text-white font-mono font-bold shadow-md shadow-red-500/10">
              A
            </div>
            <div>
              <h1 className="text-sm font-bold font-mono tracking-wider text-red-500">INVESTA ADMIN PORTAL</h1>
              <span className="text-[10px] text-gray-400 uppercase tracking-widest font-mono">Cockpit de surveillance ultra-sécurisé</span>
            </div>
          </div>

          <button
            onClick={onExit}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs border border-white/10 font-semibold cursor-pointer text-white"
          >
            Sortir du Panel Administrateur
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        
        {/* State responses bars */}
        {notifyMsg && (
          <div className="mb-4 p-3 bg-emerald-500/15 border border-emerald-500/20 rounded-xl text-xs text-emerald-650 font-mono text-center font-bold">
            ✓ ACTES ENREGISTRÉS : {notifyMsg}
          </div>
        )}
        {notifyErr && (
          <div className="mb-4 p-3 bg-red-500/15 border border-red-500/20 rounded-xl text-xs text-red-600 font-mono text-center font-bold">
            ⚠️ ERREUR BLOQUANTE : {notifyErr}
          </div>
        )}

        {/* Dynamic horizontal quick category tabs */}
        <div className="flex items-center gap-3 overflow-x-auto pb-4 mb-6 scrollbar-none border-b border-slate-200">
          <button 
            id="admin_tab_stats"
            onClick={() => setActiveSegment("stats")}
            className={`flex items-center gap-2 px-4 py-3 rounded-2xl border transition duration-200 shrink-0 cursor-pointer text-xs font-mono font-bold ${
              activeSegment === "stats" 
                ? "bg-red-600 border-red-600 text-white shadow-md shadow-red-500/25" 
                : "bg-white border-slate-200/60 hover:bg-slate-50 text-slate-700"
            }`}
          >
            <Activity className="w-4 h-4 shrink-0" />
            <span>Vue d'ensemble 📊</span>
          </button>

          <button 
            id="admin_tab_users"
            onClick={() => setActiveSegment("users")}
            className={`flex items-center gap-2 px-4 py-3 rounded-2xl border transition duration-200 shrink-0 cursor-pointer text-xs font-mono font-bold ${
              activeSegment === "users" 
                ? "bg-red-600 border-red-600 text-white shadow-md shadow-red-500/25" 
                : "bg-white border-slate-200/60 hover:bg-slate-50 text-slate-700"
            }`}
          >
            <Users className="w-4 h-4 shrink-0" />
            <span>Utilisateurs ({stats.totalUsers}) 👥</span>
          </button>

          <button 
            id="admin_tab_deposits"
            onClick={() => setActiveSegment("deposits")}
            className={`flex items-center gap-2 px-4 py-3 rounded-2xl border transition duration-200 shrink-0 cursor-pointer text-xs font-mono font-bold ${
              activeSegment === "deposits" 
                ? "bg-red-600 border-red-600 text-white shadow-md shadow-red-500/25 animate-pulse" 
                : "bg-white border-slate-200/60 hover:bg-slate-50 text-slate-700"
            }`}
          >
            <ArrowUpRight className="w-4 h-4 shrink-0" />
            <span>Dépôts MoMo ({stats.pendingDeposits}) 📥</span>
          </button>

          <button 
            id="admin_tab_withdrawals"
            onClick={() => setActiveSegment("withdrawals")}
            className={`flex items-center gap-2 px-4 py-3 rounded-2xl border transition duration-200 shrink-0 cursor-pointer text-xs font-mono font-bold ${
              activeSegment === "withdrawals" 
                ? "bg-red-600 border-red-600 text-white shadow-md shadow-red-500/25" 
                : "bg-white border-slate-200/60 hover:bg-slate-50 text-slate-700"
            }`}
          >
            <ArrowDownLeft className="w-4 h-4 shrink-0" />
            <span>Retraits ({stats.pendingWithdrawals}) 📤</span>
          </button>

          <button 
            id="admin_tab_products"
            onClick={() => setActiveSegment("products")}
            className={`flex items-center gap-2 px-4 py-3 rounded-2xl border transition duration-200 shrink-0 cursor-pointer text-xs font-mono font-bold ${
              activeSegment === "products" 
                ? "bg-red-600 border-red-600 text-white shadow-md shadow-red-500/25" 
                : "bg-white border-slate-200/60 hover:bg-slate-50 text-slate-700"
            }`}
          >
            <PlusSquare className="w-4 h-4 shrink-0" />
            <span>Plans VIP 📦</span>
          </button>

          <button 
            id="admin_tab_bonus"
            onClick={() => setActiveSegment("bonus")}
            className={`flex items-center gap-2 px-4 py-3 rounded-2xl border transition duration-200 shrink-0 cursor-pointer text-xs font-mono font-bold ${
              activeSegment === "bonus" 
                ? "bg-red-600 border-red-600 text-white shadow-md shadow-red-500/25" 
                : "bg-white border-slate-200/60 hover:bg-slate-50 text-slate-700"
            }`}
          >
            <Gift className="w-4 h-4 shrink-0" />
            <span>Alertes & Vouchers 🎁</span>
          </button>

          <button 
            id="admin_tab_chat"
            onClick={() => setActiveSegment("chat")}
            className={`flex items-center gap-2 px-4 py-3 rounded-2xl border transition duration-200 shrink-0 cursor-pointer text-xs font-mono font-bold ${
              activeSegment === "chat" 
                ? "bg-red-600 border-red-600 text-white shadow-md shadow-red-500/25" 
                : "bg-white border-slate-200/60 hover:bg-slate-50 text-slate-700"
            }`}
          >
            <MessageSquare className="w-4 h-4 shrink-0" />
            <span>Support Chat ({chats.length}) 💬</span>
          </button>
        </div>


        {/* ================================================= CONTENT SEGMENTS ================================================= */}

        {/* 1. Vue d'ensemble statistics dashboard */}
        {activeSegment === "stats" && (
          <div className="space-y-6">
            <h2 className="text-sm font-bold font-mono text-red-600 uppercase tracking-widest">Calculs Financiers Plateforme</h2>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white border border-slate-200/60 rounded-2xl p-5 shadow-sm hover:shadow-md transition duration-200">
                <span className="text-[10px] text-slate-500 font-mono block uppercase font-bold">Total Dépôts Cumulés</span>
                <span className="text-xl sm:text-2xl font-bold font-mono text-emerald-600 mt-1 block">
                  {(stats.approvedDepositsSum).toLocaleString()} <span className="text-xs font-normal">FCFA</span>
                </span>
                <span className="text-[9px] text-slate-400 font-mono block mt-2">Dépôts validés par l'administration</span>
              </div>

              <div className="bg-white border border-slate-200/60 rounded-2xl p-5 shadow-sm hover:shadow-md transition duration-200">
                <span className="text-[10px] text-slate-500 font-mono block uppercase font-bold">Total Retraits Payés</span>
                <span className="text-xl sm:text-2xl font-bold font-mono text-rose-600 mt-1 block">
                  {(stats.approvedWithdrawalsSum).toLocaleString()} <span className="text-xs font-normal">FCFA</span>
                </span>
                <span className="text-[9px] text-slate-400 font-mono block mt-2">Fonds transférés aux investisseurs</span>
              </div>

              <div className="bg-white border border-slate-200/60 rounded-2xl p-5 shadow-sm hover:shadow-md transition duration-200">
                <span className="text-[10px] text-slate-500 font-mono block uppercase font-bold">Encours des Capitaux VIP</span>
                <span className="text-xl sm:text-2xl font-bold font-mono text-amber-600 mt-1 block">
                  {(stats.activeInvestmentSum).toLocaleString()} <span className="text-xs font-normal">FCFA</span>
                </span>
                <span className="text-[9px] text-slate-400 font-mono block mt-2">Souscriptions actives de contrats</span>
              </div>

              <div className="bg-white border border-slate-200/60 rounded-2xl p-5 shadow-sm hover:shadow-md transition duration-200">
                <span className="text-[10px] text-slate-500 font-mono block uppercase font-bold">Marge brute plateforme (Estimé)</span>
                <span className="text-xl sm:text-2xl font-bold font-mono text-blue-600 mt-1 block">
                  {(stats.approvedDepositsSum - stats.approvedWithdrawalsSum).toLocaleString()} <span className="text-xs font-normal">FCFA</span>
                </span>
                <span className="text-[9px] text-slate-400 font-mono block mt-2">Fonds théoriques résiduels</span>
              </div>
            </div>

            {/* HIGHLY VISIBLE HORIZONTAL ALERTS GRID */}
            <div className="bg-white border border-slate-200/60 rounded-3xl p-5 space-y-4 shadow-sm">
              <h3 className="text-xs font-bold uppercase text-red-500 tracking-wider">Alertes Opérationnelles Instantanées (Vue Horizontale)</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 font-mono text-center">
                
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex flex-col items-center justify-center">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Inscriptions</span>
                  <span className="text-lg font-bold text-slate-800">{stats.totalUsers} Utilisateurs</span>
                </div>

                <div className="bg-amber-500/5 border border-amber-500/10 rounded-2xl p-4 flex flex-col items-center justify-center animate-pulse">
                  <span className="text-[10px] text-amber-600 uppercase font-bold block mb-1">Dépôts MoMo</span>
                  <span className="text-lg font-bold text-amber-600">{stats.pendingDeposits} Transaction(s)</span>
                </div>

                <div className="bg-red-500/5 border border-red-500/10 rounded-2xl p-4 flex flex-col items-center justify-center">
                  <span className="text-[10px] text-red-500 uppercase font-bold block mb-1">Retraits MoMo</span>
                  <span className="text-lg font-bold text-red-600">{stats.pendingWithdrawals} Demande(s)</span>
                </div>

                <div className="bg-slate-100/60 border border-slate-200/40 rounded-2xl p-4 flex flex-col items-center justify-center">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Blacklistés</span>
                  <span className="text-lg font-bold text-slate-800">{stats.blockedUsers} Bloqués</span>
                </div>

              </div>
            </div>

            {/* Secure guidelines banner */}
            <div className="bg-red-500/5 border border-red-500/10 rounded-2xl p-5 space-y-2 text-xs">
              <h3 className="text-xs font-bold font-mono text-red-500 uppercase">Règles de conformité KYC & AML</h3>
              <p className="text-slate-700 leading-relaxed">
                Avant de valider tout dépôt Mobile Money, vérifiez attentivement le reçu de paiement envoyé par l'investisseur. Assurez-vous que la référence saisie correspond en tout point au message système de l'opérateur (MTN, Orange, WAVE) afin de prévenir tout abus ou double saisie de transaction.
              </p>
              <p className="text-slate-700 leading-relaxed mt-2">
                Les demandes de retrait de plus de 100 000 FCFA nécessitent une double confirmation de l'identité de l'investisseur.
              </p>
            </div>
          </div>
        )}

        {/* 2. User Accounts Management */}
        {activeSegment === "users" && (
          <div className="space-y-6">
            <h2 className="text-base font-bold font-mono text-red-500 uppercase">Fichiers des Investisseurs</h2>

            {/* Barre de Recherche Utilisateur */}
            <div className="bg-white border border-slate-200/60 rounded-3xl p-5 shadow-sm">
              <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                <div className="w-full sm:max-w-md relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-slate-400" />
                  </span>
                  <input
                    type="text"
                    placeholder="Rechercher par nom, WhatsApp (+229...), code de parrainage..."
                    value={userSearchTerm}
                    onChange={(e) => setUserSearchTerm(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200/80 pl-10 pr-8 py-2.5 rounded-2xl text-xs text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-red-400 focus:border-red-400 font-medium"
                  />
                  {userSearchTerm && (
                    <button
                      onClick={() => setUserSearchTerm("")}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-red-500 font-bold text-[10px] uppercase font-mono cursor-pointer"
                    >
                      Effacer
                    </button>
                  )}
                </div>
                <div className="text-xs font-mono text-slate-500 flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded bg-red-50 text-red-600 font-bold border border-red-100">
                    {filteredUsers.length} trouvé(s)
                  </span>
                  <span>sur {users.length} au total</span>
                </div>
              </div>
            </div>
 
             {/* Ajuster un solde en direct drawer modal popup configuration */}
             {selectedUser && (
               <div className="bg-white/5 border border-amber-500/30 rounded-2xl p-5 space-y-3">
                 <div className="flex justify-between items-center">
                   <h3 className="text-xs font-bold font-mono text-amber-400 uppercase">Ajustement exceptionnel de solde : {selectedUser.name}</h3>
                   <button onClick={() => setSelectedUser(null)} className="text-gray-400 hover:text-white uppercase text-[10px] font-mono">Fermer [X]</button>
                 </div>
                 <form onSubmit={handleAddBalanceSubmit} className="flex gap-3 items-end max-w-sm">
                   <div className="flex-grow">
                     <label className="block text-[10px] text-gray-400 font-mono mb-1">Entrer le montant (FCFA) à ajouter</label>
                     <input 
                       type="number"
                       placeholder="Ex: 5000 ou -2000"
                       value={adjustmentAmt}
                       onChange={(e) => setAdjustmentAmt(e.target.value)}
                       className="w-full bg-[#03061A] border border-white/10 rounded-xl py-2 px-3 text-xs focus:border-red-400 outline-none font-mono"
                       required
                     />
                   </div>
                   <button type="submit" className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-black font-semibold text-xs rounded-xl">
                     Soumettre modification
                   </button>
                 </form>
               </div>
             )}
 
             <div className="overflow-x-auto bg-white/5 rounded-2xl border border-white/5">
               <table className="w-full text-left border-collapse text-xs">
                 <thead>
                   <tr className="border-b border-white/10 uppercase font-mono text-gray-400 bg-white/5">
                     <th className="p-4">WhatsApp / Pays</th>
                     <th className="p-4">Nom et Prénom</th>
                     <th className="p-4">Solde Actualisé</th>
                     <th className="p-4">Dépôts / Retraits</th>
                     <th className="p-4">Plans / MLM</th>
                     <th className="p-4">Statut</th>
                     <th className="p-4 text-right">Actions de Modération</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-white/5">
                   {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-500 font-mono text-xs">
                        ⚠️ Aucun investisseur trouvé pour "{userSearchTerm}"
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map(u => (
                      <tr key={u.id} className="hover:bg-white/5/30">
                        <td className="p-4 font-mono">
                          <span className="block font-semibold text-slate-800">{u.whatsapp}</span>
                          <span className="block text-[10px] text-gray-400">{u.country}</span>
                        </td>
                        <td className="p-4 font-medium text-slate-800">
                          <span className="block font-semibold text-slate-800">
                            {u.name}
                            {u.isAdmin && (
                              <span className="ml-1.5 px-1.5 py-0.5 bg-rose-500/10 text-rose-600 border border-rose-550/20 text-[9px] uppercase font-bold rounded font-mono" title="Administrateur">
                                ADMIN ⭐
                              </span>
                            )}
                          </span>
                          {editingPassUserId === u.id ? (
                            <form 
                              onSubmit={(e) => handleUpdatePasswordSubmit(e, u.id)}
                              className="flex items-center gap-1 mt-1"
                            >
                              <input
                                type="text"
                                value={editPassVal}
                                onChange={(e) => setEditPassVal(e.target.value)}
                                className="w-28 bg-slate-100 border border-slate-300 text-xs px-1.5 py-0.5 rounded font-mono text-slate-800 focus:outline-none"
                                placeholder="Nouv. MDP"
                                required
                              />
                              <button 
                                type="submit"
                                className="px-1.5 py-0.5 bg-emerald-600 text-white rounded text-[10px] font-bold cursor-pointer hover:bg-emerald-700"
                              >
                                OK
                              </button>
                              <button 
                                type="button"
                                onClick={() => setEditingPassUserId(null)}
                                className="px-1.5 py-0.5 bg-slate-200 text-slate-700 rounded text-[10px] font-bold cursor-pointer hover:bg-slate-300"
                              >
                                X
                              </button>
                            </form>
                          ) : (
                            <div className="flex items-center gap-1 mt-1">
                              <span className="text-[10px] text-gray-400 font-mono text-[10px]">MDP : <strong className="text-slate-800">{u.passwordHash}</strong></span>
                              <button
                                onClick={() => {
                                  setEditingPassUserId(u.id);
                                  setEditPassVal(u.passwordHash);
                                }}
                                className="text-red-500 hover:text-red-700 text-[10px] underline cursor-pointer"
                                title="Modifier le mot de passe"
                              >
                                [Modifier]
                              </button>
                            </div>
                          )}
                        </td>
                        <td className="p-4 font-mono font-semibold text-amber-500">{u.balance.toLocaleString()} F</td>
                        <td className="p-4 font-mono">
                          <span className="block text-emerald-400">+{u.totalDeposits.toLocaleString()} F</span>
                          <span className="block text-rose-400">-{u.totalWithdrawals.toLocaleString()} F</span>
                        </td>
                        <td className="p-4 font-mono text-slate-705">
                          <span className="block text-slate-800">VIPs : {u.totalInvCount} ({u.totalInvAmount.toLocaleString()} F)</span>
                          {editingCodeUserId === u.id ? (
                            <form 
                              onSubmit={(e) => handleUpdateCodeSubmit(e, u.id)}
                              className="flex items-center gap-1 mt-1"
                            >
                              <input
                                type="text"
                                value={editCodeVal}
                                onChange={(e) => setEditCodeVal(e.target.value)}
                                className="w-24 bg-slate-100 border border-slate-300 text-xs px-1.5 py-0.5 rounded font-mono text-slate-800 focus:outline-none"
                                placeholder="CODE"
                                maxLength={12}
                                required
                              />
                              <button 
                                type="submit"
                                className="px-1.5 py-0.5 bg-emerald-600 text-white rounded text-[10px] font-bold cursor-pointer hover:bg-emerald-700"
                              >
                                OK
                              </button>
                              <button 
                                type="button"
                                onClick={() => setEditingCodeUserId(null)}
                                className="px-1.5 py-0.5 bg-slate-200 text-slate-700 rounded text-[10px] font-bold cursor-pointer hover:bg-slate-300"
                              >
                                X
                              </button>
                            </form>
                          ) : (
                            <div className="flex items-center gap-1 mt-1">
                              <span className="text-[10px] text-gray-400 font-mono">Code : <strong className="text-slate-800">{u.referralCode}</strong></span>
                              <button
                                onClick={() => {
                                  setEditingCodeUserId(u.id);
                                  setEditCodeVal(u.referralCode);
                                }}
                                className="text-red-500 hover:text-red-700 text-[10px] underline cursor-pointer"
                                title="Modifier le code parrain"
                              >
                                [Modifier]
                              </button>
                            </div>
                          )}
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${u.status === "blocked" ? "bg-red-500/10 text-red-500" : "bg-emerald-500/10 text-emerald-600"}`}>
                            {u.status === "blocked" ? "Bloqué" : "Actif"}
                          </span>
                        </td>
                        <td className="p-4 text-right space-x-2 font-mono">
                          <button
                            onClick={() => setSelectedUser(u)}
                            className="px-2 py-1 bg-amber-500/10 hover:bg-amber-500 hover:text-black border border-amber-500/20 text-[#FF7800] text-[10px] rounded transition cursor-pointer font-bold animate-pulse-subtle"
                            title="Ajustement exceptionnel du solde principal de cet utilisateur"
                          >
                            Ajuster Solde 🪙
                          </button>

                          <button
                            onClick={() => handleSimulate24h(u.id)}
                            className="px-2 py-1 bg-sky-500/15 hover:bg-sky-500 hover:text-white border border-sky-500/20 text-[#02A3FC] text-[10px] rounded font-bold transition cursor-pointer"
                          >
                            Simuler +24h ⚡
                          </button>

                          <button
                            onClick={() => handleToggleBlockUser(u.id, u.status)}
                            className={`px-2 py-1 text-[10px] rounded transition ${
                              u.status === "blocked" 
                                ? "bg-emerald-500/15 hover:bg-emerald-600 hover:text-white text-emerald-600 border border-emerald-500/20 cursor-pointer font-bold" 
                                : "bg-red-500/15 hover:bg-red-650 hover:text-white text-red-650 border border-red-500/20 cursor-pointer font-bold"
                            }`}
                          >
                            {u.status === "blocked" ? "Débloquer" : "Bloquer"}
                          </button>

                          <button
                            onClick={() => handleToggleAdmin(u.id, !!u.isAdmin)}
                            className={`px-2 py-1 text-[10px] rounded transition font-bold border cursor-pointer ${
                              u.isAdmin
                                ? "bg-[#330033]/30 hover:bg-[#A300A3] hover:text-white text-[#E42AE4] border-[#E42AE4]/25"
                                : "bg-teal-500/15 hover:bg-teal-600 hover:text-white text-teal-500 border-teal-500/20"
                            }`}
                          >
                            {u.isAdmin ? "Retirer Admin 🛡️" : "Nommer Admin 👑"}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 3. Dépôts verification logs */}
        {activeSegment === "deposits" && (
          <div className="space-y-6">
            <h2 className="text-base font-bold font-mono text-red-400 uppercase">Validation des dépôts Mobile Money</h2>

            {deposits.length === 0 ? (
              <p className="text-xs text-gray-400">Aucun dépôt Mobile money soumis pour examen.</p>
            ) : (
              <div className="space-y-4">
                {deposits.map(d => {
                  const isPending = d.status === "pending";
                  return (
                    <div 
                      key={d.id} 
                      className={`border rounded-2xl p-5 grid md:grid-cols-3 gap-6 items-center ${
                        d.status === "approved" ? "bg-emerald-950/20 border-emerald-500/20" :
                        d.status === "rejected" ? "bg-rose-950/20 border-rose-500/20" : "bg-white/5 border-white/5 hover:border-amber-500/20"
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex gap-2 items-center">
                          <span className="text-xs font-mono font-bold text-white block uppercase">{d.userName}</span>
                          <span className="block text-[10px] text-gray-400 font-mono">({d.whatsapp})</span>
                        </div>
                        <p className="text-lg font-bold font-mono tracking-tight text-white">{d.amount.toLocaleString()} FCFA</p>
                        <span className="block text-[11px] font-mono text-[#FBBF24]">Réseau : {d.provider}</span>
                        <span className="block text-[11px] font-mono text-gray-400">Soumis le : {new Date(d.date).toLocaleString()}</span>
                      </div>

                      <div className="space-y-2">
                        <span className="text-[10px] text-gray-400 block uppercase font-mono">Preuve & Référence Saisie :</span>
                        <p className="text-xs font-mono font-bold text-white bg-[#03061A] p-2 rounded border border-white/5 select-all">
                          REF: {d.reference}
                        </p>
                        
                        {/* Download / view upload capture block */}
                        {d.paymentCapture ? (
                          <div className="pt-2">
                            <span className="text-[9px] text-gray-400 block uppercase font-mono">Capture Reçu Upload :</span>
                            <a 
                              href={d.paymentCapture} 
                              download={`receipt-${d.id}.png`}
                              className="text-[10px] text-amber-500 hover:underline inline-flex items-center gap-1 font-mono mt-1"
                            >
                              Télécharger le reçu de paiement 📥
                            </a>
                            <details className="mt-1">
                              <summary className="text-[9px] text-[#FBBF24]/70 hover:underline cursor-pointer font-mono outline-none">Afficher l'image incluse</summary>
                              <img 
                                referrerPolicy="no-referrer"
                                src={d.paymentCapture} 
                                alt="Capture d'écran du reçu" 
                                className="max-w-44 border border-white/10 rounded-md mt-1 object-scale-down bg-black/60 max-h-44" 
                              />
                            </details>
                          </div>
                        ) : (
                          <span className="text-[10px] text-gray-500 italic block mt-1">Aucune image téléversée</span>
                        )}
                      </div>

                      <div className="md:text-right space-x-2 font-mono">
                        {isPending ? (
                          <>
                            <button
                              onClick={() => handleProcessDeposit(d.id, "reject")}
                              className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500 hover:text-black border border-rose-500/20 text-rose-400 rounded-xl text-xs font-medium transition"
                            >
                              Rejeter ❌
                            </button>
                            <button
                              onClick={() => handleProcessDeposit(d.id, "approve")}
                              className="px-4 py-1.5 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-black font-bold rounded-xl text-xs transition shadow-lg shadow-emerald-500/10"
                            >
                              Approuver & Créditer ✅
                            </button>
                          </>
                        ) : (
                          <span className={`px-3 py-1 rounded text-xs font-bold uppercase inline-block ${
                            d.status === "approved" ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"
                          }`}>
                            {d.status === "approved" ? "Validé avec succès" : "Dépôt Rejeté"}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* 4. Retraits checkout queues */}
        {activeSegment === "withdrawals" && (
          <div className="space-y-6">
            <h2 className="text-base font-bold font-mono text-red-400 uppercase">Traitement des demandes de retraits</h2>

            {withdrawals.length === 0 ? (
              <p className="text-xs text-gray-400">Aucune demande de retrait d'argent déposée.</p>
            ) : (
              <div className="space-y-4">
                {withdrawals.map(w => {
                  const isPending = w.status === "pending";
                  return (
                    <div 
                      key={w.id} 
                      className={`border rounded-2xl p-5 grid md:grid-cols-3 gap-6 items-center ${
                        w.status === "approved" ? "bg-emerald-950/20 border-emerald-500/20" :
                        w.status === "rejected" ? "bg-rose-950/20 border-rose-500/20" : "bg-white/5 border-white/5 hover:border-amber-500/20"
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex gap-2 items-center">
                          <span className="text-xs font-mono font-bold text-white uppercase block">{w.userName}</span>
                          <span className="block text-[10px] text-gray-400 font-mono">({w.id})</span>
                        </div>
                        <p className="text-lg font-bold font-mono tracking-tight text-white">{w.amount.toLocaleString()} FCFA</p>
                        <span className="block text-[11px] font-mono text-[#FBBF24]">Méthode Mobile : {w.provider}</span>
                        <span className="block text-[11px] font-mono text-gray-400">Demandé le : {new Date(w.date).toLocaleString()}</span>
                      </div>

                      <div className="space-y-2 font-mono text-xs text-gray-300">
                        <span className="text-[10px] text-gray-500 block uppercase">Numéro de Transfert Envoi :</span>
                        <p className="font-bold text-white select-all bg-[#03061A] p-2 rounded border border-white/5">
                          {w.whatsapp}
                        </p>
                        <span className="text-[10px] text-rose-400 block font-semibold">
                          Solde résiduel du compte : {w.userBalance?.toLocaleString()} F
                        </span>
                      </div>

                      <div className="md:text-right space-x-2 font-mono">
                        {isPending ? (
                          <>
                            <button
                              onClick={() => handleProcessWithdrawal(w.id, "reject")}
                              className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500 hover:text-black border border-rose-500/20 text-rose-400 rounded-xl text-xs font-medium transition"
                            >
                              Refuser & Rembourser ❌
                            </button>
                            <button
                              onClick={() => handleProcessWithdrawal(w.id, "approve")}
                              className="px-4 py-1.5 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-black font-bold rounded-xl text-xs transition shadow-lg shadow-emerald-500/10"
                            >
                              Marquer Payé (MoMo) ✅
                            </button>
                          </>
                        ) : (
                          <span className={`px-3 py-1 rounded text-xs font-bold uppercase inline-block ${
                            w.status === "approved" ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"
                          }`}>
                            {w.status === "approved" ? "Payé & Expédié" : "Retrait Refusé & Remboursé"}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* 5. Manage products Plans VIP */}
        {activeSegment === "products" && (
          <div className="space-y-6">
            <h2 className="text-base font-bold font-mono text-red-400 uppercase">Configuration de l'offre des produits d'investissement VIP</h2>

            {/* Create new product type card */}
            <div className="bg-white/5 border border-white/5 rounded-2xl p-5">
              <h3 className="text-xs font-bold font-mono text-white mb-4 uppercase">Ajouter un nouveau Plan d'Investissement VIP</h3>
              
              <form onSubmit={handleCreateProductSubmit} className="grid sm:grid-cols-5 gap-4 items-end">
                <div>
                  <label className="block text-[10px] font-mono text-gray-400 mb-1">Nom du Plan VIP</label>
                  <input
                    type="text"
                    placeholder="Ex: VIP 1 Starter"
                    value={newProdName}
                    onChange={(e) => setNewProdName(e.target.value)}
                    className="w-full bg-[#03061A] border border-white/10 rounded-xl py-2 px-3 text-xs focus:border-red-400 outline-none font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-gray-400 mb-1">Prix (FCFA)</label>
                  <input
                    type="number"
                    placeholder="Ex: 3000"
                    value={newProdPrice}
                    onChange={(e) => setNewProdPrice(e.target.value)}
                    className="w-full bg-[#03061A] border border-white/10 rounded-xl py-2 px-3 text-xs focus:border-red-400 outline-none font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-gray-400 mb-1">Revenu journalier (FCFA)</label>
                  <input
                    type="number"
                    placeholder="Ex: 600"
                    value={newProdReturn}
                    onChange={(e) => setNewProdReturn(e.target.value)}
                    className="w-full bg-[#03061A] border border-white/10 rounded-xl py-2 px-3 text-xs focus:border-red-400 outline-none font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-gray-400 mb-1">Badge (Optionnel)</label>
                  <input
                    type="text"
                    placeholder="Ex: Populaire / PRO"
                    value={newProdBadge}
                    onChange={(e) => setNewProdBadge(e.target.value)}
                    className="w-full bg-[#03061A] border border-white/10 rounded-xl py-2 px-3 text-xs focus:border-red-400 outline-none font-mono"
                  />
                </div>

                <button 
                  type="submit" 
                  className="py-2 px-4 rounded-xl bg-red-500 hover:bg-red-600 text-white font-semibold text-xs font-mono flex items-center justify-center gap-1 tracking-wider uppercase h-10 w-full"
                >
                  <PlusSquare className="w-4 h-4" />
                  <span>Enregistrer</span>
                </button>
              </form>
            </div>

            {/* Existing products listing */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {products.map(prod => (
                <div key={prod.id} className="bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col justify-between hover:border-red-500/20 transition">
                  {editingProductId === prod.id ? (
                    <form onSubmit={(e) => handleUpdateProductSubmit(e, prod.id)} className="space-y-3 font-mono text-xs text-slate-200">
                      <div>
                        <label className="block text-[10px] text-gray-400 mb-1">Nom du Plan :</label>
                        <input
                          type="text"
                          value={editProdName}
                          onChange={(e) => setEditProdName(e.target.value)}
                          className="w-full bg-[#03061A] border border-white/10 rounded-xl py-1.5 px-3 text-xs focus:border-red-400 outline-none"
                          required
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] text-gray-400 mb-1">Prix (FCFA) :</label>
                          <input
                            type="number"
                            value={editProdPrice}
                            onChange={(e) => setEditProdPrice(e.target.value)}
                            className="w-full bg-[#03061A] border border-white/10 rounded-xl py-1.5 px-3 text-xs focus:border-red-400 outline-none"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] text-gray-400 mb-1">Gains / jour :</label>
                          <input
                            type="number"
                            value={editProdReturn}
                            onChange={(e) => setEditProdReturn(e.target.value)}
                            className="w-full bg-[#03061A] border border-white/10 rounded-xl py-1.5 px-3 text-xs focus:border-red-400 outline-none"
                            required
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] text-gray-400 mb-1">Durée (jours) :</label>
                          <input
                            type="number"
                            value={editProdDuration}
                            onChange={(e) => setEditProdDuration(e.target.value)}
                            className="w-full bg-[#03061A] border border-white/10 rounded-xl py-1.5 px-3 text-xs focus:border-red-400 outline-none"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] text-gray-400 mb-1">Badge :</label>
                          <input
                            type="text"
                            value={editProdBadge}
                            onChange={(e) => setEditProdBadge(e.target.value)}
                            className="w-full bg-[#03061A] border border-white/10 rounded-xl py-1.5 px-3 text-xs focus:border-red-400 outline-none"
                            placeholder="VIP STANDARD"
                          />
                        </div>
                      </div>
                      <div className="flex gap-2 pt-2 text-xs">
                        <button
                          type="submit"
                          className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold cursor-pointer transition"
                        >
                          Enregistrer
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingProductId(null)}
                          className="w-full py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold cursor-pointer transition"
                        >
                          Annuler
                        </button>
                      </div>
                    </form>
                  ) : (
                    <>
                      <div>
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-bold text-white uppercase font-sans tracking-wide">{prod.name}</h4>
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-red-500/10 text-red-400">
                            {prod.badge || "VIP STANDARD"}
                          </span>
                        </div>

                        <div className="h-0.5 w-8 bg-red-500 mb-4"></div>

                        <div className="space-y-2 font-mono text-xs text-gray-300">
                          <div className="flex justify-between">
                            <span>Prix plan :</span>
                            <span className="font-bold text-[#FBBF24]">{prod.price.toLocaleString()} FCFA</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Gains / jour :</span>
                            <span className="font-bold text-emerald-400">+{prod.dailyReturn} F</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Durée plan :</span>
                            <span>{prod.durationDays} Jours</span>
                          </div>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-white/5 mt-4 flex justify-between items-center text-xs font-mono">
                        <div>
                          <span className="block text-[10px] text-gray-500 font-mono">Rendement total :</span>
                          <span className="font-semibold text-emerald-400">{prod.totalReturn.toLocaleString()} F</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setEditingProductId(prod.id);
                              setEditProdName(prod.name);
                              setEditProdPrice(prod.price.toString());
                              setEditProdReturn(prod.dailyReturn.toString());
                              setEditProdDuration(prod.durationDays.toString());
                              setEditProdBadge(prod.badge || "");
                            }}
                            className="p-2 rounded-lg bg-yellow-500/10 hover:bg-yellow-500 text-yellow-400 hover:text-black border border-yellow-500/15 transition"
                            title="Modifier ce produit"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(prod.id)}
                            className="p-2 rounded-lg bg-red-500/10 hover:bg-red-600 text-red-400 hover:text-black border border-red-500/15 transition"
                            title="Supprimer ce produit"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 6. Alerts global alarms and voucher bonus code creation */}
        {activeSegment === "bonus" && (
          <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              
              {/* Diffuser global notification block */}
              <div className="bg-[#090D2A] border border-white/5 rounded-2xl p-5 space-y-4">
                <h3 className="text-xs font-bold font-mono text-red-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Megaphone className="w-4 h-4" /> Diffusion d'Alerte Globale
                </h3>
                
                <form onSubmit={handleGlobalNotificationSubmit} className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-mono text-gray-400 mb-1">Titre de l'Annonce</label>
                    <input
                      type="text"
                      placeholder="Ex: Maintenance système MTN MoMo ou Bonus Événement !"
                      value={globalNotifTitle}
                      onChange={(e) => setGlobalNotifTitle(e.target.value)}
                      className="w-full bg-[#03061A] border border-white/10 rounded-xl py-2 px-3 text-xs focus:border-red-400 outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono text-gray-400 mb-1">Contenu de l'Annonce</label>
                    <textarea
                      placeholder="Message détaillé qui s'affichera dans la section Infos en direct de tous les investisseurs"
                      value={globalNotifMessage}
                      onChange={(e) => setGlobalNotifMessage(e.target.value)}
                      className="w-full bg-[#03061A] border border-white/10 rounded-xl py-2 px-3 text-xs focus:border-red-400 outline-none h-24 resize-none"
                      required
                    ></textarea>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-semibold text-xs transition font-mono uppercase tracking-wider"
                  >
                    Envoyer Alerte Générale
                  </button>
                </form>
              </div>

              {/* Generate new voucher gift card code */}
              <div className="bg-[#090D2A] border border-white/5 rounded-2xl p-5 space-y-4">
                <h3 className="text-xs font-bold font-mono text-red-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Gift className="w-4 h-4" /> Génération de Voucher Bonus
                </h3>

                <form onSubmit={handleCreateBonusCode} className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-mono text-gray-400 mb-1">Code Promo Unique (En majuscules)</label>
                    <input
                      type="text"
                      placeholder="Ex: CADEAU5000"
                      value={newBonusCode}
                      onChange={(e) => setNewBonusCode(e.target.value.toUpperCase())}
                      className="w-full bg-[#03061A] border border-white/10 rounded-xl py-2 px-3 text-xs focus:border-red-400 outline-none font-mono"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono text-gray-400 mb-1">Montant du Bonus à créditer (FCFA)</label>
                    <input
                      type="number"
                      placeholder="Ex: 500"
                      value={newBonusAmount}
                      onChange={(e) => setNewBonusAmount(e.target.value)}
                      className="w-full bg-[#03061A] border border-white/10 rounded-xl py-2 px-3 text-xs focus:border-red-400 outline-none font-mono"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono text-gray-400 mb-1">Limite du nombre d'utilisateurs (Optionnel)</label>
                    <input
                      type="number"
                      placeholder="Ex: 50 (Laisser vide pour illimité)"
                      value={newBonusLimit}
                      onChange={(e) => setNewBonusLimit(e.target.value)}
                      className="w-full bg-[#03061A] border border-white/10 rounded-xl py-2 px-3 text-xs focus:border-red-400 outline-none font-mono"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl bg-red-500 hover:bg-red-650 text-white font-semibold text-xs transition font-mono uppercase tracking-wider"
                  >
                    Générer le Code Cadeau
                  </button>
                </form>
              </div>

              {/* Configuration Support Links (Casque Bleue) */}
              <div className="bg-[#090D2A] border border-white/5 rounded-2xl p-5 space-y-4">
                <h3 className="text-xs font-bold font-mono text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-blue-400" /> Configurations Casque Bleue
                </h3>

                <form onSubmit={handleUpdateSettings} className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-mono text-gray-400 mb-1">Lien du Groupe WhatsApp d'assistance</label>
                    <input
                      type="url"
                      placeholder="https://chat.whatsapp.com/..."
                      value={adminWhatsappGroupLink}
                      onChange={(e) => setAdminWhatsappGroupLink(e.target.value)}
                      className="w-full bg-[#03061A] border border-white/10 rounded-xl py-2 px-3 text-xs focus:border-blue-400 outline-none font-mono"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono text-gray-400 mb-1">Lien du Canal Telegram officiel</label>
                    <input
                      type="url"
                      placeholder="https://t.me/..."
                      value={adminTelegramChannelLink}
                      onChange={(e) => setAdminTelegramChannelLink(e.target.value)}
                      className="w-full bg-[#03061A] border border-white/10 rounded-xl py-2 px-3 text-xs focus:border-blue-400 outline-none font-mono"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition font-mono uppercase tracking-wider cursor-pointer"
                  >
                    Enregistrer les Liens
                  </button>
                </form>
              </div>

            </div>

            {/* List active generated voucher coupons */}
            <div className="bg-white/5 border border-white/5 rounded-2xl p-4 space-y-3">
              <h3 className="text-xs font-bold font-mono text-white uppercase tracking-widest pb-2 border-b border-white/5">Vouchers & Codes Cadeaux actifs ({bonusCodes.length})</h3>
              {bonusCodes.length === 0 ? (
                <p className="text-xs text-gray-500">Aucun code bonus actif configuré.</p>
              ) : (
                <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3 font-mono text-xs">
                  {bonusCodes.map((b, idx) => {
                    const isExhausted = b.usageLimit && b.claimedBy.length >= b.usageLimit;
                    return (
                      <div key={idx} className={`p-3 border rounded-xl flex justify-between items-center transition ${
                        isExhausted 
                          ? "bg-red-500/5 border-red-500/20 opacity-60" 
                          : "bg-white/5 border-white/5 hover:border-white/10"
                      }`}>
                        <div>
                          <span className={`font-bold block ${isExhausted ? "text-slate-400 line-through" : "text-white"}`}>{b.code}</span>
                          <span className="text-[10px] text-emerald-400">+{b.amount.toLocaleString()} FCFA</span>
                        </div>
                        <div className="text-right">
                          <span className="block text-[9px] text-gray-400">
                            Réclamations : <strong className="text-white">{b.claimedBy.length}</strong> / {b.usageLimit ? <strong>{b.usageLimit}</strong> : "∞"}
                          </span>
                          {isExhausted && (
                            <span className="inline-block text-[8px] bg-red-500/20 text-red-400 px-1 py-0.2 rounded font-bold uppercase mt-1">
                              Épuisé ⚠️
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 7. Chat Support replies center */}
        {activeSegment === "chat" && (
          <div className="space-y-6">
            <h2 className="text-base font-bold font-mono text-red-400 uppercase">Support en direct et de conciliation</h2>

            <div className="grid md:grid-cols-3 gap-6">
              
              {/* Conversations sidebar list */}
              <div className="bg-white/5 border border-white/5 rounded-2xl p-4 space-y-3 h-[450px] overflow-y-auto">
                <h3 className="text-xs font-bold font-mono text-white uppercase tracking-wider pb-2 border-b border-white/5">
                  Fils de discussion actifs
                </h3>

                {chats.length === 0 ? (
                  <p className="text-xs text-gray-500 italic">Aucune conversation d'aide en cours.</p>
                ) : (
                  <div className="space-y-2">
                    {chats.map(chat => {
                      const isSelected = activeChatUserId === chat.userId;
                      return (
                        <button
                          key={chat.userId}
                          onClick={() => selectConversation(chat.userId, chat.userName)}
                          className={`w-full text-left p-3 rounded-xl transition ${
                            isSelected ? 'bg-red-500/20 border-red-500/45 border' : 'bg-white/5 border border-white/5 hover:bg-white/10'
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <span className="text-xs font-bold text-white block font-mono truncate max-w-[120px]">{chat.userName}</span>
                            <span className="text-[8px] text-gray-400 font-mono">
                              {new Date(chat.lastMessageDate).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-[10px] text-gray-300 truncate mt-1">{chat.lastMessage}</p>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Chat pool and writing reply */}
              <div className="bg-[#090D2A] border border-white/5 rounded-2xl p-4 md:col-span-2 flex flex-col h-[450px] justify-between">
                {activeChatUserId ? (
                  <>
                    <div className="border-b border-white/10 pb-3">
                      <span className="text-xs font-mono font-bold text-red-400 uppercase tracking-widest block">Conversation d'Assistance</span>
                      <h3 className="text-sm font-bold text-white">{activeChatUserName}</h3>
                    </div>

                    <div className="flex-grow overflow-y-auto py-3 space-y-3 px-2">
                      {activeChatHistory.map(msg => {
                        const isSelf = msg.sender === "admin";
                        return (
                          <div key={msg.id} className={`flex ${isSelf ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[75%] rounded-xl px-3 py-2 text-xs ${
                              isSelf ? 'bg-red-500/20 text-white border border-red-500/15' : 'bg-white/5 border border-white/10 text-white'
                            }`}>
                              <p className="leading-relaxed whitespace-pre-wrap">{msg.message}</p>
                              <span className="block text-[8px] text-gray-400 mt-1 text-right font-mono">
                                {new Date(msg.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <form onSubmit={handleAdminChatSend} className="flex gap-2 pt-2 border-t border-white/15">
                      <input
                        type="text"
                        placeholder={`Répondez à ${activeChatUserName}...`}
                        value={adminChatReply}
                        onChange={(e) => setAdminChatReply(e.target.value)}
                        className="flex-grow bg-[#03061A] border border-white/10 rounded-xl px-3 py-2 text-xs focus:border-red-400 outline-none"
                      />
                      <button
                        type="submit"
                        className="px-5 py-2 bg-red-500 hover:bg-red-600 text-white font-bold text-xs rounded-xl"
                      >
                        Répondre
                      </button>
                    </form>
                  </>
                ) : (
                  <div className="flex flex-col justify-center items-center h-full text-center text-gray-500 text-xs text-light space-y-2">
                    <MessageSquare className="w-8 h-8 text-white/10" />
                    <p>Sélectionnez un fil de discussion dans la colonne de gauche pour rédiger une assistance.</p>
                  </div>
                )}
              </div>

            </div>
          </div>
        )}

      </div>

      {/* Dialogue de confirmation personnalisé (iframe-safe) */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#090D2A] border border-white/10 w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-start gap-4">
              <div className="p-2.5 bg-amber-500/10 rounded-xl text-amber-500 shrink-0">
                <span className="text-lg">⚠️</span>
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider">{confirmModal.title}</h3>
                <p className="text-xs text-slate-300 leading-relaxed">{confirmModal.message}</p>
              </div>
            </div>
            
            <div className="flex justify-end gap-3 pt-2 font-mono text-xs">
              <button
                type="button"
                onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl transition cursor-pointer font-medium"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={confirmModal.onConfirm}
                className="px-5 py-2 bg-yellow-500 hover:bg-yellow-600 text-black rounded-xl transition cursor-pointer font-bold"
              >
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
