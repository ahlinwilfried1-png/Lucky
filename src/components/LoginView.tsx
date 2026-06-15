import React, { useState } from "react";
import { 
  Lock, Phone, ArrowLeft, ShieldCheck, 
  Tractor, Sprout 
} from "lucide-react";
import { loginUser, resetPassword } from "../api";

interface LoginViewProps {
  onNavigate: (view: "home" | "login" | "register" | "dashboard" | "admin") => void;
  onLoginSuccess: (user: { id: string; name: string; whatsapp: string; country: string; isAdmin: boolean }) => void;
  lang: "fr" | "en";
}

export default function LoginView({ onNavigate, onLoginSuccess, lang }: LoginViewProps) {
  const [whatsapp, setWhatsapp] = useState("228");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  // Forgot password states
  const [showForgot, setShowForgot] = useState(false);
  const [forgotPhone, setForgotPhone] = useState("228");
  const [forgotNewPassword, setForgotNewPassword] = useState("");
  const [forgotConfirm, setForgotConfirm] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!whatsapp.trim() || !password) {
      setError(lang === "fr" ? "Veuillez renseigner votre numéro de téléphone et votre mot de passe d'accès." : "Please fill in your registered phone number and access security key.");
      return;
    }

    // Auto-formatting to ensure Togo code (228) is always active/automatic
    let formattedPhone = whatsapp.trim().replace(/^\+/, "").replace(/\s+/g, "");
    if (!formattedPhone.startsWith("228")) {
      formattedPhone = "228" + formattedPhone;
    }

    setLoading(true);
    try {
      const response = await loginUser({ whatsapp: formattedPhone, password });
      setSuccess(lang === "fr" ? "Connexion réussie ! Initialisation de l'espace investisseur..." : "Connection successful! Initializing secure investor dashboard...");
      
      setTimeout(() => {
        onLoginSuccess(response.user);
        if (response.user.isAdmin) {
          onNavigate("admin");
        } else {
          onNavigate("dashboard");
        }
      }, 1000);
    } catch (err: any) {
      setError(err.message || (lang === "fr" ? "Identifiants incorrects ou compte inexistant." : "Invalid credentials or account does not exist."));
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!forgotPhone || !forgotNewPassword || !forgotConfirm) {
      setError(lang === "fr" ? "Veuillez remplir tous les champs requis pour la réinitialisation." : "Please fill in all required fields to reset password.");
      return;
    }

    if (forgotNewPassword !== forgotConfirm) {
      setError(lang === "fr" ? "Les mots de passe saisis ne correspondent pas." : "Passwords do not match.");
      return;
    }

    // Auto-formatting forgot password phone
    let formattedForgotPhone = forgotPhone.trim().replace(/^\+/, "").replace(/\s+/g, "");
    if (!formattedForgotPhone.startsWith("228")) {
      formattedForgotPhone = "228" + formattedForgotPhone;
    }

    try {
      await resetPassword({ whatsapp: formattedForgotPhone, newPassword: forgotNewPassword });
      setSuccess(lang === "fr" ? "Clé de sécurité mise à jour avec succès !" : "Security key has been updated successfully.");
      setShowForgot(false);
      setWhatsapp(formattedForgotPhone);
      setPassword(forgotNewPassword);
    } catch (err: any) {
      setError(err.message || (lang === "fr" ? "Impossible de réinitialiser la clé de sécurité." : "Unable to reset technical security keys."));
    }
  };

  return (
    <div 
      id="login_container" 
      className="min-h-screen bg-slate-950 text-white flex flex-col justify-start items-center px-4 py-12 relative overflow-y-auto"
      style={{
        backgroundImage: `url('https://images.unsplash.com/photo-1625246333195-78d9c38ad49f?q=80&w=1200&auto=format&fit=crop')`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed"
      }}
    >
      {/* Dark overlay with mild blur to simulate original design ambient backdrop */}
      <div className="absolute inset-0 bg-[#0B2530]/65 backdrop-blur-[3px] z-0 pointer-events-none"></div>
      
      {/* Back to Home Action */}
      <button 
        id="login_back_home"
        onClick={() => onNavigate("register")}
        className="absolute top-4 left-4 sm:top-6 sm:left-6 z-20 flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-white/10 hover:bg-white/20 text-xs transition border border-white/10 backdrop-blur-md"
      >
        <ArrowLeft className="w-3.5 h-3.5 text-white" />
        <span className="font-sans font-medium text-white">{lang === "fr" ? "Retour" : "Back"}</span>
      </button>

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

          {/* Mini tractor symbols */}
          <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center border border-white/10 backdrop-blur-sm shadow-sm">
            <Tractor className="w-4 h-4 text-amber-400" />
          </div>
        </div>

        {/* High fidelity Glassmorphic Form Card (Matching Screenshot) */}
        <div className="w-full bg-[#112F3D]/50 backdrop-blur-md border border-white/10 rounded-[32px] p-6 sm:p-7 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.6)] relative overflow-hidden">
          
          <div className="flex items-start gap-3.5 mb-5 select-none">
            <div className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-[#82C3D8]/90">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                {showForgot 
                  ? (lang === "fr" ? "Restauration d'accès" : "Reset Portal Password") 
                  : (lang === "fr" ? "Portail d'investisseur" : "Investor Dashboard Login")
                }
              </h2>
              <p className="text-xs text-slate-300/95 font-light mt-0.5">
                {lang === "fr" ? "Accédez à vos avoirs et gérez votre portefeuille." : "Manage your agricultural assets and secured capital."}
              </p>
            </div>
          </div>

          {error && (
            <div id="login_error" className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-2xl text-xs text-red-300 font-sans text-center">
              ⚠️ {error}
            </div>
          )}

          {success && (
            <div id="login_success" className="mb-4 p-3 bg-teal-500/10 border border-teal-500/20 rounded-2xl text-xs text-emerald-300 font-sans text-center">
              ✓ {success}
            </div>
          )}

          {!showForgot ? (
            <form onSubmit={handleLogin} className="space-y-4">
              
              {/* Phone Input Container */}
              <div className="relative flex items-center gap-1.5 px-3.5 py-1 bg-white/5 border border-white/10 rounded-2xl focus-within:ring-1 focus-within:ring-emerald-500/50 focus-within:border-emerald-500 transition-all font-sans">
                <Phone className="w-4 h-4 text-slate-300 mr-1.5 shrink-0" />
                <input
                  id="login_whatsapp"
                  type="text"
                  placeholder={lang === "fr" ? "Identifiant de téléphone WhatsApp" : "Registered WhatsApp Number"}
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
                  className="w-full bg-transparent border-none py-2.5 px-1 text-sm outline-none text-white focus:ring-0 placeholder:text-slate-400 font-mono"
                  required
                />
              </div>

              {/* Password Container */}
              <div>
                <div className="flex justify-between items-center mb-1.5 px-1">
                  <span className="text-[10px] font-sans text-slate-300 uppercase tracking-wider">
                    {lang === "fr" ? "Clé de sécurité" : "Security Access Key"}
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowForgot(true)}
                    className="text-[11px] text-teal-400 hover:underline font-sans cursor-pointer"
                  >
                    {lang === "fr" ? "Clé oubliée ?" : "Restoration options"}
                  </button>
                </div>
                
                <div className="relative flex items-center gap-1.5 px-3.5 py-1 bg-white/5 border border-white/10 rounded-2xl focus-within:ring-1 focus-within:ring-emerald-500/50 focus-within:border-emerald-500 transition-all font-sans">
                  <Lock className="w-4 h-4 text-slate-300 mr-1.5 shrink-0" />
                  <input
                    id="login_password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-transparent border-none py-2.5 px-1 text-sm outline-none text-white focus:ring-0 placeholder:text-slate-400 font-sans"
                    required
                  />
                </div>
              </div>

              {/* Submit CTA button */}
              <button
                type="submit"
                id="login_submit_btn"
                disabled={loading}
                className="w-full mt-4 bg-white hover:bg-slate-100 active:scale-95 text-[#0A3D29] font-sans font-bold text-sm tracking-wide rounded-2xl py-3.5 px-4 shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Sprout className="w-4.5 h-4.5 text-emerald-600 shrink-0" />
                <span>
                  {loading ? (lang === "fr" ? "Authentification..." : "Verifying...") : (lang === "fr" ? "Accéder à l'espace" : "Access Space")}
                </span>
              </button>
            </form>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <h3 className="text-xs font-bold font-mono text-teal-400 mb-2 uppercase tracking-wider">
                {lang === "fr" ? "Restauration d'accès" : "Access Restoration"}
              </h3>
              
              <div className="relative flex items-center gap-1.5 px-3.5 py-1 bg-white/5 border border-white/10 rounded-2xl focus-within:ring-1 focus-within:ring-emerald-500/50 focus-within:border-emerald-500 transition-all font-sans">
                <Phone className="w-4 h-4 text-slate-300 mr-1.5 shrink-0" />
                <input
                  id="forgot_phone"
                  type="text"
                  placeholder={lang === "fr" ? "Votre numéro WhatsApp enregistré" : "Registered WhatsApp Number"}
                  value={forgotPhone}
                  onChange={(e) => {
                    let val = e.target.value.replace(/[^\d+]/g, "");
                    if (val.startsWith("+")) val = val.replace("+", "");
                    if (val.startsWith("228")) {
                      setForgotPhone("228" + val.substring(3));
                    } else if (val === "" || val === "2" || val === "22") {
                      setForgotPhone("228");
                    } else {
                      setForgotPhone("228" + val);
                    }
                  }}
                  className="w-full bg-transparent border-none py-2.5 px-1 text-sm outline-none text-white focus:ring-0 placeholder:text-slate-400 font-mono"
                  required
                />
              </div>

              <div className="relative flex items-center gap-1.5 px-3.5 py-1 bg-white/5 border border-white/10 rounded-2xl focus-within:ring-1 focus-within:ring-emerald-500/50 focus-within:border-emerald-500 transition-all font-sans">
                <Lock className="w-4 h-4 text-slate-300 mr-1.5 shrink-0" />
                <input
                  id="forgot_new_password"
                  type="password"
                  placeholder={lang === "fr" ? "Définir la nouvelle clé d'accès" : "Set New Access Key"}
                  value={forgotNewPassword}
                  onChange={(e) => setForgotNewPassword(e.target.value)}
                  className="w-full bg-transparent border-none py-2.5 px-1 text-sm outline-none text-white focus:ring-0 placeholder:text-slate-400 font-sans"
                  required
                />
              </div>

              <div className="relative flex items-center gap-1.5 px-3.5 py-1 bg-white/5 border border-white/10 rounded-2xl focus-within:ring-1 focus-within:ring-emerald-500/50 focus-within:border-emerald-500 transition-all font-sans">
                <Lock className="w-4 h-4 text-slate-300 mr-1.5 shrink-0" />
                <input
                  id="forgot_confirm_password"
                  type="password"
                  placeholder={lang === "fr" ? "Confirmez la clé d'accès" : "Confirm access key"}
                  value={forgotConfirm}
                  onChange={(e) => setForgotConfirm(e.target.value)}
                  className="w-full bg-transparent border-none py-2.5 px-1 text-sm outline-none text-white focus:ring-0 placeholder:text-slate-400 font-sans"
                  required
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForgot(false)}
                  className="w-1/2 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs transition"
                >
                  {lang === "fr" ? "Retour" : "Cancel"}
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 rounded-xl bg-[#0F5132] hover:bg-[#0c4028] text-white font-bold text-xs transition border border-white/10"
                >
                  {lang === "fr" ? "Confirmer" : "Confirm"}
                </button>
              </div>
            </form>
          )}

          {/* Bottom account creation route */}
          <div className="mt-6 pt-5 border-t border-white/10 text-center text-xs font-sans">
            <button
              id="login_to_register"
              onClick={() => onNavigate("register")}
              className="text-slate-300 hover:text-white transition duration-200"
            >
              🌱 {lang === "fr" ? "Vous n'avez pas encore de portefeuille ?" : "New investor? "}
              <span className="text-white hover:underline font-bold ml-1">
                {lang === "fr" ? "Créer un compte d'investisseur →" : "Register now →"}
              </span>
            </button>
          </div>

        </div>

        {/* Small security footer warning at bottom matching aesthetic */}
        <div className="text-center text-[10px] text-slate-400 font-mono gap-1.5 flex justify-center items-center select-none">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Système d'Investissement iAgri • Cryptage SSL 256-Bit • Sécurité Bancaire</span>
        </div>

      </div>
    </div>
  );
}
