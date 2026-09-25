import React, { useMemo, useState } from 'react';
import {
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
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  BarChart2,
  Calendar,
  CheckCircle2,
  Clock,
  DollarSign,
  Download,
  FileSpreadsheet,
  FileText,
  Filter,
  Layers,
  ListFilter,
  PieChart as PieIcon,
  Printer,
  Receipt,
  RefreshCw,
  Search,
  ShoppingBag,
  TrendingDown,
  TrendingUp,
  Truck,
  Wallet,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { exportToCSV, formatCurrency, formatDate, getPaymentStatusBadge } from '../../utils/formatters';
import {
  adToBs,
  formatNepaliDate,
  NEPALI_MONTHS_EN,
  NEPALI_MONTHS_NP,
  toDevanagariDigits,
} from '../../utils/nepaliDate';
import { NepaliDatePicker } from '../common/NepaliDatePicker';

type ReportTab = 'date-range' | 'month-wise' | 'inventory-breakdown';
type RangePreset = '1-year' | 'fiscal-year' | 'last-6-months' | 'last-3-months' | 'this-month' | 'all-time' | 'custom';
type CalendarSystem = 'bs' | 'ad';
type LedgerViewMode = 'itemized' | 'invoice';

export const ReportsView: React.FC = () => {
  const {
    products,
    salesOrders,
    purchaseOrders,
    categories,
    metrics,
    businessProfile,
    setActiveInvoiceForModal,
  } = useApp();

  // Active Main Tab
  const [activeTab, setActiveTab] = useState<ReportTab>('date-range');

  // --- TAB 1: DATE RANGE & 1-YEAR REPORT STATE ---
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const oneYearAgoStr = useMemo(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 1);
    return d.toISOString().split('T')[0];
  }, []);

  const [rangePreset, setRangePreset] = useState<RangePreset>('1-year');
  const [startDate, setStartDate] = useState<string>(oneYearAgoStr);
  const [endDate, setEndDate] = useState<string>(todayStr);
  const [ledgerFilter, setLedgerFilter] = useState<'all' | 'sales' | 'purchases'>('all');
  const [ledgerSearch, setLedgerSearch] = useState<string>('');
  const [ledgerViewMode, setLedgerViewMode] = useState<LedgerViewMode>('itemized');

  // Handle Preset Switching
  const handleSelectPreset = (preset: RangePreset) => {
    setRangePreset(preset);
    const now = new Date();
    const today = now.toISOString().split('T')[0];

    if (preset === '1-year') {
      const pastYear = new Date(now);
      pastYear.setFullYear(pastYear.getFullYear() - 1);
      setStartDate(pastYear.toISOString().split('T')[0]);
      setEndDate(today);
    } else if (preset === 'fiscal-year') {
      // Nepalese Fiscal Year starts Shrawan 1 (approx mid-July)
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      let fyStartYear = currentYear;
      if (currentMonth < 6) {
        fyStartYear = currentYear - 1;
      }
      const fyStart = new Date(fyStartYear, 6, 16);
      const fyEnd = new Date(fyStartYear + 1, 6, 15);
      setStartDate(fyStart.toISOString().split('T')[0]);
      setEndDate(today < fyEnd.toISOString().split('T')[0] ? today : fyEnd.toISOString().split('T')[0]);
    } else if (preset === 'last-6-months') {
      const past = new Date(now);
      past.setMonth(past.getMonth() - 6);
      setStartDate(past.toISOString().split('T')[0]);
      setEndDate(today);
    } else if (preset === 'last-3-months') {
      const past = new Date(now);
      past.setMonth(past.getMonth() - 3);
      setStartDate(past.toISOString().split('T')[0]);
      setEndDate(today);
    } else if (preset === 'this-month') {
      const past = new Date(now.getFullYear(), now.getMonth(), 1);
      setStartDate(past.toISOString().split('T')[0]);
      setEndDate(today);
    } else if (preset === 'all-time') {
      setStartDate('2020-01-01');
      setEndDate(today);
    }
  };

  // Filtered Orders within Date Range
  const filteredSalesOrders = useMemo(() => {
    return salesOrders.filter((so) => {
      if (so.status === 'cancelled') return false;
      const d = so.orderDate.split('T')[0];
      if (startDate && d < startDate) return false;
      if (endDate && d > endDate) return false;
      return true;
    });
  }, [salesOrders, startDate, endDate]);

  const filteredPurchaseOrders = useMemo(() => {
    return purchaseOrders.filter((po) => {
      if (po.status === 'cancelled') return false;
      const d = po.orderDate.split('T')[0];
      if (startDate && d < startDate) return false;
      if (endDate && d > endDate) return false;
      return true;
    });
  }, [purchaseOrders, startDate, endDate]);

  // Executive Date-Range Summary Metrics (Includes Qty, Taxable, Tax, Grand Total)
  const rangeMetrics = useMemo(() => {
    let salesQuantity = 0;
    let totalSalesTaxable = 0;
    let totalSalesTax = 0;
    let totalSalesGrand = 0;
    let totalSalesPaid = 0;
    let totalSalesCost = 0;

    filteredSalesOrders.forEach((so) => {
      const q = so.items.reduce((s, i) => s + i.quantity, 0);
      salesQuantity += q;
      totalSalesTaxable += so.subtotal;
      totalSalesTax += so.taxTotal;
      totalSalesGrand += so.grandTotal;
      totalSalesPaid += so.paidAmount;
      totalSalesCost += so.totalCost || 0;
    });

    const totalSalesDue = Math.max(0, totalSalesGrand - totalSalesPaid);
    const totalGrossProfit = totalSalesGrand - totalSalesCost;

    let purchaseQuantity = 0;
    let totalPurchasesTaxable = 0;
    let totalPurchasesTax = 0;
    let totalPurchasesGrand = 0;
    let totalPurchasesPaid = 0;

    filteredPurchaseOrders.forEach((po) => {
      const q = po.items.reduce((s, i) => s + i.quantity, 0);
      purchaseQuantity += q;
      totalPurchasesTaxable += po.subtotal;
      totalPurchasesTax += po.taxTotal;
      totalPurchasesGrand += po.grandTotal;
      totalPurchasesPaid += po.paidAmount;
    });

    const totalPurchasesDue = Math.max(0, totalPurchasesGrand - totalPurchasesPaid);

    const netTaxable = totalSalesTaxable - totalPurchasesTaxable;
    const netTaxLiability = totalSalesTax - totalPurchasesTax; // Sales VAT minus Purchase VAT
    const netDifference = totalSalesGrand - totalPurchasesGrand;
    const netCashflow = totalSalesPaid - totalPurchasesPaid;
    const profitMargin = totalSalesGrand > 0 ? (totalGrossProfit / totalSalesGrand) * 100 : 0;
    const netSpreadMargin = totalSalesGrand > 0 ? (netDifference / totalSalesGrand) * 100 : 0;

    return {
      salesCount: filteredSalesOrders.length,
      salesQuantity,
      totalSalesTaxable,
      totalSalesTax,
      totalSalesGrand,
      totalSalesPaid,
      totalSalesDue,
      totalSalesCost,
      totalGrossProfit,
      purchaseCount: filteredPurchaseOrders.length,
      purchaseQuantity,
      totalPurchasesTaxable,
      totalPurchasesTax,
      totalPurchasesGrand,
      totalPurchasesPaid,
      totalPurchasesDue,
      netTaxable,
      netTaxLiability,
      netDifference,
      netCashflow,
      profitMargin,
      netSpreadMargin,
    };
  }, [filteredSalesOrders, filteredPurchaseOrders]);

  // 1. Item-Level Tax Register (Qty, Rate, Taxable, Tax Amount)
  const itemizedLedger = useMemo(() => {
    const list: Array<{
      id: string;
      type: 'SALE' | 'PURCHASE';
      billNumber: string;
      partyName: string;
      date: string;
      productName: string;
      sku: string;
      quantity: number;
      rate: number;
      discount: number;
      taxableAmount: number;
      taxRate: number;
      taxAmount: number;
      totalAmount: number;
      rawOrder: any;
    }> = [];

    if (ledgerFilter === 'all' || ledgerFilter === 'sales') {
      filteredSalesOrders.forEach((so) => {
        so.items.forEach((item, idx) => {
          const gross = item.quantity * item.unitPrice;
          const discountVal = (gross * (item.discount || 0)) / 100;
          const taxable = gross - discountVal;
          const taxAmt = (taxable * (item.taxRate || 0)) / 100;
          const lineTotal = taxable + taxAmt;

          list.push({
            id: `sale-item-${so.id}-${idx}`,
            type: 'SALE',
            billNumber: so.invoiceNumber,
            partyName: so.customerName,
            date: so.orderDate,
            productName: item.productName,
            sku: item.sku,
            quantity: item.quantity,
            rate: item.unitPrice,
            discount: item.discount || 0,
            taxableAmount: taxable,
            taxRate: item.taxRate || 0,
            taxAmount: taxAmt,
            totalAmount: lineTotal,
            rawOrder: so,
          });
        });
      });
    }

    if (ledgerFilter === 'all' || ledgerFilter === 'purchases') {
      filteredPurchaseOrders.forEach((po) => {
        po.items.forEach((item, idx) => {
          const gross = item.quantity * item.unitCost;
          const discountVal = (gross * (item.discount || 0)) / 100;
          const taxable = gross - discountVal;
          const taxAmt = (taxable * (item.taxRate || 0)) / 100;
          const lineTotal = taxable + taxAmt;

          list.push({
            id: `purchase-item-${po.id}-${idx}`,
            type: 'PURCHASE',
            billNumber: po.poNumber,
            partyName: po.vendorName,
            date: po.orderDate,
            productName: item.productName,
            sku: item.sku,
            quantity: item.quantity,
            rate: item.unitCost,
            discount: item.discount || 0,
            taxableAmount: taxable,
            taxRate: item.taxRate || 0,
            taxAmount: taxAmt,
            totalAmount: lineTotal,
            rawOrder: po,
          });
        });
      });
    }

    // Sort descending by date
    list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    if (!ledgerSearch.trim()) return list;
    const q = ledgerSearch.toLowerCase().trim();
    return list.filter(
      (item) =>
        item.billNumber.toLowerCase().includes(q) ||
        item.partyName.toLowerCase().includes(q) ||
        item.productName.toLowerCase().includes(q) ||
        item.sku.toLowerCase().includes(q)
    );
  }, [filteredSalesOrders, filteredPurchaseOrders, ledgerFilter, ledgerSearch]);

  // 2. Bill/Invoice Summary Ledger
  const combinedLedger = useMemo(() => {
    const list: Array<{
      id: string;
      type: 'SALE' | 'PURCHASE';
      billNumber: string;
      partyName: string;
      date: string;
      totalQuantity: number;
      taxableAmount: number;
      taxAmount: number;
      grandTotal: number;
      paidAmount: number;
      balanceDue: number;
      paymentStatus: string;
      rawOrder: any;
    }> = [];

    if (ledgerFilter === 'all' || ledgerFilter === 'sales') {
      filteredSalesOrders.forEach((so) => {
        list.push({
          id: so.id,
          type: 'SALE',
          billNumber: so.invoiceNumber,
          partyName: so.customerName,
          date: so.orderDate,
          totalQuantity: so.items.reduce((s, i) => s + i.quantity, 0),
          taxableAmount: so.subtotal,
          taxAmount: so.taxTotal,
          grandTotal: so.grandTotal,
          paidAmount: so.paidAmount,
          balanceDue: Math.max(0, so.grandTotal - so.paidAmount),
          paymentStatus: so.paymentStatus,
          rawOrder: so,
        });
      });
    }

    if (ledgerFilter === 'all' || ledgerFilter === 'purchases') {
      filteredPurchaseOrders.forEach((po) => {
        list.push({
          id: po.id,
          type: 'PURCHASE',
          billNumber: po.poNumber,
          partyName: po.vendorName,
          date: po.orderDate,
          totalQuantity: po.items.reduce((s, i) => s + i.quantity, 0),
          taxableAmount: po.subtotal,
          taxAmount: po.taxTotal,
          grandTotal: po.grandTotal,
          paidAmount: po.paidAmount,
          balanceDue: Math.max(0, po.grandTotal - po.paidAmount),
          paymentStatus: po.paymentStatus,
          rawOrder: po,
        });
      });
    }

    // Sort descending by date
    list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    if (!ledgerSearch.trim()) return list;
    const q = ledgerSearch.toLowerCase().trim();
    return list.filter(
      (item) =>
        item.billNumber.toLowerCase().includes(q) ||
        item.partyName.toLowerCase().includes(q)
    );
  }, [filteredSalesOrders, filteredPurchaseOrders, ledgerFilter, ledgerSearch]);

  // Export Date-Range Report with Qty, Rate, Taxable & Tax Amount
  const handleExportRangeReport = () => {
    if (ledgerViewMode === 'itemized') {
      const data = itemizedLedger.map((row) => ({
        Type: row.type === 'SALE' ? 'Sales (बिक्री)' : 'Purchase (खरिद)',
        BillInvoiceNo: row.billNumber,
        PartyName: row.partyName,
        InvoiceDateAD: row.date,
        InvoiceMitiBS: formatNepaliDate(row.date, { format: 'standard', language: 'np' }),
        ItemName: row.productName,
        SKU: row.sku,
        Quantity: row.quantity,
        Rate: row.rate,
        DiscountPercent: `${row.discount}%`,
        TaxableAmount: Number(row.taxableAmount.toFixed(2)),
        TaxRatePercent: `${row.taxRate}%`,
        TaxAmount: Number(row.taxAmount.toFixed(2)),
        TotalAmount: Number(row.totalAmount.toFixed(2)),
      }));
      exportToCSV(`itemized_sales_purchase_tax_report_${startDate}_to_${endDate}`, data);
    } else {
      const data = combinedLedger.map((row) => ({
        Type: row.type === 'SALE' ? 'Sales (बिक्री)' : 'Purchase (खरिद)',
        BillInvoiceNo: row.billNumber,
        PartyName: row.partyName,
        InvoiceDateAD: row.date,
        InvoiceMitiBS: formatNepaliDate(row.date, { format: 'standard', language: 'np' }),
        TotalQuantity: row.totalQuantity,
        TaxableAmount: Number(row.taxableAmount.toFixed(2)),
        TaxAmount: Number(row.taxAmount.toFixed(2)),
        GrandTotal: Number(row.grandTotal.toFixed(2)),
        PaidAmount: Number(row.paidAmount.toFixed(2)),
        BalanceDue: Number(row.balanceDue.toFixed(2)),
        PaymentStatus: row.paymentStatus,
      }));
      exportToCSV(`summary_sales_purchase_report_${startDate}_to_${endDate}`, data);
    }
  };

  // --- TAB 2: MONTH-WISE SALES AND PURCHASE REPORT STATE ---
  const [calendarSystem, setCalendarSystem] = useState<CalendarSystem>('bs');
  const currentBsYear = useMemo(() => {
    const todayBs = adToBs(new Date());
    return todayBs ? todayBs.year : 2083;
  }, []);
  const currentAdYear = useMemo(() => new Date().getFullYear(), []);

  const [selectedBsYear, setSelectedBsYear] = useState<number>(currentBsYear);
  const [selectedAdYear, setSelectedAdYear] = useState<number>(currentAdYear);

  // Available Year Options
  const bsYearOptions = [2084, 2083, 2082, 2081, 2080, 2079];
  const adYearOptions = [2027, 2026, 2025, 2024, 2023, 2022];

  // Month-wise Data Calculation with Quantity, Taxable, Tax Amount & Grand Total
  const monthwiseReportData = useMemo(() => {
    if (calendarSystem === 'bs') {
      // 12 Nepali Months (1 = Baisakh, 12 = Chaitra)
      const months = NEPALI_MONTHS_NP.map((npName, idx) => ({
        monthIndex: idx + 1,
        monthNameNp: npName,
        monthNameEn: NEPALI_MONTHS_EN[idx],
        label: `${toDevanagariDigits(idx + 1)}. ${npName} (${NEPALI_MONTHS_EN[idx]})`,
        salesCount: 0,
        salesQuantity: 0,
        salesTaxable: 0,
        salesTax: 0,
        salesGrandTotal: 0,
        salesPaid: 0,
        salesDue: 0,
        purchasesCount: 0,
        purchasesQuantity: 0,
        purchasesTaxable: 0,
        purchasesTax: 0,
        purchasesGrandTotal: 0,
        purchasesPaid: 0,
        purchasesDue: 0,
      }));

      // Map Sales
      salesOrders.forEach((so) => {
        if (so.status === 'cancelled') return;
        const bs = adToBs(so.orderDate);
        if (bs && bs.year === selectedBsYear && bs.month >= 1 && bs.month <= 12) {
          const row = months[bs.month - 1];
          row.salesCount += 1;
          row.salesQuantity += so.items.reduce((sum, item) => sum + item.quantity, 0);
          row.salesTaxable += so.subtotal;
          row.salesTax += so.taxTotal;
          row.salesGrandTotal += so.grandTotal;
          row.salesPaid += so.paidAmount;
          row.salesDue += Math.max(0, so.grandTotal - so.paidAmount);
        }
      });

      // Map Purchases
      purchaseOrders.forEach((po) => {
        if (po.status === 'cancelled') return;
        const bs = adToBs(po.orderDate);
        if (bs && bs.year === selectedBsYear && bs.month >= 1 && bs.month <= 12) {
          const row = months[bs.month - 1];
          row.purchasesCount += 1;
          row.purchasesQuantity += po.items.reduce((sum, item) => sum + item.quantity, 0);
          row.purchasesTaxable += po.subtotal;
          row.purchasesTax += po.taxTotal;
          row.purchasesGrandTotal += po.grandTotal;
          row.purchasesPaid += po.paidAmount;
          row.purchasesDue += Math.max(0, po.grandTotal - po.paidAmount);
        }
      });

      return months.map((m) => {
        const netProfit = m.salesGrandTotal - m.purchasesGrandTotal;
        const netTaxable = m.salesTaxable - m.purchasesTaxable;
        const netVatLiability = m.salesTax - m.purchasesTax;
        const marginPct = m.salesGrandTotal > 0 ? (netProfit / m.salesGrandTotal) * 100 : 0;
        const netCashflow = m.salesPaid - m.purchasesPaid;
        return {
          ...m,
          netProfit,
          netTaxable,
          netVatLiability,
          marginPct,
          netCashflow,
          // For Recharts
          chartLabel: m.monthNameEn.substring(0, 3),
          Sales: Number(m.salesGrandTotal.toFixed(2)),
          Purchases: Number(m.purchasesGrandTotal.toFixed(2)),
          Profit: Number(netProfit.toFixed(2)),
        };
      });
    } else {
      // 12 Gregorian Months (Jan - Dec)
      const adMonthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const months = adMonthNames.map((name, idx) => ({
        monthIndex: idx + 1,
        monthNameNp: NEPALI_MONTHS_NP[idx] || name,
        monthNameEn: name,
        label: `${idx + 1}. ${name} (${NEPALI_MONTHS_NP[idx] || ''})`,
        salesCount: 0,
        salesQuantity: 0,
        salesTaxable: 0,
        salesTax: 0,
        salesGrandTotal: 0,
        salesPaid: 0,
        salesDue: 0,
        purchasesCount: 0,
        purchasesQuantity: 0,
        purchasesTaxable: 0,
        purchasesTax: 0,
        purchasesGrandTotal: 0,
        purchasesPaid: 0,
        purchasesDue: 0,
      }));

      salesOrders.forEach((so) => {
        if (so.status === 'cancelled') return;
        const d = new Date(so.orderDate);
        if (d.getFullYear() === selectedAdYear) {
          const mIdx = d.getMonth();
          if (mIdx >= 0 && mIdx < 12) {
            const row = months[mIdx];
            row.salesCount += 1;
            row.salesQuantity += so.items.reduce((sum, item) => sum + item.quantity, 0);
            row.salesTaxable += so.subtotal;
            row.salesTax += so.taxTotal;
            row.salesGrandTotal += so.grandTotal;
            row.salesPaid += so.paidAmount;
            row.salesDue += Math.max(0, so.grandTotal - so.paidAmount);
          }
        }
      });

      purchaseOrders.forEach((po) => {
        if (po.status === 'cancelled') return;
        const d = new Date(po.orderDate);
        if (d.getFullYear() === selectedAdYear) {
          const mIdx = d.getMonth();
          if (mIdx >= 0 && mIdx < 12) {
            const row = months[mIdx];
            row.purchasesCount += 1;
            row.purchasesQuantity += po.items.reduce((sum, item) => sum + item.quantity, 0);
            row.purchasesTaxable += po.subtotal;
            row.purchasesTax += po.taxTotal;
            row.purchasesGrandTotal += po.grandTotal;
            row.purchasesPaid += po.paidAmount;
            row.purchasesDue += Math.max(0, po.grandTotal - po.paidAmount);
          }
        }
      });

      return months.map((m) => {
        const netProfit = m.salesGrandTotal - m.purchasesGrandTotal;
        const netTaxable = m.salesTaxable - m.purchasesTaxable;
        const netVatLiability = m.salesTax - m.purchasesTax;
        const marginPct = m.salesGrandTotal > 0 ? (netProfit / m.salesGrandTotal) * 100 : 0;
        const netCashflow = m.salesPaid - m.purchasesPaid;
        return {
          ...m,
          netProfit,
          netTaxable,
          netVatLiability,
          marginPct,
          netCashflow,
          chartLabel: m.monthNameEn,
          Sales: Number(m.salesGrandTotal.toFixed(2)),
          Purchases: Number(m.purchasesGrandTotal.toFixed(2)),
          Profit: Number(netProfit.toFixed(2)),
        };
      });
    }
  }, [calendarSystem, selectedBsYear, selectedAdYear, salesOrders, purchaseOrders]);

  // Annual Totals for Month-wise Report
  const annualTotals = useMemo(() => {
    let salesCount = 0;
    let salesQuantity = 0;
    let salesTaxable = 0;
    let salesTax = 0;
    let salesGrandTotal = 0;
    let salesPaid = 0;
    let salesDue = 0;

    let purchasesCount = 0;
    let purchasesQuantity = 0;
    let purchasesTaxable = 0;
    let purchasesTax = 0;
    let purchasesGrandTotal = 0;
    let purchasesPaid = 0;
    let purchasesDue = 0;

    monthwiseReportData.forEach((m) => {
      salesCount += m.salesCount;
      salesQuantity += m.salesQuantity;
      salesTaxable += m.salesTaxable;
      salesTax += m.salesTax;
      salesGrandTotal += m.salesGrandTotal;
      salesPaid += m.salesPaid;
      salesDue += m.salesDue;

      purchasesCount += m.purchasesCount;
      purchasesQuantity += m.purchasesQuantity;
      purchasesTaxable += m.purchasesTaxable;
      purchasesTax += m.purchasesTax;
      purchasesGrandTotal += m.purchasesGrandTotal;
      purchasesPaid += m.purchasesPaid;
      purchasesDue += m.purchasesDue;
    });

    const netProfit = salesGrandTotal - purchasesGrandTotal;
    const netTaxable = salesTaxable - purchasesTaxable;
    const netVatLiability = salesTax - purchasesTax;
    const marginPct = salesGrandTotal > 0 ? (netProfit / salesGrandTotal) * 100 : 0;
    const netCashflow = salesPaid - purchasesPaid;

    return {
      salesCount,
      salesQuantity,
      salesTaxable,
      salesTax,
      salesGrandTotal,
      salesPaid,
      salesDue,
      purchasesCount,
      purchasesQuantity,
      purchasesTaxable,
      purchasesTax,
      purchasesGrandTotal,
      purchasesPaid,
      purchasesDue,
      netProfit,
      netTaxable,
      netVatLiability,
      marginPct,
      netCashflow,
    };
  }, [monthwiseReportData]);

  // Export Month-wise CSV with Qty, Taxable, and Tax Amount
  const handleExportMonthwiseCSV = () => {
    const yearLabel = calendarSystem === 'bs' ? `BS_${selectedBsYear}` : `AD_${selectedAdYear}`;
    const data = monthwiseReportData.map((m) => ({
      MonthIndex: m.monthIndex,
      MonthName: `${m.monthNameNp} (${m.monthNameEn})`,
      SalesBillsCount: m.salesCount,
      SalesQuantity: m.salesQuantity,
      SalesTaxableAmount: Number(m.salesTaxable.toFixed(2)),
      SalesTaxAmount: Number(m.salesTax.toFixed(2)),
      SalesGrandTotal: Number(m.salesGrandTotal.toFixed(2)),
      SalesPaid: Number(m.salesPaid.toFixed(2)),
      SalesBalanceDue: Number(m.salesDue.toFixed(2)),
      PurchaseBillsCount: m.purchasesCount,
      PurchaseQuantity: m.purchasesQuantity,
      PurchaseTaxableAmount: Number(m.purchasesTaxable.toFixed(2)),
      PurchaseTaxAmount: Number(m.purchasesTax.toFixed(2)),
      PurchaseGrandTotal: Number(m.purchasesGrandTotal.toFixed(2)),
      PurchasePaid: Number(m.purchasesPaid.toFixed(2)),
      PurchaseBalanceDue: Number(m.purchasesDue.toFixed(2)),
      NetMarginProfit: Number(m.netProfit.toFixed(2)),
      NetVatPayable: Number(m.netVatLiability.toFixed(2)),
      ProfitMarginPercent: `${m.marginPct.toFixed(1)}%`,
      NetCashflow: Number(m.netCashflow.toFixed(2)),
    }));
    exportToCSV(`monthwise_sales_purchases_tax_${yearLabel}`, data);
  };

  // --- TAB 3: INVENTORY DIAGNOSTICS & CATEGORIES ---
  const categoryShare = useMemo(() => {
    return categories
      .map((cat) => {
        const catProducts = products.filter((p) => p.categoryId === cat.id);
        const stockValuation = catProducts.reduce(
          (sum, p) => sum + p.currentStock * p.purchasePrice,
          0
        );
        return {
          name: cat.name,
          value: stockValuation,
          color: cat.color,
        };
      })
      .filter((c) => c.value > 0);
  }, [categories, products]);

  const urgentRestockItems = useMemo(() => {
    return products
      .filter((p) => p.currentStock <= p.minReorderLevel)
      .sort((a, b) => a.currentStock - b.currentStock);
  }, [products]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Navigation Tabs */}
      <div className="no-print flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-3xl border border-[#E6E4DF] shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-serif italic text-[#3E4A3D]">
              Business Reports & Analytics (व्यापार प्रतिवेदन)
            </h2>
            <span className="hidden sm:inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#3E4A3D]/10 text-[#3E4A3D]">
              Nepal B.S. / A.D. Sync
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#8A8882] mt-1">
            Complete Sales & Purchase Reports with Quantity, Unit Rate, Taxable Amount, 13% VAT, and Grand Totals.
          </p>
        </div>

        {/* Primary Tab Buttons */}
        <div className="flex items-center p-1 bg-[#F3F1ED] rounded-2xl gap-1 shrink-0 overflow-x-auto">
          <button
            id="tab-date-range"
            type="button"
            onClick={() => setActiveTab('date-range')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'date-range'
                ? 'bg-white text-[#3E4A3D] shadow-xs'
                : 'text-[#8A8882] hover:text-[#2D2D2A]'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            Date Range & 1-Year Report
          </button>
          <button
            id="tab-month-wise"
            type="button"
            onClick={() => setActiveTab('month-wise')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'month-wise'
                ? 'bg-white text-[#3E4A3D] shadow-xs'
                : 'text-[#8A8882] hover:text-[#2D2D2A]'
            }`}
          >
            <BarChart2 className="w-3.5 h-3.5" />
            Month-wise Report (महिनावारी)
          </button>
          <button
            id="tab-inventory"
            type="button"
            onClick={() => setActiveTab('inventory-breakdown')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'inventory-breakdown'
                ? 'bg-white text-[#3E4A3D] shadow-xs'
                : 'text-[#8A8882] hover:text-[#2D2D2A]'
            }`}
          >
            <PieIcon className="w-3.5 h-3.5" />
            Stock & Categories
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: DATE RANGE & 1-YEAR OVERALL SALES & PURCHASES REPORT */}
      {/* ========================================================================= */}
      {activeTab === 'date-range' && (
        <div className="space-y-6">
          {/* Controls Bar */}
          <div className="no-print bg-white p-5 rounded-3xl border border-[#E6E4DF] shadow-xs space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-3 border-b border-[#F3F1ED]">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-[#3E4A3D]" />
                <span className="text-xs font-bold uppercase tracking-wider text-[#3E4A3D]">
                  Date Range Filter (मिति दायरा छनोट)
                </span>
              </div>

              {/* Quick Presets */}
              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                <button
                  type="button"
                  onClick={() => handleSelectPreset('1-year')}
                  className={`px-3 py-1.5 rounded-full font-bold transition-colors ${
                    rangePreset === '1-year'
                      ? 'bg-[#3E4A3D] text-white'
                      : 'bg-[#F3F1ED] text-[#63615A] hover:bg-[#E6E4DF]'
                  }`}
                >
                  ⚡ 1 Year Report (१ वर्ष)
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectPreset('fiscal-year')}
                  className={`px-3 py-1.5 rounded-full font-bold transition-colors ${
                    rangePreset === 'fiscal-year'
                      ? 'bg-[#3E4A3D] text-white'
                      : 'bg-[#F3F1ED] text-[#63615A] hover:bg-[#E6E4DF]'
                  }`}
                >
                  Fiscal Year (चालु आ.व.)
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectPreset('last-6-months')}
                  className={`px-3 py-1.5 rounded-full font-bold transition-colors ${
                    rangePreset === 'last-6-months'
                      ? 'bg-[#3E4A3D] text-white'
                      : 'bg-[#F3F1ED] text-[#63615A] hover:bg-[#E6E4DF]'
                  }`}
                >
                  Last 6 Months (६ महिना)
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectPreset('last-3-months')}
                  className={`px-3 py-1.5 rounded-full font-bold transition-colors ${
                    rangePreset === 'last-3-months'
                      ? 'bg-[#3E4A3D] text-white'
                      : 'bg-[#F3F1ED] text-[#63615A] hover:bg-[#E6E4DF]'
                  }`}
                >
                  Last 3 Months (३ महिना)
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectPreset('this-month')}
                  className={`px-3 py-1.5 rounded-full font-bold transition-colors ${
                    rangePreset === 'this-month'
                      ? 'bg-[#3E4A3D] text-white'
                      : 'bg-[#F3F1ED] text-[#63615A] hover:bg-[#E6E4DF]'
                  }`}
                >
                  This Month (यो महिना)
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectPreset('all-time')}
                  className={`px-3 py-1.5 rounded-full font-bold transition-colors ${
                    rangePreset === 'all-time'
                      ? 'bg-[#3E4A3D] text-white'
                      : 'bg-[#F3F1ED] text-[#63615A] hover:bg-[#E6E4DF]'
                  }`}
                >
                  All Time (सबै)
                </button>
              </div>
            </div>

            {/* Custom Date Pickers & Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
              <NepaliDatePicker
                id="report-start-date"
                label="Start Date (सुरु मिति)"
                value={startDate}
                onChange={(newDate) => {
                  setStartDate(newDate);
                  setRangePreset('custom');
                }}
              />

              <NepaliDatePicker
                id="report-end-date"
                label="End Date (अन्तिम मिति)"
                value={endDate}
                onChange={(newDate) => {
                  setEndDate(newDate);
                  setRangePreset('custom');
                }}
              />

              {/* Interval Information */}
              <div className="bg-[#FDFCF9] p-2.5 rounded-2xl border border-[#E6E4DF] text-xs">
                <span className="text-[10px] text-[#8A8882] uppercase font-bold block">
                  Reporting Window
                </span>
                <div className="font-bold text-[#3E4A3D] truncate mt-0.5">
                  {formatNepaliDate(startDate, { format: 'short', language: 'np' })} –{' '}
                  {formatNepaliDate(endDate, { format: 'short', language: 'np' })}
                </div>
                <div className="text-[10px] text-[#8A8882] truncate">
                  {startDate} to {endDate}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleExportRangeReport}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-[#3E4A3D] hover:bg-[#323D31] text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
                  title="Download CSV Ledger"
                >
                  <Download className="w-3.5 h-3.5" />
                  Export {ledgerViewMode === 'itemized' ? 'Itemized CSV' : 'Summary CSV'}
                </button>
                <button
                  type="button"
                  onClick={handlePrint}
                  className="flex items-center justify-center gap-1.5 px-3.5 py-2 bg-white hover:bg-[#F3F1ED] text-[#3E4A3D] border border-[#E6E4DF] text-xs font-bold rounded-xl transition-colors"
                  title="Print Report"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Print
                </button>
              </div>
            </div>
          </div>

          {/* Executive Scorecard: With Quantity, Taxable, Tax Amount and Grand Totals */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Sales Card */}
            <div className="bg-white p-5 rounded-3xl border border-[#E6E4DF] shadow-xs relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1">
                  <ShoppingBag className="w-3.5 h-3.5" /> Total Sales (कुल बिक्री)
                </span>
                <span className="text-xs font-bold font-mono bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200">
                  {rangeMetrics.salesCount} Bills
                </span>
              </div>
              <div className="text-2xl font-black font-mono text-emerald-700 mt-2">
                {formatCurrency(rangeMetrics.totalSalesGrand, businessProfile.currencySymbol)}
              </div>
              <div className="mt-2 text-[11px] text-[#8A8882] space-y-1 border-t border-[#F3F1ED] pt-2">
                <div className="flex justify-between">
                  <span className="font-medium text-[#63615A]">Total Quantity (परिमाण):</span>
                  <span className="font-bold text-[#2D2D2A] font-mono">
                    {rangeMetrics.salesQuantity} units
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-[#63615A]">Taxable Amount (करयोग्य):</span>
                  <span className="font-bold text-[#2D2D2A] font-mono">
                    {formatCurrency(rangeMetrics.totalSalesTaxable, businessProfile.currencySymbol)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-emerald-800">Tax / 13% VAT (कर रकम):</span>
                  <span className="font-bold text-emerald-700 font-mono">
                    {formatCurrency(rangeMetrics.totalSalesTax, businessProfile.currencySymbol)}
                  </span>
                </div>
                <div className="flex justify-between border-t border-dashed border-[#F3F1ED] pt-1">
                  <span>Cash Realized:</span>
                  <span className="font-semibold text-emerald-700">
                    {formatCurrency(rangeMetrics.totalSalesPaid, businessProfile.currencySymbol)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Balance Due:</span>
                  <span className="font-bold text-rose-600">
                    {formatCurrency(rangeMetrics.totalSalesDue, businessProfile.currencySymbol)}
                  </span>
                </div>
              </div>
            </div>

            {/* Total Purchases Card */}
            <div className="bg-white p-5 rounded-3xl border border-[#E6E4DF] shadow-xs relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-blue-800 uppercase tracking-wider flex items-center gap-1">
                  <Truck className="w-3.5 h-3.5" /> Total Purchases (कुल खरिद)
                </span>
                <span className="text-xs font-bold font-mono bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-200">
                  {rangeMetrics.purchaseCount} Bills
                </span>
              </div>
              <div className="text-2xl font-black font-mono text-blue-700 mt-2">
                {formatCurrency(rangeMetrics.totalPurchasesGrand, businessProfile.currencySymbol)}
              </div>
              <div className="mt-2 text-[11px] text-[#8A8882] space-y-1 border-t border-[#F3F1ED] pt-2">
                <div className="flex justify-between">
                  <span className="font-medium text-[#63615A]">Total Quantity (परिमाण):</span>
                  <span className="font-bold text-[#2D2D2A] font-mono">
                    {rangeMetrics.purchaseQuantity} units
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-[#63615A]">Taxable Amount (करयोग्य):</span>
                  <span className="font-bold text-[#2D2D2A] font-mono">
                    {formatCurrency(rangeMetrics.totalPurchasesTaxable, businessProfile.currencySymbol)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-blue-800">Tax / 13% VAT (कर रकम):</span>
                  <span className="font-bold text-blue-700 font-mono">
                    {formatCurrency(rangeMetrics.totalPurchasesTax, businessProfile.currencySymbol)}
                  </span>
                </div>
                <div className="flex justify-between border-t border-dashed border-[#F3F1ED] pt-1">
                  <span>Vendor Cash Paid:</span>
                  <span className="font-semibold text-blue-700">
                    {formatCurrency(rangeMetrics.totalPurchasesPaid, businessProfile.currencySymbol)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Payables Due:</span>
                  <span className="font-bold text-amber-700">
                    {formatCurrency(rangeMetrics.totalPurchasesDue, businessProfile.currencySymbol)}
                  </span>
                </div>
              </div>
            </div>

            {/* Net Difference / Margin */}
            <div className="bg-white p-5 rounded-3xl border border-[#E6E4DF] shadow-xs relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-[#3E4A3D] uppercase tracking-wider flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5" /> Net Difference (नाफा / बचत)
                </span>
                <span
                  className={`text-xs font-bold font-mono px-2 py-0.5 rounded-full border ${
                    rangeMetrics.netDifference >= 0
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : 'bg-rose-50 text-rose-800 border-rose-200'
                  }`}
                >
                  {rangeMetrics.netSpreadMargin.toFixed(1)}% Spread
                </span>
              </div>
              <div
                className={`text-2xl font-black font-mono mt-2 ${
                  rangeMetrics.netDifference >= 0 ? 'text-[#3E4A3D]' : 'text-rose-600'
                }`}
              >
                {formatCurrency(rangeMetrics.netDifference, businessProfile.currencySymbol)}
              </div>
              <div className="mt-2 text-[11px] text-[#8A8882] space-y-1 border-t border-[#F3F1ED] pt-2">
                <div className="flex justify-between">
                  <span className="font-medium text-[#63615A]">Net Taxable Spread:</span>
                  <span className="font-bold text-[#3E4A3D] font-mono">
                    {formatCurrency(rangeMetrics.netTaxable, businessProfile.currencySymbol)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-[#63615A]">Net VAT Liability (IRD):</span>
                  <span
                    className={`font-bold font-mono ${
                      rangeMetrics.netTaxLiability >= 0 ? 'text-amber-700' : 'text-emerald-700'
                    }`}
                  >
                    {formatCurrency(rangeMetrics.netTaxLiability, businessProfile.currencySymbol)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>COGS Gross Profit:</span>
                  <span className="font-bold text-[#3E4A3D]">
                    {formatCurrency(rangeMetrics.totalGrossProfit, businessProfile.currencySymbol)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Gross Margin %:</span>
                  <span className="font-semibold text-[#2D2D2A]">
                    {rangeMetrics.profitMargin.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>

            {/* Cashflow Realization */}
            <div className="bg-white p-5 rounded-3xl border border-[#E6E4DF] shadow-xs relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-purple-900 uppercase tracking-wider flex items-center gap-1">
                  <Wallet className="w-3.5 h-3.5" /> Net Cashflow
                </span>
                <span className="text-xs font-bold font-mono bg-purple-50 text-purple-800 px-2 py-0.5 rounded-full border border-purple-200">
                  In vs Out
                </span>
              </div>
              <div
                className={`text-2xl font-black font-mono mt-2 ${
                  rangeMetrics.netCashflow >= 0 ? 'text-emerald-700' : 'text-rose-600'
                }`}
              >
                {formatCurrency(rangeMetrics.netCashflow, businessProfile.currencySymbol)}
              </div>
              <div className="mt-2 text-[11px] text-[#8A8882] space-y-1 border-t border-[#F3F1ED] pt-2">
                <div className="flex justify-between">
                  <span>Customer Cash In:</span>
                  <span className="font-semibold text-emerald-700">
                    +{formatCurrency(rangeMetrics.totalSalesPaid, businessProfile.currencySymbol)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Supplier Cash Out:</span>
                  <span className="font-semibold text-rose-600">
                    -{formatCurrency(rangeMetrics.totalPurchasesPaid, businessProfile.currencySymbol)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Cash Realization:</span>
                  <span className="font-semibold text-[#2D2D2A]">
                    {rangeMetrics.totalSalesGrand > 0
                      ? `${((rangeMetrics.totalSalesPaid / rangeMetrics.totalSalesGrand) * 100).toFixed(0)}%`
                      : '0%'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Detailed Transaction Report with Quantity, Rate, Taxable, Tax Amount */}
          <div className="bg-white rounded-3xl border border-[#E6E4DF] shadow-xs overflow-hidden">
            <div className="p-5 border-b border-[#E6E4DF] flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-[#FDFCF9]">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-[#2D2D2A] text-sm">
                    {ledgerViewMode === 'itemized'
                      ? 'Itemized Tax Register (वस्तुगत विस्तृत विवरण: Quantity, Rate, Taxable & Tax Amount)'
                      : 'Invoice Summary Ledger (बिजक सारांश)'}
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#3E4A3D]/10 text-[#3E4A3D]">
                    {ledgerViewMode === 'itemized' ? `${itemizedLedger.length} Items` : `${combinedLedger.length} Bills`}
                  </span>
                </div>
                <p className="text-xs text-[#8A8882] mt-0.5">
                  Detailed audit register matching IRD Nepal sales/purchase books with units, unit rates, taxable base, and VAT.
                </p>
              </div>

              {/* View Switcher, Filter & Search */}
              <div className="flex flex-wrap items-center gap-3">
                {/* View Mode Toggle */}
                <div className="flex items-center bg-[#ECE9E2] p-0.5 rounded-xl text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setLedgerViewMode('itemized')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${
                      ledgerViewMode === 'itemized'
                        ? 'bg-white text-[#3E4A3D] shadow-xs'
                        : 'text-[#8A8882] hover:text-[#2D2D2A]'
                    }`}
                  >
                    <ListFilter className="w-3.5 h-3.5" />
                    Item-wise (Qty, Rate, Tax)
                  </button>
                  <button
                    type="button"
                    onClick={() => setLedgerViewMode('invoice')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${
                      ledgerViewMode === 'invoice'
                        ? 'bg-white text-[#3E4A3D] shadow-xs'
                        : 'text-[#8A8882] hover:text-[#2D2D2A]'
                    }`}
                  >
                    <Receipt className="w-3.5 h-3.5" />
                    Bill Summary
                  </button>
                </div>

                {/* Sub-Filters */}
                <div className="flex items-center bg-[#F3F1ED] p-0.5 rounded-xl text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setLedgerFilter('all')}
                    className={`px-3 py-1.5 rounded-lg transition-colors ${
                      ledgerFilter === 'all'
                        ? 'bg-white text-[#3E4A3D] shadow-xs'
                        : 'text-[#8A8882] hover:text-[#2D2D2A]'
                    }`}
                  >
                    All
                  </button>
                  <button
                    type="button"
                    onClick={() => setLedgerFilter('sales')}
                    className={`px-3 py-1.5 rounded-lg transition-colors ${
                      ledgerFilter === 'sales'
                        ? 'bg-white text-emerald-700 shadow-xs'
                        : 'text-[#8A8882] hover:text-[#2D2D2A]'
                    }`}
                  >
                    Sales ({rangeMetrics.salesCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setLedgerFilter('purchases')}
                    className={`px-3 py-1.5 rounded-lg transition-colors ${
                      ledgerFilter === 'purchases'
                        ? 'bg-white text-blue-700 shadow-xs'
                        : 'text-[#8A8882] hover:text-[#2D2D2A]'
                    }`}
                  >
                    Purchases ({rangeMetrics.purchaseCount})
                  </button>
                </div>

                {/* Search */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-[#8A8882] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={ledgerSearch}
                    onChange={(e) => setLedgerSearch(e.target.value)}
                    placeholder="Search bill, party, item, SKU..."
                    className="pl-8 pr-3 py-1.5 text-xs bg-white border border-[#E6E4DF] rounded-xl focus:ring-2 focus:ring-[#3E4A3D] text-[#2D2D2A] w-52"
                  />
                </div>
              </div>
            </div>

            {/* 1. Itemized Table View (Shows Quantity, Rate, Taxable Amount, Tax Amount, Grand Total) */}
            {ledgerViewMode === 'itemized' ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#F8F7F4] border-b border-[#E6E4DF] text-[11px] font-bold text-[#63615A] uppercase tracking-wider">
                      <th className="px-4 py-3">Type</th>
                      <th className="px-4 py-3">Bill / Invoice No.</th>
                      <th className="px-4 py-3">Bill Date (Miti & AD)</th>
                      <th className="px-4 py-3">Party (Customer / Vendor)</th>
                      <th className="px-4 py-3">Item Description (मालवस्तु)</th>
                      <th className="px-4 py-3 text-right">Quantity (परिमाण)</th>
                      <th className="px-4 py-3 text-right">Unit Rate (दर)</th>
                      <th className="px-4 py-3 text-right">Taxable (करयोग्य रकम)</th>
                      <th className="px-4 py-3 text-right">Tax (कर रकम)</th>
                      <th className="px-4 py-3 text-right">Total (कुल रकम)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F3F1ED]">
                    {itemizedLedger.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="px-5 py-12 text-center text-[#8A8882]">
                          No sales or purchases items found in this date range. Try widening the dates above.
                        </td>
                      </tr>
                    ) : (
                      itemizedLedger.map((row) => (
                        <tr key={row.id} className="hover:bg-[#FDFCF9] transition-colors">
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                row.type === 'SALE'
                                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                  : 'bg-blue-50 text-blue-800 border border-blue-200'
                              }`}
                            >
                              {row.type === 'SALE' ? 'बिक्री (SALE)' : 'खरिद (PURCHASE)'}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-mono font-bold text-[#2D2D2A] whitespace-nowrap">
                            {row.type === 'SALE' ? (
                              <button
                                type="button"
                                onClick={() => setActiveInvoiceForModal(row.rawOrder)}
                                className="text-emerald-800 hover:underline font-mono text-left"
                                title="Click to view full IRD Tax Invoice"
                              >
                                {row.billNumber}
                              </button>
                            ) : (
                              <span className="text-blue-900">{row.billNumber}</span>
                            )}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="font-bold text-[#3E4A3D] font-mono text-xs">
                              {formatNepaliDate(row.date, { format: 'standard', language: 'np' })}
                            </div>
                            <div className="text-[10px] text-[#8A8882]">{formatDate(row.date)}</div>
                          </td>
                          <td className="px-4 py-3 font-medium text-[#2D2D2A] max-w-xs truncate">
                            {row.partyName}
                          </td>
                          <td className="px-4 py-3">
                            <div className="font-bold text-[#2D2D2A]">{row.productName}</div>
                            <div className="text-[10px] text-[#8A8882] font-mono">{row.sku}</div>
                          </td>
                          <td className="px-4 py-3 text-right font-mono font-bold text-[#2D2D2A] whitespace-nowrap">
                            {row.quantity}
                          </td>
                          <td className="px-4 py-3 text-right font-mono text-[#63615A] whitespace-nowrap">
                            {formatCurrency(row.rate, businessProfile.currencySymbol)}
                            {row.discount > 0 && (
                              <span className="block text-[10px] text-rose-600">(-{row.discount}%)</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right font-mono font-semibold text-[#2D2D2A] whitespace-nowrap">
                            {formatCurrency(row.taxableAmount, businessProfile.currencySymbol)}
                          </td>
                          <td className="px-4 py-3 text-right font-mono font-semibold text-[#3E4A3D] whitespace-nowrap">
                            {formatCurrency(row.taxAmount, businessProfile.currencySymbol)}
                            <span className="block text-[10px] text-[#8A8882]">({row.taxRate}% VAT)</span>
                          </td>
                          <td className="px-4 py-3 text-right font-mono font-black text-[#2D2D2A] whitespace-nowrap">
                            {formatCurrency(row.totalAmount, businessProfile.currencySymbol)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  {itemizedLedger.length > 0 && (
                    <tfoot>
                      <tr className="bg-[#F8F7F4] font-bold text-xs border-t-2 border-[#E6E4DF] text-[#2D2D2A]">
                        <td colSpan={5} className="px-4 py-3.5 uppercase tracking-wider font-black">
                          Period Aggregate Totals ({startDate} to {endDate})
                        </td>
                        <td className="px-4 py-3.5 text-right font-mono font-black text-[#2D2D2A]">
                          {itemizedLedger.reduce((sum, r) => sum + r.quantity, 0)} units
                        </td>
                        <td></td>
                        <td className="px-4 py-3.5 text-right font-mono font-black text-[#2D2D2A]">
                          {formatCurrency(
                            itemizedLedger.reduce((sum, r) => sum + r.taxableAmount, 0),
                            businessProfile.currencySymbol
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-right font-mono font-black text-emerald-800">
                          {formatCurrency(
                            itemizedLedger.reduce((sum, r) => sum + r.taxAmount, 0),
                            businessProfile.currencySymbol
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-right font-mono font-black text-[#3E4A3D] text-sm">
                          {formatCurrency(
                            itemizedLedger.reduce((sum, r) => sum + r.totalAmount, 0),
                            businessProfile.currencySymbol
                          )}
                        </td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            ) : (
              /* 2. Bill Summary Table View */
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#F8F7F4] border-b border-[#E6E4DF] text-[11px] font-bold text-[#63615A] uppercase tracking-wider">
                      <th className="px-4 py-3">Type</th>
                      <th className="px-4 py-3">Bill / Invoice No.</th>
                      <th className="px-4 py-3">Bill Date (Miti & AD)</th>
                      <th className="px-4 py-3">Party (Customer / Vendor)</th>
                      <th className="px-4 py-3 text-right">Total Qty (परिमाण)</th>
                      <th className="px-4 py-3 text-right">Taxable (करयोग्य)</th>
                      <th className="px-4 py-3 text-right">Tax / VAT (कर रकम)</th>
                      <th className="px-4 py-3 text-right">Grand Total (जम्मा)</th>
                      <th className="px-4 py-3 text-right">Paid</th>
                      <th className="px-4 py-3 text-right">Due</th>
                      <th className="px-4 py-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F3F1ED]">
                    {combinedLedger.length === 0 ? (
                      <tr>
                        <td colSpan={11} className="px-5 py-12 text-center text-[#8A8882]">
                          No sales or purchases found in this date range. Try widening the dates above.
                        </td>
                      </tr>
                    ) : (
                      combinedLedger.map((row) => {
                        const badge = getPaymentStatusBadge(row.paymentStatus);
                        return (
                          <tr key={`${row.type}-${row.id}`} className="hover:bg-[#FDFCF9] transition-colors">
                            <td className="px-4 py-3 whitespace-nowrap">
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  row.type === 'SALE'
                                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                    : 'bg-blue-50 text-blue-800 border border-blue-200'
                                }`}
                              >
                                {row.type === 'SALE' ? 'बिक्री (SALE)' : 'खरिद (PURCHASE)'}
                              </span>
                            </td>
                            <td className="px-4 py-3 font-mono font-bold text-[#2D2D2A] whitespace-nowrap">
                              {row.type === 'SALE' ? (
                                <button
                                  type="button"
                                  onClick={() => setActiveInvoiceForModal(row.rawOrder)}
                                  className="text-emerald-800 hover:underline font-mono text-left"
                                  title="Click to view full IRD Tax Invoice"
                                >
                                  {row.billNumber}
                                </button>
                              ) : (
                                <span className="text-blue-900">{row.billNumber}</span>
                              )}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <div className="font-bold text-[#3E4A3D] font-mono text-xs">
                                {formatNepaliDate(row.date, { format: 'standard', language: 'np' })}
                              </div>
                              <div className="text-[10px] text-[#8A8882]">{formatDate(row.date)}</div>
                            </td>
                            <td className="px-4 py-3 font-medium text-[#2D2D2A] max-w-xs truncate">
                              {row.partyName}
                            </td>
                            <td className="px-4 py-3 text-right font-mono font-bold text-[#2D2D2A]">
                              {row.totalQuantity}
                            </td>
                            <td className="px-4 py-3 text-right font-mono text-[#63615A]">
                              {formatCurrency(row.taxableAmount, businessProfile.currencySymbol)}
                            </td>
                            <td className="px-4 py-3 text-right font-mono text-[#3E4A3D] font-semibold">
                              {formatCurrency(row.taxAmount, businessProfile.currencySymbol)}
                            </td>
                            <td className="px-4 py-3 text-right font-mono font-black text-[#2D2D2A]">
                              {formatCurrency(row.grandTotal, businessProfile.currencySymbol)}
                            </td>
                            <td className="px-4 py-3 text-right font-mono font-semibold text-emerald-700">
                              {formatCurrency(row.paidAmount, businessProfile.currencySymbol)}
                            </td>
                            <td className="px-4 py-3 text-right font-mono font-bold">
                              {row.balanceDue > 0 ? (
                                <span className="text-rose-600">
                                  {formatCurrency(row.balanceDue, businessProfile.currencySymbol)}
                                </span>
                              ) : (
                                <span className="text-emerald-700">—</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-center whitespace-nowrap">
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${badge.bg}`}
                              >
                                {badge.label}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                  {combinedLedger.length > 0 && (
                    <tfoot>
                      <tr className="bg-[#F8F7F4] font-bold text-xs border-t-2 border-[#E6E4DF] text-[#2D2D2A]">
                        <td colSpan={4} className="px-4 py-3.5 uppercase tracking-wider font-black">
                          Period Aggregate Totals ({startDate} to {endDate})
                        </td>
                        <td className="px-4 py-3.5 text-right font-mono font-black text-[#2D2D2A]">
                          {combinedLedger.reduce((sum, r) => sum + r.totalQuantity, 0)} units
                        </td>
                        <td className="px-4 py-3.5 text-right font-mono font-black text-[#2D2D2A]">
                          {formatCurrency(
                            combinedLedger.reduce((sum, r) => sum + r.taxableAmount, 0),
                            businessProfile.currencySymbol
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-right font-mono font-black text-emerald-800">
                          {formatCurrency(
                            combinedLedger.reduce((sum, r) => sum + r.taxAmount, 0),
                            businessProfile.currencySymbol
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-right font-mono font-black text-[#3E4A3D] text-sm">
                          {formatCurrency(
                            combinedLedger.reduce((sum, r) => sum + r.grandTotal, 0),
                            businessProfile.currencySymbol
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-right font-mono font-bold text-emerald-700">
                          {formatCurrency(
                            combinedLedger.reduce((sum, r) => sum + r.paidAmount, 0),
                            businessProfile.currencySymbol
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-right font-mono font-bold text-rose-600">
                          {formatCurrency(
                            combinedLedger.reduce((sum, r) => sum + r.balanceDue, 0),
                            businessProfile.currencySymbol
                          )}
                        </td>
                        <td></td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: MONTH-WISE SALES & PURCHASE REPORT */}
      {/* ========================================================================= */}
      {activeTab === 'month-wise' && (
        <div className="space-y-6">
          {/* Controls Bar for Month-wise */}
          <div className="no-print bg-white p-5 rounded-3xl border border-[#E6E4DF] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              {/* Calendar Switcher */}
              <div className="flex items-center bg-[#F3F1ED] p-1 rounded-2xl text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setCalendarSystem('bs')}
                  className={`px-3 py-1.5 rounded-xl transition-all ${
                    calendarSystem === 'bs'
                      ? 'bg-white text-[#3E4A3D] shadow-xs'
                      : 'text-[#8A8882] hover:text-[#2D2D2A]'
                  }`}
                >
                  नेपाली वि.सं. (बैशाख - चैत्र)
                </button>
                <button
                  type="button"
                  onClick={() => setCalendarSystem('ad')}
                  className={`px-3 py-1.5 rounded-xl transition-all ${
                    calendarSystem === 'ad'
                      ? 'bg-white text-[#3E4A3D] shadow-xs'
                      : 'text-[#8A8882] hover:text-[#2D2D2A]'
                  }`}
                >
                  Gregorian A.D. (Jan - Dec)
                </button>
              </div>

              {/* Year Dropdown */}
              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-[#63615A] uppercase tracking-wider">
                  Select Year:
                </label>
                {calendarSystem === 'bs' ? (
                  <select
                    value={selectedBsYear}
                    onChange={(e) => setSelectedBsYear(Number(e.target.value))}
                    className="px-3.5 py-1.5 text-xs font-bold border border-[#E6E4DF] rounded-xl bg-white text-[#3E4A3D] focus:ring-2 focus:ring-[#3E4A3D]"
                  >
                    {bsYearOptions.map((yr) => (
                      <option key={yr} value={yr}>
                        वि.सं. {toDevanagariDigits(yr)} ({yr} B.S.)
                      </option>
                    ))}
                  </select>
                ) : (
                  <select
                    value={selectedAdYear}
                    onChange={(e) => setSelectedAdYear(Number(e.target.value))}
                    className="px-3.5 py-1.5 text-xs font-bold border border-[#E6E4DF] rounded-xl bg-white text-[#3E4A3D] focus:ring-2 focus:ring-[#3E4A3D]"
                  >
                    {adYearOptions.map((yr) => (
                      <option key={yr} value={yr}>
                        Year {yr} A.D.
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleExportMonthwiseCSV}
                className="flex items-center gap-1.5 px-4 py-2 bg-[#3E4A3D] hover:bg-[#323D31] text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                Export Monthwise CSV
              </button>
              <button
                type="button"
                onClick={handlePrint}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-[#F3F1ED] text-[#3E4A3D] border border-[#E6E4DF] text-xs font-bold rounded-xl transition-colors"
              >
                <Printer className="w-3.5 h-3.5" />
                Print Report
              </button>
            </div>
          </div>

          {/* Month-wise Comparative Bar Chart */}
          <div className="bg-white p-6 rounded-3xl border border-[#E6E4DF] shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
              <div>
                <h3 className="font-bold text-[#2D2D2A] text-sm flex items-center gap-2">
                  <span>Month-wise Sales vs Purchases Comparison</span>
                  <span className="text-xs text-[#8A8882] font-normal">
                    ({calendarSystem === 'bs' ? `वि.सं. ${toDevanagariDigits(selectedBsYear)}` : `${selectedAdYear} A.D.`})
                  </span>
                </h3>
                <p className="text-xs text-[#8A8882]">
                  Visual bar chart representing monthly turnover, inventory spending, and monthly net margins.
                </p>
              </div>

              <div className="flex items-center gap-4 text-xs">
                <span className="flex items-center gap-1.5 font-bold text-emerald-800">
                  <span className="w-3 h-3 rounded-sm bg-emerald-600"></span> Sales (बिक्री)
                </span>
                <span className="flex items-center gap-1.5 font-bold text-blue-800">
                  <span className="w-3 h-3 rounded-sm bg-blue-600"></span> Purchases (खरिद)
                </span>
                <span className="flex items-center gap-1.5 font-bold text-[#3E4A3D]">
                  <span className="w-3 h-3 rounded-sm bg-[#3E4A3D]"></span> Profit / Margin
                </span>
              </div>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthwiseReportData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F1ED" vertical={false} />
                  <XAxis
                    dataKey="chartLabel"
                    tick={{ fontSize: 11, fill: '#8A8882', fontWeight: 600 }}
                    axisLine={{ stroke: '#E6E4DF' }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#8A8882' }}
                    axisLine={{ stroke: '#E6E4DF' }}
                    tickLine={false}
                    tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v)}
                  />
                  <Tooltip
                    formatter={(val: number) => [
                      formatCurrency(val, businessProfile.currencySymbol),
                      '',
                    ]}
                    contentStyle={{
                      backgroundColor: '#FFFFFF',
                      borderRadius: '16px',
                      border: '1px solid #E6E4DF',
                      boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="Sales" fill="#059669" radius={[4, 4, 0, 0]} name="Sales" />
                  <Bar dataKey="Purchases" fill="#2563EB" radius={[4, 4, 0, 0]} name="Purchases" />
                  <Bar dataKey="Profit" fill="#3E4A3D" radius={[4, 4, 0, 0]} name="Net Margin" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Comprehensive 12-Month Performance Table with Quantity, Taxable, Tax Amount & Grand Total */}
          <div className="bg-white rounded-3xl border border-[#E6E4DF] shadow-xs overflow-hidden">
            <div className="p-5 border-b border-[#E6E4DF] flex items-center justify-between bg-[#FDFCF9]">
              <div>
                <h3 className="font-bold text-[#2D2D2A] text-sm">
                  12-Month Detailed Sales & Purchase Audit (महिनावारी कर तथा परिमाण तालिका)
                </h3>
                <p className="text-xs text-[#8A8882]">
                  Includes monthly bill count, units quantity, taxable sales/purchases, 13% VAT, grand totals, and profit margins.
                </p>
              </div>
              <span className="text-xs font-bold font-mono px-3 py-1 rounded-full bg-[#3E4A3D]/10 text-[#3E4A3D]">
                Year {calendarSystem === 'bs' ? `B.S. ${selectedBsYear}` : `A.D. ${selectedAdYear}`}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#F8F7F4] border-b border-[#E6E4DF] text-[11px] font-bold text-[#63615A] uppercase tracking-wider">
                    <th className="px-4 py-3">महिना (Month)</th>
                    <th className="px-3 py-3 text-center">Sales Qty (परिमाण)</th>
                    <th className="px-4 py-3 text-right">Taxable Sales (करयोग्य)</th>
                    <th className="px-4 py-3 text-right">Sales Tax (कर रकम)</th>
                    <th className="px-4 py-3 text-right">कुल बिक्री (Total Sales)</th>
                    <th className="px-3 py-3 text-center">Purchase Qty (परिमाण)</th>
                    <th className="px-4 py-3 text-right">Taxable Pur. (करयोग्य)</th>
                    <th className="px-4 py-3 text-right">Pur. Tax (कर रकम)</th>
                    <th className="px-4 py-3 text-right">कुल खरिद (Total Pur.)</th>
                    <th className="px-4 py-3 text-right">नाफा/घाटा (Net Margin)</th>
                    <th className="px-3 py-3 text-center">Margin %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F3F1ED]">
                  {monthwiseReportData.map((row) => (
                    <tr key={row.monthIndex} className="hover:bg-[#FDFCF9] transition-colors">
                      <td className="px-4 py-3 font-bold text-[#2D2D2A] whitespace-nowrap">
                        {row.label}
                      </td>
                      {/* Sales Qty */}
                      <td className="px-3 py-3 text-center font-mono font-semibold text-emerald-800">
                        {row.salesQuantity > 0 ? `${row.salesQuantity} pcs` : '—'}
                      </td>
                      {/* Sales Taxable */}
                      <td className="px-4 py-3 text-right font-mono text-[#63615A] whitespace-nowrap">
                        {row.salesTaxable > 0
                          ? formatCurrency(row.salesTaxable, businessProfile.currencySymbol)
                          : '—'}
                      </td>
                      {/* Sales Tax */}
                      <td className="px-4 py-3 text-right font-mono font-semibold text-emerald-700 whitespace-nowrap">
                        {row.salesTax > 0
                          ? formatCurrency(row.salesTax, businessProfile.currencySymbol)
                          : '—'}
                      </td>
                      {/* Sales Grand Total */}
                      <td className="px-4 py-3 text-right font-mono font-black text-emerald-700 whitespace-nowrap">
                        {row.salesGrandTotal > 0
                          ? formatCurrency(row.salesGrandTotal, businessProfile.currencySymbol)
                          : '—'}
                      </td>

                      {/* Purchase Qty */}
                      <td className="px-3 py-3 text-center font-mono font-semibold text-blue-800">
                        {row.purchasesQuantity > 0 ? `${row.purchasesQuantity} pcs` : '—'}
                      </td>
                      {/* Purchase Taxable */}
                      <td className="px-4 py-3 text-right font-mono text-[#63615A] whitespace-nowrap">
                        {row.purchasesTaxable > 0
                          ? formatCurrency(row.purchasesTaxable, businessProfile.currencySymbol)
                          : '—'}
                      </td>
                      {/* Purchase Tax */}
                      <td className="px-4 py-3 text-right font-mono font-semibold text-blue-700 whitespace-nowrap">
                        {row.purchasesTax > 0
                          ? formatCurrency(row.purchasesTax, businessProfile.currencySymbol)
                          : '—'}
                      </td>
                      {/* Purchase Grand Total */}
                      <td className="px-4 py-3 text-right font-mono font-black text-blue-700 whitespace-nowrap">
                        {row.purchasesGrandTotal > 0
                          ? formatCurrency(row.purchasesGrandTotal, businessProfile.currencySymbol)
                          : '—'}
                      </td>

                      {/* Net Margin */}
                      <td className="px-4 py-3 text-right font-mono font-bold whitespace-nowrap">
                        {row.salesGrandTotal > 0 || row.purchasesGrandTotal > 0 ? (
                          <span className={row.netProfit >= 0 ? 'text-[#3E4A3D]' : 'text-rose-600'}>
                            {formatCurrency(row.netProfit, businessProfile.currencySymbol)}
                          </span>
                        ) : (
                          <span className="text-[#8A8882]">—</span>
                        )}
                      </td>
                      {/* Margin % */}
                      <td className="px-3 py-3 text-center font-mono whitespace-nowrap">
                        {row.salesGrandTotal > 0 ? (
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              row.marginPct >= 0
                                ? 'bg-emerald-50 text-emerald-800'
                                : 'bg-rose-50 text-rose-800'
                            }`}
                          >
                            {row.marginPct.toFixed(1)}%
                          </span>
                        ) : (
                          <span className="text-[#8A8882]">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-[#F8F7F4] font-bold text-xs border-t-2 border-[#E6E4DF] text-[#2D2D2A]">
                    <td className="px-4 py-3.5 uppercase tracking-wider font-black">
                      वार्षिक कुल जम्मा (Annual Total)
                    </td>
                    <td className="px-3 py-3.5 text-center font-mono font-black text-emerald-900">
                      {annualTotals.salesQuantity} units
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono font-bold text-[#63615A] whitespace-nowrap">
                      {formatCurrency(annualTotals.salesTaxable, businessProfile.currencySymbol)}
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono font-black text-emerald-800 whitespace-nowrap">
                      {formatCurrency(annualTotals.salesTax, businessProfile.currencySymbol)}
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono font-black text-emerald-700 text-sm whitespace-nowrap">
                      {formatCurrency(annualTotals.salesGrandTotal, businessProfile.currencySymbol)}
                    </td>

                    <td className="px-3 py-3.5 text-center font-mono font-black text-blue-900">
                      {annualTotals.purchasesQuantity} units
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono font-bold text-[#63615A] whitespace-nowrap">
                      {formatCurrency(annualTotals.purchasesTaxable, businessProfile.currencySymbol)}
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono font-black text-blue-800 whitespace-nowrap">
                      {formatCurrency(annualTotals.purchasesTax, businessProfile.currencySymbol)}
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono font-black text-blue-700 text-sm whitespace-nowrap">
                      {formatCurrency(annualTotals.purchasesGrandTotal, businessProfile.currencySymbol)}
                    </td>

                    <td className="px-4 py-3.5 text-right font-mono font-black text-sm whitespace-nowrap text-[#3E4A3D]">
                      {formatCurrency(annualTotals.netProfit, businessProfile.currencySymbol)}
                    </td>
                    <td className="px-3 py-3.5 text-center font-mono font-bold">
                      <span className="px-2 py-0.5 rounded-full bg-[#3E4A3D]/15 text-[#3E4A3D]">
                        {annualTotals.marginPct.toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: INVENTORY VALUATION & CATEGORY BREAKDOWN */}
      {/* ========================================================================= */}
      {activeTab === 'inventory-breakdown' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Category Asset Share */}
            <div className="bg-white p-6 rounded-3xl border border-[#E6E4DF] shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold text-[#2D2D2A] text-sm">
                    Stock Valuation by Category (वर्गअनुसार मौज्दात)
                  </h3>
                  <p className="text-xs text-[#8A8882]">Working capital asset allocation across product segments</p>
                </div>
                <Layers className="w-4 h-4 text-[#3E4A3D]" />
              </div>

              <div className="h-64 w-full">
                {categoryShare.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-xs text-[#8A8882]">
                    No stock valuation data recorded
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryShare}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {categoryShare.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color || '#3E4A3D'} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(val: number) => [
                          formatCurrency(val, businessProfile.currencySymbol),
                          'Valuation',
                        ]}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Replenishment Urgency */}
            <div className="bg-white p-6 rounded-3xl border border-[#E6E4DF] shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold text-[#2D2D2A] text-sm">
                    Stock Replenishment Alerts (पुनः खरिद गर्नुपर्ने सामानहरू)
                  </h3>
                  <p className="text-xs text-[#8A8882]">Products currently at or below minimum safety threshold</p>
                </div>
                <AlertTriangle className="w-4 h-4 text-[#C97B5A]" />
              </div>

              <div className="divide-y divide-[#F3F1ED] max-h-64 overflow-y-auto">
                {urgentRestockItems.length === 0 ? (
                  <div className="py-8 text-center text-[#3E4A3D] font-semibold text-xs">
                    All inventory catalog levels are healthy!
                  </div>
                ) : (
                  urgentRestockItems.map((p) => {
                    const isZero = p.currentStock <= 0;
                    return (
                      <div key={p.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                        <div>
                          <div className="font-bold text-[#2D2D2A]">{p.name}</div>
                          <div className="text-[11px] text-[#8A8882] font-mono">
                            {p.sku} • {p.location || 'Warehouse'}
                          </div>
                        </div>
                        <div className="text-right">
                          <div
                            className={`font-bold font-mono ${
                              isZero ? 'text-rose-600' : 'text-[#C97B5A]'
                            }`}
                          >
                            {p.currentStock} {p.unit} remaining
                          </div>
                          <div className="text-[11px] text-[#8A8882]">
                            Min Level: {p.minReorderLevel}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
