import React, { useState, useEffect } from "react";
import { 
  UserPlus, Phone, Shield, Globe, Lock, 
  Tractor, Sprout, Handshake, Sparkles, ChevronDown, Check 
} from "lucide-react";
import { registerUser } from "../api";

interface RegisterViewProps {
  onNavigate: (view: "home" | "login" | "register" | "dashboard" | "admin") => void;
  lang: "fr" | "en";
}

const countryList = [
  { name: "Togo", code: "+228", flag: "🇹🇬" }
];

export default function RegisterView({ onNavigate, lang }: RegisterViewProps) {
  const [whatsapp, setWhatsapp] = useState("228");
  const [country, setCountry] = useState("Togo");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [sponsorCode, setSponsorCode] = useState("WILF228");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  // Get selected country details
  const selectedCountry = countryList.find(c => c.name === country) || countryList[0]; // default to Togo

  // Auto-detect referral code from URL search query if exists or falls back to stored localStorage token, or WILF228 fallback
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const ref = params.get("ref") || params.get("sponsor");
      if (ref) {
        const cleaned = ref.toUpperCase().trim();
        setSponsorCode(cleaned);
        localStorage.setItem("pending_referral_code", cleaned);
      } else {
        const storedRef = localStorage.getItem("pending_referral_code");
        if (storedRef) {
          setSponsorCode(storedRef.toUpperCase().trim());
        } else {
          setSponsorCode("WILF228");
        }
      }
    } catch (e) {
      setSponsorCode("WILF228");
    }
  }, []);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!whatsapp.trim() || !password || !confirmPassword) {
      setError(lang === "fr" ? "Veuillez remplir tous les champs obligatoires (Téléphone, Mots de passe)." : "WhatsApp phone and passwords are required.");
      return;
    }

    if (password !== confirmPassword) {
      setError(lang === "fr" ? "La confirmation du mot de passe ne correspond pas." : "Passwords do not match.");
      return;
    }

    if (password.length < 6) {
      setError(lang === "fr" ? "Le mot de passe doit contenir au moins 6 caractères." : "Password must be at least 6 characters.");
      return;
    }

    // Auto-formatting to ensure Togo code (228) is always active/automatic
    let formattedPhone = whatsapp.trim().replace(/^\+/, "").replace(/\s+/g, "");
    if (!formattedPhone.startsWith("228")) {
      formattedPhone = "228" + formattedPhone;
    }

    setLoading(true);
    try {
      // Auto-attribute premium default investor name based on WhatsApp phone number
      const autoName = "Investisseur " + formattedPhone;
      await registerUser({
        name: autoName,
        whatsapp: formattedPhone,
        country,
        password,
        sponsorCode: sponsorCode || undefined
      });

      // Clear the temporary stored registration referral code on success
      localStorage.removeItem("pending_referral_code");

      setSuccess(lang === "fr" ? "Votre compte d'investisseur a été créé avec succès ! Connectez-vous." : "Success! Account registered. Redirecting to login...");

      setTimeout(() => {
        onNavigate("login");
      }, 1500);

    } catch (err: any) {
      setError(err.message || "Échec de l'inscription");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      id="register_container" 
      className="min-h-screen bg-slate-950 text-white flex flex-col justify-start items-center px-4 py-8 sm:py-12 relative overflow-y-auto"
      style={{
        backgroundImage: `url('https://images.unsplash.com/photo-1625246333195-78d9c38ad49f?q=80&w=1200&auto=format&fit=crop')`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed"
      }}
    >
      {/* Dark overlay with mild blur to simulate original design ambient backdrop */}
      <div className="absolute inset-0 bg-[#0B2530]/65 backdrop-blur-[3px] z-0 pointer-events-none"></div>

      {/* Main container column to layout exactly like the screenshot */}
      <div className="w-full max-w-md flex flex-col gap-6 z-10 my-auto pt-8">
        
        {/* Custom Header Logo Section (Matching Screenshot) */}
        <div id="iagri_brand_header" className="flex items-center justify-between px-2 pt-2">
          {/* Brand left */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-[20px] bg-[#115E59]/90 flex items-center justify-center border border-teal-400/20 shadow-md">
              <Tractor className="w-6 h-6 text-emerald-400" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1">
                <span className="text-3xl font-extrabold text-white tracking-tight leading-none">iAgri</span>
                <Sprout className="w-5 h-5 text-emerald-400 animate-pulse ml-0.5" />
              </div>
              <span className="text-[11px] font-light text-slate-300 mt-1">
                {lang === "fr" ? "Plateforme d'Investissement Agricole" : "Agricultural Investment Platform"}
              </span>
            </div>
          </div>

          {/* Mini tractor floating symbol right */}
          <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center border border-white/10 backdrop-blur-sm shadow-sm">
            <Tractor className="w-4 h-4 text-amber-400" />
          </div>
        </div>

        {/* High fidelity Glassmorphic Form Card (Matching Screenshot) */}
        <div className="w-full bg-[#112F3D]/50 backdrop-blur-md border border-white/10 rounded-[32px] p-6 sm:p-7 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.6)] relative overflow-hidden">
          
          <div className="flex items-start gap-3.5 mb-5 select-none font-sans">
            <div className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-[#82C3D8]/90">
              <UserPlus className="w-5 h-5" />
            </div>
            <div className="flex items-center">
              <h2 className="text-lg font-bold text-white tracking-tight self-center py-2">
                {lang === "fr" ? "Création de Portefeuille" : "Investor Registration"}
              </h2>
            </div>
          </div>

          {/* Alert messages */}
          {error && (
            <div id="register_error" className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-2xl text-xs text-red-300 font-sans text-center">
              ⚠️ {error}
            </div>
          )}

          {success && (
            <div id="register_success" className="mb-4 p-3 bg-teal-500/10 border border-teal-500/20 rounded-2xl text-xs text-emerald-300 font-sans text-center-emerald">
              ✓ {success}
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-4">
            
            {/* Custom styled Phone with Flag prefix matching selector (Matching Screenshot) */}
            <div className="relative flex items-center gap-1.5 px-3.5 py-1 bg-white/5 border border-white/10 rounded-2xl focus-within:ring-1 focus-within:ring-emerald-500/50 focus-within:border-emerald-500 transition-all font-sans">
              <div className="relative flex items-center gap-1 cursor-pointer bg-transparent py-2.5">
                <span className="text-base select-none">{selectedCountry.flag}</span>
                <span className="text-xs font-mono font-semibold text-slate-200 ml-1">{selectedCountry.code}</span>
                <ChevronDown className="w-3 h-3 text-slate-400 ml-1 shrink-0" />
                <select
                  value={country}
                  onChange={(e) => {
                    const found = countryList.find(c => c.name === e.target.value);
                    if (found) {
                      setCountry(found.name);
                    }
                  }}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                >
                  {countryList.map((c) => (
                    <option key={c.name} value={c.name} className="bg-slate-900 text-white">
                      {c.flag} {c.code} - {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="w-[1px] h-5 bg-white/20 self-center mx-1"></div>
              <input
                id="reg_whatsapp"
                type="text"
                placeholder={lang === "fr" ? "Numéro de téléphone *" : "Phone number *"}
                value={whatsapp}
                onChange={(e) => {
                  let val = e.target.value.replace(/[^\d+]/g, "");
                  if (val.startsWith("+")) val = val.replace("+", "");
                  if (val.startsWith("228")) {
                    setWhatsapp("228" + val.substring(3));
                  } else if (val === "" || val === "2" || val === "22") {
                    setWhatsapp("228");
                  } else {
                    setWhatsapp("228" + val);
                  }
                }}
                className="w-full bg-transparent border-none py-1.5 px-1 text-sm outline-none text-white focus:ring-0 placeholder:text-slate-400 font-mono"
                required
              />
            </div>

            {/* Password input matching styling */}
            <div className="relative flex items-center gap-1.5 px-3.5 py-1 bg-white/5 border border-white/10 rounded-2xl focus-within:ring-1 focus-within:ring-emerald-500/50 focus-within:border-emerald-500 transition-all">
              <Lock className="w-4 h-4 text-slate-300 mr-1.5 shrink-0" />
              <input
                id="reg_password"
                type="password"
                placeholder={lang === "fr" ? "Mot de passe" : "Password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-transparent border-none py-2.5 px-1 text-sm outline-none text-white focus:ring-0 placeholder:text-slate-400 font-sans font-light"
                required
              />
            </div>

            {/* Confirm Password input */}
            <div className="relative flex items-center gap-1.5 px-3.5 py-1 bg-white/5 border border-white/10 rounded-2xl focus-within:ring-1 focus-within:ring-emerald-500/50 focus-within:border-emerald-500 transition-all">
              <Lock className="w-4 h-4 text-slate-300 mr-1.5 shrink-0" />
              <input
                id="reg_confirm"
                type="password"
                placeholder={lang === "fr" ? "Confirmez le mot de passe" : "Confirm password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-transparent border-none py-2.5 px-1 text-sm outline-none text-white focus:ring-0 placeholder:text-slate-400 font-sans font-light"
                required
              />
            </div>

            {/* Handshake Sponsor Code Input */}
            <div className="relative flex items-center gap-1.5 px-3.5 py-1 bg-white/10 border border-white/10 rounded-2xl focus-within:ring-1 focus-within:ring-emerald-500/50 focus-within:border-emerald-500 transition-all">
              <Handshake className="w-4 h-4 text-amber-400 mr-1.5 shrink-0" />
              <input
                id="reg_sponsor"
                type="text"
                placeholder={lang === "fr" ? "Code de Parrainage (Sponsor)" : "Referral code (Sponsor)"}
                value={sponsorCode}
                onChange={(e) => setSponsorCode(e.target.value.toUpperCase().trim())}
                className="w-full bg-transparent border-none py-2.5 px-1 text-sm outline-none text-[#FBCD4D]/90 font-mono font-medium focus:ring-0 placeholder:text-slate-400"
              />
              <Sparkles className="w-4 h-4 text-teal-400 animate-pulse ml-1 shrink-0" />
            </div>

            {/* Centered Solid White Submit button with Leaf icon (Matching Screenshot) */}
            <button
              type="submit"
              id="register_submit_btn"
              disabled={loading}
              className="w-full mt-5 bg-white hover:bg-slate-100 active:scale-95 text-[#0A3D29] font-sans font-bold text-sm tracking-wide rounded-2xl py-3 px-4 shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Sprout className="w-4.5 h-4.5 text-emerald-600 shrink-0" />
              <span>
                {loading ? (lang === "fr" ? "Création..." : "Creating...") : (lang === "fr" ? "Créer mon compte" : "Create my account")}
              </span>
            </button>
          </form>

          {/* Underlink Account Navigation (Matching Screenshot) */}
          <div className="mt-6 pt-5 border-t border-white/10 text-center text-xs font-sans">
            <button
              id="register_to_login"
              onClick={() => onNavigate("login")}
              className="text-slate-300 hover:text-white transition duration-200"
            >
              🔑 {lang === "fr" ? "Déjà un compte ? " : "Already have an account? "}
              <span className="text-white hover:underline font-bold ml-1">
                {lang === "fr" ? "Se connecter →" : "Sign in →"}
              </span>
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
