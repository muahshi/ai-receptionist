"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Home, Camera, BarChart2, Settings, Plus, Bell, LogOut,
  TrendingUp, Users, DollarSign, Zap, RefreshCw
} from "lucide-react";
import dynamic from "next/dynamic";

// Dynamic imports to avoid SSR issues with localStorage
const DashboardView = dynamic(() => import("../components/DashboardView"), { ssr: false });
const ScannerView = dynamic(() => import("../components/ScannerView"), { ssr: false });
const ReportsView = dynamic(() => import("../components/ReportsView"), { ssr: false });
const SettingsView = dynamic(() => import("../components/SettingsView"), { ssr: false });
const LoginScreen = dynamic(() => import("../components/LoginScreen"), { ssr: false });

export default function App() {
  const [activeTab, setActiveTab] = useState("home");
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [alertCount, setAlertCount] = useState(0);

  useEffect(() => {
    // Check auth
    try {
      const stored = localStorage.getItem("air_current_user");
      if (stored) setUser(JSON.parse(stored));
    } catch {}
    setIsLoading(false);
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem("air_current_user");
    setUser(null);
  };

  const handleNewBooking = useCallback(() => {
    setAlertCount((c) => c + 1);
    setTimeout(() => setAlertCount(0), 5000);
  }, []);

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-charcoal-800">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-gold-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gold-500 font-display text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return (
    <div className="h-full flex flex-col" style={{ height: "100dvh" }}>
      {/* ── Top Header ────────────────────────────────────────────────── */}
      <header className="flex-shrink-0 safe-top">
        <div className="glass-card mx-3 mt-2 px-4 py-3 rounded-2xl flex items-center justify-between">
          <div>
            <h1 className="font-display text-gold-500 text-lg leading-tight gold-glow">
              {process.env.NEXT_PUBLIC_HOTEL_NAME || "Grand Palace"}
            </h1>
            <p className="text-gray-500 text-xs font-body">
              {user.role === "owner" ? "👑 Owner View" : "🔑 Manager View"}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Alert Bell */}
            <button
              className="relative p-2 rounded-xl glass-card"
              onClick={() => setAlertCount(0)}
            >
              <Bell size={18} className="text-gray-400" />
              {alertCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-gold-500 rounded-full text-black text-xs flex items-center justify-center font-bold pulse-dot">
                  {alertCount}
                </span>
              )}
            </button>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="p-2 rounded-xl glass-card"
            >
              <LogOut size={18} className="text-gray-400" />
            </button>
          </div>
        </div>
      </header>

      {/* ── Main Content ──────────────────────────────────────────────── */}
      <main className="flex-1 overflow-hidden px-3 py-2">
        {activeTab === "home" && (
          <DashboardView
            user={user}
            onNavigate={setActiveTab}
            onNewBooking={handleNewBooking}
          />
        )}
        {activeTab === "scanner" && (
          <ScannerView
            user={user}
            onSuccess={() => {
              handleNewBooking();
              setActiveTab("home");
            }}
            onBack={() => setActiveTab("home")}
          />
        )}
        {activeTab === "reports" && (
          <ReportsView user={user} />
        )}
        {activeTab === "settings" && (
          <SettingsView user={user} onLogout={handleLogout} />
        )}
      </main>

      {/* ── Bottom Navigation ─────────────────────────────────────────── */}
      <nav className="flex-shrink-0 safe-bottom">
        <div className="glass-card mx-3 mb-2 px-2 py-2 rounded-2xl">
          <div className="flex items-center justify-around">
            <NavItem
              icon={<Home size={20} />}
              label="Home"
              active={activeTab === "home"}
              onClick={() => setActiveTab("home")}
            />

            {/* Center Scanner Button */}
            <button
              onClick={() => setActiveTab("scanner")}
              className={`flex flex-col items-center justify-center w-14 h-14 rounded-2xl transition-all duration-200 ${
                activeTab === "scanner"
                  ? "btn-gold scale-110"
                  : "bg-gradient-to-br from-gold-600/80 to-gold-500/80 shadow-lg shadow-gold-500/30"
              }`}
            >
              <Plus
                size={24}
                className={activeTab === "scanner" ? "text-black" : "text-black"}
                strokeWidth={2.5}
              />
            </button>

            <NavItem
              icon={<BarChart2 size={20} />}
              label="Reports"
              active={activeTab === "reports"}
              onClick={() => setActiveTab("reports")}
            />

            <NavItem
              icon={<Settings size={20} />}
              label="Settings"
              active={activeTab === "settings"}
              onClick={() => setActiveTab("settings")}
            />
          </div>
        </div>
      </nav>
    </div>
  );
}

function NavItem({ icon, label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-1 px-3 py-1 rounded-xl transition-all duration-200 ${
        active ? "text-gold-500" : "text-gray-500"
      }`}
    >
      {icon}
      <span className="text-xs font-medium">{label}</span>
      {active && (
        <span className="w-1 h-1 rounded-full bg-gold-500 absolute -bottom-0.5" />
      )}
    </button>
  );
}
