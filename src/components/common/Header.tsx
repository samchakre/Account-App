import React, { useState } from 'react';
import {
  Bell,
  Building2,
  Check,
  ChevronDown,
  CircleDollarSign,
  Download,
  Flame,
  Layers,
  LogOut,
  Menu,
  Package,
  Plus,
  RotateCcw,
  Search,
  Settings,
  ShieldCheck,
  ShoppingCart,
  SlidersHorizontal,
  TrendingDown,
  TrendingUp,
  Truck,
  User,
  Users,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatCurrency } from '../../utils/formatters';
import { NepaliDateWidget } from './NepaliDateWidget';

interface HeaderProps {
  onOpenSettings?: () => void;
  onQuickNewSale?: () => void;
  onQuickNewPO?: () => void;
  onQuickAddProduct?: () => void;
  onToggleMobileMenu?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenSettings,
  onQuickNewSale,
  onQuickNewPO,
  onQuickAddProduct,
  onToggleMobileMenu,
}) => {
  const { 
    businessProfile, 
    metrics, 
    products, 
    setActiveTab, 
    activeTab,
    currentUser,
    users,
    logout,
    switchUser,
  } = useApp();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);


  // Critical alerts: Low stock & Out of stock products
  const criticalStockItems = products.filter(
    (p) => p.status === 'active' && p.currentStock <= p.minReorderLevel
  );

  const getPageTitle = () => {
    switch (activeTab) {
      case 'dashboard':
        return 'Executive Overview';
      case 'pos':
        return 'POS Checkout Register';
      case 'sales':
        return 'Sales & Invoicing';
      case 'purchases':
        return 'Purchases (खरिद) & Inbound Stock';
      case 'products':
        return 'Product Catalog';
      case 'inventory_movements':
        return 'Stock Ledger & Audit';
      case 'categories':
        return 'Product Categories';
      case 'customers':
        return 'Customer Directory';
      case 'vendors':
        return 'Supplier & Vendor Accounts';
      case 'payments':
        return 'Cash & Treasury Ledger';
      case 'reports':
        return 'Financial Intelligence';
      case 'settings':
        return 'System Preferences';
      default:
        return 'Management Overview';
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-[#E6E4DF] shadow-xs">
      <div className="px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="flex items-center justify-between gap-4">
          {/* Left: Mobile Toggle & Page Title */}
          <div className="flex items-center gap-3 min-w-0">
            {onToggleMobileMenu && (
              <button
                onClick={onToggleMobileMenu}
                className="lg:hidden p-2 rounded-xl text-[#3E4A3D] hover:bg-[#F3F1ED] transition-colors"
                aria-label="Open menu"
              >
                <Menu className="w-5 h-5" />
              </button>
            )}
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-serif italic text-[#3E4A3D] truncate tracking-tight">
                {getPageTitle()}
              </h1>
              <p className="text-xs text-[#8A8882] truncate hidden sm:block">
                {businessProfile.companyName} • {businessProfile.tagline}
              </p>
            </div>
          </div>

          {/* Center: Quick Natural Metric Highlights */}
          <div className="hidden xl:flex items-center gap-4 py-1.5 px-4 bg-[#FDFCF9] border border-[#E6E4DF] rounded-full text-xs shadow-xs">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#3E4A3D]"></span>
              <span className="text-[#8A8882] font-medium">Revenue:</span>
              <span className="font-bold text-[#3E4A3D]">
                {formatCurrency(metrics.totalRevenue, businessProfile.currencySymbol)}
              </span>
            </div>
            <div className="h-3.5 w-px bg-[#E6E4DF]"></div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#A7C4BC]"></span>
              <span className="text-[#8A8882] font-medium">Valuation:</span>
              <span className="font-bold text-[#3E4A3D]">
                {formatCurrency(metrics.inventoryCostValue, businessProfile.currencySymbol)}
              </span>
            </div>
            <div className="h-3.5 w-px bg-[#E6E4DF]"></div>
            <div className="flex items-center gap-2">
              <span
                className={`w-2 h-2 rounded-full ${
                  metrics.lowStockCount + metrics.outOfStockCount > 0 ? 'bg-[#C97B5A] animate-pulse' : 'bg-[#A7C4BC]'
                }`}
              ></span>
              <span className="text-[#8A8882] font-medium">Stock Alerts:</span>
              <span className={`font-bold ${metrics.lowStockCount + metrics.outOfStockCount > 0 ? 'text-[#C97B5A]' : 'text-[#3E4A3D]'}`}>
                {metrics.lowStockCount + metrics.outOfStockCount} items
              </span>
            </div>
          </div>

          {/* Right Action Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Nepali Date (वि.सं.) & Converter */}
            <NepaliDateWidget />

            {/* Quick POS button */}
            <button
              id="header-pos-btn"
              onClick={() => setActiveTab('pos')}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs sm:text-sm font-medium transition-all shadow-xs ${
                activeTab === 'pos'
                  ? 'bg-[#3E4A3D] text-white'
                  : 'bg-[#A7C4BC]/25 text-[#3E4A3D] hover:bg-[#A7C4BC]/40 border border-[#A7C4BC]/40'
              }`}
            >
              <ShoppingCart className="w-4 h-4" />
              <span className="hidden sm:inline">POS Terminal</span>
              <span className="sm:hidden">POS</span>
            </button>

            {/* Quick Create Dropdown */}
            <div className="relative">
              <button
                id="header-quick-add-btn"
                onClick={() => setShowQuickActions(!showQuickActions)}
                className="flex items-center gap-2 px-5 py-2 bg-[#3E4A3D] hover:bg-[#2D362C] text-white rounded-full text-xs sm:text-sm font-medium shadow-xs transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">New Entry</span>
                <ChevronDown className="w-3.5 h-3.5 opacity-80" />
              </button>

              {showQuickActions && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowQuickActions(false)}
                  ></div>
                  <div className="absolute right-0 mt-2 w-60 bg-white border border-[#E6E4DF] rounded-3xl shadow-xl z-50 p-2 text-sm">
                    <button
                      onClick={() => {
                        setShowQuickActions(false);
                        if (onQuickNewSale) onQuickNewSale();
                        else setActiveTab('sales');
                      }}
                      className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-[#2D2D2A] hover:bg-[#F3F1ED] text-left transition-colors"
                    >
                      <div className="w-8 h-8 rounded-xl bg-[#A7C4BC]/30 text-[#3E4A3D] flex items-center justify-center shrink-0">
                        <ShoppingCart className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-semibold text-xs text-[#3E4A3D]">New Sales Invoice</div>
                        <div className="text-[11px] text-[#8A8882]">Sell products & deduct stock</div>
                      </div>
                    </button>
                    <button
                      onClick={() => {
                        setShowQuickActions(false);
                        if (onQuickNewPO) onQuickNewPO();
                        else setActiveTab('purchases');
                      }}
                      className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-[#2D2D2A] hover:bg-[#F3F1ED] text-left transition-colors"
                    >
                      <div className="w-8 h-8 rounded-xl bg-[#3E4A3D]/15 text-[#3E4A3D] flex items-center justify-center shrink-0">
                        <Truck className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-semibold text-xs text-[#3E4A3D]">New Purchase (खरिद)</div>
                        <div className="text-[11px] text-[#8A8882]">Buy stock & increment inventory</div>
                      </div>
                    </button>
                    <div className="h-px bg-[#E6E4DF] my-1"></div>
                    <button
                      onClick={() => {
                        setShowQuickActions(false);
                        if (onQuickAddProduct) onQuickAddProduct();
                        else setActiveTab('products');
                      }}
                      className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-[#2D2D2A] hover:bg-[#F3F1ED] text-left transition-colors"
                    >
                      <div className="w-8 h-8 rounded-xl bg-[#C97B5A]/20 text-[#C97B5A] flex items-center justify-center shrink-0">
                        <Package className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-semibold text-xs text-[#3E4A3D]">Add New Product</div>
                        <div className="text-[11px] text-[#8A8882]">Register SKU, price & stock</div>
                      </div>
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Low Stock Alerts Notification Bell */}
            <div className="relative">
              <button
                id="header-notifications-btn"
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2.5 text-[#3E4A3D] hover:bg-[#F3F1ED] rounded-full transition-colors border border-[#E6E4DF]"
                aria-label="Stock Notifications"
              >
                <Bell className="w-4 h-4" />
                {criticalStockItems.length > 0 && (
                  <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-4 h-4 px-1 rounded-full bg-[#C97B5A] text-white text-[10px] font-bold ring-2 ring-white">
                    {criticalStockItems.length}
                  </span>
                )}
              </button>

              {showNotifications && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowNotifications(false)}
                  ></div>
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-[#E6E4DF] rounded-3xl shadow-xl z-50 p-4 text-sm">
                    <div className="pb-3 border-b border-[#E6E4DF] flex items-center justify-between">
                      <div className="font-semibold font-serif italic text-sm text-[#3E4A3D] flex items-center gap-1.5">
                        <Flame className="w-4 h-4 text-[#C97B5A]" />
                        Stock & Reorder Alerts
                      </div>
                      <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-[#C97B5A]/15 text-[#C97B5A] font-semibold border border-[#C97B5A]/25">
                        {criticalStockItems.length} require action
                      </span>
                    </div>
                    <div className="max-h-72 overflow-y-auto divide-y divide-[#F3F1ED] my-2">
                      {criticalStockItems.length === 0 ? (
                        <div className="py-8 text-center text-[#8A8882] text-xs">
                          All products are healthy above min reorder levels! 🌿
                        </div>
                      ) : (
                        criticalStockItems.map((prod) => (
                          <div
                            key={prod.id}
                            className="py-3 hover:bg-[#FDFCF9] px-2 rounded-xl transition-colors flex items-center justify-between gap-3"
                          >
                            <div className="min-w-0">
                              <div className="font-semibold text-[#2D2D2A] text-xs truncate">
                                {prod.name}
                              </div>
                              <div className="text-[11px] text-[#8A8882] flex items-center gap-2 mt-0.5">
                                <code className="text-[#3E4A3D] font-mono">{prod.sku}</code>
                                <span>•</span>
                                <span
                                  className={
                                    prod.currentStock === 0
                                      ? 'text-[#C97B5A] font-bold'
                                      : 'text-[#C97B5A] font-semibold'
                                  }
                                >
                                  {prod.currentStock === 0
                                    ? 'Out of Stock (0)'
                                    : `${prod.currentStock} ${prod.unit} left (Min: ${prod.minReorderLevel})`}
                                </span>
                              </div>
                            </div>
                            <button
                              onClick={() => {
                                setShowNotifications(false);
                                if (onQuickNewPO) onQuickNewPO();
                                else setActiveTab('purchases');
                              }}
                              className="shrink-0 px-3 py-1 bg-[#A7C4BC]/30 hover:bg-[#A7C4BC]/50 text-[#3E4A3D] text-xs font-semibold rounded-full border border-[#A7C4BC]/40 transition-colors"
                            >
                              Restock
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                    <div className="pt-3 border-t border-[#E6E4DF] text-center">
                      <button
                        onClick={() => {
                          setShowNotifications(false);
                          setActiveTab('products');
                        }}
                        className="text-xs text-[#3E4A3D] font-semibold hover:underline"
                      >
                        View Full Inventory Table →
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Settings Modal Button */}
            <button
              id="header-settings-btn"
              onClick={onOpenSettings || (() => setActiveTab('settings'))}
              className="p-2.5 text-[#3E4A3D] hover:bg-[#F3F1ED] rounded-full transition-colors border border-[#E6E4DF]"
              title="ERP Settings"
            >
              <Settings className="w-4 h-4" />
            </button>

            {/* Current User & Logout Menu */}
            {currentUser && (
              <div className="relative">
                <button
                  id="header-user-btn"
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 pl-1 pr-3 py-1 bg-[#FDFCF9] hover:bg-[#F3F1ED] border border-[#E6E4DF] rounded-full transition-all shadow-xs"
                >
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-white font-bold text-xs shadow-2xs"
                    style={{ backgroundColor: currentUser.avatarColor || '#3E4A3D' }}
                  >
                    {currentUser.fullName.charAt(0)}
                  </div>
                  <div className="text-left hidden md:block">
                    <div className="text-xs font-bold text-[#2D2D2A] leading-tight truncate max-w-[110px]">
                      {currentUser.fullName}
                    </div>
                    <div className="text-[10px] text-[#8A8882] capitalize leading-none">
                      {currentUser.role.replace('_', ' ')}
                    </div>
                  </div>
                  <ChevronDown className="w-3 h-3 text-[#8A8882] hidden md:block" />
                </button>

                {showUserMenu && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setShowUserMenu(false)}
                    ></div>
                    <div className="absolute right-0 mt-2 w-72 bg-white border border-[#E6E4DF] rounded-3xl shadow-xl z-50 p-4 text-sm animate-in fade-in zoom-in-95 duration-150">
                      {/* User Header */}
                      <div className="flex items-center gap-3 pb-3 border-b border-[#E6E4DF]">
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-xs"
                          style={{ backgroundColor: currentUser.avatarColor || '#3E4A3D' }}
                        >
                          {currentUser.fullName.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-[#2D2D2A] text-sm truncate">
                            {currentUser.fullName}
                          </div>
                          <div className="text-xs text-[#8A8882] font-mono">
                            @{currentUser.username}
                          </div>
                          <div className="mt-1">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#A7C4BC]/25 text-[#3E4A3D] border border-[#A7C4BC]/40 uppercase tracking-wider">
                              <ShieldCheck className="w-3 h-3" />
                              {currentUser.role.replace('_', ' ')}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Quick Switch (Admin or Testing) */}
                      <div className="py-2.5">
                        <div className="text-[10px] font-semibold text-[#8A8882] uppercase tracking-wider px-1 mb-1.5">
                          Quick Switch Account (Demo)
                        </div>
                        <div className="space-y-1">
                          {users
                            .filter((u) => u.status === 'active')
                            .map((u) => {
                              const isSelf = u.id === currentUser.id;
                              return (
                                <button
                                  key={u.id}
                                  onClick={() => {
                                    switchUser(u.id);
                                    setShowUserMenu(false);
                                  }}
                                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs transition ${
                                    isSelf
                                      ? 'bg-[#3E4A3D]/10 text-[#3E4A3D] font-bold'
                                      : 'text-stone-700 hover:bg-stone-50'
                                  }`}
                                >
                                  <div className="flex items-center gap-2">
                                    <div
                                      className="w-5 h-5 rounded-full text-[10px] text-white flex items-center justify-center font-bold shrink-0"
                                      style={{ backgroundColor: u.avatarColor || '#3E4A3D' }}
                                    >
                                      {u.fullName.charAt(0)}
                                    </div>
                                    <span className="truncate">{u.fullName}</span>
                                  </div>
                                  {isSelf ? (
                                    <Check className="w-3.5 h-3.5 text-[#3E4A3D]" />
                                  ) : (
                                    <span className="text-[10px] text-stone-600 capitalize">
                                      {u.role.replace('_', ' ')}
                                    </span>
                                  )}
                                </button>
                              );
                            })}
                        </div>
                      </div>

                      {/* Logout Button */}
                      <div className="pt-2 border-t border-[#E6E4DF]">
                        <button
                          onClick={() => {
                            setShowUserMenu(false);
                            logout();
                          }}
                          className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold border border-rose-200 transition cursor-pointer"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>Sign Out / Logout (लगआउट)</span>
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

          </div>
        </div>
      </div>
    </header>
  );
};
