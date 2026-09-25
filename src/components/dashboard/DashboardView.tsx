import React, { useMemo } from 'react';
import {
  AlertCircle,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Boxes,
  CheckCircle2,
  CircleDollarSign,
  Clock,
  Coins,
  CreditCard,
  DollarSign,
  Flame,
  Layers,
  Package,
  Plus,
  Receipt,
  ShoppingCart,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Truck,
  Users,
  Wallet,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useApp } from '../../context/AppContext';
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  formatNepaliDate,
  getTodayNepaliDate,
  getPaymentStatusBadge,
  getPOStatusBadge,
  getSalesStatusBadge,
} from '../../utils/formatters';

interface DashboardViewProps {
  onOpenNewSale?: () => void;
  onOpenNewPO?: () => void;
  onOpenAddProduct?: () => void;
  onOpenAdjustStock?: (productId?: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onOpenNewSale,
  onOpenNewPO,
  onOpenAddProduct,
  onOpenAdjustStock,
}) => {
  const {
    metrics,
    businessProfile,
    salesOrders,
    purchaseOrders,
    products,
    categories,
    stockMovements,
    setActiveTab,
    setActiveInvoiceForModal,
    setActivePOForModal,
  } = useApp();

  // Natural Tones palette for category charts
  const naturalColors = ['#3E4A3D', '#A7C4BC', '#C97B5A', '#8A8882', '#6B7A6A', '#D4A373', '#5E503F'];

  // Prepare monthly revenue & purchase comparison chart data
  const chartData = useMemo(() => {
    return [
      { month: 'Mar', sales: 14200, purchases: 9100, profit: 5100 },
      { month: 'Apr', sales: 18500, purchases: 11400, profit: 7100 },
      { month: 'May', sales: 21900, purchases: 13800, profit: 8100 },
      { month: 'Jun', sales: 24800, purchases: 15200, profit: 9600 },
      { month: 'Jul', sales: 29400, purchases: 17800, profit: 11600 },
      {
        month: 'Aug',
        sales: Math.max(31200, metrics.totalRevenue),
        purchases: Math.max(18600, metrics.totalPurchasesCost),
        profit: Math.max(12600, metrics.grossProfit),
      },
    ];
  }, [metrics]);

  // Category distribution data
  const categoryChartData = useMemo(() => {
    const map = new Map<string, number>();
    products.forEach((p) => {
      if (p.status === 'active') {
        const val = p.currentStock * p.purchasePrice;
        map.set(p.categoryId, (map.get(p.categoryId) || 0) + val);
      }
    });

    return categories
      .map((c, idx) => ({
        name: c.name,
        value: Number((map.get(c.id) || 0).toFixed(2)),
        color: naturalColors[idx % naturalColors.length],
      }))
      .filter((item) => item.value > 0);
  }, [products, categories]);

  // Low stock products
  const criticalProducts = useMemo(() => {
    return products
      .filter((p) => p.status === 'active' && p.currentStock <= p.minReorderLevel)
      .sort((a, b) => a.currentStock - b.currentStock);
  }, [products]);

  // Top products by sales volume
  const topSellingProducts = useMemo(() => {
    const itemMap = new Map<string, { name: string; sku: string; qty: number; revenue: number }>();
    salesOrders.forEach((so) => {
      if (so.status !== 'cancelled') {
        so.items.forEach((it) => {
          const prev = itemMap.get(it.productId) || {
            name: it.productName,
            sku: it.sku,
            qty: 0,
            revenue: 0,
          };
          prev.qty += it.quantity;
          prev.revenue += it.total;
          itemMap.set(it.productId, prev);
        });
      }
    });
    return Array.from(itemMap.values())
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);
  }, [salesOrders]);

  const recentSales = salesOrders.slice(0, 5);
  const recentPurchases = purchaseOrders.slice(0, 5);
  const todayNepali = getTodayNepaliDate();

  return (
    <div className="space-y-8">
      {/* Top Natural Tones Banner */}
      <div className="bg-[#3E4A3D] text-[#F4F1EA] rounded-3xl p-6 sm:p-8 shadow-sm relative overflow-hidden">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#A7C4BC]/20 border border-[#A7C4BC]/30 text-[#A7C4BC] text-xs font-semibold mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>आजको मिति: वि.सं. {todayNepali.bsDevanagariStr} {todayNepali.monthNameNp} ({todayNepali.adText})</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-serif italic tracking-tight text-white">
              Inventory & Commerce Intelligence
            </h2>
            <p className="mt-1.5 text-xs sm:text-sm text-[#F4F1EA]/80 max-w-2xl leading-relaxed">
              Unified operational control across store inventory, supplier purchase pipelines, POS register sales, and cashflow treasuries.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              id="dash-quick-pos-btn"
              onClick={() => setActiveTab('pos')}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#A7C4BC] hover:bg-[#96b4ab] text-[#2D362C] font-semibold rounded-full text-xs sm:text-sm shadow-xs transition-colors"
            >
              <ShoppingCart className="w-4 h-4" />
              POS Register
            </button>
            <button
              id="dash-quick-sale-btn"
              onClick={onOpenNewSale || (() => setActiveTab('sales'))}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#F4F1EA]/15 hover:bg-[#F4F1EA]/25 text-white font-semibold rounded-full text-xs sm:text-sm border border-[#F4F1EA]/20 transition-colors"
            >
              <Receipt className="w-4 h-4 text-[#A7C4BC]" />
              New Invoice
            </button>
            <button
              id="dash-quick-po-btn"
              onClick={onOpenNewPO || (() => setActiveTab('purchases'))}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#2D362C] hover:bg-[#20271f] text-[#F4F1EA] font-semibold rounded-full text-xs sm:text-sm border border-[#F4F1EA]/10 transition-colors"
            >
              <Truck className="w-4 h-4 text-[#A7C4BC]" />
              New Purchase
            </button>
          </div>
        </div>
      </div>

      {/* 4-Column Primary Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Valuation */}
        <div className="bg-white p-6 rounded-3xl border border-[#E6E4DF] shadow-xs hover:border-[#A7C4BC] transition-all">
          <p className="text-xs uppercase tracking-widest text-[#8A8882] mb-1.5 font-semibold">
            Inventory Valuation (Cost)
          </p>
          <h3 className="text-2xl sm:text-3xl font-bold text-[#3E4A3D] tracking-tight">
            {formatCurrency(metrics.inventoryCostValue, businessProfile.currencySymbol)}
          </h3>
          <p className="text-xs text-[#3E4A3D] mt-2.5 flex items-center gap-1 font-medium">
            <span className="text-[#A7C4BC] font-bold">↑</span> Retail: {formatCurrency(metrics.inventoryRetailValue, businessProfile.currencySymbol)}
          </p>
        </div>

        {/* Sales Revenue */}
        <div className="bg-white p-6 rounded-3xl border border-[#E6E4DF] shadow-xs hover:border-[#A7C4BC] transition-all">
          <p className="text-xs uppercase tracking-widest text-[#8A8882] mb-1.5 font-semibold">
            Sales Revenue (Total)
          </p>
          <h3 className="text-2xl sm:text-3xl font-bold text-[#3E4A3D] tracking-tight">
            {formatCurrency(metrics.totalRevenue, businessProfile.currencySymbol)}
          </h3>
          <p className="text-xs text-[#8A8882] mt-2.5">
            {salesOrders.length} Invoices • Gross Margin: {(metrics.grossMarginPercent ?? 0).toFixed(1)}%
          </p>
        </div>

        {/* Pending Receivables & Payables */}
        <div className="bg-white p-6 rounded-3xl border border-[#E6E4DF] shadow-xs hover:border-[#A7C4BC] transition-all">
          <p className="text-xs uppercase tracking-widest text-[#8A8882] mb-1.5 font-semibold">
            Pending Receivables
          </p>
          <h3 className="text-2xl sm:text-3xl font-bold text-[#C97B5A] tracking-tight">
            {formatCurrency(metrics.totalReceivables, businessProfile.currencySymbol)}
          </h3>
          <p className="text-xs text-[#8A8882] mt-2.5">
            Payables to vendors: {formatCurrency(metrics.totalPayables, businessProfile.currencySymbol)}
          </p>
        </div>

        {/* Low Stock Highlight Card */}
        <div
          onClick={() => setActiveTab('products')}
          className="bg-[#A7C4BC]/20 p-6 rounded-3xl border border-[#A7C4BC]/40 shadow-xs cursor-pointer hover:bg-[#A7C4BC]/30 transition-all"
        >
          <p className="text-xs uppercase tracking-widest text-[#3E4A3D] mb-1.5 font-semibold">
            Low Stock Alerts
          </p>
          <h3 className="text-2xl sm:text-3xl font-bold text-[#3E4A3D] tracking-tight">
            {criticalProducts.length < 10 ? `0${criticalProducts.length}` : criticalProducts.length} <span className="text-sm font-normal opacity-70">SKUs</span>
          </h3>
          <p className="text-xs text-[#3E4A3D] mt-2.5 font-medium flex items-center gap-1.5">
            <Flame className="w-3.5 h-3.5 text-[#C97B5A]" />
            {metrics.outOfStockCount > 0 ? `${metrics.outOfStockCount} out of stock` : 'Reorder recommended'}
          </p>
        </div>
      </div>

      {/* Analytics & Distribution Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales vs Purchases Trend */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-[#E6E4DF] p-6 shadow-xs flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-[#E6E4DF]">
            <div>
              <h3 className="font-serif italic text-xl text-[#3E4A3D]">Sales & Procurement Trends</h3>
              <p className="text-xs text-[#8A8882]">Monthly revenue generated vs. inbound purchase costs</p>
            </div>
            <div className="flex items-center gap-4 text-xs font-medium">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-[#3E4A3D]"></span>
                <span className="text-[#2D2D2A]">Sales Revenue</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-[#A7C4BC]"></span>
                <span className="text-[#8A8882]">Purchases</span>
              </div>
            </div>
          </div>

          <div className="h-72 w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="naturalSalesGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3E4A3D" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#3E4A3D" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="naturalPurchaseGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#A7C4BC" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#A7C4BC" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E6E4DF" />
                <XAxis dataKey="month" stroke="#8A8882" fontSize={12} tickLine={false} />
                <YAxis
                  stroke="#8A8882"
                  fontSize={12}
                  tickLine={false}
                  tickFormatter={(val) => `$${val / 1000}k`}
                />
                <Tooltip
                  formatter={(val: number) => [
                    formatCurrency(val, businessProfile.currencySymbol),
                    '',
                  ]}
                  contentStyle={{
                    backgroundColor: '#3E4A3D',
                    borderRadius: '16px',
                    color: '#F4F1EA',
                    fontSize: '12px',
                    border: '1px solid rgba(244,241,234,0.1)',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="sales"
                  name="Sales Revenue"
                  stroke="#3E4A3D"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#naturalSalesGrad)"
                />
                <Area
                  type="monotone"
                  dataKey="purchases"
                  name="Purchases"
                  stroke="#A7C4BC"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#naturalPurchaseGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Breakdown & Optimization */}
        <div className="bg-white rounded-3xl border border-[#E6E4DF] p-6 shadow-xs flex flex-col justify-between">
          <div className="pb-3 border-b border-[#E6E4DF]">
            <h3 className="font-serif italic text-xl text-[#3E4A3D]">Asset Distribution</h3>
            <p className="text-xs text-[#8A8882]">Category stock value proportion</p>
          </div>

          <div className="h-52 w-full my-auto flex items-center justify-center">
            {categoryChartData.length === 0 ? (
              <div className="text-xs text-[#8A8882]">No category stock registered</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {categoryChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val: number) => [
                      formatCurrency(val, businessProfile.currencySymbol),
                      'Stock Cost Value',
                    ]}
                    contentStyle={{
                      backgroundColor: '#3E4A3D',
                      borderRadius: '16px',
                      color: '#F4F1EA',
                      fontSize: '12px',
                      border: 'none',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="space-y-2 pt-3 border-t border-[#E6E4DF] max-h-32 overflow-y-auto">
            {categoryChartData.map((cat) => (
              <div key={cat.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 truncate">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: cat.color }}
                  ></span>
                  <span className="text-[#2D2D2A] truncate font-medium">{cat.name}</span>
                </div>
                <span className="font-bold text-[#3E4A3D] shrink-0 font-mono">
                  {formatCurrency(cat.value, businessProfile.currencySymbol)}
                </span>
              </div>
            ))}
          </div>

          {/* Natural Optimization Callout */}
          <div className="mt-4 p-3.5 bg-[#FDFCF9] rounded-2xl border border-dashed border-[#E6E4DF]">
            <p className="text-[10px] text-center text-[#8A8882] font-semibold uppercase tracking-widest">
              Evergreen Optimization Tip
            </p>
            <p className="text-xs text-center text-[#3E4A3D] mt-1 font-medium">
              Maintain optimal stock levels on top-volume SKUs to reduce carrying expenses.
            </p>
          </div>
        </div>
      </div>

      {/* Dual Recent Transactions Table: Invoices & POs in Natural Tones */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Invoices Card */}
        <div className="bg-white rounded-3xl border border-[#E6E4DF] overflow-hidden flex flex-col shadow-xs">
          <div className="p-6 border-b border-[#E6E4DF] flex justify-between items-center">
            <div>
              <h3 className="font-serif italic text-lg text-[#3E4A3D]">Recent Sales Invoices</h3>
              <p className="text-xs text-[#8A8882]">Customer fulfillment and payment tracking</p>
            </div>
            <button
              onClick={() => setActiveTab('sales')}
              className="text-xs font-semibold uppercase tracking-wider text-[#3E4A3D] hover:text-[#2D362C] underline decoration-[#A7C4BC]"
            >
              View All
            </button>
          </div>

          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-[#FDFCF9] text-[10px] uppercase tracking-wider text-[#8A8882] border-b border-[#E6E4DF]">
                <tr>
                  <th className="px-6 py-3 font-semibold">Invoice ID</th>
                  <th className="px-6 py-3 font-semibold">Customer</th>
                  <th className="px-6 py-3 font-semibold">Amount</th>
                  <th className="px-6 py-3 font-semibold">Status</th>
                  <th className="px-6 py-3 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-[#F3F1ED]">
                {recentSales.map((so) => {
                  const isPaid = so.paymentStatus === 'paid';
                  const isPartial = so.paymentStatus === 'partial';
                  return (
                    <tr key={so.id} className="hover:bg-[#FDFCF9] transition-colors">
                      <td className="px-6 py-3.5">
                        <div className="font-mono text-xs font-bold text-[#3E4A3D]">
                          {so.invoiceNumber}
                        </div>
                        <div className="text-[10px] text-[#8A8882]">
                          {formatNepaliDate(so.orderDate, { format: 'standard', language: 'np' })}
                        </div>
                      </td>
                      <td className="px-6 py-3.5 text-xs text-[#2D2D2A] font-medium truncate max-w-[140px]">
                        {so.customerName}
                      </td>
                      <td className="px-6 py-3.5 text-xs font-bold text-[#3E4A3D] font-mono">
                        {formatCurrency(so.grandTotal, businessProfile.currencySymbol)}
                      </td>
                      <td className="px-6 py-3.5">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide ${
                            isPaid
                              ? 'bg-[#A7C4BC]/30 text-[#2D362C]'
                              : isPartial
                              ? 'bg-[#C97B5A]/20 text-[#C97B5A]'
                              : 'bg-[#F3F1ED] text-[#8A8882]'
                          }`}
                        >
                          {so.paymentStatus.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-right">
                        <button
                          onClick={() => setActiveInvoiceForModal(so)}
                          className="px-3 py-1 text-xs font-medium text-[#3E4A3D] bg-[#F3F1ED] hover:bg-[#E6E4DF] rounded-full transition-colors"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Purchases Card */}
        <div className="bg-white rounded-3xl border border-[#E6E4DF] overflow-hidden flex flex-col shadow-xs">
          <div className="p-6 border-b border-[#E6E4DF] flex justify-between items-center">
            <div>
              <h3 className="font-serif italic text-lg text-[#3E4A3D]">Recent Purchases (खरिद)</h3>
              <p className="text-xs text-[#8A8882]">Direct supplier purchases & stock additions</p>
            </div>
            <button
              onClick={() => setActiveTab('purchases')}
              className="text-xs font-semibold uppercase tracking-wider text-[#3E4A3D] hover:text-[#2D362C] underline decoration-[#A7C4BC]"
            >
              View All
            </button>
          </div>

          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-[#FDFCF9] text-[10px] uppercase tracking-wider text-[#8A8882] border-b border-[#E6E4DF]">
                <tr>
                  <th className="px-6 py-3 font-semibold">Bill #</th>
                  <th className="px-6 py-3 font-semibold">Supplier</th>
                  <th className="px-6 py-3 font-semibold">Amount</th>
                  <th className="px-6 py-3 font-semibold">Stock Impact</th>
                  <th className="px-6 py-3 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-[#F3F1ED]">
                {recentPurchases.map((po) => {
                  const totalUnits = po.items.reduce((s, it) => s + (it.quantity || 0), 0);
                  return (
                    <tr key={po.id} className="hover:bg-[#FDFCF9] transition-colors">
                      <td className="px-6 py-3.5">
                        <div className="font-mono text-xs font-bold text-[#3E4A3D]">
                          {po.poNumber}
                        </div>
                        <div className="text-[10px] text-[#8A8882]">
                          {formatNepaliDate(po.orderDate, { format: 'standard', language: 'np' })}
                        </div>
                      </td>
                      <td className="px-6 py-3.5 text-xs text-[#2D2D2A] font-medium truncate max-w-[140px]">
                        {po.vendorName}
                      </td>
                      <td className="px-6 py-3.5 text-xs font-bold text-[#3E4A3D] font-mono">
                        {formatCurrency(po.grandTotal, businessProfile.currencySymbol)}
                      </td>
                      <td className="px-6 py-3.5">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide bg-[#3E4A3D]/10 text-[#3E4A3D] border border-[#3E4A3D]/20">
                          +{totalUnits} in stock
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-right">
                        <button
                          onClick={() => setActiveTab('purchases')}
                          className="px-3 py-1 text-xs font-medium text-[#3E4A3D] bg-[#F3F1ED] hover:bg-[#E6E4DF] rounded-full transition-colors"
                        >
                          Details
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
