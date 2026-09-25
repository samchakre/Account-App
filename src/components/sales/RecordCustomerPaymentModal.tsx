import React, { useEffect, useState } from 'react';
import { AlertCircle, CreditCard, DollarSign, Receipt, User, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Customer, SalesOrder } from '../../types';
import { formatCurrency } from '../../utils/formatters';
import { NepaliDatePicker } from '../common/NepaliDatePicker';

interface RecordCustomerPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialOrder?: SalesOrder | null;
  initialCustomer?: Customer | null;
}

export const RecordCustomerPaymentModal: React.FC<RecordCustomerPaymentModalProps> = ({
  isOpen,
  onClose,
  initialOrder,
  initialCustomer,
}) => {
  const { customers, salesOrders, recordCustomerPayment, businessProfile } = useApp();

  const [customerId, setCustomerId] = useState('');
  const [selectedInvoiceNumber, setSelectedInvoiceNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<
    'Cash' | 'Card' | 'Bank Transfer' | 'UPI' | 'Cheque' | 'Store Credit'
  >('Bank Transfer');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [referenceNumber, setReferenceNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialOrder) {
      setCustomerId(initialOrder.customerId);
      setSelectedInvoiceNumber(initialOrder.invoiceNumber);
      const balance = Math.max(0, initialOrder.grandTotal - initialOrder.paidAmount);
      setAmount(String(balance));
    } else if (initialCustomer) {
      setCustomerId(initialCustomer.id);
      setSelectedInvoiceNumber('');
      setAmount(String(initialCustomer.outstandingReceivable));
    } else if (customers.length > 0) {
      setCustomerId(customers[0].id);
      setSelectedInvoiceNumber('');
      setAmount('');
    }
    setError('');
  }, [initialOrder, initialCustomer, customers, isOpen]);

  if (!isOpen) return null;

  const currentCustomer = customers.find((c) => c.id === customerId);
  const customerInvoices = salesOrders.filter(
    (so) => so.customerId === customerId && so.paymentStatus !== 'paid' && so.status !== 'cancelled'
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (!customerId) {
      setError('Please select a customer.');
      return;
    }
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Please enter a valid payment amount.');
      return;
    }

    recordCustomerPayment({
      customerId,
      amount: parsedAmount,
      paymentMethod,
      referenceId: selectedInvoiceNumber || undefined,
      referenceNumber: referenceNumber.trim() || undefined,
      notes: notes.trim() || undefined,
      paymentDate,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Record Customer Payment</h2>
              <p className="text-xs text-slate-500">Collect dues against invoices or account balance</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Customer *
            </label>
            <select
              value={customerId}
              onChange={(e) => {
                setCustomerId(e.target.value);
                setSelectedInvoiceNumber('');
              }}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 bg-white font-semibold"
            >
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} (Due:{' '}
                  {formatCurrency(c.outstandingReceivable, businessProfile.currencySymbol)})
                </option>
              ))}
            </select>
          </div>

          {currentCustomer && (
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
              <span className="text-slate-500">Outstanding Receivable:</span>
              <span className="font-bold text-rose-700">
                {formatCurrency(
                  currentCustomer.outstandingReceivable,
                  businessProfile.currencySymbol
                )}
              </span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Apply to Specific Invoice (Optional)
            </label>
            <select
              value={selectedInvoiceNumber}
              onChange={(e) => {
                const invNum = e.target.value;
                setSelectedInvoiceNumber(invNum);
                const inv = salesOrders.find((s) => s.invoiceNumber === invNum);
                if (inv) {
                  setAmount(String(inv.grandTotal - inv.paidAmount));
                }
              }}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              <option value="">General Account Settlement</option>
              {customerInvoices.map((inv) => (
                <option key={inv.id} value={inv.invoiceNumber}>
                  {inv.invoiceNumber} — Balance Due:{' '}
                  {formatCurrency(inv.grandTotal - inv.paidAmount, businessProfile.currencySymbol)}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Amount Received ($) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full px-3 py-2 text-sm font-bold text-emerald-700 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Payment Method *
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as any)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 bg-white font-medium"
              >
                <option value="Bank Transfer">Bank Wire / ACH</option>
                <option value="Cash">Cash</option>
                <option value="Card">Credit Card</option>
                <option value="UPI">UPI / Digital</option>
                <option value="Cheque">Cheque</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <NepaliDatePicker
              id="customer-payment-date"
              label="Payment Date (भुक्तानी मिति)"
              value={paymentDate}
              onChange={(adDate) => setPaymentDate(adDate)}
            />

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Transaction / Ref #
              </label>
              <input
                type="text"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                placeholder="e.g. TXN-89021"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Notes
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Partial wire received into Chase business account"
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors"
            >
              Record Payment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
