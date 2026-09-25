import React from 'react';
import { ArrowDownRight, ArrowUpRight, Boxes, History, Package, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Product } from '../../types';
import { formatCurrency, formatDateTime } from '../../utils/formatters';

interface ProductHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
}

export const ProductHistoryModal: React.FC<ProductHistoryModalProps> = ({
  isOpen,
  onClose,
  product,
}) => {
  const { stockMovements, businessProfile } = useApp();

  if (!isOpen || !product) return null;

  const productMovements = stockMovements.filter((m) => m.productId === product.id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden max-h-[85vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">{product.name}</h2>
              <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                <code>{product.sku}</code>
                <span>•</span>
                <span className="font-semibold text-slate-700">
                  Current Stock: {product.currentStock} {product.unit}
                </span>
                <span>•</span>
                <span>
                  Asset Value:{' '}
                  {formatCurrency(
                    product.currentStock * product.purchasePrice,
                    businessProfile.currencySymbol
                  )}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Movement Timeline */}
        <div className="p-6 overflow-y-auto flex-1">
          {productMovements.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-sm">
              No historical stock movements recorded for this item yet.
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Audit Timeline ({productMovements.length} transactions)
              </div>
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                {productMovements.map((m) => (
                  <div key={m.id} className="p-4 hover:bg-slate-50 transition-colors flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 min-w-0">
                      <div
                        className={`p-2 rounded-lg shrink-0 mt-0.5 ${
                          m.quantityChange > 0
                            ? 'bg-emerald-50 text-emerald-600'
                            : 'bg-rose-50 text-rose-600'
                        }`}
                      >
                        {m.quantityChange > 0 ? (
                          <ArrowUpRight className="w-4 h-4" />
                        ) : (
                          <ArrowDownRight className="w-4 h-4" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900">{m.type}</span>
                          <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                            {m.referenceId}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 mt-1">{m.reason}</p>
                        <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1.5">
                          <span>By: {m.performedBy}</span>
                          <span>•</span>
                          <span>{m.timestamp}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div
                        className={`text-sm font-extrabold ${
                          m.quantityChange > 0 ? 'text-emerald-600' : 'text-rose-600'
                        }`}
                      >
                        {m.quantityChange > 0 ? `+${m.quantityChange}` : m.quantityChange} {product.unit}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        Balance: <span className="font-semibold text-slate-800">{m.newStock} {product.unit}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-xl transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
