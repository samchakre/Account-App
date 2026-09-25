import React, { useState } from 'react';
import { Header } from './components/common/Header';
import { Sidebar } from './components/common/Sidebar';
import { CategoriesView } from './components/categories/CategoriesView';
import { CustomersView } from './components/customers/CustomersView';
import { DashboardView } from './components/dashboard/DashboardView';
import { InventoryStockView } from './components/inventory/InventoryStockView';
import { InvoiceModal } from './components/modals/InvoiceModal';
import { PaymentsView } from './components/payments/PaymentsView';
import { POSView } from './components/pos/POSView';
import { ProductsView } from './components/products/ProductsView';
import { PurchasesView } from './components/purchases/PurchasesView';
import { ReportsView } from './components/reports/ReportsView';
import { SalesView } from './components/sales/SalesView';
import { CreateSalesModal } from './components/sales/CreateSalesModal';
import { SettingsView } from './components/settings/SettingsView';
import { VendorsView } from './components/vendors/VendorsView';
import { LoginView } from './components/auth/LoginView';
import { AppProvider, useApp } from './context/AppContext';
import { SalesOrder } from './types';

const AppContent: React.FC = () => {
  const { 
    currentUser, 
    activeTab, 
    setActiveTab, 
    activeInvoiceForModal, 
    setActiveInvoiceForModal,
    canAccessTab 
  } = useApp();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [editingInvoiceOrder, setEditingInvoiceOrder] = useState<SalesOrder | null>(null);

  // If user is not authenticated, render Login Screen
  if (!currentUser) {
    return <LoginView />;
  }

  const renderActiveView = () => {
    // Role check guard: If current user doesn't have permission for this tab
    if (!canAccessTab(activeTab)) {
      return (
        <div className="p-8 text-center bg-white rounded-3xl border border-stone-200 shadow-xs max-w-lg mx-auto my-12">
          <h3 className="text-lg font-bold text-stone-900 mb-1">Access Restricted (अनुमति छैन)</h3>
          <p className="text-xs text-stone-600 mb-4">
            Your assigned role (<strong>{currentUser.role.replace('_', ' ')}</strong>) does not have access permission for this module. Please contact the administrator.
          </p>
          <button
            onClick={() => setActiveTab(currentUser.role === 'sales_cashier' ? 'pos' : 'dashboard')}
            className="px-4 py-2 bg-[#3E4A3D] text-white text-xs font-semibold rounded-full shadow-xs"
          >
            Go to My Home Screen
          </button>
        </div>
      );
    }

    switch (activeTab) {
      case 'dashboard':
        return <DashboardView />;
      case 'products':
        return <ProductsView />;
      case 'categories':
        return <CategoriesView />;
      case 'inventory':
      case 'inventory_movements':
        return <InventoryStockView />;
      case 'sales':
        return <SalesView />;
      case 'pos':
        return <POSView />;
      case 'purchases':
        return <PurchasesView />;
      case 'customers':
        return <CustomersView />;
      case 'vendors':
        return <VendorsView />;
      case 'payments':
        return <PaymentsView />;
      case 'reports':
        return <ReportsView />;
      case 'settings':
        return <SettingsView />;
      default:
        return <DashboardView />;
    }
  };


  return (
    <div className="flex min-h-screen bg-[#FAF9F6] text-[#2D2D2A] font-sans antialiased selection:bg-[#3E4A3D] selection:text-[#F4F1EA]">
      {/* Sidebar Navigation */}
      <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />

      {/* Main Content Viewport */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64 transition-all">
        {/* Sticky Header */}
        <Header
          onToggleMobileMenu={() => setMobileOpen(true)}
          onOpenSettings={() => setActiveTab('settings')}
          onQuickNewSale={() => setActiveTab('sales')}
          onQuickNewPO={() => setActiveTab('purchases')}
          onQuickAddProduct={() => setActiveTab('products')}
        />

        {/* Dynamic Route View */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {renderActiveView()}
        </main>
      </div>

      {/* Global Printable Invoice Modal */}
      <InvoiceModal
        isOpen={!!activeInvoiceForModal}
        onClose={() => setActiveInvoiceForModal(null)}
        order={activeInvoiceForModal}
        onEditInvoice={(order) => {
          setActiveInvoiceForModal(null);
          setEditingInvoiceOrder(order);
        }}
      />

      {/* Global Edit Sales Invoice Modal (Admin Only) */}
      <CreateSalesModal
        isOpen={!!editingInvoiceOrder}
        onClose={() => setEditingInvoiceOrder(null)}
        orderToEdit={editingInvoiceOrder}
      />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
