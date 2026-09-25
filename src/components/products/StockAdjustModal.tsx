import React, { useEffect, useState } from 'react';
import { AlertCircle, ArrowDown, ArrowUp, Boxes, CheckCircle2, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { MovementType, Product } from '../../types';
import { formatCurrency } from '../../utils/formatters';

interface StockAdjustModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialProductId?: string;
}

export const StockAdjustModal: React.FC<StockAdjustModalProps> = ({
  isOpen,
  onClose,
  initialProductId,
}) => {
  const { products, adjustStock, businessProfile } = useApp();

  const [selectedProductId, setSelectedProductId] = useState('');
  const [adjustmentType, setAdjustmentType] = useState<'set_exact' | 'add' | 'reduce'>('set_exact');
  const [amount, setAmount] = useState<string>('');
  const [reasonCategory, setReasonCategory] = useState<MovementType>('ADJUSTMENT_ADD');
  const [customReason, setCustomReason] = useState('');
  const [performedBy, setPerformedBy] = useState('Inventory Manager');
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialProductId) {
      setSelectedProductId(initialProductId);
    } else if (products.length > 0 && !selectedProductId) {
      setSelectedProductId(products[0].id);
    }
  }, [initialProductId, products, isOpen]);

  const selectedProduct = products.find((p) => p.id === selectedProductId);

  useEffect(() => {
    if (selectedProduct && adjustmentType === 'set_exact') {
      setAmount(String(selectedProduct.currentStock));
    } else {
      setAmount('');
    }
    setError('');
  }, [selectedProductId, adjustmentType]);

  if (!isOpen) return null;

  const currentStock = selectedProduct ? selectedProduct.currentStock : 0;
  const parsedVal = parseInt(amount, 10) || 0;

  let calculatedNewStock = currentStock;
  if (adjustmentType === 'set_exact') {
    calculatedNewStock = parsedVal;
  } else if (adjustmentType === 'add') {
    calculatedNewStock = currentStock + parsedVal;
  } else if (adjustmentType === 'reduce') {
    calculatedNewStock = Math.max(0, currentStock - parsedVal);
  }

  const stockDiff = calculatedNewStock - currentStock;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) {
      setError('Please select a product.');
      return;
    }
    if (isNaN(parsedVal) || parsedVal < 0) {
      setError('Please enter a valid positive number.');
      return;
    }
    if (calculatedNewStock < 0) {
      setError('Final stock cannot be negative.');
      return;
    }

    let finalType: MovementType = reasonCategory;
    if (adjustmentType === 'add') {
      finalType = 'ADJUSTMENT_ADD';
    } else if (adjustmentType === 'reduce') {
      finalType = reasonCategory === 'DAMAGE_WRITEOFF' ? 'DAMAGE_WRITEOFF' : 'ADJUSTMENT_REDUCE';
    } else {
      finalType = stockDiff >= 0 ? 'ADJUSTMENT_ADD' : 'ADJUSTMENT_REDUCE';
    }

    const reasonText = customReason.trim()
      ? customReason.trim()
      : `Physical audit count adjustment: ${currentStock} -> ${calculatedNewStock} ${selectedProduct.unit}`;

    adjustStock(selectedProduct.id, calculatedNewStock, reasonText, finalType, performedBy);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
              <Boxes className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Stock Level Reconciliation</h2>
              <p className="text-xs text-slate-500">Record manual adjustments, recount or damage write-offs</p>
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
              Select Product *
            </label>
            <select
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.sku}) — Current Stock: {p.currentStock} {p.unit}
                </option>
              ))}
            </select>
          </div>

          {selectedProduct && (
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-3 gap-2 text-center text-xs">
              <div>
                <span className="text-slate-400 block text-[10px]">Current On-Hand</span>
                <span className="font-bold text-slate-900 text-sm">
                  {selectedProduct.currentStock} {selectedProduct.unit}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Reorder Min</span>
                <span className="font-semibold text-slate-700 text-sm">
                  {selectedProduct.minReorderLevel}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Cost Value</span>
                <span className="font-semibold text-slate-700 text-sm">
                  {formatCurrency((selectedProduct.currentStock || 0) * (selectedProduct.purchasePrice || 0), businessProfile.currencySymbol)}
                </span>
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Adjustment Mode
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setAdjustmentType('set_exact')}
                className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all ${
                  adjustmentType === 'set_exact'
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                }`}
              >
                Set Exact Qty
              </button>
              <button
                type="button"
                onClick={() => setAdjustmentType('add')}
                className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all ${
                  adjustmentType === 'add'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                }`}
              >
                + Add Stock
              </button>
              <button
                type="button"
                onClick={() => setAdjustmentType('reduce')}
                className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all ${
                  adjustmentType === 'reduce'
                    ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                }`}
              >
                - Reduce Stock
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              {adjustmentType === 'set_exact'
                ? 'New Verified Stock Count *'
                : adjustmentType === 'add'
                ? 'Quantity to Add (+)'
                : 'Quantity to Deduct (-)'}
            </label>
            <input
              type="number"
              min="0"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter quantity"
              className="w-full px-3 py-2 text-base font-bold border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          {/* Real-time Calculation Result Preview */}
          <div className="p-3.5 rounded-xl bg-indigo-50/70 border border-indigo-100 flex items-center justify-between">
            <div className="text-xs text-indigo-900">
              <span className="font-semibold">Calculated New Stock:</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-extrabold text-indigo-950">
                {calculatedNewStock} {selectedProduct?.unit}
              </span>
              <span
                className={`text-xs font-bold px-1.5 py-0.5 rounded ${
                  stockDiff > 0
                    ? 'bg-emerald-100 text-emerald-800'
                    : stockDiff < 0
                    ? 'bg-rose-100 text-rose-800'
                    : 'bg-slate-200 text-slate-700'
                }`}
              >
                {stockDiff > 0 ? `+${stockDiff}` : stockDiff}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Reason Category
              </label>
              <select
                value={reasonCategory}
                onChange={(e) => setReasonCategory(e.target.value as MovementType)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
              >
                <option value="ADJUSTMENT_ADD">Inventory Recount / Found Stock</option>
                <option value="DAMAGE_WRITEOFF">Damaged / Broken / Expired</option>
                <option value="ADJUSTMENT_REDUCE">Theft / Shrinkage / Missing</option>
                <option value="CUSTOMER_RETURN">Customer Return to Stock</option>
                <option value="VENDOR_RETURN">Return to Supplier</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Performed By
              </label>
              <input
                type="text"
                value={performedBy}
                onChange={(e) => setPerformedBy(e.target.value)}
                placeholder="Warehouse Staff"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Audit Notes & Reference Details
            </label>
            <input
              type="text"
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              placeholder="e.g. Annual physical count variance verified with shelf 3"
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs sm:text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs sm:text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors"
            >
              Apply Adjustment & Log
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
