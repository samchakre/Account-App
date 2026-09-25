import React from 'react';
import {
  Boxes,
  CreditCard,
  FolderTree,
  LayoutDashboard,
  LogOut,
  Package,
  Receipt,
  Settings,
  ShoppingCart,
  Sparkles,
  TrendingUp,
  Truck,
  Users,
  X,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ActiveTab } from '../../types';

interface SidebarProps {
  mobileOpen?: boolean;
  setMobileOpen?: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ mobileOpen = false, setMobileOpen }) => {
  const { 
    activeTab, 
    setActiveTab, 
    metrics, 
    salesOrders, 
    purchaseOrders, 
    businessProfile,
    currentUser,
    logout,
    canAccessTab
  } = useApp();

  const unpaidInvoicesCount = salesOrders.filter((s) => s.paymentStatus !== 'paid' && s.status !== 'cancelled').length;
  const unpaidPurchasesCount = purchaseOrders.filter((p) => p.paymentStatus !== 'paid' && p.status !== 'cancelled').length;


  const navItems: {
    id: ActiveTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number | string;
    badgeColor?: string;
    group?: string;
  }[] = [
    {
      id: 'dashboard',
      label: 'Executive Dashboard',
      icon: LayoutDashboard,
      group: 'OVERVIEW',
    },
    {
      id: 'pos',
      label: 'POS Register',
      icon: ShoppingCart,
      badge: 'Fast',
      badgeColor: 'bg-[#A7C4BC]/30 text-[#F4F1EA] border-[#A7C4BC]/40',
      group: 'OPERATIONS',
    },
    {
      id: 'sales',
      label: 'Sales & Invoices',
      icon: Receipt,
      badge: unpaidInvoicesCount > 0 ? `${unpaidInvoicesCount} due` : undefined,
      badgeColor: 'bg-[#C97B5A]/30 text-[#F4F1EA] border-[#C97B5A]/40',
      group: 'OPERATIONS',
    },
    {
      id: 'purchases',
      label: 'Purchases (खरिद)',
      icon: Truck,
      badge: unpaidPurchasesCount > 0 ? `${unpaidPurchasesCount} due` : undefined,
      badgeColor: 'bg-[#D4A373]/30 text-[#F4F1EA] border-[#D4A373]/40',
      group: 'OPERATIONS',
    },
    {
      id: 'products',
      label: 'Product Catalog',
      icon: Package,
      badge: metrics.lowStockCount > 0 ? `${metrics.lowStockCount} low` : undefined,
      badgeColor: 'bg-[#C97B5A]/30 text-[#F4F1EA] border-[#C97B5A]/40',
      group: 'INVENTORY',
    },
    {
      id: 'inventory_movements',
      label: 'Stock Ledger & Audit',
      icon: Boxes,
      group: 'INVENTORY',
    },
    {
      id: 'categories',
      label: 'Categories',
      icon: FolderTree,
      group: 'INVENTORY',
    },
    {
      id: 'customers',
      label: 'Customers (CRM)',
      icon: Users,
      group: 'DIRECTORY & FINANCE',
    },
    {
      id: 'vendors',
      label: 'Suppliers & Vendors',
      icon: Users,
      group: 'DIRECTORY & FINANCE',
    },
    {
      id: 'payments',
      label: 'Payments & Treasury',
      icon: CreditCard,
      group: 'DIRECTORY & FINANCE',
    },
    {
      id: 'reports',
      label: 'Reports & Analytics',
      icon: TrendingUp,
      group: 'DIRECTORY & FINANCE',
    },
    {
      id: 'settings',
      label: 'ERP Settings',
      icon: Settings,
      group: 'DIRECTORY & FINANCE',
    },
  ];

  const handleSelect = (tab: ActiveTab) => {
    setActiveTab(tab);
    if (setMobileOpen) {
      setMobileOpen(false);
    }
  };

  return (
    <>
      {/* Mobile overlay backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-[#2D2D2A]/60 backdrop-blur-xs lg:hidden"
          onClick={() => setMobileOpen && setMobileOpen(false)}
        />
      )}

      <aside
        id="app-sidebar"
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-[#3E4A3D] text-[#F4F1EA] flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        } border-r border-[#2D362C]/40 shadow-xl lg:shadow-none`}
      >
        {/* Sidebar Header: Botanical Evergreen Brand */}
        <div className="h-20 flex items-center justify-between px-6 border-b border-[#F4F1EA]/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#A7C4BC] rounded-xl flex items-center justify-center shadow-xs">
              <div className="w-4 h-4 border-2 border-[#3E4A3D] rotate-45"></div>
            </div>
            <div>
              <div className="text-lg font-semibold tracking-tight italic font-serif text-[#F4F1EA]">
                {businessProfile.companyName || 'Evergreen'}
              </div>
              <div className="text-[10px] uppercase tracking-widest text-[#A7C4BC] font-medium">
                Natural ERP Suite
              </div>
            </div>
          </div>
          {setMobileOpen && (
            <button
              onClick={() => setMobileOpen(false)}
              className="lg:hidden p-1.5 rounded-lg text-[#F4F1EA]/70 hover:text-white hover:bg-[#F4F1EA]/10"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Navigation List */}
        <div className="flex-1 overflow-y-auto px-3.5 py-5 space-y-6">
          {['OVERVIEW', 'OPERATIONS', 'INVENTORY', 'DIRECTORY & FINANCE'].map((group) => {
            const groupItems = navItems.filter((i) => i.group === group && canAccessTab(i.id));
            if (!groupItems.length) return null;

            return (
              <div key={group}>
                <div className="px-3 mb-2 text-[10px] font-semibold tracking-widest text-[#A7C4BC]/80 uppercase">
                  {group}
                </div>
                <div className="space-y-1">
                  {groupItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        id={`sidebar-nav-${item.id}`}
                        onClick={() => handleSelect(item.id)}
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                          isActive
                            ? 'bg-[#F4F1EA]/15 text-white font-semibold shadow-xs ring-1 ring-[#A7C4BC]/40'
                            : 'text-[#F4F1EA]/75 hover:bg-[#F4F1EA]/10 hover:text-white'
                        }`}
                      >
                        <div className="flex items-center gap-3 truncate">
                          <Icon
                            className={`w-4 h-4 shrink-0 ${
                              isActive ? 'text-[#A7C4BC]' : 'text-[#F4F1EA]/60'
                            }`}
                          />
                          <span className="truncate">{item.label}</span>
                        </div>
                        {item.badge !== undefined && (
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-bold border shrink-0 ${
                              item.badgeColor || 'bg-[#F4F1EA]/10 text-[#F4F1EA] border-[#F4F1EA]/20'
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Sidebar Footer: Logged in User & Logout */}
        {currentUser && (
          <div className="p-3.5 border-t border-[#F4F1EA]/10 bg-[#2D362C]/50">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs shadow-xs shrink-0"
                  style={{ backgroundColor: currentUser.avatarColor || '#5B7059' }}
                >
                  {currentUser.fullName.charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-[#F4F1EA] truncate">
                    {currentUser.fullName}
                  </p>
                  <p className="text-[10px] text-[#A7C4BC] capitalize truncate">
                    {currentUser.role.replace('_', ' ')}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => logout()}
                className="p-1.5 rounded-lg text-[#F4F1EA]/60 hover:text-rose-300 hover:bg-[#F4F1EA]/10 transition shrink-0"
                title="Logout / Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

      </aside>
    </>
  );
};
