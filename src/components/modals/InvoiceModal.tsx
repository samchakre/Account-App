import React from 'react';
import {
  CheckCircle,
  CreditCard,
  Download,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Printer,
  QrCode,
  Receipt,
  X,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { SalesOrder } from '../../types';
import { 
  formatCurrency, 
  formatDate, 
  formatNepaliDate,
  getPaymentStatusBadge, 
  numberToWordsNepali 
} from '../../utils/formatters';

interface InvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: SalesOrder | null;
  onEditInvoice?: (order: SalesOrder) => void;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({ isOpen, onClose, order, onEditInvoice }) => {
  const { businessProfile, customers, currentUser } = useApp();

  if (!isOpen || !order) return null;

  const handlePrint = () => {
    window.print();
  };

  const payBadge = getPaymentStatusBadge(order.paymentStatus);
  const balanceDue = Math.max(0, order.grandTotal - order.paidAmount);
  const customer = customers.find((c) => c.id === order.customerId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-[#E6E4DF] overflow-hidden my-4 flex flex-col max-h-[94vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Controls Toolbar (Hidden during print) */}
        <div className="no-print px-6 py-3.5 border-b border-[#E6E4DF] flex items-center justify-between bg-[#FDFCF9]">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-[#63615A] uppercase tracking-wider">
              कर बिजक (VAT Tax Invoice Preview)
            </span>
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${payBadge.bg}`}
            >
              {payBadge.label}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {currentUser?.role === 'admin' && onEditInvoice && (
              <button
                type="button"
                onClick={() => onEditInvoice(order)}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold rounded-full shadow-xs transition-colors"
                title="Edit Invoice (Admin Only)"
              >
                <Pencil className="w-3.5 h-3.5 text-amber-700" />
                Edit Invoice (सम्पादन)
              </button>
            )}
            <button
              id="invoice-print-btn"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#3E4A3D] hover:bg-[#323D31] text-white text-xs font-bold rounded-full shadow-xs transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              Print / Save PDF (प्रिन्ट गर्नुहोस्)
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-[#8A8882] hover:text-[#2D2D2A] hover:bg-[#F3F1ED] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Sheet Container */}
        <div
          id="printable-document"
          className="flex-1 overflow-y-auto p-6 sm:p-10 space-y-6 bg-white text-[#2D2D2A]"
        >
          {/* Top IRD Standard Tax Invoice Header */}
          <div className="text-center pb-4 border-b-2 border-[#2D2D2A]/10 space-y-1">
            <div className="inline-block px-3 py-1 bg-[#3E4A3D]/10 rounded-full text-xs font-bold text-[#3E4A3D] mb-1">
              नेपाल सरकार आन्तरिक राजस्व विभाग (Government of Nepal - IRD Standard)
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-[#2D2D2A] tracking-tight font-serif">
              {businessProfile.companyName}
            </h1>
            <p className="text-xs text-[#63615A] font-medium">{businessProfile.tagline}</p>
            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-[#63615A] pt-1">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-[#3E4A3D]" />
                {businessProfile.address}, {businessProfile.city}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-[#3E4A3D]" />
                {businessProfile.phone}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-[#3E4A3D]" />
                {businessProfile.email}
              </span>
            </div>
            <div className="pt-2">
              <span className="inline-block bg-[#F3F1ED] border border-[#E6E4DF] px-3 py-1 rounded-md font-mono text-xs font-black text-[#2D2D2A]">
                विक्रेताको स्थायी लेखा नं (Seller PAN / VAT): {businessProfile.taxRegistrationNumber}
              </span>
            </div>
          </div>

          {/* Invoice Identification & Buyer Meta */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-[#FDFCF9] p-4 rounded-2xl border border-[#E6E4DF]">
            {/* Buyer Details */}
            <div className="space-y-1 text-xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#8A8882] block">
                खरिदकर्ताको विवरण (Buyer / Customer Details):
              </span>
              <div className="text-sm font-bold text-[#2D2D2A]">{order.customerName}</div>
              {customer?.taxId && (
                <div className="font-mono text-xs font-semibold text-[#3E4A3D]">
                  ग्राहकको प्यान नं (Buyer PAN): {customer.taxId}
                </div>
              )}
              {order.customerPhone && (
                <div className="text-xs text-[#63615A]">सम्पर्क (Phone): {order.customerPhone}</div>
              )}
              {customer?.address && (
                <div className="text-xs text-[#63615A]">ठेगाना (Address): {customer.address}, {customer.city}</div>
              )}
            </div>

            {/* Invoice Meta */}
            <div className="sm:text-right space-y-1 text-xs">
              <div>
                <span className="text-base font-black text-[#3E4A3D] uppercase tracking-wide">
                  कर बिजक (TAX INVOICE)
                </span>
              </div>
              <div>
                <span className="text-[#8A8882]">बिजक नं (Invoice No): </span>
                <span className="font-mono font-bold text-[#2D2D2A]">{order.invoiceNumber}</span>
              </div>
              <div>
                <span className="text-[#8A8882]">मिति (Miti B.S.): </span>
                <span className="font-bold text-[#3E4A3D] font-mono">
                  {formatNepaliDate(order.orderDate, { format: 'standard', language: 'np' })}
                </span>
              </div>
              <div>
                <span className="text-[#8A8882]">जारी मिति (Date A.D.): </span>
                <span className="font-semibold text-[#2D2D2A]">{formatDate(order.orderDate)}</span>
              </div>
              {order.dueDate && (
                <div>
                  <span className="text-[#8A8882]">भुक्तानी म्याद (Due Date): </span>
                  <span className="font-medium text-amber-900">{formatDate(order.dueDate)}</span>
                </div>
              )}
              <div>
                <span className="text-[#8A8882]">भुक्तानी विधि (Payment Mode): </span>
                <span className="font-bold text-[#3E4A3D] bg-[#E8EDE7] px-2 py-0.5 rounded">
                  {order.paymentMethod}
                </span>
              </div>
            </div>
          </div>

          {/* Itemized Table */}
          <div className="overflow-x-auto border border-[#E6E4DF] rounded-2xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F3F1ED] text-[#2D2D2A] font-bold border-b border-[#E6E4DF]">
                <tr>
                  <th className="py-3 px-3">क्र.सं (S.N.)</th>
                  <th className="py-3 px-3">सामानको विवरण (Particulars)</th>
                  <th className="py-3 px-3 font-mono">SKU / Barcode</th>
                  <th className="py-3 px-3 text-right">परिमाण (Qty)</th>
                  <th className="py-3 px-3 text-right">दर (Rate)</th>
                  <th className="py-3 px-3 text-right">भ्याट (VAT %)</th>
                  <th className="py-3 px-3 text-right">जम्मा रकम (Total)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E6E4DF]">
                {order.items.map((item, index) => (
                  <tr key={index} className="hover:bg-[#FDFCF9]">
                    <td className="py-2.5 px-3 text-[#8A8882] font-mono">{index + 1}</td>
                    <td className="py-2.5 px-3 font-semibold text-[#2D2D2A]">{item.productName}</td>
                    <td className="py-2.5 px-3 font-mono text-[#8A8882] text-[11px]">{item.sku}</td>
                    <td className="py-2.5 px-3 text-right font-bold text-[#2D2D2A]">{item.quantity}</td>
                    <td className="py-2.5 px-3 text-right font-medium text-[#63615A]">
                      {formatCurrency(item.unitPrice, businessProfile.currencySymbol)}
                    </td>
                    <td className="py-2.5 px-3 text-right text-[#63615A]">{item.taxRate}%</td>
                    <td className="py-2.5 px-3 text-right font-bold text-[#2D2D2A]">
                      {formatCurrency(item.total, businessProfile.currencySymbol)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* In Words & Totals Breakdown */}
          <div className="flex flex-col sm:flex-row justify-between gap-6 pt-2">
            {/* Left: In Words & QR Code */}
            <div className="flex-1 space-y-3">
              <div className="bg-[#FDFCF9] p-3.5 rounded-2xl border border-[#E6E4DF] space-y-1">
                <span className="text-[11px] font-bold text-[#8A8882] uppercase block">
                  अक्षरेपी (Amount in Words):
                </span>
                <p className="text-xs font-bold text-[#3E4A3D] font-serif leading-relaxed italic">
                  {numberToWordsNepali(order.grandTotal)}
                </p>
              </div>

              {/* Fonepay / eSewa Quick Scan Info */}
              <div className="flex items-center gap-3 p-3 bg-[#E8EDE7]/50 rounded-2xl border border-[#A7C4BC]/40">
                <div className="w-12 h-12 bg-white rounded-xl border border-[#A7C4BC] flex items-center justify-center text-[#3E4A3D] shrink-0">
                  <QrCode className="w-8 h-8" />
                </div>
                <div className="text-xs">
                  <div className="font-bold text-[#3E4A3D]">QR भुक्तानी (Fonepay / eSewa / Khalti)</div>
                  <div className="text-[11px] text-[#63615A]">
                    Scan directly to pay {businessProfile.companyName}
                  </div>
                </div>
              </div>

              <div className="text-[11px] text-[#8A8882] leading-relaxed">
                {businessProfile.invoiceFooterNote}
              </div>
            </div>

            {/* Right: Calculations breakdown */}
            <div className="w-full sm:w-80 space-y-2 text-xs bg-[#FDFCF9] p-4 rounded-2xl border border-[#E6E4DF]">
              <div className="flex justify-between text-[#63615A]">
                <span>करयोग्य रकम (Taxable Amount):</span>
                <span className="font-semibold text-[#2D2D2A]">
                  {formatCurrency(order.subtotal, businessProfile.currencySymbol)}
                </span>
              </div>
              <div className="flex justify-between text-[#63615A]">
                <span>१३% मू.अ.कर (13% VAT Amount):</span>
                <span className="font-semibold text-[#2D2D2A]">
                  +{formatCurrency(order.taxTotal, businessProfile.currencySymbol)}
                </span>
              </div>
              {order.discountTotal > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span>छुट रकम (Discount):</span>
                  <span className="font-semibold">
                    -{formatCurrency(order.discountTotal, businessProfile.currencySymbol)}
                  </span>
                </div>
              )}
              {order.shippingFee > 0 && (
                <div className="flex justify-between text-[#63615A]">
                  <span>ढुवानी खर्च (Delivery / Shipping):</span>
                  <span className="font-semibold text-[#2D2D2A]">
                    +{formatCurrency(order.shippingFee, businessProfile.currencySymbol)}
                  </span>
                </div>
              )}

              <div className="h-px bg-[#E6E4DF] my-2"></div>

              <div className="flex justify-between text-sm font-black text-[#2D2D2A]">
                <span>कुल जम्मा (Grand Total):</span>
                <span className="text-base text-[#3E4A3D] font-bold">
                  {formatCurrency(order.grandTotal, businessProfile.currencySymbol)}
                </span>
              </div>

              <div className="flex justify-between text-xs text-[#63615A]">
                <span>प्राप्त रकम (Amount Paid):</span>
                <span className="font-bold text-emerald-700">
                  {formatCurrency(order.paidAmount, businessProfile.currencySymbol)}
                </span>
              </div>

              <div className="flex justify-between text-xs font-bold bg-[#F3F1ED] p-2.5 rounded-xl">
                <span>बाँकी बक्यौता (Balance Due):</span>
                <span className={balanceDue > 0 ? 'text-rose-600 font-extrabold' : 'text-emerald-700 font-extrabold'}>
                  {formatCurrency(balanceDue, businessProfile.currencySymbol)}
                </span>
              </div>
            </div>
          </div>

          {/* Official Signature Boxes */}
          <div className="pt-6 border-t border-[#E6E4DF] grid grid-cols-2 gap-8 text-xs text-[#63615A]">
            <div className="space-y-1 text-center">
              <div className="h-12 border-b border-dashed border-[#8A8882]/40 flex items-end justify-center pb-1">
                {order.customerName}
              </div>
              <div className="font-semibold text-[#2D2D2A]">ग्राहकको हस्ताक्षर (Customer Signature)</div>
            </div>
            <div className="space-y-1 text-center">
              <div className="h-12 border-b border-dashed border-[#8A8882]/40 flex items-end justify-center pb-1">
                <span className="font-mono text-[10px] text-[#3E4A3D]">Authorized Staff</span>
              </div>
              <div className="font-semibold text-[#2D2D2A]">अधिकृत हस्ताक्षर तथा छाप (Authorized Signatory)</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
