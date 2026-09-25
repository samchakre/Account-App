import React, { useMemo, useState } from 'react';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Building2,
  Calendar,
  CreditCard,
  DollarSign,
  Download,
  Filter,
  Plus,
  Receipt,
  Search,
  Trash2,
  Truck,
  User,
  Wallet,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { PaymentRecord } from '../../types';
import { exportToCSV, formatCurrency, formatDate } from '../../utils/formatters';
import { RecordVendorPaymentModal } from '../purchases/RecordVendorPaymentModal';
import { RecordCustomerPaymentModal } from '../sales/RecordCustomerPaymentModal';
import { ConfirmModal } from '../common/ConfirmModal';

export const PaymentsView: React.FC = () => {
  const { payments, deletePayment, businessProfile } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'CUSTOMER_PAYMENT' | 'VENDOR_PAYMENT'>('all');
  const [methodFilter, setMethodFilter] = useState<string>('all');

  const [isCustomerPayModalOpen, setIsCustomerPayModalOpen] = useState(false);
  const [isVendorPayModalOpen, setIsVendorPayModalOpen] = useState(false);
  const [paymentToDelete, setPaymentToDelete] = useState<PaymentRecord | null>(null);

  // Filtered Payments
  const filteredPayments = useMemo(() => {
    return payments.filter((p) => {
      const entity = p.entityName || p.partyName || '';
      const matchesSearch =
        entity.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.referenceId && p.referenceId.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (p.referenceNumber && p.referenceNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (p.notes && p.notes.toLowerCase().includes(searchQuery.toLowerCase()));

      const isCustomer =
        p.type === 'CUSTOMER_PAYMENT' ||
        p.transactionType === 'INFLOW_SALE' ||
        p.transactionType === 'CUSTOMER_SETTLEMENT' ||
        p.partyType === 'customer';

      const matchesType =
        typeFilter === 'all' ||
        (typeFilter === 'CUSTOMER_PAYMENT' && isCustomer) ||
        (typeFilter === 'VENDOR_PAYMENT' && !isCustomer);

      const matchesMethod = methodFilter === 'all' || p.paymentMethod === methodFilter;

      return matchesSearch && matchesType && matchesMethod;
    });
  }, [payments, searchQuery, typeFilter, methodFilter]);

  // Treasury Totals
  const treasury = useMemo(() => {
    let totalInflow = 0;
    let totalOutflow = 0;

    payments.forEach((p) => {
      const isCustomer =
        p.type === 'CUSTOMER_PAYMENT' ||
        p.transactionType === 'INFLOW_SALE' ||
        p.transactionType === 'CUSTOMER_SETTLEMENT' ||
        p.partyType === 'customer';

      if (isCustomer) {
        totalInflow += p.amount;
      } else {
        totalOutflow += p.amount;
      }
    });

    const netCashflow = totalInflow - totalOutflow;

    return {
      totalInflow,
      totalOutflow,
      netCashflow,
    };
  }, [payments]);

  const handleExportCSV = () => {
    const data = filteredPayments.map((p) => {
      const isCustomer =
        p.type === 'CUSTOMER_PAYMENT' ||
        p.transactionType === 'INFLOW_SALE' ||
        p.transactionType === 'CUSTOMER_SETTLEMENT' ||
        p.partyType === 'customer';

      return {
        Date: p.paymentDate,
        Type: isCustomer ? 'Customer Inflow' : 'Vendor Outflow',
        Entity: p.entityName || p.partyName || '',
        Amount: p.amount,
        PaymentMethod: p.paymentMethod,
        ReferenceId: p.referenceId || '',
        TxnRef: p.referenceNumber || '',
        Notes: p.notes || '',
      };
    });
    exportToCSV(`cash_treasury_ledger_${new Date().toISOString().split('T')[0]}`, data);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-serif italic text-[#3E4A3D]">Payments & Treasury Cash Flow</h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#A7C4BC]/20 text-[#3E4A3D] border border-[#A7C4BC]/30">
              {filteredPayments.length} Transactions
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#8A8882] mt-0.5">
            Real-time double-entry audit of all customer inflows, supplier remittances, and banking transactions.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-[#FDFCF9] text-[#3E4A3D] text-xs font-semibold rounded-full border border-[#E6E4DF] shadow-xs transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-[#8A8882]" />
            Export CSV
          </button>
          <button
            onClick={() => setIsCustomerPayModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#3E4A3D] hover:bg-[#2D362C] text-white text-xs font-semibold rounded-full shadow-xs transition-colors"
          >
            <ArrowDownLeft className="w-4 h-4 text-[#A7C4BC]" />
            Receive Customer Pay
          </button>
          <button
            onClick={() => setIsVendorPayModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-[#FDFCF9] text-[#3E4A3D] text-xs font-semibold rounded-full border border-[#E6E4DF] shadow-xs transition-colors"
          >
            <ArrowUpRight className="w-4 h-4 text-[#C97B5A]" />
            Pay Supplier
          </button>
        </div>
      </div>

      {/* KPI Treasury Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-[#E6E4DF] shadow-xs">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-full bg-[#A7C4BC]/20 text-[#3E4A3D]">
              <ArrowDownLeft className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-semibold text-[#8A8882] uppercase tracking-wider">
              Total Inflows (Revenue)
            </span>
          </div>
          <div className="text-xl font-bold font-mono text-[#3E4A3D] mt-2">
            +{formatCurrency(treasury.totalInflow, businessProfile.currencySymbol)}
          </div>
          <span className="text-[11px] text-[#8A8882] mt-0.5 block">
            Customer collections & retail cash
          </span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-[#E6E4DF] shadow-xs">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-full bg-[#C97B5A]/20 text-[#C97B5A]">
              <ArrowUpRight className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-semibold text-[#8A8882] uppercase tracking-wider">
              Total Outflows (Procurement)
            </span>
          </div>
          <div className="text-xl font-bold font-mono text-[#C97B5A] mt-2">
            -{formatCurrency(treasury.totalOutflow, businessProfile.currencySymbol)}
          </div>
          <span className="text-[11px] text-[#8A8882] mt-0.5 block">
            Vendor settlements & freight costs
          </span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-[#E6E4DF] shadow-xs">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-full bg-[#3E4A3D]/10 text-[#3E4A3D]">
              <Wallet className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-semibold text-[#8A8882] uppercase tracking-wider">
              Net Operating Cashflow
            </span>
          </div>
          <div
            className={`text-xl font-bold font-mono mt-2 ${
              treasury.netCashflow >= 0 ? 'text-[#3E4A3D]' : 'text-[#C97B5A]'
            }`}
          >
            {formatCurrency(treasury.netCashflow, businessProfile.currencySymbol)}
          </div>
          <span className="text-[11px] text-[#8A8882] mt-0.5 block font-medium">
            Cash retained in operational flow
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
            placeholder="Search payments by entity name, invoice#, PO#, or ref transaction..."
            className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm border border-[#E6E4DF] rounded-full focus:ring-2 focus:ring-[#3E4A3D] bg-[#FDFCF9] text-[#2D2D2A]"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto text-xs">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as any)}
            className="px-4 py-2 border border-[#E6E4DF] rounded-full focus:ring-2 focus:ring-[#3E4A3D] bg-white font-semibold text-[#2D2D2A]"
          >
            <option value="all">All Cash Flows</option>
            <option value="CUSTOMER_PAYMENT">Inflows (Customer Collections)</option>
            <option value="VENDOR_PAYMENT">Outflows (Vendor Disbursements)</option>
          </select>

          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            className="px-4 py-2 border border-[#E6E4DF] rounded-full focus:ring-2 focus:ring-[#3E4A3D] bg-white font-semibold text-[#2D2D2A]"
          >
            <option value="all">All Payment Methods</option>
            <option value="Cash">Cash</option>
            <option value="Card">Card</option>
            <option value="Bank Transfer">Bank Wire / ACH</option>
            <option value="UPI">UPI / Digital</option>
            <option value="Cheque">Cheque</option>
          </select>
        </div>
      </div>

      {/* Payments Ledger Table */}
      <div className="bg-white rounded-3xl border border-[#E6E4DF] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FDFCF9] text-[#8A8882] font-semibold text-[10px] uppercase tracking-wider border-b border-[#E6E4DF]">
              <tr>
                <th className="px-5 py-3.5 font-semibold">Date</th>
                <th className="px-5 py-3.5 font-semibold">Flow Type</th>
                <th className="px-5 py-3.5 font-semibold">Counterparty / Account</th>
                <th className="px-5 py-3.5 font-semibold">Method</th>
                <th className="px-5 py-3.5 font-semibold">Linked Order / Ref</th>
                <th className="px-5 py-3.5 text-right font-semibold">Amount</th>
                <th className="px-5 py-3.5 font-semibold">Audit Notes</th>
                <th className="px-5 py-3.5 text-right font-semibold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F3F1ED]">
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-[#8A8882]">
                    No payment transactions found.
                  </td>
                </tr>
              ) : (
                filteredPayments.map((payment) => {
                  const isInflow =
                    payment.type === 'CUSTOMER_PAYMENT' ||
                    payment.transactionType === 'INFLOW_SALE' ||
                    payment.transactionType === 'CUSTOMER_SETTLEMENT' ||
                    payment.partyType === 'customer';

                  const counterparty = payment.entityName || payment.partyName || 'General Account';

                  return (
                    <tr key={payment.id} className="hover:bg-[#FDFCF9] transition-colors">
                      <td className="px-5 py-3.5 font-medium text-[#8A8882] whitespace-nowrap">
                        {formatDate(payment.paymentDate)}
                      </td>

                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${
                            isInflow
                              ? 'bg-[#A7C4BC]/25 text-[#3E4A3D] border-[#A7C4BC]/35'
                              : 'bg-[#C97B5A]/15 text-[#C97B5A] border-[#C97B5A]/25'
                          }`}
                        >
                          {isInflow ? (
                            <ArrowDownLeft className="w-3 h-3 text-[#3E4A3D]" />
                          ) : (
                            <ArrowUpRight className="w-3 h-3 text-[#C97B5A]" />
                          )}
                          {isInflow ? 'Customer Inflow' : 'Supplier Outflow'}
                        </span>
                      </td>

                      <td className="px-5 py-3.5">
                        <div className="font-bold text-[#2D2D2A]">{counterparty}</div>
                      </td>

                      <td className="px-5 py-3.5 text-[#8A8882] font-medium">
                        {payment.paymentMethod}
                      </td>

                      <td className="px-5 py-3.5 font-mono text-[#8A8882]">
                        {payment.referenceId || payment.referenceNumber || '—'}
                      </td>

                      <td className="px-5 py-3.5 text-right">
                        <span
                          className={`font-bold font-mono text-sm ${
                            isInflow ? 'text-[#3E4A3D]' : 'text-[#C97B5A]'
                          }`}
                        >
                          {isInflow ? '+' : '-'}
                          {formatCurrency(payment.amount, businessProfile.currencySymbol)}
                        </span>
                      </td>

                      <td className="px-5 py-3.5 text-[#8A8882] max-w-xs truncate">
                        {payment.notes || '—'}
                      </td>

                      <td className="px-5 py-3.5 text-right">
                        <button
                          onClick={() => setPaymentToDelete(payment)}
                          className="p-1.5 text-[#8A8882] hover:text-[#C97B5A] hover:bg-[#C97B5A]/10 rounded-full transition-colors"
                          title="Delete Payment Record"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      <RecordCustomerPaymentModal
        isOpen={isCustomerPayModalOpen}
        onClose={() => setIsCustomerPayModalOpen(false)}
      />

      <RecordVendorPaymentModal
        isOpen={isVendorPayModalOpen}
        onClose={() => setIsVendorPayModalOpen(false)}
      />

      {/* Delete Payment Confirmation Modal */}
      <ConfirmModal
        isOpen={!!paymentToDelete}
        onClose={() => setPaymentToDelete(null)}
        onConfirm={() => {
          if (paymentToDelete) {
            deletePayment(paymentToDelete.id);
            setPaymentToDelete(null);
          }
        }}
        title="Delete Payment Record"
        message={`Are you sure you want to delete this payment record of ${formatCurrency(paymentToDelete?.amount || 0, businessProfile.currencySymbol)} (${paymentToDelete?.entityName || paymentToDelete?.partyName || 'General Account'})? Deleting this payment will automatically reconcile and revert the outstanding balance of the associated customer/vendor and linked order.`}
        confirmLabel="Delete Payment"
        isDestructive={true}
      />
    </div>
  );
};
