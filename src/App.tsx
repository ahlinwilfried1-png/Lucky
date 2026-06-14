/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from "react";
import LoginView from "./components/LoginView";
import RegisterView from "./components/RegisterView";
import DashboardView from "./components/DashboardView";
import AdminView from "./components/AdminView";
import { syncOfflineLocalData } from "./api";

export default function App() {
  // Navigation states: "home" | "login" | "register" | "dashboard" | "admin"
  const [currentView, setCurrentView] = useState<"home" | "login" | "register" | "dashboard" | "admin">("register");

  // Multi language state: Français ("fr") or English ("en")
  const [lang, setLang] = useState<"fr" | "en">("fr");

  // User session state
  const [user, setUser] = useState<{
    id: string;
    name: string;
    whatsapp: string;
    country: string;
    isAdmin: boolean;
  } | null>(null);

  // Auto-restore credential sessions from local persistence on boot
  useEffect(() => {
    try {
      // Auto-detect referral code from URL search query if exists and store it
      const params = new URLSearchParams(window.location.search);
      const ref = params.get("ref") || params.get("sponsor");
      if (ref) {
        localStorage.setItem("pending_referral_code", ref.toUpperCase().trim());
      }
    } catch (e) {
      console.warn("Could not capture URL referral parameter.", e);
    }

    try {
      const storedUser = sessionStorage.getItem("investa_user_session");
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        setUser(parsed);
        if (parsed.isAdmin) {
          setCurrentView("admin");
        } else {
          setCurrentView("dashboard");
        }
      }
      
      const storedLang = localStorage.getItem("investa_lang");
      if (storedLang === "fr" || storedLang === "en") {
        setLang(storedLang);
      }
    } catch (e) {
      console.warn("Could not retrieve standard user sessions from memory.", e);
    }

    // Trigger auto synchronization of offline accounts from other devices
    try {
      syncOfflineLocalData();
    } catch (e) {}
  }, []);

  const handleLoginSuccess = (userData: { id: string; name: string; whatsapp: string; country: string; isAdmin: boolean }) => {
    setUser(userData);
    sessionStorage.setItem("investa_user_session", JSON.stringify(userData));
  };

  const handleLogout = () => {
    sessionStorage.removeItem("investa_user_session");
    setUser(null);
    setCurrentView("register");
  };

  const handleLangToggle = (selectedLang: "fr" | "en") => {
    setLang(selectedLang);
    localStorage.setItem("investa_lang", selectedLang);
  };

  return (
    <div id="react_core_gate" className="min-h-screen bg-[#030617] text-white selection:bg-amber-500 selection:text-black">
      
      {currentView === "home" && (
        <RegisterView 
          onNavigate={setCurrentView} 
          lang={lang} 
        />
      )}

      {currentView === "login" && (
        <LoginView 
          onNavigate={setCurrentView} 
          onLoginSuccess={handleLoginSuccess} 
          lang={lang} 
        />
      )}

      {currentView === "register" && (
        <RegisterView 
          onNavigate={setCurrentView} 
          lang={lang} 
        />
      )}

      {currentView === "dashboard" && user && (
        <DashboardView 
          userId={user.id} 
          onLogout={handleLogout} 
          lang={lang} 
          onNavigate={setCurrentView}
        />
      )}

      {currentView === "admin" && user && (
        <AdminView 
          adminUserId={user.id} 
          onExit={() => setCurrentView(user.isAdmin ? "dashboard" : "register")} 
          lang={lang} 
        />
      )}

    </div>
  );
}
