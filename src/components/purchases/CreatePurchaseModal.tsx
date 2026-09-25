import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  Building2,
  Calendar,
  CreditCard,
  Package,
  Pencil,
  Plus,
  ShieldAlert,
  Trash2,
  Truck,
  X,
  TrendingUp,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { PurchaseOrder } from '../../types';
import { formatCurrency } from '../../utils/formatters';
import { NepaliDatePicker } from '../common/NepaliDatePicker';

interface CreatePurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialProductId?: string;
  orderToEdit?: PurchaseOrder | null;
}

interface PurchaseLineItem {
  productId: string;
  quantity: number;
  unitCost: number;
  taxRate: number;
}

export const CreatePurchaseModal: React.FC<CreatePurchaseModalProps> = ({
  isOpen,
  onClose,
  initialProductId,
  orderToEdit,
}) => {
  const { 
    purchaseOrders, 
    vendors, 
    products, 
    createPurchaseOrder, 
    updatePurchaseOrder, 
    businessProfile,
  } = useApp();

  const isEditMode = !!orderToEdit;

  const [poNumber, setPoNumber] = useState('');
  const [vendorId, setVendorId] = useState('');
  const [orderDate, setOrderDate] = useState(new Date().toISOString().split('T')[0]);
  const [shippingFee, setShippingFee] = useState('0');
  const [paymentMethod, setPaymentMethod] = useState<string>('Bank Transfer (ConnectIPS)');
  const [paidAmount, setPaidAmount] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  const [items, setItems] = useState<PurchaseLineItem[]>([]);

  useEffect(() => {
    if (!isOpen) return;

    if (orderToEdit) {
      setPoNumber(orderToEdit.poNumber || '');
      setVendorId(orderToEdit.vendorId);
      setOrderDate(orderToEdit.orderDate);
      setShippingFee(String(orderToEdit.shippingFee || 0));
      setPaymentMethod(orderToEdit.paymentMethod || 'Bank Transfer (ConnectIPS)');
      setPaidAmount(String(orderToEdit.paidAmount ?? ''));
      setNotes(orderToEdit.notes || '');

      setItems(
        orderToEdit.items.map((it) => ({
          productId: it.productId,
          quantity: it.quantity,
          unitCost: it.unitCost,
          taxRate: it.taxRate,
        }))
      );
    } else {
      const currentYear = new Date().getFullYear();
      setPoNumber(`PUR-${currentYear}-${String(purchaseOrders.length + 84).padStart(4, '0')}`);
      if (vendors.length > 0 && !vendorId) {
        setVendorId(vendors[0].id);
      }
      const today = new Date();
      setOrderDate(today.toISOString().split('T')[0]);
      setShippingFee('0');
      setPaymentMethod('Bank Transfer (ConnectIPS)');
      setPaidAmount('');
      setNotes('');

      const defaultTax = businessProfile.defaultTaxRate ?? 13.0;

      if (products.length > 0) {
        const selectedP = initialProductId
          ? products.find((p) => p.id === initialProductId) || products[0]
          : products[0];
        setItems([
          {
            productId: selectedP.id,
            quantity: 10,
            unitCost: selectedP.purchasePrice,
            taxRate: defaultTax,
          },
        ]);
      }
    }
    setError('');
  }, [vendors, products, purchaseOrders.length, isOpen, initialProductId, orderToEdit, businessProfile.defaultTaxRate]);

  if (!isOpen) return null;

  const handleAddItem = () => {
    if (products.length === 0) return;
    const prod = products[0];
    setItems([
      ...items,
      {
        productId: prod.id,
        quantity: 5,
        unitCost: prod.purchasePrice,
        taxRate: businessProfile.defaultTaxRate ?? 13.0,
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: keyof PurchaseLineItem, value: any) => {
    setItems((prev) =>
      prev.map((item, i) => {
        if (i !== index) return item;
        if (field === 'productId') {
          const p = products.find((prod) => prod.id === value);
          return {
            ...item,
            productId: value,
            unitCost: p ? p.purchasePrice : item.unitCost,
          };
        }
        return { ...item, [field]: value };
      })
    );
  };

  // Calculations
  let subtotal = 0;
  let taxTotal = 0;

  items.forEach((it) => {
    const gross = (it.unitCost || 0) * (it.quantity || 0);
    const tax = (gross * (it.taxRate || 0)) / 100;
    subtotal += gross;
    taxTotal += tax;
  });

  const parsedShipping = parseFloat(shippingFee) || 0;
  const grandTotal = subtotal + taxTotal + parsedShipping;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendorId) {
      setError('Please select a supplier / vendor.');
      return;
    }
    if (items.length === 0) {
      setError('Please add at least one product item.');
      return;
    }

    for (const item of items) {
      if (!item.quantity || item.quantity <= 0) {
        setError('Quantity must be greater than 0 for all items.');
        return;
      }
    }

    const initialPaid = paidAmount === '' ? grandTotal : parseFloat(paidAmount) || 0;

    const formattedItems = items.map((it) => ({
      productId: it.productId,
      productName: products.find((p) => p.id === it.productId)?.name || 'Product',
      sku: products.find((p) => p.id === it.productId)?.sku || '',
      quantity: Number(it.quantity),
      unitCost: Number(it.unitCost),
      taxRate: Number(it.taxRate),
      discount: 0,
      total: Number((it.unitCost * it.quantity * (1 + (it.taxRate || 0) / 100)).toFixed(2)),
    }));

    if (isEditMode && orderToEdit) {
      const res = updatePurchaseOrder(orderToEdit.id, {
        poNumber: poNumber.trim() || orderToEdit.poNumber,
        vendorId,
        orderDate,
        items: formattedItems,
        shippingFee: parsedShipping,
        paymentMethod,
        paidAmount: initialPaid,
        notes: notes.trim(),
        status: orderToEdit.status,
      });
      if (!res.success) {
        setError(res.error || 'Failed to update purchase order');
        return;
      }
    } else {
      createPurchaseOrder({
        poNumber: poNumber.trim(),
        vendorId,
        orderDate,
        items: formattedItems,
        shippingFee: parsedShipping,
        paymentMethod,
        paidAmount: initialPaid,
        notes: notes.trim(),
        status: 'received',
      });
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs overflow-y-auto">
      <div className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-[#E6E4DF] overflow-hidden my-6 flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-[#E6E4DF] flex items-center justify-between bg-[#FDFCF9]">
          <div className="flex items-center gap-3">
            <div
              className={`p-2.5 rounded-2xl ${
                isEditMode ? 'bg-amber-100 text-amber-800' : 'bg-[#3E4A3D]/10 text-[#3E4A3D]'
              }`}
            >
              {isEditMode ? <Pencil className="w-5 h-5" /> : <Truck className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-serif italic text-[#3E4A3D]">
                  {isEditMode
                    ? `Edit Purchase Bill (खरिद बिल सम्पादन) - ${orderToEdit?.poNumber}`
                    : 'Record Direct Purchase (नयाँ खरिद इन्ट्री)'}
                </h2>
                {isEditMode && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                    <ShieldAlert className="w-3 h-3" /> Admin Edit
                  </span>
                )}
              </div>
              <p className="text-xs text-[#8A8882]">
                {isEditMode
                  ? 'Admin Override: modify quantities, supplier, cost prices or payment with automatic stock adjustment.'
                  : 'Purchased quantities will directly increment your live product stock.'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-[#8A8882] hover:text-[#3E4A3D] hover:bg-[#F3F1ED] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="p-3.5 rounded-2xl bg-[#C97B5A]/15 border border-[#C97B5A]/30 text-[#C97B5A] text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Bill No., Supplier & Purchase Date */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-[#FDFCF9] p-4 rounded-2xl border border-[#E6E4DF]">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-[11px] font-semibold text-[#3E4A3D] uppercase tracking-wider">
                  Supplier Bill No. (खरिद बिल नं.) *
                </label>
                <button
                  type="button"
                  onClick={() => {
                    const yr = new Date().getFullYear();
                    setPoNumber(`PUR-${yr}-${String(purchaseOrders.length + 84).padStart(4, '0')}`);
                  }}
                  className="text-[10px] font-semibold text-[#3E4A3D] hover:underline"
                  title="Generate auto number"
                >
                  Auto Number
                </button>
              </div>
              <input
                type="text"
                value={poNumber}
                onChange={(e) => setPoNumber(e.target.value)}
                placeholder="e.g. BILL-9281 or PB-043"
                required
                className="w-full px-3.5 py-2 text-xs border border-[#E6E4DF] rounded-xl focus:ring-2 focus:ring-[#3E4A3D] bg-white font-mono font-bold text-[#2D2D2A]"
              />
              <span className="text-[10px] text-[#8A8882] mt-1 block">
                Type the physical bill # received from vendor
              </span>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[#3E4A3D] uppercase tracking-wider mb-1.5">
                Supplier / Vendor (साहु / आपूर्तिकर्ता) *
              </label>
              <select
                value={vendorId}
                onChange={(e) => setVendorId(e.target.value)}
                className="w-full px-3.5 py-2 text-xs border border-[#E6E4DF] rounded-xl focus:ring-2 focus:ring-[#3E4A3D] bg-white font-medium text-[#2D2D2A]"
              >
                {vendors.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name} {v.contactPerson ? `(${v.contactPerson})` : ''} — Due:{' '}
                    {formatCurrency(v.outstandingPayable || 0, businessProfile.currencySymbol)}
                  </option>
                ))}
              </select>
            </div>

            <NepaliDatePicker
              id="purchase-order-date"
              label="Purchase Bill Date (खरिद मिति) *"
              required
              value={orderDate}
              onChange={(adDate) => setOrderDate(adDate)}
            />
          </div>

          {/* Product Items Table */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-[#3E4A3D] uppercase tracking-wider">
                  Purchased Products & Stock Addition ({items.length})
                </h3>
                <p className="text-[11px] text-[#8A8882]">
                  Each item quantity is directly added to your inventory upon saving.
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddItem}
                className="flex items-center gap-1.5 text-xs font-semibold text-[#3E4A3D] hover:bg-[#3E4A3D]/10 bg-[#3E4A3D]/5 border border-[#3E4A3D]/20 px-3.5 py-1.5 rounded-full transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Add Product Line
              </button>
            </div>

            <div className="border border-[#E6E4DF] rounded-2xl overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[700px]">
                <thead className="bg-[#FDFCF9] text-[#8A8882] font-semibold uppercase tracking-wider text-[10px] border-b border-[#E6E4DF]">
                  <tr>
                    <th className="px-3.5 py-2.5 w-[38%]">Product Item</th>
                    <th className="px-3.5 py-2.5 w-[16%]">Units to Buy</th>
                    <th className="px-3.5 py-2.5 w-[16%]">Unit Cost ({businessProfile.currencySymbol.trim()})</th>
                    <th className="px-3.5 py-2.5 w-[12%]">VAT %</th>
                    <th className="px-3.5 py-2.5 w-[14%] text-right">Line Total</th>
                    <th className="px-2 py-2.5 text-center w-[4%]"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F3F1ED]">
                  {items.map((item, index) => {
                    const prod = products.find((p) => p.id === item.productId);
                    const currentStock = prod ? prod.currentStock : 0;
                    const newStock = currentStock + (item.quantity || 0);

                    const lineGross = (item.unitCost || 0) * (item.quantity || 0);
                    const lineTax = (lineGross * (item.taxRate || 0)) / 100;
                    const lineTotal = lineGross + lineTax;

                    return (
                      <tr key={index} className="hover:bg-[#FDFCF9]">
                        {/* Product Selection */}
                        <td className="p-2.5">
                          <select
                            value={item.productId}
                            onChange={(e) => handleItemChange(index, 'productId', e.target.value)}
                            className="w-full p-2 border border-[#E6E4DF] rounded-xl text-xs bg-white font-medium focus:ring-2 focus:ring-[#3E4A3D]"
                          >
                            {products.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.name} ({p.sku}) — Stock: {p.currentStock} {p.unit}
                              </option>
                            ))}
                          </select>
                          <div className="mt-1 flex items-center gap-1.5 text-[10px] text-[#8A8882]">
                            <span>Current: {currentStock} {prod?.unit || 'pcs'}</span>
                            <span className="text-[#3E4A3D] font-bold">
                              ➔ After Purchase: <span className="text-[#3E4A3D] underline">{newStock} {prod?.unit || 'pcs'}</span>
                            </span>
                          </div>
                        </td>

                        {/* Quantity */}
                        <td className="p-2.5">
                          <div className="relative">
                            <input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) =>
                                handleItemChange(index, 'quantity', parseInt(e.target.value, 10) || 0)
                              }
                              className="w-full p-2 border border-[#E6E4DF] rounded-xl text-xs font-bold text-center focus:ring-2 focus:ring-[#3E4A3D]"
                            />
                          </div>
                          <span className="text-[10px] text-[#3E4A3D] font-medium block text-center mt-0.5">
                            +{item.quantity || 0} to stock
                          </span>
                        </td>

                        {/* Cost Price */}
                        <td className="p-2.5">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={item.unitCost}
                            onChange={(e) =>
                              handleItemChange(index, 'unitCost', parseFloat(e.target.value) || 0)
                            }
                            className="w-full p-2 border border-[#E6E4DF] rounded-xl text-xs font-bold text-[#2D2D2A] focus:ring-2 focus:ring-[#3E4A3D]"
                          />
                        </td>

                        {/* Tax */}
                        <td className="p-2.5">
                          <input
                            type="number"
                            min="0"
                            step="0.1"
                            value={item.taxRate}
                            onChange={(e) =>
                              handleItemChange(index, 'taxRate', parseFloat(e.target.value) || 0)
                            }
                            className="w-full p-2 border border-[#E6E4DF] rounded-xl text-xs text-center focus:ring-2 focus:ring-[#3E4A3D]"
                          />
                        </td>

                        {/* Total */}
                        <td className="p-2.5 text-right font-bold font-mono text-[#3E4A3D]">
                          {formatCurrency(lineTotal, businessProfile.currencySymbol)}
                        </td>

                        {/* Delete Button */}
                        <td className="p-2.5 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(index)}
                            disabled={items.length <= 1}
                            className="p-1.5 text-[#8A8882] hover:text-[#C97B5A] hover:bg-[#C97B5A]/10 rounded-full disabled:opacity-30 transition-colors"
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

          {/* Payment Details & Summary Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            <div className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-semibold text-[#3E4A3D] uppercase tracking-wider mb-1.5">
                  Payment Mode (भुक्तानी विधि)
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs border border-[#E6E4DF] rounded-xl focus:ring-2 focus:ring-[#3E4A3D] bg-white font-medium text-[#2D2D2A]"
                >
                  <option value="Bank Transfer (ConnectIPS)">Bank Transfer / ConnectIPS</option>
                  <option value="Cheque">Corporate Cheque (बैंक चेक)</option>
                  <option value="Cash">Cash (नगद)</option>
                  <option value="Fonepay / eSewa">Fonepay / eSewa QR</option>
                  <option value="Card">Corporate Debit/Credit Card</option>
                  <option value="Credit">Vendor Khata (साहु उधारो)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#3E4A3D] uppercase tracking-wider mb-1.5">
                  Amount Paid to Supplier ({businessProfile.currencySymbol.trim()})
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={paidAmount}
                  onChange={(e) => setPaidAmount(e.target.value)}
                  placeholder={`Full payment: ${grandTotal.toFixed(2)}`}
                  className="w-full px-3.5 py-2 text-xs font-bold font-mono border border-[#E6E4DF] rounded-xl focus:ring-2 focus:ring-[#3E4A3D] text-[#2D2D2A]"
                />
                <span className="text-[11px] text-[#8A8882] mt-1 block">
                  Leave empty for full payment ({formatCurrency(grandTotal, businessProfile.currencySymbol)}), or enter 0 if purchasing on credit (साहु उधारो).
                </span>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#3E4A3D] uppercase tracking-wider mb-1.5">
                  Bill Remarks / Supplier Invoice Ref
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Supplier Bill # 4092, Truck Delivery"
                  className="w-full px-3.5 py-2 text-xs border border-[#E6E4DF] rounded-xl focus:ring-2 focus:ring-[#3E4A3D] text-[#2D2D2A]"
                />
              </div>
            </div>

            {/* Calculations Breakdown */}
            <div className="bg-[#FDFCF9] p-5 rounded-2xl border border-[#E6E4DF] space-y-2.5 text-xs">
              <div className="flex justify-between text-[#8A8882]">
                <span>Total Goods Value:</span>
                <span className="font-semibold font-mono text-[#2D2D2A]">
                  {formatCurrency(subtotal, businessProfile.currencySymbol)}
                </span>
              </div>
              <div className="flex justify-between text-[#8A8882]">
                <span>VAT (१३% मू.अ.कर):</span>
                <span className="font-semibold font-mono text-[#2D2D2A]">
                  +{formatCurrency(taxTotal, businessProfile.currencySymbol)}
                </span>
              </div>
              <div className="flex items-center justify-between text-[#8A8882]">
                <span>Inward Freight / Shipping:</span>
                <div className="w-24">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={shippingFee}
                    onChange={(e) => setShippingFee(e.target.value)}
                    className="w-full px-2 py-1 text-right text-xs font-semibold bg-white border border-[#E6E4DF] rounded-lg"
                  />
                </div>
              </div>
              <div className="h-px bg-[#E6E4DF] my-2"></div>
              <div className="flex justify-between text-sm font-bold font-mono text-[#3E4A3D]">
                <span>Total Purchase Amount:</span>
                <span className="text-base">
                  {formatCurrency(grandTotal, businessProfile.currencySymbol)}
                </span>
              </div>
            </div>
          </div>
        </form>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-[#E6E4DF] bg-[#FDFCF9] flex items-center justify-between">
          <div className="text-xs text-[#3E4A3D] flex items-center gap-1.5 font-medium">
            <TrendingUp className="w-4 h-4 text-[#3E4A3D]" />
            <span>
              {isEditMode
                ? 'Admin Notice: Product inventory & supplier balance will be adjusted accordingly.'
                : 'Product inventory quantities will be immediately updated.'}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-[#8A8882] hover:text-[#2D2D2A] hover:bg-[#F3F1ED] rounded-full transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className={`px-6 py-2 text-xs font-semibold text-white rounded-full shadow-xs transition-colors ${
                isEditMode ? 'bg-amber-600 hover:bg-amber-700' : 'bg-[#3E4A3D] hover:bg-[#2D362C]'
              }`}
            >
              {isEditMode ? 'Update Purchase Bill (परिवर्तन सुरक्षित गर्नुहोस्)' : 'Save Purchase & Add Stock'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
