import React, { useMemo, useState } from 'react';
import confetti from 'canvas-confetti';
import {
  AlertCircle,
  Banknote,
  CheckCircle2,
  CreditCard,
  Minus,
  Package,
  Plus,
  QrCode,
  Receipt,
  RotateCcw,
  Search,
  ShoppingCart,
  Smartphone,
  Trash2,
  User,
  Users,
  Wallet,
  Zap,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Product } from '../../types';
import { formatCurrency, formatNepaliDate } from '../../utils/formatters';
import { NepaliDatePicker } from '../common/NepaliDatePicker';

interface CartItem {
  product: Product;
  quantity: number;
  unitPrice: number;
  discount: number; // percentage
}

export const POSView: React.FC = () => {
  const {
    products,
    categories,
    customers,
    createSalesOrder,
    businessProfile,
    setActiveInvoiceForModal,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(
    () => customers.find((c) => c.customerType === 'Retail')?.id || customers[0]?.id || ''
  );

  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<
    'Cash' | 'Fonepay QR' | 'eSewa' | 'Khalti' | 'Bank Transfer (ConnectIPS)' | 'Card'
  >('Fonepay QR');
  const [tenderedCash, setTenderedCash] = useState<string>('');
  const [error, setError] = useState('');
  const [posDate, setPosDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [successOrder, setSuccessOrder] = useState<any | null>(null);

  // Filtered products
  const activeProducts = useMemo(() => {
    return products.filter((p) => {
      if (p.status !== 'active') return false;
      const matchesSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.barcode && p.barcode.includes(searchQuery));
      const matchesCat = selectedCategory === 'all' || p.categoryId === selectedCategory;
      return matchesSearch && matchesCat;
    });
  }, [products, searchQuery, selectedCategory]);

  const addToCart = (product: Product) => {
    if (product.currentStock <= 0) return;

    setError('');
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.currentStock) {
          setError(`Cannot add more than available stock (${product.currentStock} ${product.unit})`);
          return prev;
        }
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      } else {
        return [
          ...prev,
          {
            product,
            quantity: 1,
            unitPrice: product.sellingPrice,
            discount: 0,
          },
        ];
      }
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            if (newQty > item.product.currentStock) {
              setError(`Maximum available stock reached (${item.product.currentStock})`);
              return item;
            }
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
    setError('');
    setTenderedCash('');
  };

  // Calculations
  const taxRate = businessProfile.defaultTaxRate ?? 13;
  let subtotal = 0;
  let discountTotal = 0;

  cart.forEach((item) => {
    const gross = item.unitPrice * item.quantity;
    const disc = (gross * (item.discount || 0)) / 100;
    subtotal += gross - disc;
    discountTotal += disc;
  });

  const taxAmount = (subtotal * taxRate) / 100;
  const grandTotal = subtotal + taxAmount;
  const parsedTendered = parseFloat(tenderedCash) || 0;
  const changeDue = Math.max(0, parsedTendered - grandTotal);

  const handleCheckout = () => {
    if (cart.length === 0) {
      setError('Cart is empty. Please add items to checkout.');
      return;
    }

    const targetCustId =
      selectedCustomerId ||
      customers.find((c) => c.customerType === 'Retail')?.id ||
      customers[0]?.id;

    const result = createSalesOrder({
      customerId: targetCustId,
      orderDate: posDate,
      dueDate: posDate,
      items: cart.map((item) => ({
        productId: item.product.id,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        taxRate: taxRate,
        discount: item.discount,
      })),
      shippingFee: 0,
      paymentMethod,
      paidAmount: grandTotal,
      notes: `POS Quick Counter Sale (Nepal POS). Payment via ${paymentMethod}`,
      status: 'fulfilled',
    });

    if (!result.success) {
      setError(result.error || 'Failed to process checkout');
      return;
    }

    try {
      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.7 },
      });
    } catch {
      // ignore
    }

    setSuccessOrder(result.order);
    clearCart();
  };

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col lg:flex-row gap-4 overflow-hidden">
      {/* Left Column: Product Selection Grid */}
      <div className="flex-1 flex flex-col bg-white rounded-3xl border border-[#E6E4DF] shadow-xs overflow-hidden">
        {/* Search & Category Tabs */}
        <div className="p-4 border-b border-[#E6E4DF] space-y-3 bg-[#FDFCF9]">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8A8882]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="खोज्नुहोस् / Scan barcode, SKU, or search item name..."
              className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm border border-[#E6E4DF] rounded-full focus:ring-2 focus:ring-[#3E4A3D] bg-white font-medium shadow-xs text-[#2D2D2A]"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3.5 py-1.5 rounded-full font-semibold shrink-0 transition-all ${
                selectedCategory === 'all'
                  ? 'bg-[#3E4A3D] text-white shadow-xs'
                  : 'bg-white text-[#8A8882] border border-[#E6E4DF] hover:bg-[#F3F1ED]'
              }`}
            >
              सबै सामान (All Items)
            </button>
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedCategory(c.id)}
                className={`px-3.5 py-1.5 rounded-full font-semibold shrink-0 transition-all flex items-center gap-1.5 ${
                  selectedCategory === c.id
                    ? 'bg-[#A7C4BC] text-[#2D362C] shadow-xs'
                    : 'bg-white text-[#8A8882] border border-[#E6E4DF] hover:bg-[#F3F1ED]'
                }`}
              >
                <span>{c.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Product Tiles Grid */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
            {activeProducts.map((prod) => {
              const isOut = prod.currentStock <= 0;
              const isLow = prod.currentStock > 0 && prod.currentStock <= prod.minReorderLevel;
              const inCartItem = cart.find((i) => i.product.id === prod.id);

              return (
                <button
                  key={prod.id}
                  type="button"
                  disabled={isOut}
                  onClick={() => addToCart(prod)}
                  className={`relative p-3.5 rounded-2xl border text-left flex flex-col justify-between transition-all group ${
                    isOut
                      ? 'opacity-40 bg-[#FDFCF9] border-[#E6E4DF] cursor-not-allowed'
                      : inCartItem
                      ? 'bg-[#A7C4BC]/15 border-[#A7C4BC] shadow-xs'
                      : 'bg-white border-[#E6E4DF] hover:border-[#3E4A3D] hover:shadow-xs'
                  }`}
                >
                  {inCartItem && (
                    <span className="absolute top-2.5 right-2.5 flex items-center justify-center w-5 h-5 rounded-full bg-[#3E4A3D] text-white font-bold text-xs">
                      {inCartItem.quantity}
                    </span>
                  )}

                  <div>
                    <div className="flex items-center justify-between gap-1 text-[10px] text-[#8A8882] font-mono">
                      <span>{prod.sku}</span>
                      <span
                        className={`font-bold px-2 py-0.5 rounded-full ${
                          isOut
                            ? 'text-[#C97B5A] bg-[#C97B5A]/15'
                            : isLow
                            ? 'text-[#9C6644] bg-[#D4A373]/20'
                            : 'text-[#2D362C] bg-[#A7C4BC]/30'
                        }`}
                      >
                        {isOut ? 'स्टक सकियो' : `${prod.currentStock} ${prod.unit}`}
                      </span>
                    </div>

                    <h4 className="font-bold text-[#2D2D2A] text-xs mt-2 line-clamp-2 group-hover:text-[#3E4A3D] transition-colors">
                      {prod.name}
                    </h4>
                  </div>

                  <div className="mt-3 pt-2 border-t border-[#E6E4DF] flex items-center justify-between">
                    <span className="font-bold text-[#3E4A3D] text-sm font-mono">
                      {formatCurrency(prod.sellingPrice, businessProfile.currencySymbol)}
                    </span>
                    <span className="text-[10px] text-[#8A8882] font-medium">+ थप्नुहोस्</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Right Column: Interactive Cart & Checkout Panel */}
      <div className="w-full lg:w-96 bg-white rounded-3xl border border-[#E6E4DF] shadow-xs flex flex-col overflow-hidden">
        {/* Cart Header */}
        <div className="p-4 border-b border-[#E6E4DF] bg-[#FDFCF9] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-full bg-[#A7C4BC]/20 text-[#3E4A3D]">
              <ShoppingCart className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-serif italic font-semibold text-[#3E4A3D] text-sm">बिक्री बिल (Counter Cart)</h3>
              <span className="text-[11px] text-[#8A8882]">
                {cart.reduce((s, i) => s + i.quantity, 0)} items in bill
              </span>
            </div>
          </div>
          {cart.length > 0 && (
            <button
              onClick={clearCart}
              className="text-xs text-[#C97B5A] hover:text-[#A85B3E] font-semibold transition-colors"
            >
              खाली गर्नुहोस् (Clear)
            </button>
          )}
        </div>

        {/* Customer Select Bar & Nepali Bill Date */}
        <div className="px-4 py-2.5 border-b border-[#E6E4DF] bg-[#F3F1ED]/50 space-y-2 text-xs">
          <div className="flex items-center gap-2">
            <User className="w-3.5 h-3.5 text-[#8A8882] shrink-0" />
            <select
              aria-label="Customer"
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
              className="flex-1 text-xs border border-[#E6E4DF] rounded-full px-3 py-1.5 bg-white font-semibold text-[#2D2D2A]"
            >
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.taxId ? `(PAN: ${c.taxId})` : ''} - {c.customerType}
                </option>
              ))}
            </select>
          </div>
          <NepaliDatePicker
            label="बिल मिति (Bill Date)"
            value={posDate}
            onChange={(adDate) => setPosDate(adDate)}
            compact={true}
            className="text-xs pt-1 border-t border-[#E6E4DF]/60"
          />
        </div>

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto p-4 divide-y divide-[#F3F1ED]">
          {error && (
            <div className="p-3 mb-3 rounded-2xl bg-[#C97B5A]/15 border border-[#C97B5A]/30 text-[#C97B5A] text-xs flex items-center gap-2 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {cart.length === 0 ? (
            <div className="py-16 text-center text-[#8A8882] space-y-2">
              <Package className="w-10 h-10 mx-auto text-[#8A8882] opacity-40" />
              <div className="text-xs font-serif italic text-[#3E4A3D]">बिल खाली छ (Cart is empty)</div>
              <p className="text-[11px] text-[#8A8882] max-w-[200px] mx-auto">
                Click any product on the left catalog to add to this counter sale.
              </p>
            </div>
          ) : (
            cart.map((item) => {
              const lineTotal = item.unitPrice * item.quantity;
              return (
                <div key={item.product.id} className="py-3 flex items-center justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-[#2D2D2A] text-xs truncate">
                      {item.product.name}
                    </div>
                    <div className="text-[11px] text-[#8A8882] font-mono">
                      {formatCurrency(item.unitPrice, businessProfile.currencySymbol)} / {item.product.unit}
                    </div>
                  </div>

                  {/* Quantity Stepper */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => updateQuantity(item.product.id, -1)}
                      className="w-6 h-6 rounded-full bg-[#F3F1ED] hover:bg-[#E6E4DF] text-[#3E4A3D] flex items-center justify-center font-bold text-xs transition-colors"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-6 text-center font-bold font-mono text-xs text-[#2D2D2A]">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.product.id, 1)}
                      className="w-6 h-6 rounded-full bg-[#F3F1ED] hover:bg-[#E6E4DF] text-[#3E4A3D] flex items-center justify-center font-bold text-xs transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  <div className="text-right shrink-0 min-w-[65px]">
                    <div className="font-bold text-[#3E4A3D] text-xs font-mono">
                      {formatCurrency(lineTotal, businessProfile.currencySymbol)}
                    </div>
                    <button
                      onClick={() => removeFromCart(item.product.id)}
                      className="text-[10px] text-[#C97B5A] hover:text-[#A85B3E] font-medium"
                    >
                      हटाउनुहोस्
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Payment & Totals Footer */}
        <div className="p-4 border-t border-[#E6E4DF] bg-[#FDFCF9] space-y-3">
          {/* Nepal Payment Tender Selector */}
          <div>
            <div className="text-[10px] font-bold text-[#8A8882] uppercase tracking-wider mb-1.5 flex items-center justify-between">
              <span>भुक्तानी माध्यम (Payment Tender)</span>
              <span className="text-[9px] text-[#3E4A3D] font-medium">Nepal Standard</span>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { id: 'Fonepay QR', label: 'Fonepay QR' },
                { id: 'eSewa', label: 'eSewa' },
                { id: 'Khalti', label: 'Khalti' },
                { id: 'Cash', label: 'नगद (Cash)' },
                { id: 'Bank Transfer (ConnectIPS)', label: 'ConnectIPS' },
                { id: 'Card', label: 'Card / POS' },
              ].map((m) => (
                <button
                  key={m.id}
                  onClick={() => setPaymentMethod(m.id as any)}
                  className={`py-1.5 px-2 rounded-xl text-[11px] font-bold transition-all truncate text-center ${
                    paymentMethod === m.id
                      ? 'bg-[#3E4A3D] text-white shadow-xs'
                      : 'bg-white text-[#63615A] border border-[#E6E4DF] hover:bg-[#F3F1ED]'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Cash calculation shortcuts */}
          {paymentMethod === 'Cash' && grandTotal > 0 && (
            <div className="space-y-1.5 pt-1 bg-[#F3F1ED]/60 p-2.5 rounded-2xl border border-[#E6E4DF]">
              <div className="flex items-center justify-between text-[11px] text-[#8A8882]">
                <span>प्राप्त नगद (Tendered):</span>
                {changeDue > 0 && (
                  <span className="font-bold text-emerald-800">
                    फिर्ता (Change): {formatCurrency(changeDue, businessProfile.currencySymbol)}
                  </span>
                )}
              </div>
              <div className="flex gap-1">
                <input
                  type="number"
                  value={tenderedCash}
                  onChange={(e) => setTenderedCash(e.target.value)}
                  placeholder={grandTotal.toFixed(0)}
                  className="flex-1 px-3 py-1 text-xs font-semibold border border-[#E6E4DF] rounded-full bg-white text-[#2D2D2A]"
                />
                <button
                  type="button"
                  onClick={() => setTenderedCash(grandTotal.toFixed(0))}
                  className="px-2 py-1 bg-white border border-[#E6E4DF] hover:bg-[#E6E4DF] text-[#3E4A3D] text-[10px] font-bold rounded-full"
                >
                  Exact
                </button>
                <button
                  type="button"
                  onClick={() => setTenderedCash('500')}
                  className="px-2 py-1 bg-white border border-[#E6E4DF] hover:bg-[#E6E4DF] text-[#3E4A3D] text-[10px] font-bold rounded-full"
                >
                  ५००
                </button>
                <button
                  type="button"
                  onClick={() => setTenderedCash('1000')}
                  className="px-2 py-1 bg-white border border-[#E6E4DF] hover:bg-[#E6E4DF] text-[#3E4A3D] text-[10px] font-bold rounded-full"
                >
                  १०००
                </button>
              </div>
            </div>
          )}

          {/* Pricing Totals */}
          <div className="space-y-1 text-xs pt-1 border-t border-[#E6E4DF]">
            <div className="flex justify-between text-[#8A8882] text-[11px]">
              <span>करयोग्य रकम (Subtotal):</span>
              <span className="font-semibold text-[#2D2D2A] font-mono">
                {formatCurrency(subtotal, businessProfile.currencySymbol)}
              </span>
            </div>
            <div className="flex justify-between text-[#8A8882] text-[11px]">
              <span>१३% मू.अ.कर (13% VAT):</span>
              <span className="font-semibold text-[#2D2D2A] font-mono">
                +{formatCurrency(taxAmount, businessProfile.currencySymbol)}
              </span>
            </div>
            <div className="flex justify-between text-base font-bold text-[#3E4A3D] pt-1.5 border-t border-[#E6E4DF]">
              <span className="font-serif italic">कुल जम्मा (Total):</span>
              <span className="font-mono">
                {formatCurrency(grandTotal, businessProfile.currencySymbol)}
              </span>
            </div>
          </div>

          {/* Pay Button */}
          <button
            id="pos-checkout-btn"
            disabled={cart.length === 0}
            onClick={handleCheckout}
            className="w-full py-3 bg-[#3E4A3D] hover:bg-[#2D362C] disabled:opacity-50 text-white font-semibold text-sm rounded-full shadow-xs transition-all active:scale-[0.98] flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4 text-[#A7C4BC]" />
            बिल जारी गर्नुहोस् ({formatCurrency(grandTotal, businessProfile.currencySymbol)})
          </button>
        </div>
      </div>

      {/* Success Receipt Popup */}
      {successOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-[#E6E4DF] text-center">
            <div className="w-12 h-12 rounded-full bg-[#A7C4BC]/30 text-[#3E4A3D] flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-serif italic text-[#3E4A3D]">भुक्तानी सफल भयो (Payment Completed!)</h3>
            <p className="text-xs text-[#8A8882] mt-1">
              कर बिजक नं. <span className="font-bold text-[#2D2D2A]">{successOrder.invoiceNumber}</span>{' '}
              सफलतापूर्वक दर्ता भयो र स्टक हिसाब मिलाइयो।
            </p>

            <div className="my-4 p-4 rounded-2xl bg-[#FDFCF9] border border-[#E6E4DF] text-xs space-y-1.5 text-left">
              <div className="flex justify-between">
                <span className="text-[#8A8882]">मिति (Nepali Miti):</span>
                <span className="font-bold text-[#3E4A3D] font-mono">
                  {formatNepaliDate(successOrder.orderDate, { format: 'standard', language: 'np' })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8A8882]">ग्राहक (Customer):</span>
                <span className="font-semibold text-[#2D2D2A]">{successOrder.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8A8882]">जम्मा रकम (Amount):</span>
                <span className="font-bold text-[#3E4A3D] font-mono">
                  {formatCurrency(successOrder.grandTotal, businessProfile.currencySymbol)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8A8882]">माध्यम (Payment Mode):</span>
                <span className="font-semibold text-[#2D2D2A]">{successOrder.paymentMethod}</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setSuccessOrder(null)}
                className="flex-1 py-2.5 bg-[#F3F1ED] hover:bg-[#E6E4DF] text-[#3E4A3D] text-xs font-semibold rounded-full transition-colors"
              >
                नयाँ बिल (Next Sale)
              </button>
              <button
                onClick={() => {
                  const ord = successOrder;
                  setSuccessOrder(null);
                  setActiveInvoiceForModal(ord);
                }}
                className="flex-1 py-2.5 bg-[#3E4A3D] hover:bg-[#2D362C] text-white text-xs font-semibold rounded-full shadow-xs transition-colors flex items-center justify-center gap-1.5"
              >
                <Receipt className="w-3.5 h-3.5 text-[#A7C4BC]" />
                कर बिजक हेर्नुहोस् (VAT Bill)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
