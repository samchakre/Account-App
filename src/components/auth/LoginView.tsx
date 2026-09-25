import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Building2, 
  Lock, 
  User, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  Store, 
  ShoppingCart, 
  Boxes, 
  Receipt,
  ArrowRight,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  KeyRound,
  FileSpreadsheet,
  QrCode,
  Layers
} from 'lucide-react';
import { UserRole } from '../../types';

export const LoginView: React.FC = () => {
  const { login, users, businessProfile } = useApp();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    setTimeout(() => {
      const result = login(username, password, rememberMe);
      if (!result.success) {
        setError(result.error || 'Invalid credentials. Please verify username and password/PIN.');
        setIsLoading(false);
      }
    }, 250);
  };

  const handleQuickLogin = (roleUsername: string, rolePassword: string) => {
    setUsername(roleUsername);
    setPassword(rolePassword);
    setError(null);
    setIsLoading(true);

    setTimeout(() => {
      const res = login(roleUsername, rolePassword, rememberMe);
      if (!res.success) {
        setError(res.error || 'Quick login failed.');
        setIsLoading(false);
      }
    }, 250);
  };

  const handleAutofill = (roleUsername: string, rolePassword: string) => {
    setUsername(roleUsername);
    setPassword(rolePassword);
    setError(null);
  };

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return <ShieldCheck className="w-4 h-4 text-amber-400" />;
      case 'sales_cashier':
        return <ShoppingCart className="w-4 h-4 text-emerald-400" />;
      case 'inventory_manager':
        return <Boxes className="w-4 h-4 text-blue-400" />;
      case 'accountant':
        return <Receipt className="w-4 h-4 text-purple-400" />;
      default:
        return <User className="w-4 h-4 text-stone-400" />;
    }
  };

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return 'bg-amber-950/80 text-amber-300 border-amber-800/80';
      case 'sales_cashier':
        return 'bg-emerald-950/80 text-emerald-300 border-emerald-800/80';
      case 'inventory_manager':
        return 'bg-blue-950/80 text-blue-300 border-blue-800/80';
      case 'accountant':
        return 'bg-purple-950/80 text-purple-300 border-purple-800/80';
      default:
        return 'bg-stone-900 text-stone-300 border-stone-700';
    }
  };

  const getRoleScopeDescription = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return 'Full executive privileges • System setup, Users, Stock adjustments & Invoices';
      case 'sales_cashier':
        return 'POS Counter register, Cash & QR checkouts, Customer khata ledgers';
      case 'inventory_manager':
        return 'Inward purchase receipts, SKU catalog, Stock ledger & low-stock audits';
      case 'accountant':
        return 'Financial statements, VAT reports, Cashflow & Outstanding receivables/payables';
    }
  };

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col justify-between relative overflow-hidden font-sans selection:bg-emerald-600 selection:text-white">
      {/* Background Ambient Glows */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-emerald-900/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-amber-900/15 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header Bar */}
      <header className="px-5 sm:px-8 py-4 border-b border-stone-800/80 backdrop-blur-md bg-stone-950/70 relative z-10">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-800 flex items-center justify-center text-white shadow-lg shadow-emerald-950/60 ring-1 ring-emerald-500/30">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold text-stone-100 tracking-tight leading-tight">
                  {businessProfile.companyName || 'Himalayan Traders & Suppliers'}
                </h1>
                <span className="hidden sm:inline-flex text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-950 border border-emerald-800 text-emerald-400">
                  ERP & POS
                </span>
              </div>
              <p className="text-xs text-stone-400 font-medium">
                Sales, Purchase & Inventory Management • बिक्री, खरिद तथा मौज्दात व्यवस्थापन
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 text-xs text-stone-400 bg-stone-900/80 px-3 py-1.5 rounded-lg border border-stone-800">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-mono">{businessProfile.taxRegistrationNumber || 'PAN: 609823412'}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Login Workspace */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8 relative z-10 my-4 sm:my-6">
        <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 bg-stone-900/90 rounded-2xl border border-stone-800 shadow-2xl backdrop-blur-sm overflow-hidden">
          
          {/* Left Side: Login Form */}
          <div className="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-between">
            <div>
              {/* Header Badge */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-800/60 text-emerald-400 text-xs font-medium mb-4">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Sign In to Open App • प्रणाली पहुँच</span>
              </div>
              
              <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-100 tracking-tight">
                Welcome to OmniStock ERP
              </h2>
              <p className="text-sm text-stone-400 mt-1.5">
                Sign in with your staff account or PIN to open the dashboard, point of sale, and inventory catalog.
              </p>

              {/* Quick Autofill Buttons for rapid testing */}
              <div className="mt-5 pt-4 border-t border-stone-800/80">
                <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-stone-400 mb-2">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Quick Autofill Test Credentials:</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleAutofill('admin', 'admin')}
                    className="px-2.5 py-1.5 rounded-lg bg-stone-950/80 hover:bg-stone-800 text-[11px] font-medium text-stone-300 hover:text-white border border-stone-800 transition flex items-center justify-center gap-1 cursor-pointer"
                  >
                    👑 Admin
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAutofill('cashier', 'sales')}
                    className="px-2.5 py-1.5 rounded-lg bg-stone-950/80 hover:bg-stone-800 text-[11px] font-medium text-stone-300 hover:text-white border border-stone-800 transition flex items-center justify-center gap-1 cursor-pointer"
                  >
                    🛒 Cashier
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAutofill('storekeeper', 'store')}
                    className="px-2.5 py-1.5 rounded-lg bg-stone-950/80 hover:bg-stone-800 text-[11px] font-medium text-stone-300 hover:text-white border border-stone-800 transition flex items-center justify-center gap-1 cursor-pointer"
                  >
                    📦 Storekeeper
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAutofill('accountant', 'accounts')}
                    className="px-2.5 py-1.5 rounded-lg bg-stone-950/80 hover:bg-stone-800 text-[11px] font-medium text-stone-300 hover:text-white border border-stone-800 transition flex items-center justify-center gap-1 cursor-pointer"
                  >
                    📑 Accountant
                  </button>
                </div>
              </div>

              {/* Error Notification */}
              {error && (
                <div className="mt-4 p-3.5 rounded-xl bg-rose-950/70 border border-rose-800/80 text-rose-200 text-sm flex items-start gap-3 animate-in fade-in">
                  <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">{error}</p>
                    <p className="text-xs text-rose-300/80 mt-0.5">Tip: You can click any profile on the right for instant 1-click login.</p>
                  </div>
                </div>
              )}

              {/* Login Form */}
              <form onSubmit={handleSubmit} className="mt-5 space-y-4">
                <div>
                  <label 
                    htmlFor="login-username-input"
                    className="block text-xs font-semibold uppercase tracking-wider text-stone-300 mb-1.5"
                  >
                    Username or Email (प्रयोगकर्ता नाम वा इमेल)
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-500">
                      <User className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      id="login-username-input"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required
                      placeholder="e.g. admin, cashier, storekeeper, or email"
                      className="w-full pl-10 pr-4 py-2.5 bg-stone-950/80 border border-stone-700/80 rounded-xl text-stone-100 placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm transition"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label 
                      htmlFor="login-password-input"
                      className="block text-xs font-semibold uppercase tracking-wider text-stone-300"
                    >
                      Password or 4-Digit PIN (पासवर्ड वा पिन)
                    </label>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-500">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="login-password-input"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      placeholder="Enter password or 4-digit PIN"
                      className="w-full pl-10 pr-11 py-2.5 bg-stone-950/80 border border-stone-700/80 rounded-xl text-stone-100 placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm transition font-mono tracking-wide"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-stone-400 hover:text-stone-200 transition cursor-pointer"
                      title={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Remember Me Option */}
                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded border-stone-700 bg-stone-950 text-emerald-600 focus:ring-emerald-500 focus:ring-offset-stone-900"
                    />
                    <span className="text-xs text-stone-300">
                      Remember me on this browser
                    </span>
                  </label>

                  <span className="text-[11px] text-stone-500">
                    PIN supported
                  </span>
                </div>

                {/* Submit Action */}
                <button
                  type="submit"
                  id="btn-login-submit"
                  disabled={isLoading}
                  className="w-full mt-3 py-3 px-4 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-semibold rounded-xl text-sm transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/80 disabled:opacity-50 cursor-pointer"
                >
                  {isLoading ? (
                    <span className="inline-flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Authenticating Access...
                    </span>
                  ) : (
                    <>
                      <span>Open Workspace • लगइन गरी खोल्नुहोस्</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Bottom Security Note */}
            <div className="mt-6 pt-4 border-t border-stone-800/80 flex items-center justify-between text-xs text-stone-400">
              <span className="flex items-center gap-1.5 text-stone-300">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Role-Based Permission Security Guard
              </span>
              <span className="text-[11px] text-stone-500">
                Encrypted Session
              </span>
            </div>
          </div>

          {/* Right Side: Quick One-Click Access Cards */}
          <div className="lg:col-span-5 bg-stone-950/80 p-6 sm:p-8 border-t lg:border-t-0 lg:border-l border-stone-800/80 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-stone-300">
                  <KeyRound className="w-4 h-4 text-amber-400" />
                  <span>1-Click Fast Login (द्रुत खाताहरू)</span>
                </div>
                <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-950/80 border border-emerald-800/60 px-2 py-0.5 rounded">
                  Instant Test
                </span>
              </div>
              <p className="text-xs text-stone-400 mb-4 leading-relaxed">
                Click any staff profile below to sign in instantly with appropriate permissions:
              </p>

              {/* User Role Profiles */}
              <div className="space-y-3">
                {users.map((u) => (
                  <div
                    key={u.id}
                    className="p-3 rounded-xl bg-stone-900/90 hover:bg-stone-900 border border-stone-800 hover:border-emerald-600/60 transition group"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2.5">
                        <span 
                          className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-xs"
                          style={{ backgroundColor: u.avatarColor || '#3E4A3D' }}
                        >
                          {u.fullName.charAt(0)}
                        </span>
                        <div>
                          <div className="text-xs font-semibold text-stone-200 group-hover:text-emerald-300 transition leading-tight">
                            {u.fullName}
                          </div>
                          <div className="text-[10px] text-stone-400 font-mono">
                            @{u.username}
                          </div>
                        </div>
                      </div>

                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${getRoleBadgeColor(u.role)} flex items-center gap-1`}>
                        {getRoleIcon(u.role)}
                        {u.role.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>

                    <p className="text-[11px] text-stone-400 line-clamp-1 mb-2.5 pl-9">
                      {getRoleScopeDescription(u.role)}
                    </p>

                    <div className="flex items-center justify-between pt-2 border-t border-stone-800/60 text-[11px] text-stone-400 pl-9">
                      <div className="text-[10px] text-stone-400 font-mono">
                        Pass: <strong className="text-stone-300 font-mono">{u.password}</strong> | PIN: <strong className="text-stone-300 font-mono">{u.pin}</strong>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleQuickLogin(u.username, u.password || u.pin || '')}
                        disabled={isLoading}
                        className="px-2.5 py-1 rounded-md bg-emerald-950 hover:bg-emerald-900 text-emerald-300 hover:text-emerald-200 text-[11px] font-semibold border border-emerald-800/80 transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
                      >
                        <span>Sign In</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* System Feature Highlights */}
            <div className="mt-6 pt-4 border-t border-stone-800/80">
              <div className="grid grid-cols-2 gap-2 text-[11px] text-stone-400">
                <div className="flex items-center gap-1.5 text-stone-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>13% Nepal VAT Invoicing</span>
                </div>
                <div className="flex items-center gap-1.5 text-stone-300">
                  <QrCode className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>POS Fonepay QR & Cash</span>
                </div>
                <div className="flex items-center gap-1.5 text-stone-300">
                  <Boxes className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Real-time Stock Ledger</span>
                </div>
                <div className="flex items-center gap-1.5 text-stone-300">
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Customer & Vendor Khata</span>
                </div>
              </div>
            </div>

          </div>

        </div>
      </main>

      {/* Bottom Footer Bar */}
      <footer className="px-6 py-3.5 border-t border-stone-800/60 text-center text-xs text-stone-400 relative z-10 bg-stone-950/50">
        <p>
          {businessProfile.companyName} • OmniStock ERP Nepal • Authorized Personnel Only • {businessProfile.taxRegistrationNumber || 'PAN: 609823412'}
        </p>
      </footer>
    </div>
  );
};
