import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  Building2,
  Calendar,
  CheckCircle2,
  CreditCard,
  DollarSign,
  Package,
  Pencil,
  Plus,
  Receipt,
  ShieldAlert,
  ShoppingCart,
  Trash2,
  User,
  X,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Product, SalesOrder, SalesOrderStatus } from '../../types';
import { formatCurrency, formatNepaliDate } from '../../utils/formatters';
import { NepaliDatePicker } from '../common/NepaliDatePicker';

interface CreateSalesModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderToEdit?: SalesOrder | null;
}

interface LineItemInput {
  productId: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  discount: number;
}

export const CreateSalesModal: React.FC<CreateSalesModalProps> = ({ isOpen, onClose, orderToEdit }) => {
  const { 
    salesOrders, 
    customers, 
    products, 
    createSalesOrder, 
    updateSalesOrder, 
    currentUser, 
    businessProfile, 
    setActiveInvoiceForModal,
  } = useApp();

  const isEditMode = !!orderToEdit;

  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [orderDate, setOrderDate] = useState(new Date().toISOString().split('T')[0]);
  const [shippingFee, setShippingFee] = useState('0');
  const [status, setStatus] = useState<SalesOrderStatus>('fulfilled');
  const [paymentMethod, setPaymentMethod] = useState<
    'Cash' | 'Card' | 'Bank Transfer' | 'UPI'
  >('Cash');
  const [paidAmount, setPaidAmount] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  const [items, setItems] = useState<LineItemInput[]>([]);

  useEffect(() => {
    if (!isOpen) return;

    if (orderToEdit) {
      setInvoiceNumber(orderToEdit.invoiceNumber || '');
      setCustomerId(orderToEdit.customerId);
      setOrderDate(orderToEdit.orderDate);
      setShippingFee(String(orderToEdit.shippingFee || 0));
      setStatus(orderToEdit.status);
      setPaymentMethod(
        ['Cash', 'Card', 'Bank Transfer', 'UPI'].includes(orderToEdit.paymentMethod)
          ? (orderToEdit.paymentMethod as any)
          : 'Cash'
      );
      setPaidAmount(String(orderToEdit.paidAmount ?? ''));
      setNotes(orderToEdit.notes || '');

      setItems(
        orderToEdit.items.map((it) => ({
          productId: it.productId,
          quantity: it.quantity,
          unitPrice: it.unitPrice,
          taxRate: it.taxRate,
          discount: it.discount,
        }))
      );
    } else {
      const currentYear = new Date().getFullYear();
      setInvoiceNumber(`INV-${currentYear}-${String(salesOrders.length + 145).padStart(4, '0')}`);
      if (customers.length > 0 && !customerId) {
        setCustomerId(customers[0].id);
      }
      const today = new Date();
      setOrderDate(today.toISOString().split('T')[0]);
      setShippingFee('0');
      setStatus('fulfilled');
      setPaymentMethod('Cash');
      setPaidAmount('');
      setNotes('');

      const defaultRate = businessProfile.defaultTaxRate || 13;

      if (products.length > 0) {
        setItems([
          {
            productId: products[0].id,
            quantity: 1,
            unitPrice: products[0].sellingPrice,
            taxRate: defaultRate,
            discount: 0,
          },
        ]);
      }
    }
    setError('');
  }, [customers, products, salesOrders.length, isOpen, orderToEdit, businessProfile.defaultTaxRate]);

  if (!isOpen) return null;

  const handleAddItem = () => {
    if (products.length === 0) return;
    const prod = products[0];
    setItems([
      ...items,
      {
        productId: prod.id,
        quantity: 1,
        unitPrice: prod.sellingPrice,
        taxRate: businessProfile.defaultTaxRate || 13,
        discount: 0,
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: keyof LineItemInput, value: any) => {
    setItems((prev) =>
      prev.map((item, i) => {
        if (i !== index) return item;
        if (field === 'productId') {
          const p = products.find((prod) => prod.id === value);
          return {
            ...item,
            productId: value,
            unitPrice: p ? p.sellingPrice : item.unitPrice,
          };
        }
        return { ...item, [field]: value };
      })
    );
  };

  // Calculations
  let subtotal = 0;
  let taxTotal = 0;
  let discountTotal = 0;

  items.forEach((it) => {
    const gross = it.unitPrice * (it.quantity || 0);
    const disc = (gross * (it.discount || 0)) / 100;
    const taxable = gross - disc;
    const tax = (taxable * (it.taxRate || 0)) / 100;

    subtotal += taxable;
    taxTotal += tax;
    discountTotal += disc;
  });

  const parsedShipping = parseFloat(shippingFee) || 0;
  const grandTotal = subtotal + taxTotal + parsedShipping;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId) {
      setError('Please select a customer.');
      return;
    }
    if (items.length === 0) {
      setError('Please add at least one product item to the invoice.');
      return;
    }

    for (const item of items) {
      if (item.quantity <= 0) {
        setError('Item quantity must be greater than 0.');
        return;
      }
    }

    const initialPaid = paidAmount === '' ? grandTotal : parseFloat(paidAmount) || 0;

    let result: { success: boolean; order?: SalesOrder; error?: string };

    if (isEditMode && orderToEdit) {
      result = updateSalesOrder(orderToEdit.id, {
        invoiceNumber: invoiceNumber.trim() || orderToEdit.invoiceNumber,
        customerId,
        orderDate,
        dueDate: orderDate,
        items: items.map((it) => ({
          productId: it.productId,
          quantity: Number(it.quantity),
          unitPrice: Number(it.unitPrice),
          taxRate: Number(it.taxRate),
          discount: Number(it.discount),
        })),
        shippingFee: parsedShipping,
        paymentMethod,
        paidAmount: initialPaid,
        notes: notes.trim(),
        status,
      });
    } else {
      result = createSalesOrder({
        invoiceNumber: invoiceNumber.trim(),
        customerId,
        orderDate,
        dueDate: orderDate,
        items: items.map((it) => ({
          productId: it.productId,
          quantity: Number(it.quantity),
          unitPrice: Number(it.unitPrice),
          taxRate: Number(it.taxRate),
          discount: Number(it.discount),
        })),
        shippingFee: parsedShipping,
        paymentMethod,
        paidAmount: initialPaid,
        notes: notes.trim(),
        status,
      });
    }

    if (!result.success) {
      setError(result.error || (isEditMode ? 'Failed to update sales order' : 'Failed to create sales order'));
      return;
    }

    if (result.order) {
      setActiveInvoiceForModal(result.order);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-6 flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div
              className={`p-2 rounded-lg ${
                isEditMode ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-600'
              }`}
            >
              {isEditMode ? <Pencil className="w-5 h-5" /> : <Receipt className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">
                  {isEditMode
                    ? `Edit Sales Invoice (कर बिजक सम्पादन) - ${orderToEdit?.invoiceNumber}`
                    : 'Create Sales Invoice & Dispatch'}
                </h2>
                {isEditMode && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                    <ShieldAlert className="w-3 h-3" /> Admin Edit
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">
                {isEditMode
                  ? 'Admin Override: modify quantities, pricing, customer, or payments with automatic stock reconciliation'
                  : 'Record outward stock sale, pricing & tax invoice'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Invoice Identification, Customer & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Bill / Invoice No. (बिल नं.) *
                </label>
                <button
                  type="button"
                  onClick={() => {
                    const yr = new Date().getFullYear();
                    setInvoiceNumber(`INV-${yr}-${String(salesOrders.length + 145).padStart(4, '0')}`);
                  }}
                  className="text-[10px] font-semibold text-indigo-600 hover:text-indigo-800"
                  title="Generate sequence number"
                >
                  Auto Number
                </button>
              </div>
              <input
                type="text"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                placeholder="e.g. 0145 or INV-2026-0185"
                required
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 bg-white font-mono font-bold text-slate-900"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">
                Type manual sales bill book # or auto format
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Select Customer *
              </label>
              <select
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 bg-white font-semibold"
              >
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.customerType})
                  </option>
                ))}
              </select>
            </div>

            <NepaliDatePicker
              id="invoice-order-date"
              label="Invoice Date (बिल मिति) *"
              required
              value={orderDate}
              onChange={(adDate) => setOrderDate(adDate)}
            />
          </div>

          {/* Line Items Table */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Invoice Line Items ({items.length})
              </h3>
              <button
                type="button"
                onClick={handleAddItem}
                className="flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Add Item Line
              </button>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[650px]">
                <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                  <tr>
                    <th className="px-3 py-2.5 w-[35%]">Product</th>
                    <th className="px-3 py-2.5 w-[12%]">Quantity</th>
                    <th className="px-3 py-2.5 w-[15%]">Unit Price ($)</th>
                    <th className="px-3 py-2.5 w-[12%]">Discount %</th>
                    <th className="px-3 py-2.5 w-[12%]">Tax %</th>
                    <th className="px-3 py-2.5 w-[14%] text-right">Line Total</th>
                    <th className="px-2 py-2.5 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map((item, index) => {
                    const prod = products.find((p) => p.id === item.productId);
                    const gross = item.unitPrice * (item.quantity || 0);
                    const disc = (gross * (item.discount || 0)) / 100;
                    const lineTotal = gross - disc + ((gross - disc) * (item.taxRate || 0)) / 100;

                    return (
                      <tr key={index} className="hover:bg-slate-50/50">
                        {/* Product Picker */}
                        <td className="p-2">
                          <select
                            value={item.productId}
                            onChange={(e) => handleItemChange(index, 'productId', e.target.value)}
                            className="w-full p-2 border border-slate-300 rounded-lg text-xs bg-white font-medium focus:ring-1 focus:ring-indigo-500"
                          >
                            {products.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.name} (Stock: {p.currentStock} {p.unit})
                              </option>
                            ))}
                          </select>
                          {prod && prod.currentStock < item.quantity && (
                            <span className="text-[10px] text-rose-600 font-bold block mt-0.5">
                              ⚠️ Warning: Exceeds stock ({prod.currentStock} available)
                            </span>
                          )}
                        </td>

                        {/* Quantity */}
                        <td className="p-2">
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) =>
                              handleItemChange(index, 'quantity', parseInt(e.target.value, 10) || 1)
                            }
                            className="w-full p-2 border border-slate-300 rounded-lg text-xs font-bold text-center focus:ring-1 focus:ring-indigo-500"
                          />
                        </td>

                        {/* Unit Price */}
                        <td className="p-2">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={item.unitPrice}
                            onChange={(e) =>
                              handleItemChange(index, 'unitPrice', parseFloat(e.target.value) || 0)
                            }
                            className="w-full p-2 border border-slate-300 rounded-lg text-xs font-bold text-slate-800 focus:ring-1 focus:ring-indigo-500"
                          />
                        </td>

                        {/* Discount */}
                        <td className="p-2">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={item.discount}
                            onChange={(e) =>
                              handleItemChange(index, 'discount', parseFloat(e.target.value) || 0)
                            }
                            placeholder="0%"
                            className="w-full p-2 border border-slate-300 rounded-lg text-xs text-center focus:ring-1 focus:ring-indigo-500"
                          />
                        </td>

                        {/* Tax */}
                        <td className="p-2">
                          <input
                            type="number"
                            min="0"
                            step="0.1"
                            value={item.taxRate}
                            onChange={(e) =>
                              handleItemChange(index, 'taxRate', parseFloat(e.target.value) || 0)
                            }
                            className="w-full p-2 border border-slate-300 rounded-lg text-xs text-center focus:ring-1 focus:ring-indigo-500"
                          />
                        </td>

                        {/* Line Total */}
                        <td className="p-2 text-right font-bold text-slate-900">
                          {formatCurrency(lineTotal, businessProfile.currencySymbol)}
                        </td>

                        {/* Delete */}
                        <td className="p-2 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(index)}
                            disabled={items.length <= 1}
                            className="p-1 text-slate-400 hover:text-rose-600 disabled:opacity-30"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pricing Summary & Payment Settings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  भुक्तानी विधि (Payment Mode)
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  <option value="Fonepay QR">Fonepay QR (फोनपे)</option>
                  <option value="eSewa">eSewa (ईसेवा)</option>
                  <option value="Khalti">Khalti (खल्ती)</option>
                  <option value="Cash">Cash (नगद)</option>
                  <option value="Bank Transfer (ConnectIPS)">Bank Transfer / ConnectIPS</option>
                  <option value="Cheque">Cheque (बैंक चेक)</option>
                  <option value="Card">Card / POS (कार्ड)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  हाल प्राप्त रकम ({businessProfile.currencySymbol.trim()})
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={paidAmount}
                  onChange={(e) => setPaidAmount(e.target.value)}
                  placeholder={`Full amount: ${grandTotal.toFixed(2)}`}
                  className="w-full px-3 py-2 text-xs font-bold border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
                />
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Leave empty to mark fully paid ({formatCurrency(grandTotal, businessProfile.currencySymbol)}), or enter 0 for credit / उधारो.
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Invoice Notes & Terms
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Workstation delivery, 30 days return window..."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Calculations Breakdown Box */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2.5 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Taxable Subtotal:</span>
                <span className="font-semibold text-slate-900">
                  {formatCurrency(subtotal, businessProfile.currencySymbol)}
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Total Tax Amount (VAT):</span>
                <span className="font-semibold text-slate-900">
                  +{formatCurrency(taxTotal, businessProfile.currencySymbol)}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span>Shipping / Freight Fee:</span>
                <div className="w-24">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={shippingFee}
                    onChange={(e) => setShippingFee(e.target.value)}
                    className="w-full px-2 py-1 text-right text-xs font-semibold bg-white border border-slate-300 rounded-lg"
                  />
                </div>
              </div>
              <div className="h-px bg-slate-200 my-2"></div>
              <div className="flex justify-between text-sm font-extrabold text-slate-900">
                <span>Grand Total:</span>
                <span className="text-emerald-700 text-base">
                  {formatCurrency(grandTotal, businessProfile.currencySymbol)}
                </span>
              </div>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            {isEditMode
              ? 'Admin Notice: Stock deduction & customer balance will be recalculated automatically.'
              : 'Stock will be automatically deducted from inventory upon completion.'}
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className={`px-5 py-2 text-xs font-bold text-white rounded-xl shadow-xs transition-colors ${
                isEditMode ? 'bg-amber-600 hover:bg-amber-700' : 'bg-emerald-600 hover:bg-emerald-700'
              }`}
            >
              {isEditMode ? 'Save Changes (परिवर्तन सुरक्षित गर्नुहोस्)' : 'Generate Invoice & Complete'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
