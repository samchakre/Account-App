import React, { useMemo, useState } from 'react';
import {
  AlertCircle,
  Building2,
  CheckCircle2,
  Clock,
  CreditCard,
  Download,
  Eye,
  Filter,
  Package,
  Pencil,
  Plus,
  Search,
  Trash2,
  TrendingUp,
  Truck,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { PurchaseOrder } from '../../types';
import { exportToCSV, formatCurrency, formatDate, formatNepaliDate, getPaymentStatusBadge } from '../../utils/formatters';
import { CreatePurchaseModal } from './CreatePurchaseModal';
import { RecordVendorPaymentModal } from './RecordVendorPaymentModal';
import { ConfirmModal } from '../common/ConfirmModal';

export const PurchasesView: React.FC = () => {
  const { purchaseOrders, deletePurchaseOrder, businessProfile, currentUser } = useApp();

  const isAdmin = currentUser?.role === 'admin';

  const [searchQuery, setSearchQuery] = useState('');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [purchaseToEdit, setPurchaseToEdit] = useState<PurchaseOrder | null>(null);
  const [payTargetOrder, setPayTargetOrder] = useState<PurchaseOrder | null>(null);
  const [viewPurchaseDetail, setViewPurchaseDetail] = useState<PurchaseOrder | null>(null);
  const [purchaseToDelete, setPurchaseToDelete] = useState<PurchaseOrder | null>(null);

  // Filtered Purchases
  const filteredPurchases = useMemo(() => {
    return purchaseOrders.filter((po) => {
      const matchesSearch =
        po.poNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        po.vendorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        po.items.some((it) => it.productName.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesPayment = paymentFilter === 'all' || po.paymentStatus === paymentFilter;

      return matchesSearch && matchesPayment;
    });
  }, [purchaseOrders, searchQuery, paymentFilter]);

  // Aggregate Metrics
  const metrics = useMemo(() => {
    let totalPurchases = 0;
    let totalPaid = 0;
    let totalPayables = 0;
    let totalUnitsInward = 0;

    purchaseOrders.forEach((po) => {
      if (po.status !== 'cancelled') {
        totalPurchases += po.grandTotal;
        totalPaid += po.paidAmount;
        totalPayables += Math.max(0, po.grandTotal - po.paidAmount);
        po.items.forEach((it) => {
          totalUnitsInward += it.quantity || 0;
        });
      }
    });

    return {
      totalPurchases,
      totalPaid,
      totalPayables,
      totalUnitsInward,
    };
  }, [purchaseOrders]);

  const handleExportCSV = () => {
    const data = filteredPurchases.map((po) => ({
      PurchaseNumber: po.poNumber,
      Vendor: po.vendorName,
      PurchaseDate: po.orderDate,
      ItemsCount: po.items.length,
      TotalUnitsBought: po.items.reduce((s, it) => s + it.quantity, 0),
      Subtotal: po.subtotal,
      Tax: po.taxTotal,
      Shipping: po.shippingFee,
      GrandTotal: po.grandTotal,
      PaidAmount: po.paidAmount,
      BalanceDue: Math.max(0, po.grandTotal - po.paidAmount),
      PaymentStatus: po.paymentStatus,
    }));
    exportToCSV(`purchases_${new Date().toISOString().split('T')[0]}`, data);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-serif italic text-[#3E4A3D]">Purchases (खरिद) & Stock Inward</h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#3E4A3D]/10 text-[#3E4A3D] border border-[#3E4A3D]/20">
              {filteredPurchases.length} Records
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#8A8882] mt-0.5">
            Direct supplier purchases. Every recorded purchase directly increases product stock quantity and records supplier billing.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
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
            New Purchase (नयाँ खरिद)
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-[#E6E4DF] shadow-xs">
          <span className="text-[10px] font-semibold text-[#8A8882] uppercase tracking-wider block">
            Total Purchase Volume (कुल खरिद)
          </span>
          <div className="text-xl font-bold font-mono text-[#3E4A3D] mt-2">
            {formatCurrency(metrics.totalPurchases, businessProfile.currencySymbol)}
          </div>
          <span className="text-[11px] text-[#8A8882] mt-0.5 block">
            Across {purchaseOrders.length} purchase entries
          </span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-[#E6E4DF] shadow-xs">
          <span className="text-[10px] font-semibold text-[#8A8882] uppercase tracking-wider block">
            Total Paid to Suppliers
          </span>
          <div className="text-xl font-bold font-mono text-[#3E4A3D] mt-2">
            {formatCurrency(metrics.totalPaid, businessProfile.currencySymbol)}
          </div>
          <span className="text-[11px] text-[#8A8882] mt-0.5 block font-medium">
            Cash / Bank settlements
          </span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-[#E6E4DF] shadow-xs">
          <span className="text-[10px] font-semibold text-[#8A8882] uppercase tracking-wider block">
            Supplier Payables Due (साहुलाई तिर्न बाँकी)
          </span>
          <div className="text-xl font-bold font-mono text-[#C97B5A] mt-2">
            {formatCurrency(metrics.totalPayables, businessProfile.currencySymbol)}
          </div>
          <span className="text-[11px] text-[#C97B5A] mt-0.5 block font-medium">
            Outstanding credit balances
          </span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-[#E6E4DF] shadow-xs">
          <span className="text-[10px] font-semibold text-[#8A8882] uppercase tracking-wider block">
            Total Stock Added (+Inward)
          </span>
          <div className="text-xl font-bold font-mono text-[#3E4A3D] mt-2">
            +{metrics.totalUnitsInward} Units
          </div>
          <span className="text-[11px] text-[#3E4A3D] mt-0.5 block font-medium">
            Credited into product inventory
          </span>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-3xl border border-[#E6E4DF] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8A8882]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Purchase #, supplier name, or product item..."
            className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm border border-[#E6E4DF] rounded-full focus:ring-2 focus:ring-[#3E4A3D] bg-[#FDFCF9] text-[#2D2D2A]"
          />
        </div>

        <div className="flex items-center gap-2 text-xs">
          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="px-4 py-2 border border-[#E6E4DF] rounded-full focus:ring-2 focus:ring-[#3E4A3D] bg-white font-semibold text-[#2D2D2A]"
          >
            <option value="all">All Payment Statuses</option>
            <option value="paid">Fully Settled (Paid)</option>
            <option value="partial">Partially Paid</option>
            <option value="unpaid">Unpaid Payables (Credit / साहु उधारो)</option>
          </select>
        </div>
      </div>

      {/* Purchases Table */}
      <div className="bg-white rounded-3xl border border-[#E6E4DF] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FDFCF9] text-[#8A8882] font-semibold text-[10px] uppercase tracking-wider border-b border-[#E6E4DF]">
              <tr>
                <th className="px-5 py-3.5 font-semibold">Bill #</th>
                <th className="px-5 py-3.5 font-semibold">Supplier / Vendor</th>
                <th className="px-5 py-3.5 font-semibold">Purchase Date (मिति)</th>
                <th className="px-5 py-3.5 font-semibold">Items & Stock Added</th>
                <th className="px-5 py-3.5 font-semibold">Grand Total</th>
                <th className="px-5 py-3.5 font-semibold">Paid / Balance Due</th>
                <th className="px-5 py-3.5 font-semibold">Status</th>
                <th className="px-5 py-3.5 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F3F1ED]">
              {filteredPurchases.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-[#8A8882]">
                    No purchase records found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredPurchases.map((po) => {
                  const payBadge = getPaymentStatusBadge(po.paymentStatus);
                  const balanceDue = Math.max(0, po.grandTotal - po.paidAmount);
                  const totalUnits = po.items.reduce((sum, it) => sum + (it.quantity || 0), 0);

                  return (
                    <tr key={po.id} className="hover:bg-[#FDFCF9] transition-colors">
                      <td className="px-5 py-3.5 font-mono font-bold text-[#3E4A3D]">
                        {po.poNumber}
                      </td>

                      <td className="px-5 py-3.5">
                        <div className="font-bold text-[#2D2D2A]">{po.vendorName}</div>
                        <div className="text-[11px] text-[#8A8882]">
                          {po.paymentMethod || 'Bank Transfer'}
                        </div>
                      </td>

                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <div className="font-bold text-[#3E4A3D] font-mono text-xs">
                          {formatNepaliDate(po.orderDate, { format: 'standard', language: 'np' })}
                        </div>
                        <div className="text-[10px] text-[#8A8882]">{formatDate(po.orderDate)}</div>
                      </td>

                      <td className="px-5 py-3.5">
                        <span className="inline-flex items-center gap-1 text-[#3E4A3D] bg-[#3E4A3D]/10 border border-[#3E4A3D]/20 px-2.5 py-0.5 rounded-full text-[11px] font-bold">
                          +{totalUnits} Units
                        </span>
                        <div className="text-[11px] text-[#8A8882] mt-0.5 truncate max-w-[180px]">
                          {po.items.map((it) => `${it.productName} (${it.quantity})`).join(', ')}
                        </div>
                      </td>

                      <td className="px-5 py-3.5 font-bold font-mono text-[#3E4A3D] text-sm">
                        {formatCurrency(po.grandTotal, businessProfile.currencySymbol)}
                      </td>

                      <td className="px-5 py-3.5">
                        <div className="font-bold font-mono text-[#3E4A3D]">
                          {formatCurrency(po.paidAmount, businessProfile.currencySymbol)}
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
                            po.paymentStatus === 'paid'
                              ? 'bg-[#3E4A3D]/15 text-[#3E4A3D] border border-[#3E4A3D]/25'
                              : po.paymentStatus === 'partial'
                              ? 'bg-[#D4A373]/25 text-[#9C6644] border border-[#D4A373]/30'
                              : 'bg-[#C97B5A]/20 text-[#C97B5A] border border-[#C97B5A]/30'
                          }`}
                        >
                          {payBadge.label}
                        </span>
                      </td>

                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {balanceDue > 0 && (
                            <button
                              onClick={() => setPayTargetOrder(po)}
                              className="px-3 py-1 bg-[#3E4A3D]/10 hover:bg-[#3E4A3D]/20 text-[#3E4A3D] text-[11px] font-semibold rounded-full transition-colors flex items-center gap-1 border border-[#3E4A3D]/20"
                              title="Record Payment to Supplier"
                            >
                              <CreditCard className="w-3 h-3" /> Pay
                            </button>
                          )}
                          {isAdmin && (
                            <button
                              onClick={() => setPurchaseToEdit(po)}
                              className="p-1.5 text-[#8A8882] hover:text-amber-700 hover:bg-amber-50 rounded-full transition-colors"
                              title="Edit Purchase Bill (Admin Only)"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => setViewPurchaseDetail(po)}
                            className="p-1.5 text-[#8A8882] hover:text-[#3E4A3D] hover:bg-[#F3F1ED] rounded-full transition-colors"
                            title="View Purchase Bill Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setPurchaseToDelete(po)}
                            className="p-1.5 text-[#8A8882] hover:text-[#C97B5A] hover:bg-[#C97B5A]/10 rounded-full transition-colors"
                            title="Delete Purchase Record"
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

      {/* Purchase Details Modal */}
      {viewPurchaseDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-[#E6E4DF] overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-[#E6E4DF] flex items-center justify-between bg-[#FDFCF9]">
              <div>
                <h3 className="font-serif italic font-bold text-[#3E4A3D] text-lg">
                  Purchase Bill: {viewPurchaseDetail.poNumber}
                </h3>
                <span className="text-xs text-[#8A8882]">
                  Supplier: <strong className="text-[#3E4A3D]">{viewPurchaseDetail.vendorName}</strong> | Date:{' '}
                  {formatDate(viewPurchaseDetail.orderDate)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {isAdmin && (
                  <button
                    onClick={() => {
                      const po = viewPurchaseDetail;
                      setViewPurchaseDetail(null);
                      setPurchaseToEdit(po);
                    }}
                    className="px-3.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    title="Edit Purchase Bill (Admin Only)"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    Edit (सम्पादन)
                  </button>
                )}
                <button
                  onClick={() => setViewPurchaseDetail(null)}
                  className="px-4 py-1.5 bg-[#F3F1ED] hover:bg-[#E6E4DF] text-[#3E4A3D] rounded-full text-xs font-semibold"
                >
                  Close
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto space-y-4">
              <table className="w-full text-left text-xs border border-[#E6E4DF] rounded-2xl overflow-hidden">
                <thead className="bg-[#FDFCF9] text-[#8A8882] font-semibold uppercase tracking-wider text-[10px] border-b border-[#E6E4DF]">
                  <tr>
                    <th className="p-3">Product Name</th>
                    <th className="p-3">SKU</th>
                    <th className="p-3 text-right">Quantity Added</th>
                    <th className="p-3 text-right">Unit Cost</th>
                    <th className="p-3 text-right">Line Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F3F1ED]">
                  {viewPurchaseDetail.items.map((item, idx) => (
                    <tr key={idx}>
                      <td className="p-3 font-semibold text-[#2D2D2A]">{item.productName}</td>
                      <td className="p-3 font-mono text-[#8A8882]">{item.sku}</td>
                      <td className="p-3 text-right font-bold font-mono text-[#3E4A3D]">+{item.quantity}</td>
                      <td className="p-3 text-right font-mono text-[#8A8882]">
                        {formatCurrency(item.unitCost, businessProfile.currencySymbol)}
                      </td>
                      <td className="p-3 text-right font-bold font-mono text-[#3E4A3D]">
                        {formatCurrency(item.total, businessProfile.currencySymbol)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="bg-[#FDFCF9] p-4 rounded-2xl border border-[#E6E4DF] space-y-1.5 text-xs">
                <div className="flex justify-between text-[#8A8882]">
                  <span>Subtotal:</span>
                  <span className="font-semibold font-mono text-[#2D2D2A]">
                    {formatCurrency(viewPurchaseDetail.subtotal, businessProfile.currencySymbol)}
                  </span>
                </div>
                <div className="flex justify-between text-[#8A8882]">
                  <span>VAT / Tax Total:</span>
                  <span className="font-semibold font-mono text-[#2D2D2A]">
                    +{formatCurrency(viewPurchaseDetail.taxTotal, businessProfile.currencySymbol)}
                  </span>
                </div>
                <div className="flex justify-between text-[#8A8882]">
                  <span>Inward Freight:</span>
                  <span className="font-semibold font-mono text-[#2D2D2A]">
                    +{formatCurrency(viewPurchaseDetail.shippingFee, businessProfile.currencySymbol)}
                  </span>
                </div>
                <div className="flex justify-between text-sm font-bold font-mono text-[#3E4A3D] pt-2 border-t border-[#E6E4DF]">
                  <span>Grand Total:</span>
                  <span>
                    {formatCurrency(viewPurchaseDetail.grandTotal, businessProfile.currencySymbol)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Purchase Modal */}
      <CreatePurchaseModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />

      {/* Edit Purchase Modal (Admin Only) */}
      <CreatePurchaseModal
        isOpen={!!purchaseToEdit}
        onClose={() => setPurchaseToEdit(null)}
        orderToEdit={purchaseToEdit}
      />

      {/* Settle Vendor Payment Modal */}
      <RecordVendorPaymentModal
        isOpen={!!payTargetOrder}
        onClose={() => setPayTargetOrder(null)}
        initialOrder={payTargetOrder}
      />

      {/* Delete Purchase Confirmation Modal */}
      <ConfirmModal
        isOpen={!!purchaseToDelete}
        onClose={() => setPurchaseToDelete(null)}
        onConfirm={() => {
          if (purchaseToDelete) {
            deletePurchaseOrder(purchaseToDelete.id, true);
            setPurchaseToDelete(null);
          }
        }}
        title="Delete Purchase Record"
        message={`Are you sure you want to delete purchase record ${purchaseToDelete?.poNumber} (${purchaseToDelete?.vendorName}) for ${formatCurrency(purchaseToDelete?.grandTotal || 0, businessProfile.currencySymbol)}? Deleting this purchase will automatically deduct the received quantities back out of product inventory and reconcile supplier payable balances.`}
        confirmLabel="Delete Purchase"
        isDestructive={true}
      />
    </div>
  );
};
