import React, { useEffect, useState } from 'react';
import { AlertCircle, CreditCard, DollarSign, Truck, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { PurchaseOrder, Vendor } from '../../types';
import { formatCurrency } from '../../utils/formatters';
import { NepaliDatePicker } from '../common/NepaliDatePicker';

interface RecordVendorPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialOrder?: PurchaseOrder | null;
  initialVendor?: Vendor | null;
}

export const RecordVendorPaymentModal: React.FC<RecordVendorPaymentModalProps> = ({
  isOpen,
  onClose,
  initialOrder,
  initialVendor,
}) => {
  const { vendors, purchaseOrders, recordVendorPayment, businessProfile } = useApp();

  const [vendorId, setVendorId] = useState('');
  const [selectedPONumber, setSelectedPONumber] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<
    'Bank Wire' | 'Cash' | 'Card' | 'Cheque' | 'Credit'
  >('Bank Wire');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [referenceNumber, setReferenceNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialOrder) {
      setVendorId(initialOrder.vendorId);
      setSelectedPONumber(initialOrder.poNumber);
      const balance = Math.max(0, initialOrder.grandTotal - initialOrder.paidAmount);
      setAmount(String(balance));
    } else if (initialVendor) {
      setVendorId(initialVendor.id);
      setSelectedPONumber('');
      setAmount(String(initialVendor.outstandingPayable));
    } else if (vendors.length > 0) {
      setVendorId(vendors[0].id);
      setSelectedPONumber('');
      setAmount('');
    }
    setError('');
  }, [initialOrder, initialVendor, vendors, isOpen]);

  if (!isOpen) return null;

  const currentVendor = vendors.find((v) => v.id === vendorId);
  const vendorPOs = purchaseOrders.filter(
    (po) => po.vendorId === vendorId && po.paymentStatus !== 'paid' && po.status !== 'cancelled'
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (!vendorId) {
      setError('Please select a vendor.');
      return;
    }
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Please enter a valid payment amount.');
      return;
    }

    recordVendorPayment({
      vendorId,
      amount: parsedAmount,
      paymentMethod,
      referenceId: selectedPONumber || undefined,
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
            <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Record Vendor Disbursement</h2>
              <p className="text-xs text-slate-500">Pay supplier invoice dues or settle accounts</p>
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
              Supplier / Vendor *
            </label>
            <select
              value={vendorId}
              onChange={(e) => {
                setVendorId(e.target.value);
                setSelectedPONumber('');
              }}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 bg-white font-semibold"
            >
              {vendors.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name} (Payable:{' '}
                  {formatCurrency(v.outstandingPayable, businessProfile.currencySymbol)})
                </option>
              ))}
            </select>
          </div>

          {currentVendor && (
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
              <span className="text-slate-500">Total Outstanding Payable:</span>
              <span className="font-bold text-rose-700">
                {formatCurrency(currentVendor.outstandingPayable, businessProfile.currencySymbol)}
              </span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Apply to Specific PO (Optional)
            </label>
            <select
              value={selectedPONumber}
              onChange={(e) => {
                const poNum = e.target.value;
                setSelectedPONumber(poNum);
                const po = purchaseOrders.find((p) => p.poNumber === poNum);
                if (po) {
                  setAmount(String(po.grandTotal - po.paidAmount));
                }
              }}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              <option value="">General Account Settlement</option>
              {vendorPOs.map((po) => (
                <option key={po.id} value={po.poNumber}>
                  {po.poNumber} — Balance Due:{' '}
                  {formatCurrency(po.grandTotal - po.paidAmount, businessProfile.currencySymbol)}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Disbursed Amount ($) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full px-3 py-2 text-sm font-bold text-blue-800 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
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
                <option value="Bank Wire">Bank Wire / ACH</option>
                <option value="Cash">Cash</option>
                <option value="Card">Company Debit/Credit</option>
                <option value="Cheque">Corporate Cheque</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <NepaliDatePicker
              id="vendor-disbursement-date"
              label="Disbursement Date (भुक्तानी मिति)"
              value={paymentDate}
              onChange={(adDate) => setPaymentDate(adDate)}
            />

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Wire / Check Ref #
              </label>
              <input
                type="text"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                placeholder="e.g. WIRE-90812"
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
              placeholder="e.g. Bi-monthly supplier batch settlement"
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
              className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors"
            >
              Disburse Payment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
