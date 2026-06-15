import React, { useEffect, useState } from "react";
import { Download, X, PlusSquare, Share } from "lucide-react";

interface PWAInstallPromptProps {
  lang: "fr" | "en";
}

export default function PWAInstallPrompt({ lang }: PWAInstallPromptProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState<boolean>(false);
  const [isiOS, setIsiOS] = useState<boolean>(false);
  const [isStandalone, setIsStandalone] = useState<boolean>(false);

  useEffect(() => {
    // Check if space is already standalone
    const standaloneMode = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;
    setIsStandalone(standaloneMode);

    if (standaloneMode) return;

    // Detect iOS
    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsiOS(ios);

    // Grab standard beforeinstallprompt on other platforms
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Only show banner if not already closed/dismissed in this session
      const dismissed = sessionStorage.getItem("pwa_prompt_dismissed");
      if (!dismissed) {
        setShowPrompt(true);
      }
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // For iOS, show installation helper after 4 seconds of activity if not dismissed
    if (ios) {
      const timer = setTimeout(() => {
        const dismissed = sessionStorage.getItem("pwa_prompt_dismissed");
        if (!dismissed) {
          setShowPrompt(true);
        }
      }, 4000);
      return () => clearTimeout(timer);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`PWA installation outcome: ${outcome}`);
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    sessionStorage.setItem("pwa_prompt_dismissed", "true");
    setShowPrompt(false);
  };

  if (isStandalone || !showPrompt) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-md bg-slate-900/95 border border-emerald-500/30 backdrop-blur rounded-3xl p-4 shadow-2xl text-white animate-in slide-in-from-bottom duration-500">
      <div className="flex items-start justify-between gap-3">
        {/* App Mini Icon and Label */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-[#0b1329] rounded-2xl border border-emerald-500/20 p-2 flex items-center justify-center shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className="w-full h-full">
              <linearGradient id="g" x1="0%" y1="100%" x2="100%" y2="0%">
                <stop offset="0%" stop-color="#059669"/>
                <stop offset="100%" stop-color="#34d399"/>
              </linearGradient>
              <path d="M 256,420 C 180,360 160,270 210,180 C 240,195 250,230 256,260 C 262,230 272,195 302,180 C 352,270 332,360 256,420 Z" fill="url(#g)"/>
            </svg>
          </div>
          <div>
            <h4 className="font-sans font-semibold text-sm text-emerald-300">
              {lang === "fr" ? "Installer l'application iAgri" : "Install iAgri App"}
            </h4>
            <p className="font-sans text-[11px] text-slate-300 leading-normal">
              {lang === "fr" 
                ? "Installez l'application sur votre écran d'accueil pour y accéder comme une vraie application mobile d'un clic."
                : "Add application to your screen instantly for the best mobile and secure experience."}
            </p>
          </div>
        </div>

        {/* Close button */}
        <button 
          onClick={handleDismiss}
          className="p-1 text-slate-400 hover:text-white rounded-full transition-colors hover:bg-white/10"
        >
          <X size={16} />
        </button>
      </div>

      <div className="mt-3.5 pt-3 border-t border-white/5 flex items-center justify-end">
        {isiOS ? (
          <div className="w-full text-xs font-sans text-slate-300 flex items-center gap-1.5 flex-wrap justify-between leading-tight">
            <span>
              {lang === "fr" ? "Sur iPhone :" : "On iPhone:"}
            </span>
            <span className="flex items-center gap-1 bg-white/5 px-2 py-1/2 rounded-lg text-emerald-400 font-medium text-[10px] sm:text-xs">
              {lang === "fr" ? "Appuyez sur" : "Press"}
              <Share size={12} className="inline text-emerald-400 mx-0.5" />
              {lang === "fr" ? "puis 'Sur l'écran d'accueil'" : "then 'Add to Home Screen'"}
              <PlusSquare size={12} className="inline text-emerald-400 mx-0.5" />
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <button 
              onClick={handleDismiss}
              className="px-3 py-1.5 text-xs text-slate-300 hover:text-white font-sans transition-colors"
            >
              {lang === "fr" ? "Plus tard" : "Maybe Later"}
            </button>
            <button
              onClick={handleInstallClick}
              className="flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 font-semibold px-4 py-2 rounded-2xl text-xs text-slate-950 font-sans shadow-lg shadow-emerald-500/10 transition-all active:scale-95"
            >
              <Download size={13} />
              {lang === "fr" ? "Télécharger / Installer" : "Download & Install"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
