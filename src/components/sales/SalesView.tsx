import React, { useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowDownRight,
  CheckCircle2,
  Clock,
  CreditCard,
  DollarSign,
  Download,
  Eye,
  FileText,
  Filter,
  Pencil,
  Plus,
  Printer,
  Receipt,
  Search,
  ShoppingCart,
  Trash2,
  TrendingUp,
  XCircle,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { PaymentStatus, SalesOrder } from '../../types';
import { exportToCSV, formatCurrency, formatDate, formatNepaliDate, getPaymentStatusBadge } from '../../utils/formatters';
import { CreateSalesModal } from './CreateSalesModal';
import { RecordCustomerPaymentModal } from './RecordCustomerPaymentModal';
import { ConfirmModal } from '../common/ConfirmModal';

export const SalesView: React.FC = () => {
  const { salesOrders, customers, businessProfile, setActiveInvoiceForModal, setActiveTab, deleteSalesOrder, currentUser } = useApp();

  const isAdmin = currentUser?.role === 'admin';

  const [searchQuery, setSearchQuery] = useState('');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [orderToEdit, setOrderToEdit] = useState<SalesOrder | null>(null);
  const [payTargetOrder, setPayTargetOrder] = useState<SalesOrder | null>(null);
  const [orderToDelete, setOrderToDelete] = useState<SalesOrder | null>(null);

  // Filtered sales orders
  const filteredOrders = useMemo(() => {
    return salesOrders.filter((order) => {
      const matchesSearch =
        order.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (order.customerPhone && order.customerPhone.includes(searchQuery));

      const matchesPayment = paymentFilter === 'all' || order.paymentStatus === paymentFilter;
      const matchesStatus = statusFilter === 'all' || order.status === statusFilter;

      return matchesSearch && matchesPayment && matchesStatus;
    });
  }, [salesOrders, searchQuery, paymentFilter, statusFilter]);

  // Aggregate Metrics
  const metrics = useMemo(() => {
    let totalRevenue = 0;
    let totalReceived = 0;
    let totalPendingReceivable = 0;
    let totalProfit = 0;

    salesOrders.forEach((so) => {
      if (so.status !== 'cancelled') {
        totalRevenue += so.grandTotal;
        totalReceived += so.paidAmount;
        totalPendingReceivable += Math.max(0, so.grandTotal - so.paidAmount);
        totalProfit += so.grossProfit || 0;
      }
    });

    return {
      totalRevenue,
      totalReceived,
      totalPendingReceivable,
      totalProfit,
    };
  }, [salesOrders]);

  const handleExportCSV = () => {
    const data = filteredOrders.map((so) => ({
      InvoiceNumber: so.invoiceNumber,
      Customer: so.customerName,
      InvoiceDateAD: so.orderDate,
      InvoiceMitiBS: formatNepaliDate(so.orderDate, { format: 'standard', language: 'np' }),
      ItemsCount: so.items.length,
      Subtotal: so.subtotal,
      Tax: so.taxTotal,
      Discount: so.discountTotal,
      GrandTotal: so.grandTotal,
      PaidAmount: so.paidAmount,
      BalanceDue: Math.max(0, so.grandTotal - so.paidAmount),
      PaymentStatus: so.paymentStatus,
      FulfillmentStatus: so.status,
      PaymentMethod: so.paymentMethod,
    }));
    exportToCSV(`sales_invoices_${new Date().toISOString().split('T')[0]}`, data);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-serif italic text-[#3E4A3D]">Sales Invoices & Billing</h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#A7C4BC]/20 text-[#3E4A3D] border border-[#A7C4BC]/30">
              {filteredOrders.length} Invoices
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#8A8882] mt-0.5">
            Manage wholesale orders, counter POS receipts, client receivables, and automated tax calculations.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setActiveTab('pos')}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#A7C4BC]/20 hover:bg-[#A7C4BC]/30 text-[#3E4A3D] text-xs font-semibold rounded-full border border-[#A7C4BC]/40 shadow-xs transition-colors"
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            Open POS Register
          </button>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-[#FDFCF9] text-[#3E4A3D] text-xs font-semibold rounded-full border border-[#E6E4DF] shadow-xs transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-[#8A8882]" />
            Export CSV
          </button>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-1.5 px-5 py-2 bg-[#3E4A3D] hover:bg-[#2D362C] text-white text-xs font-semibold rounded-full shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Sales Invoice
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-[#E6E4DF] shadow-xs">
          <span className="text-[10px] font-semibold text-[#8A8882] uppercase tracking-wider block">
            Total Billed Invoices
          </span>
          <div className="text-xl font-bold font-mono text-[#3E4A3D] mt-2">
            {formatCurrency(metrics.totalRevenue, businessProfile.currencySymbol)}
          </div>
          <span className="text-[11px] text-[#8A8882] mt-0.5 block">
            From {salesOrders.length} total orders
          </span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-[#E6E4DF] shadow-xs">
          <span className="text-[10px] font-semibold text-[#8A8882] uppercase tracking-wider block">
            Collected Cash
          </span>
          <div className="text-xl font-bold font-mono text-[#3E4A3D] mt-2">
            {formatCurrency(metrics.totalReceived, businessProfile.currencySymbol)}
          </div>
          <span className="text-[11px] text-[#8A8882] mt-0.5 block font-medium">
            Deposited into accounts
          </span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-[#E6E4DF] shadow-xs">
          <span className="text-[10px] font-semibold text-[#8A8882] uppercase tracking-wider block">
            Pending Receivables
          </span>
          <div className="text-xl font-bold font-mono text-[#C97B5A] mt-2">
            {formatCurrency(metrics.totalPendingReceivable, businessProfile.currencySymbol)}
          </div>
          <span className="text-[11px] text-[#C97B5A] mt-0.5 block font-medium">
            Awaiting client settlement
          </span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-[#E6E4DF] shadow-xs">
          <span className="text-[10px] font-semibold text-[#8A8882] uppercase tracking-wider block">
            Gross Profit Realized
          </span>
          <div className="text-xl font-bold font-mono text-[#3E4A3D] mt-2">
            {formatCurrency(metrics.totalProfit, businessProfile.currencySymbol)}
          </div>
          <span className="text-[11px] text-[#8A8882] mt-0.5 block font-medium">
            Margin: {(metrics.totalRevenue > 0 ? (metrics.totalProfit / metrics.totalRevenue) * 100 : 0).toFixed(1)}%
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-3xl border border-[#E6E4DF] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8A8882]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by invoice number (e.g. INV-2025-001) or customer name..."
            className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm border border-[#E6E4DF] rounded-full focus:ring-2 focus:ring-[#3E4A3D] bg-[#FDFCF9] text-[#2D2D2A]"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto text-xs">
          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="px-4 py-2 border border-[#E6E4DF] rounded-full focus:ring-2 focus:ring-[#3E4A3D] bg-white font-semibold text-[#2D2D2A]"
          >
            <option value="all">All Payment Statuses</option>
            <option value="paid">Fully Paid</option>
            <option value="partial">Partially Paid</option>
            <option value="unpaid">Unpaid / Overdue</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-[#E6E4DF] rounded-full focus:ring-2 focus:ring-[#3E4A3D] bg-white font-semibold text-[#2D2D2A]"
          >
            <option value="all">All Order Statuses</option>
            <option value="fulfilled">Fulfilled / Dispatched</option>
            <option value="confirmed">Confirmed</option>
            <option value="draft">Draft</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-3xl border border-[#E6E4DF] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FDFCF9] text-[#8A8882] font-semibold text-[10px] uppercase tracking-wider border-b border-[#E6E4DF]">
              <tr>
                <th className="px-5 py-3.5 font-semibold">Invoice #</th>
                <th className="px-5 py-3.5 font-semibold">Customer</th>
                <th className="px-5 py-3.5 font-semibold">Date (मिति) & Due</th>
                <th className="px-5 py-3.5 font-semibold">Items</th>
                <th className="px-5 py-3.5 font-semibold">Grand Total</th>
                <th className="px-5 py-3.5 font-semibold">Paid / Balance</th>
                <th className="px-5 py-3.5 font-semibold">Payment</th>
                <th className="px-5 py-3.5 font-semibold">Status</th>
                <th className="px-5 py-3.5 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F3F1ED]">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-[#8A8882]">
                    No sales invoices found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((so) => {
                  const payBadge = getPaymentStatusBadge(so.paymentStatus);
                  const balanceDue = Math.max(0, so.grandTotal - so.paidAmount);

                  return (
                    <tr key={so.id} className="hover:bg-[#FDFCF9] transition-colors">
                      <td className="px-5 py-3.5 font-mono font-bold text-[#3E4A3D]">
                        {so.invoiceNumber}
                      </td>

                      <td className="px-5 py-3.5">
                        <div className="font-bold text-[#2D2D2A]">{so.customerName}</div>
                        {so.customerPhone && (
                          <div className="text-[11px] text-[#8A8882]">{so.customerPhone}</div>
                        )}
                      </td>

                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <div className="font-bold text-[#3E4A3D] font-mono text-xs">
                          {formatNepaliDate(so.orderDate, { format: 'standard', language: 'np' })}
                        </div>
                        <div className="text-[10px] text-[#8A8882]">
                          {formatDate(so.orderDate)}
                        </div>
                      </td>

                      <td className="px-5 py-3.5 text-[#8A8882] font-medium">
                        {so.items.length} items (
                        {so.items.reduce((s, i) => s + i.quantity, 0)} units)
                      </td>

                      <td className="px-5 py-3.5 font-bold font-mono text-[#3E4A3D] text-sm">
                        {formatCurrency(so.grandTotal, businessProfile.currencySymbol)}
                      </td>

                      <td className="px-5 py-3.5">
                        <div className="font-bold font-mono text-[#3E4A3D]">
                          {formatCurrency(so.paidAmount, businessProfile.currencySymbol)}
                        </div>
                        {balanceDue > 0 && (
                          <div className="text-[11px] font-semibold text-[#C97B5A] font-mono">
                            Due: {formatCurrency(balanceDue, businessProfile.currencySymbol)}
                          </div>
                        )}
                      </td>

                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                            so.paymentStatus === 'paid'
                              ? 'bg-[#A7C4BC]/30 text-[#2D362C] border border-[#A7C4BC]/40'
                              : so.paymentStatus === 'partial'
                              ? 'bg-[#D4A373]/25 text-[#9C6644] border border-[#D4A373]/30'
                              : 'bg-[#C97B5A]/20 text-[#C97B5A] border border-[#C97B5A]/30'
                          }`}
                        >
                          {payBadge.label}
                        </span>
                      </td>

                      <td className="px-5 py-3.5">
                        <span className="capitalize font-semibold text-[#8A8882] bg-[#F3F1ED] px-2.5 py-0.5 rounded-full text-[11px]">
                          {so.status}
                        </span>
                      </td>

                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {balanceDue > 0 && (
                            <button
                              onClick={() => setPayTargetOrder(so)}
                              className="px-3 py-1 bg-[#A7C4BC]/20 hover:bg-[#A7C4BC]/30 text-[#3E4A3D] text-[11px] font-semibold rounded-full transition-colors flex items-center gap-1 border border-[#A7C4BC]/30"
                              title="Record Payment"
                            >
                              <CreditCard className="w-3 h-3" /> Pay
                            </button>
                          )}
                          {isAdmin && (
                            <button
                              onClick={() => setOrderToEdit(so)}
                              className="p-1.5 text-[#8A8882] hover:text-amber-700 hover:bg-amber-50 rounded-full transition-colors"
                              title="Edit Sales Invoice (Admin Only)"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => setActiveInvoiceForModal(so)}
                            className="p-1.5 text-[#8A8882] hover:text-[#3E4A3D] hover:bg-[#F3F1ED] rounded-full transition-colors"
                            title="View / Print Tax Invoice"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setOrderToDelete(so)}
                            className="p-1.5 text-[#8A8882] hover:text-[#C97B5A] hover:bg-[#C97B5A]/10 rounded-full transition-colors"
                            title="Delete Sales Transaction"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Sales Modal */}
      <CreateSalesModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />

      {/* Edit Sales Modal (Admin Only) */}
      <CreateSalesModal
        isOpen={!!orderToEdit}
        onClose={() => setOrderToEdit(null)}
        orderToEdit={orderToEdit}
      />

      {/* Customer Payment Settle Modal */}
      <RecordCustomerPaymentModal
        isOpen={!!payTargetOrder}
        onClose={() => setPayTargetOrder(null)}
        initialOrder={payTargetOrder}
      />

      {/* Delete Sales Order Confirmation Modal */}
      <ConfirmModal
        isOpen={!!orderToDelete}
        onClose={() => setOrderToDelete(null)}
        onConfirm={() => {
          if (orderToDelete) {
            deleteSalesOrder(orderToDelete.id, true);
            setOrderToDelete(null);
          }
        }}
        title="Delete Sales Invoice"
        message={`Are you sure you want to delete sales invoice ${orderToDelete?.invoiceNumber} (${orderToDelete?.customerName}) for ${formatCurrency(orderToDelete?.grandTotal || 0, businessProfile.currencySymbol)}? Deducted product stocks will be automatically restored to inventory, and any linked receivable balances or payments will be reconciled.`}
        confirmLabel="Delete Invoice"
        isDestructive={true}
      />
    </div>
  );
};
