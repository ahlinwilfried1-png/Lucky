import React, { useEffect, useState } from "react";
import { 
  TrendingUp, 
  ShieldCheck, 
  Users, 
  ArrowUpRight, 
  ArrowDownLeft, 
  UsersRound, 
  Layers, 
  ChevronDown, 
  ChevronUp, 
  Globe2, 
  Gem, 
  Wallet2, 
  Activity 
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { fetchPlatformStats } from "../api";

interface HomeViewProps {
  onNavigate: (view: "home" | "login" | "register" | "dashboard" | "admin") => void;
  lang: "fr" | "en";
  setLang: (lang: "fr" | "en") => void;
}

export default function HomeView({ onNavigate, lang, setLang }: HomeViewProps) {
  const [stats, setStats] = useState({
    usersCount: 4239,
    totalDeposits: 48430000,
    totalWithdrawals: 19280000,
    onlineCount: 145,
    revenuesGenerated: 21540000,
    ticker: [] as Array<{ name: string; city: string; amount: string; type: string }>
  });

  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<"about" | "security">("about");

  const [tickerIndex, setTickerIndex] = useState(0);

  // Load backend stats
  useEffect(() => {
    fetchPlatformStats().then(data => {
      setStats(data);
    }).catch(err => {
      console.warn("Could not load backend stats, using defaults.", err);
    });

    const interval = setInterval(() => {
      // Simulate real-time ticking
      setStats(prev => ({
        ...prev,
        onlineCount: prev.onlineCount + (Math.random() > 0.5 ? 1 : -1) * Math.floor(Math.random() * 3),
        revenuesGenerated: prev.revenuesGenerated + Math.floor(Math.random() * 1200)
      }));
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  // Cycle through ticker array for live profit simulation
  useEffect(() => {
    if (stats.ticker.length > 0) {
      const interval = setInterval(() => {
        setTickerIndex(prev => (prev + 1) % stats.ticker.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [stats.ticker]);

  // Language dictionary 
  const dict = {
    fr: {
      heroTitle: "L'Investissement Intelligent Re-déclaré",
      heroSub: "Rejoignez une plateforme d'investissement ultra-sécu. Obtenez jusqu'à 30% d'intérêts quotidiens garantis.",
      btnEnter: "Créer un Compte",
      btnLogin: "Se Connecter",
      statsOnline: "Investisseurs en ligne",
      statsUsers: "Utilisateurs Actifs",
      statsDeposits: "Total des Dépôts",
      statsWithdrawals: "Total des Retraits",
      statsRevenues: "Gains Générés",
      plansTitle: "Nos Plans VIP d'Élite",
      plansSub: "Souscrivez à l'un de nos VIP et commencez à générer des revenus en direct toutes les 24 heures.",
      testiTitle: "Ce qu'ils disent d'Investa",
      faqTitle: "Foire Aux Questions",
      liveGain: "Dernières transactions en direct",
      langText: "English",
      aboutTitle: "À Propos d'Investa",
      aboutText: "Leader mondial de la technologie fintech, Investa Premium démocratise l'accès à l'investissement et aux rendements d'élite en Afrique subsaharienne. Grâce au Mobile Money, déposez et retirez en toute confiance sans frais cachés.",
      securityText: "Sécurité intégrale de bout en bout. Cryptage complet de vos données sensibles de paiement, serveurs hautement tolérants aux pannes, processus de vérification humaine ultra réactif.",
      readMore: "En savoir plus",
      vip1: "VIP 1 Bronze",
      vip2: "VIP 2 Silver",
      price: "Prix",
      daily: "Gains / Jour",
      duration: "Durée",
      totalGain: "Revenus Totaux",
      investBtn: "Investir maintenant",
      rights: "Tous droits réservés."
    },
    en: {
      heroTitle: "Smart Investment Re-defined",
      heroSub: "Join a highly secured investment platform. Secure up to 30% guaranteed daily return on your plans.",
      btnEnter: "Create Account",
      btnLogin: "Sign In",
      statsOnline: "Investors Online",
      statsUsers: "Active Users",
      statsDeposits: "Total Deposits",
      statsWithdrawals: "Total Withdrawals",
      statsRevenues: "Revenues Generated",
      plansTitle: "Our Elite VIP Plans",
      plansSub: "Subscribe to any VIP level and start generating real-time payouts every 24 hours.",
      testiTitle: "What They Say About Investa",
      faqTitle: "Frequently Asked Questions",
      liveGain: "Latest live transactions",
      langText: "Français",
      aboutTitle: "About Investa",
      aboutText: "A world leader in fintech solutions, Investa Premium simplifies micro-investments in Sub-Saharan Africa. Leverage standard Mobile Money to deposit and withdraw securely with zero hidden fees.",
      securityText: "Uncompromising end-to-end security. Highly robust custom server architecture, full JWT data isolation, and human-verified immediate transaction system.",
      readMore: "Discover More",
      vip1: "VIP 1 Bronze",
      vip2: "VIP 2 Silver",
      price: "Price",
      daily: "Daily Return",
      duration: "Duration",
      totalGain: "Total Return",
      investBtn: "Invest Now",
      rights: "All rights reserved."
    }
  };

  const t = dict[lang];

  const plansShow = [
    { name: "VIP 1 - Bronze Starter", price: "3 000 FCFA", daily: "600 FCFA", duration: "10 jours", total: "6 000 FCFA", bg: "from-blue-900/40 to-indigo-950/40" },
    { name: "VIP 2 - Silver Yield", price: "10 000 FCFA", daily: "2 500 FCFA", duration: "10 jours", total: "25 000 FCFA", bg: "from-slate-900/40 to-zinc-950/40" },
    { name: "VIP 3 - Gold Premium", price: "25 000 FCFA", daily: "6 500 FCFA", duration: "10 jours", total: "65 000 FCFA", bg: "from-amber-950/40 to-yellow-950/40" }
  ];

  const testimonials = [
    { author: "Koffi Mensah", country: "Togo", date: "Il y a 2h", text: "J'ai investi 10 000 FCFA et je reçois 2 500 FCFA chaque matin. Retrait MTN MoMo ultra rapide !", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop" },
    { author: "Arame Diop", country: "Sénégal", date: "Il y a 5h", text: "La vitesse de validation des dépôts est impressionnante. Le système de triple niveau MLM me rapporte déjà gros.", avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop" },
    { author: "Dr. Marc Gbedji", country: "Bénin", date: "Hier", text: "Plateforme fiable, sécurité maximale et service client aux petits soins. Un investissement indispensable en 2026.", avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop" }
  ];

  const faqs = [
    { q: "Qu'est-ce que Investa Premium et comment ça marche ?", a: "Investa est un système intelligent où vous louez de la puissance logicielle VIP. Chaque VIP acheté génère des revenus quotidiens que vous pouvez retirer par MTN, Orange Money ou Wave dès 1 000 FCFA." },
    { q: "Quel est le montant minimum d'investissement et de retrait ?", a: "L'investissement minimum commence à seulement 3 000 FCFA (VIP 1). Les retraits sont autorisés dès 1 000 FCFA de gains accumulés et sont envoyés directement sur votre numéro Mobile Money." },
    { q: "Comment fonctionne le système de parrainage à 3 niveaux ?", a: "Faites profiter vos amis ! Vous gagnez 20% de commission d'affiliation directe sur toutes les souscriptions de votre Niveau 1 (vos invités), 2% sur toutes les souscriptions de votre Niveau 2 (les invités de vos invités), et 1% sur toutes les souscriptions de votre Niveau 3." },
    { q: "Dans quel délai mon dépôt Mobile Money est-il validé ?", a: "Notre équipe administrative examine les informations de dépôt 24h/24. En général, les fonds apparaissent sur votre solde en moins de 15 minutes après l'envoi de la capture d'écran." }
  ];

  return (
    <div id="home_view_wrapper" className="min-h-screen bg-[#020617] text-slate-100 font-sans selection:bg-[#D4AF37] selection:text-black">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#0A0E17]/90 backdrop-blur-md border-b border-white/5 px-4 py-4 sm:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-tr from-[#D4AF37] to-[#F97316] rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/20">
              <TrendingUp className="w-6 h-6 text-white" id="logo_icon" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-white block">INVESTA<span className="text-[#D4AF37]">PREMIUM</span></span>
              <span className="text-[9px] font-mono tracking-widest text-slate-400 uppercase block">FINTECH SECURITY</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button 
              id="lang_toggle"
              onClick={() => setLang(lang === "fr" ? "en" : "fr")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 transition text-xs border border-white/10 font-mono"
            >
              <Globe2 className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>{t.langText}</span>
            </button>
            <button 
              id="header_login_btn"
              onClick={() => onNavigate("login")} 
              className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold border border-white/10 transition-colors text-xs"
            >
              {t.btnLogin}
            </button>
          </div>
        </div>
      </header>

      {/* Hero Banner Area */}
      <section className="pt-32 pb-12 px-4 text-center relative overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-[#D4AF37]/5 rounded-full blur-3xl pointer-events-none"></div>

        <div className="max-w-3xl mx-auto relative z-10">
          {/* Active online state with golden ring shadow glow */}
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#D4AF37]/10 border border-[#D4AF37]/20 rounded-full text-xs text-[#D4AF37] mb-6 font-mono gold-glow">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#D4AF37] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#D4AF37] block"></span>
            </span>
            <span>{stats.onlineCount} {t.statsOnline}</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-4 bg-gradient-to-r from-white via-amber-100 to-[#D4AF37] bg-clip-text text-transparent">
            {t.heroTitle}
          </h1>

          <p className="text-sm sm:text-base text-slate-400 max-w-xl mx-auto mb-8 font-light leading-relaxed">
            {t.heroSub}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6">
            <button 
              id="hero_cta_register"
              onClick={() => onNavigate("register")}
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-[#D4AF37] hover:bg-[#B8962F] text-black font-bold text-sm tracking-wide shadow-lg shadow-amber-500/10 transition-all transform active:scale-95"
            >
              {t.btnEnter}
            </button>
            <button 
              id="hero_cta_login"
              onClick={() => onNavigate("login")}
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-bold border border-white/10 transition-all text-sm"
            >
              {t.btnLogin}
            </button>
          </div>

          {/* Secure fintech badge tag */}
          <div className="flex items-center justify-center gap-2 text-[11px] text-[#D4AF37] font-mono tracking-wide">
            <ShieldCheck className="w-4 h-4 text-[#D4AF37]" />
            <span>ENREGISTRÉ • SECURE ELECTRONIC MULTI-WALLET • 256-BIT SYSTEM</span>
          </div>
        </div>
      </section>

      {/* Live Transaction Ticker Feed */}
      <section className="px-4 py-3.5 bg-[#0A0E17] border-y border-white/5 overflow-hidden font-mono">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#D4AF37] uppercase">
            <Activity className="w-4 h-4 text-rose-500 animate-pulse" />
            <span>{t.liveGain} :</span>
          </div>

          <div className="h-6 relative w-full md:w-3/4 overflow-hidden flex justify-center md:justify-start">
            <AnimatePresence mode="wait">
              {stats.ticker.length > 0 && (
                <motion.div
                  key={tickerIndex}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -20, opacity: 0 }}
                  transition={{ duration: 0.5 }}
                  className="flex items-center gap-3 text-xs sm:text-sm text-slate-300"
                >
                  <span className="font-semibold text-[#D4AF37]">{stats.ticker[tickerIndex]?.name}</span> 
                  <span className="text-slate-500">depuis</span> 
                  <span className="text-white font-medium">{stats.ticker[tickerIndex]?.city}</span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-[#D4AF37]/15 text-[#D4AF37] font-bold">
                    {stats.ticker[tickerIndex]?.type}
                  </span>
                  <span className="text-emerald-400 font-bold">{stats.ticker[tickerIndex]?.amount}</span>
                  <span className="text-[10px] text-slate-500">à l'instant</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </section>

      {/* Statistics Block Row */}
      <section className="py-12 px-4 max-w-7xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-[#0A0E17] border border-white/5 rounded-3xl p-5 hover:border-[#D4AF37]/30 transition-all text-center group" id="stat_users">
            <Users className="w-6 h-6 text-[#D4AF37] mx-auto mb-2" />
            <div className="text-xl sm:text-2xl font-bold font-mono tracking-tight text-white group-hover:scale-105 transition-transform">
              {(stats.usersCount).toLocaleString()}
            </div>
            <div className="text-[10px] text-slate-400 mt-1 uppercase font-mono tracking-wider">{t.statsUsers}</div>
          </div>

          <div className="bg-[#0A0E17] border border-white/5 rounded-3xl p-5 hover:border-[#D4AF37]/30 transition-all text-center group" id="stat_deposits">
            <ArrowUpRight className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
            <div className="text-xl sm:text-2xl font-bold font-mono tracking-tight text-emerald-400 group-hover:scale-105 transition-transform">
              {stats.totalDeposits.toLocaleString()} <span className="text-xs">FCFA</span>
            </div>
            <div className="text-[10px] text-slate-400 mt-1 uppercase font-mono tracking-wider">{t.statsDeposits}</div>
          </div>

          <div className="bg-[#0A0E17] border border-white/5 rounded-3xl p-5 hover:border-[#D4AF37]/30 transition-all text-center group" id="stat_withdrawals">
            <ArrowDownLeft className="w-6 h-6 text-rose-400 mx-auto mb-2" />
            <div className="text-xl sm:text-2xl font-bold font-mono tracking-tight text-rose-400 group-hover:scale-105 transition-transform">
              {stats.totalWithdrawals.toLocaleString()} <span className="text-xs">FCFA</span>
            </div>
            <div className="text-[10px] text-slate-400 mt-1 uppercase font-mono tracking-wider">{t.statsWithdrawals}</div>
          </div>

          <div className="bg-[#0A0E17] border border-white/5 rounded-3xl p-5 hover:border-[#D4AF37]/30 transition-all text-center group" id="stat_revenues">
            <TrendingUp className="w-6 h-6 text-[#D4AF37] mx-auto mb-2" />
            <div className="text-xl sm:text-2xl font-bold font-mono tracking-tight text-[#D4AF37] group-hover:scale-105 transition-transform">
              {stats.revenuesGenerated.toLocaleString()} <span className="text-xs">FCFA</span>
            </div>
            <div className="text-[10px] text-slate-400 mt-1 uppercase font-mono tracking-wider">{t.statsRevenues}</div>
          </div>
        </div>
      </section>

      {/* About Tabs & Info Boxes */}
      <section className="py-12 px-6 max-w-7xl mx-auto bg-[#0A0E17] rounded-[32px] border border-white/5 mb-14 relative overflow-hidden">
        {/* Subtle visual glow backdrops */}
        <div className="absolute -left-12 -bottom-12 w-48 h-48 bg-[#D4AF37]/5 rounded-full blur-2xl"></div>

        <div className="grid md:grid-cols-2 gap-8 items-center relative z-10">
          <div className="space-y-6">
            <div className="flex gap-2">
              <button
                id="tab_about_btn"
                onClick={() => setActiveTab("about")}
                className={`px-4 py-2.5 text-xs font-semibold rounded-xl font-mono tracking-wider transition ${
                  activeTab === "about"
                    ? "bg-[#D4AF37] text-black shadow-lg shadow-amber-500/10 font-bold"
                    : "bg-white/5 text-slate-400 hover:text-white"
                }`}
              >
                {lang === "fr" ? "QUI SOMMES-NOUS" : "WHO WE ARE"}
              </button>
              <button
                id="tab_security_btn"
                onClick={() => setActiveTab("security")}
                className={`px-4 py-2.5 text-xs font-semibold rounded-xl font-mono tracking-wider transition ${
                  activeTab === "security"
                    ? "bg-[#D4AF37] text-black shadow-lg shadow-amber-500/10 font-bold"
                    : "bg-white/5 text-slate-400 hover:text-white"
                }`}
              >
                {lang === "fr" ? "SÉCURITÉ" : "SECURITY"}
              </button>
            </div>

            <div>
              <h3 className="text-2xl font-bold text-white mb-3">
                {activeTab === "about" ? t.aboutTitle : (lang === "fr" ? "Technologie de Sécurité Bancaire" : "Bank-Grade Security")}
              </h3>
              <p className="text-sm text-slate-300 leading-relaxed font-light">
                {activeTab === "about" ? t.aboutText : t.securityText}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-start gap-2.5">
                <div className="w-6 h-6 rounded-lg bg-[#D4AF37]/15 flex items-center justify-center text-[#D4AF37] text-xs font-bold font-mono">1</div>
                <div>
                  <h4 className="text-xs font-semibold text-white">MTN & ORANGE</h4>
                  <p className="text-[10px] text-slate-400">Totalement compatible en Afrique</p>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <div className="w-6 h-6 rounded-lg bg-[#D4AF37]/15 flex items-center justify-center text-[#D4AF37] text-xs font-bold font-mono">2</div>
                <div>
                  <h4 className="text-xs font-semibold text-white">GAINS 24H/24</h4>
                  <p className="text-[10px] text-slate-400">Calcul du rendement en temps réel</p>
                </div>
              </div>
            </div>
          </div>

          <div className="relative flex justify-center">
            {/* Elegant visual card mimicking premium smart check system */}
            <div className="relative w-80 h-48 rounded-[32px] bg-gradient-to-br from-[#0f172a] to-[#1e293b] p-0.5 border border-white/10 relative overflow-hidden shadow-xl shadow-amber-500/5">
              <div className="absolute -right-8 -top-8 w-32 h-32 bg-[#D4AF37]/10 rounded-full blur-2xl"></div>
              <div className="h-full w-full bg-[#0A0E17] rounded-[30px] p-6 flex flex-col justify-between relative z-10">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">NIV. PLATINE VIP</h3>
                    <p className="text-lg font-bold text-white tracking-widest mt-1 font-mono">CARD ••••• 8821</p>
                  </div>
                  <div className="p-2 bg-[#D4AF37]/10 text-[#D4AF37] rounded-xl">
                    <Gem className="w-5 h-5" />
                  </div>
                </div>

                <div className="flex justify-between items-end">
                  <div>
                    <span className="text-[9px] font-mono text-slate-400 block uppercase">Solde garanti</span>
                    <span className="text-lg font-bold text-white tracking-wide">1,500,000 <span className="text-xs text-[#D4AF37]">F</span></span>
                  </div>
                  <div>
                    <span className="px-2 py-0.5 rounded-lg text-[9px] bg-emerald-500/10 text-emerald-400 font-mono font-bold tracking-wide">RETRAITS DIRECTS</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Investment Plans Demonstration Cards */}
      <section className="py-12 px-4 max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="w-1.5 h-6 bg-[#D4AF37] rounded-full"></span>
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              {t.plansTitle}
            </h2>
          </div>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            {t.plansSub}
          </p>
        </div>

        <div className="grid sm:grid-cols-3 gap-6">
          {plansShow.map((plan, index) => (
            <div 
              key={plan.name} 
              className="bg-[#0A0E17] border-2 border-white/5 hover:border-[#D4AF37]/45 rounded-[32px] p-6 flex flex-col justify-between transition-all duration-350 relative group overflow-hidden"
            >
              {index === 2 && (
                <div className="absolute top-0 right-0 bg-[#D4AF37] text-black text-[10px] font-black px-4 py-1.5 rounded-bl-xl tracking-wider uppercase font-mono">
                  ÉLITE
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-lg font-bold text-white mb-2 uppercase tracking-wide">{plan.name}</h3>
                <div className="h-0.5 w-12 bg-[#D4AF37]/30 mb-5 group-hover:w-full transition-all duration-300"></div>

                <div className="space-y-3 font-mono text-xs text-slate-300">
                  <div className="flex justify-between">
                    <span className="text-slate-400">{t.price}:</span>
                    <span className="font-bold text-[#D4AF37]">{plan.price}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">{t.daily}:</span>
                    <span className="font-bold text-emerald-400">+{plan.daily}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">{t.duration}:</span>
                    <span className="text-white">{plan.duration}</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-white/5">
                <div className="flex justify-between items-center mb-4 text-xs font-mono">
                  <span className="text-slate-400">{t.totalGain}:</span>
                  <span className="font-bold text-emerald-400">{plan.total}</span>
                </div>

                <button 
                  onClick={() => onNavigate("login")}
                  className="w-full py-3.5 rounded-xl bg-white/5 hover:bg-[#D4AF37] text-white hover:text-black border border-white/10 transition-all font-bold uppercase tracking-wider text-xs"
                >
                  {t.investBtn}
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 bg-[#0A0E17]/40 border-t border-white/5 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold tracking-tight text-white mb-2">{t.testiTitle}</h2>
            <div className="h-1 w-16 bg-[#D4AF37] mx-auto rounded-full"></div>
          </div>

          <div className="grid sm:grid-cols-3 gap-6">
            {testimonials.map((testi, i) => (
              <div key={testi.author} className="bg-[#0A0E17] border border-white/5 rounded-3xl p-5 relative hover:border-[#D4AF37]/30 transition duration-300">
                <div className="flex items-center gap-3 mb-4">
                  <img referrerPolicy="no-referrer" src={testi.avatar} alt={testi.author} className="w-10 h-10 rounded-full object-cover border border-[#D4AF37]/20" />
                  <div>
                    <h4 className="text-xs font-bold text-white">{testi.author}</h4>
                    <span className="block text-[10px] text-slate-400 font-mono uppercase">{testi.country} • {testi.date}</span>
                  </div>
                </div>
                <p className="text-xs text-slate-300 italic leading-relaxed font-light">
                  "{testi.text}"
                </p>
                <div className="flex gap-0.5 text-[#D4AF37] mt-3 text-[10px]">
                  <span>★</span><span>★</span><span>★</span><span>★</span><span>★</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 px-4 max-w-3xl mx-auto mb-20" id="faq_section">
        <h2 className="text-2xl font-bold text-center mb-8 tracking-tight text-white">{t.faqTitle}</h2>

        <div className="space-y-3">
          {faqs.map((faq, i) => {
            const isOpen = activeFaq === i;
            return (
              <div 
                key={i} 
                className="bg-[#0A0E17] border border-white/5 rounded-2xl overflow-hidden transition duration-300"
              >
                <button
                  onClick={() => setActiveFaq(isOpen ? null : i)}
                  className="w-full px-5 py-4 flex items-center justify-between text-left focus:outline-none"
                  id={`faq_q_${i}`}
                >
                  <span className="text-xs sm:text-sm font-semibold pr-4 text-white">{faq.q}</span>
                  {isOpen ? (
                    <ChevronUp className="w-4 h-4 text-[#D4AF37] shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-500 shrink-0" />
                  )}
                </button>

                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: "auto" }}
                      exit={{ height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 pb-4 pt-1 border-t border-white/5 text-xs text-slate-400 leading-relaxed font-light">
                        {faq.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </section>

      {/* Static Footer */}
      <footer className="border-t border-white/5 bg-[#0A0E17] py-8 px-4 text-center mt-auto text-[11px] text-slate-500 font-mono">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <span>© 2026 INVESTA Premium. {t.rights}</span>
          </div>
          <div className="flex gap-4">
            <span className="hover:text-[#D4AF37] transition cursor-pointer">Conditions d'utilisation</span>
            <span>•</span>
            <span className="hover:text-[#D4AF37] transition cursor-pointer">Support WhatsApp</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
