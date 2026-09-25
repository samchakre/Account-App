import React, { useEffect, useState } from 'react';
import { AlertCircle, Building2, Mail, MapPin, Phone, Truck, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Vendor } from '../../types';

interface VendorModalProps {
  isOpen: boolean;
  onClose: () => void;
  vendorToEdit?: Vendor | null;
}

export const VendorModal: React.FC<VendorModalProps> = ({ isOpen, onClose, vendorToEdit }) => {
  const { addVendor, updateVendor } = useApp();

  const [formData, setFormData] = useState({
    name: '',
    contactPerson: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    taxNumber: '',
    paymentTerms: 'Net-30',
    leadTimeDays: '5',
    notes: '',
  });

  const [error, setError] = useState('');

  useEffect(() => {
    if (vendorToEdit) {
      setFormData({
        name: vendorToEdit.name,
        contactPerson: vendorToEdit.contactPerson || '',
        email: vendorToEdit.email || '',
        phone: vendorToEdit.phone || '',
        address: vendorToEdit.address || '',
        city: vendorToEdit.city || '',
        taxNumber: vendorToEdit.taxNumber || '',
        paymentTerms: vendorToEdit.paymentTerms || 'Net-30',
        leadTimeDays: String(vendorToEdit.leadTimeDays || 5),
        notes: vendorToEdit.notes || '',
      });
    } else {
      setFormData({
        name: '',
        contactPerson: '',
        email: '',
        phone: '',
        address: '',
        city: 'Kathmandu, Nepal',
        taxNumber: '',
        paymentTerms: 'Net 30 Days',
        leadTimeDays: '3',
        notes: '',
      });
    }
    setError('');
  }, [vendorToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError('Please provide vendor / supplier company name.');
      return;
    }

    const leadTime = parseInt(formData.leadTimeDays, 10) || 5;

    if (vendorToEdit) {
      updateVendor(vendorToEdit.id, {
        name: formData.name.trim(),
        contactPerson: formData.contactPerson.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        address: formData.address.trim(),
        city: formData.city.trim(),
        taxNumber: formData.taxNumber.trim(),
        paymentTerms: formData.paymentTerms.trim(),
        leadTimeDays: leadTime,
        notes: formData.notes.trim(),
      });
    } else {
      addVendor({
        name: formData.name.trim(),
        contactPerson: formData.contactPerson.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        address: formData.address.trim(),
        city: formData.city.trim(),
        taxNumber: formData.taxNumber.trim(),
        paymentTerms: formData.paymentTerms.trim(),
        leadTimeDays: leadTime,
        notes: formData.notes.trim(),
      });
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-150">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {vendorToEdit ? 'Edit Supplier Profile' : 'Register New Vendor'}
              </h2>
              <p className="text-xs text-slate-500">Configure procurement terms & contact persons</p>
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Supplier Company Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Apex Global Components Inc."
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Key Account Manager / Contact
              </label>
              <input
                type="text"
                value={formData.contactPerson}
                onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                placeholder="e.g. Sarah Jenkins"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Agreed Payment Terms
              </label>
              <select
                value={formData.paymentTerms}
                onChange={(e) => setFormData({ ...formData, paymentTerms: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="Immediate / Prepaid">Immediate / Advance</option>
                <option value="Net-15">Net-15 Days</option>
                <option value="Net-30">Net-30 Days</option>
                <option value="Net-60">Net-60 Days</option>
                <option value="Cash on Delivery">Cash on Delivery (COD)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="orders@apexsupply.com"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+1 (800) 555-0199"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Standard Inbound Lead Time (Days)
              </label>
              <input
                type="number"
                min="1"
                value={formData.leadTimeDays}
                onChange={(e) => setFormData({ ...formData, leadTimeDays: e.target.value })}
                placeholder="5"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Tax Registration / Tax ID
              </label>
              <input
                type="text"
                value={formData.taxNumber}
                onChange={(e) => setFormData({ ...formData, taxNumber: e.target.value })}
                placeholder="EIN-98-7654321"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Warehouse / Office Address
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="100 Logistics Blvd, Distribution Center 4"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Supplier Notes & Discounts
              </label>
              <input
                type="text"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Bulk discount eligible on orders over $5,000..."
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500"
              />
            </div>
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
              {vendorToEdit ? 'Save Changes' : 'Register Vendor'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
