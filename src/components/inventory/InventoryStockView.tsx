import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Boxes,
  Calendar,
  Download,
  Filter,
  History,
  Layers,
  Package,
  Plus,
  RefreshCw,
  Search,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { MovementType } from '../../types';
import { exportToCSV, formatCurrency, formatDateTime } from '../../utils/formatters';
import { StockAdjustModal } from '../products/StockAdjustModal';

export const InventoryStockView: React.FC = () => {
  const { stockMovements, products, categories, businessProfile } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);

  // Filtered movements
  const filteredMovements = useMemo(() => {
    return stockMovements.filter((m) => {
      const matchesSearch =
        m.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.referenceId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.reason.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.performedBy.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesType = typeFilter === 'all' || m.type === typeFilter;

      return matchesSearch && matchesType;
    });
  }, [stockMovements, searchQuery, typeFilter]);

  // Inventory valuation summary metrics
  const valuation = useMemo(() => {
    let totalCostVal = 0;
    let totalRetailVal = 0;
    let totalStockUnits = 0;

    products.forEach((p) => {
      if (p.status === 'active') {
        totalCostVal += p.currentStock * p.purchasePrice;
        totalRetailVal += p.currentStock * p.sellingPrice;
        totalStockUnits += p.currentStock;
      }
    });

    const unrealizedProfit = totalRetailVal - totalCostVal;

    return {
      totalCostVal,
      totalRetailVal,
      totalStockUnits,
      unrealizedProfit,
    };
  }, [products]);

  // Export movements CSV
  const handleExportCSV = () => {
    const data = filteredMovements.map((m) => ({
      Timestamp: m.timestamp,
      Product: m.productName,
      SKU: m.sku,
      MovementType: m.type,
      QuantityChange: m.quantityChange,
      PreviousStock: m.previousStock,
      NewStock: m.newStock,
      Reference: m.referenceId,
      Reason: m.reason,
      PerformedBy: m.performedBy,
    }));
    exportToCSV(`stock_audit_ledger_${new Date().toISOString().split('T')[0]}`, data);
  };

  return (
    <div className="space-y-6">
      {/* Header & Valuation Metrics */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-serif italic text-[#3E4A3D]">Inventory Valuation & Stock Ledger</h2>
          <p className="text-xs sm:text-sm text-[#8A8882] mt-0.5">
            Complete immutable audit trail of goods intake, customer dispatches, and warehouse reconciliations.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-[#FDFCF9] text-[#3E4A3D] text-xs font-semibold rounded-full border border-[#E6E4DF] shadow-xs transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-[#8A8882]" />
            Export Ledger CSV
          </button>
          <button
            onClick={() => setIsAdjustModalOpen(true)}
            className="flex items-center gap-1.5 px-5 py-2 bg-[#3E4A3D] hover:bg-[#2D362C] text-white text-xs font-semibold rounded-full shadow-xs transition-colors"
          >
            <Boxes className="w-4 h-4" />
            Perform Stock Audit
          </button>
        </div>
      </div>

      {/* Valuation Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-[#E6E4DF] shadow-xs">
          <span className="text-[10px] font-semibold text-[#8A8882] uppercase tracking-wider block">
            Total Inventory Units
          </span>
          <div className="text-xl font-bold font-mono text-[#3E4A3D] mt-2">
            {valuation.totalStockUnits.toLocaleString()} Units
          </div>
          <span className="text-[11px] text-[#8A8882] mt-0.5 block">
            Across {products.length} active SKUs
          </span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-[#E6E4DF] shadow-xs">
          <span className="text-[10px] font-semibold text-[#8A8882] uppercase tracking-wider block">
            Cost Asset Valuation
          </span>
          <div className="text-xl font-bold font-mono text-[#3E4A3D] mt-2">
            {formatCurrency(valuation.totalCostVal, businessProfile.currencySymbol)}
          </div>
          <span className="text-[11px] text-[#8A8882] mt-0.5 block font-medium">
            Capital tied in warehouse stock
          </span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-[#E6E4DF] shadow-xs">
          <span className="text-[10px] font-semibold text-[#8A8882] uppercase tracking-wider block">
            Potential Retail Value
          </span>
          <div className="text-xl font-bold font-mono text-[#3E4A3D] mt-2">
            {formatCurrency(valuation.totalRetailVal, businessProfile.currencySymbol)}
          </div>
          <span className="text-[11px] text-[#8A8882] mt-0.5 block font-medium">
            Expected revenue upon sale
          </span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-[#E6E4DF] shadow-xs">
          <span className="text-[10px] font-semibold text-[#8A8882] uppercase tracking-wider block">
            Unrealized Stock Profit
          </span>
          <div className="text-xl font-bold font-mono text-[#3E4A3D] mt-2">
            {formatCurrency(valuation.unrealizedProfit, businessProfile.currencySymbol)}
          </div>
          <span className="text-[11px] text-[#8A8882] mt-0.5 block">
            Margin: {(valuation.totalRetailVal > 0 ? (valuation.unrealizedProfit / valuation.totalRetailVal) * 100 : 0).toFixed(1)}%
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
            placeholder="Search stock movement logs by product, SKU, PO#, Invoice#, auditor..."
            className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm border border-[#E6E4DF] rounded-full focus:ring-2 focus:ring-[#3E4A3D] focus:border-[#3E4A3D] bg-[#FDFCF9] text-[#2D2D2A]"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto text-xs">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-4 py-2 border border-[#E6E4DF] rounded-full focus:ring-2 focus:ring-[#3E4A3D] bg-white font-semibold text-[#2D2D2A]"
          >
            <option value="all">All Movement Types</option>
            <option value="PURCHASE_RECEIPT">Purchase Receipt (Inward)</option>
            <option value="SALES_FULFILLMENT">Sales Fulfillment (Outward)</option>
            <option value="ADJUSTMENT_ADD">Audit Additions (+)</option>
            <option value="ADJUSTMENT_REDUCE">Audit Deductions (-)</option>
            <option value="DAMAGE_WRITEOFF">Damage Write-offs</option>
            <option value="CUSTOMER_RETURN">Customer Returns</option>
            <option value="INITIAL_STOCK">Initial Stock</option>
          </select>
        </div>
      </div>

      {/* Movements Table */}
      <div className="bg-white rounded-3xl border border-[#E6E4DF] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FDFCF9] text-[#8A8882] font-semibold text-[10px] uppercase tracking-wider border-b border-[#E6E4DF]">
              <tr>
                <th className="px-5 py-3.5 font-semibold">Timestamp</th>
                <th className="px-5 py-3.5 font-semibold">Product & SKU</th>
                <th className="px-5 py-3.5 font-semibold">Type</th>
                <th className="px-5 py-3.5 font-semibold">Reference</th>
                <th className="px-5 py-3.5 font-semibold">Change</th>
                <th className="px-5 py-3.5 font-semibold">Balance</th>
                <th className="px-5 py-3.5 font-semibold">Reason / Notes</th>
                <th className="px-5 py-3.5 font-semibold">Auditor / User</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F3F1ED]">
              {filteredMovements.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-[#8A8882]">
                    No stock movements found matching your filters.
                  </td>
                </tr>
              ) : (
                filteredMovements.map((mov) => {
                  const isPositive = mov.quantityChange > 0;
                  return (
                    <tr key={mov.id} className="hover:bg-[#FDFCF9] transition-colors">
                      <td className="px-5 py-3.5 text-[#8A8882] font-medium whitespace-nowrap">
                        {mov.timestamp}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="font-bold text-[#2D2D2A]">{mov.productName}</div>
                        <code className="text-[11px] text-[#8A8882] font-mono bg-[#F3F1ED] px-1.5 py-0.5 rounded text-[#3E4A3D]">{mov.sku}</code>
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                            mov.type === 'PURCHASE_RECEIPT'
                              ? 'bg-[#A7C4BC]/30 text-[#2D362C] border border-[#A7C4BC]/40'
                              : mov.type === 'SALES_FULFILLMENT'
                              ? 'bg-[#3E4A3D]/10 text-[#3E4A3D] border border-[#3E4A3D]/20'
                              : mov.type === 'DAMAGE_WRITEOFF'
                              ? 'bg-[#C97B5A]/20 text-[#C97B5A] border border-[#C97B5A]/30'
                              : 'bg-[#F3F1ED] text-[#8A8882] border border-[#E6E4DF]'
                          }`}
                        >
                          {mov.type.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 font-mono font-bold text-[#3E4A3D]">
                        {mov.referenceId}
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1 font-bold font-mono text-sm ${
                            isPositive ? 'text-[#3E4A3D]' : 'text-[#C97B5A]'
                          }`}
                        >
                          {isPositive ? (
                            <ArrowUpRight className="w-3.5 h-3.5 text-[#A7C4BC]" />
                          ) : (
                            <ArrowDownRight className="w-3.5 h-3.5 text-[#C97B5A]" />
                          )}
                          {isPositive ? `+${mov.quantityChange}` : mov.quantityChange}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="font-bold text-[#2D2D2A] font-mono">{mov.newStock} units</div>
                        <div className="text-[10px] text-[#8A8882]">Prev: {mov.previousStock}</div>
                      </td>
                      <td className="px-5 py-3.5 text-[#8A8882] max-w-xs truncate">{mov.reason}</td>
                      <td className="px-5 py-3.5 text-[#8A8882] whitespace-nowrap font-medium">
                        {mov.performedBy}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <StockAdjustModal
        isOpen={isAdjustModalOpen}
        onClose={() => setIsAdjustModalOpen(false)}
      />
    </div>
  );
};
