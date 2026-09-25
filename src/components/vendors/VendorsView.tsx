import React, { useMemo, useState } from 'react';
import {
  AlertCircle,
  Building2,
  Clock,
  CreditCard,
  Download,
  Edit2,
  Mail,
  MapPin,
  Phone,
  Plus,
  Search,
  Trash2,
  Truck,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Vendor } from '../../types';
import { exportToCSV, formatCurrency } from '../../utils/formatters';
import { ConfirmModal } from '../common/ConfirmModal';
import { RecordVendorPaymentModal } from '../purchases/RecordVendorPaymentModal';
import { VendorModal } from './VendorModal';

export const VendorsView: React.FC = () => {
  const { vendors, deleteVendor, businessProfile } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [vendorToEdit, setVendorToEdit] = useState<Vendor | null>(null);
  const [payTargetVendor, setPayTargetVendor] = useState<Vendor | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  // Filtered vendors
  const filteredVendors = useMemo(() => {
    return vendors.filter((v) => {
      return (
        v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (v.contactPerson && v.contactPerson.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (v.email && v.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (v.phone && v.phone.includes(searchQuery))
      );
    });
  }, [vendors, searchQuery]);

  const totalPayables = useMemo(() => {
    return vendors.reduce((sum, v) => sum + v.outstandingPayable, 0);
  }, [vendors]);

  const handleExportCSV = () => {
    const data = filteredVendors.map((v) => ({
      SupplierName: v.name,
      ContactPerson: v.contactPerson,
      Email: v.email,
      Phone: v.phone,
      PaymentTerms: v.paymentTerms,
      LeadTimeDays: v.leadTimeDays,
      OutstandingPayable: v.outstandingPayable,
      Address: v.address || '',
      City: v.city || '',
      TaxNumber: v.taxNumber || '',
    }));
    exportToCSV(`suppliers_directory_${new Date().toISOString().split('T')[0]}`, data);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-serif italic text-[#3E4A3D]">Vendors & Supplier Directory</h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#A7C4BC]/20 text-[#3E4A3D] border border-[#A7C4BC]/30">
              {filteredVendors.length} Suppliers
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#8A8882] mt-0.5">
            Manage product manufacturers, supply contracts, procurement lead times, and accounts payables.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-[#FDFCF9] text-[#3E4A3D] text-xs font-semibold rounded-full border border-[#E6E4DF] shadow-xs transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-[#8A8882]" />
            Export CSV
          </button>
          <button
            onClick={() => {
              setVendorToEdit(null);
              setIsModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-5 py-2 bg-[#3E4A3D] hover:bg-[#2D362C] text-white text-xs font-semibold rounded-full shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Supplier
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-[#E6E4DF] shadow-xs">
          <span className="text-[10px] font-semibold text-[#8A8882] uppercase tracking-wider block">
            Approved Vendors
          </span>
          <div className="text-xl font-bold font-mono text-[#3E4A3D] mt-2">
            {vendors.length} Suppliers
          </div>
          <span className="text-[11px] text-[#8A8882] mt-0.5 block">
            Active supply chain partners
          </span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-[#E6E4DF] shadow-xs">
          <span className="text-[10px] font-semibold text-[#8A8882] uppercase tracking-wider block">
            Total Outstanding Payables
          </span>
          <div className="text-xl font-bold font-mono text-[#C97B5A] mt-2">
            {formatCurrency(totalPayables, businessProfile.currencySymbol)}
          </div>
          <span className="text-[11px] text-[#C97B5A] mt-0.5 block font-medium">
            Pending supplier disbursements
          </span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-[#E6E4DF] shadow-xs">
          <span className="text-[10px] font-semibold text-[#8A8882] uppercase tracking-wider block">
            Average Lead Time
          </span>
          <div className="text-xl font-bold font-mono text-[#3E4A3D] mt-2">
            {(
              vendors.reduce((s, v) => s + (v.leadTimeDays || 5), 0) / (vendors.length || 1)
            ).toFixed(1)}{' '}
            Days
          </div>
          <span className="text-[11px] text-[#8A8882] mt-0.5 block font-medium">
            Purchase to warehouse delivery
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
            placeholder="Search suppliers by name, representative, email, or phone..."
            className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm border border-[#E6E4DF] rounded-full focus:ring-2 focus:ring-[#3E4A3D] bg-[#FDFCF9] text-[#2D2D2A]"
          />
        </div>
      </div>

      {/* Vendors Table */}
      <div className="bg-white rounded-3xl border border-[#E6E4DF] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FDFCF9] text-[#8A8882] font-semibold text-[10px] uppercase tracking-wider border-b border-[#E6E4DF]">
              <tr>
                <th className="px-5 py-3.5 font-semibold">Supplier Name</th>
                <th className="px-5 py-3.5 font-semibold">Representative</th>
                <th className="px-5 py-3.5 font-semibold">Contact Info</th>
                <th className="px-5 py-3.5 font-semibold">Payment Terms</th>
                <th className="px-5 py-3.5 font-semibold">Lead Time</th>
                <th className="px-5 py-3.5 font-semibold">Payables Due</th>
                <th className="px-5 py-3.5 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F3F1ED]">
              {filteredVendors.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#8A8882]">
                    No suppliers found matching your query.
                  </td>
                </tr>
              ) : (
                filteredVendors.map((vendor) => {
                  const hasDue = vendor.outstandingPayable > 0;
                  return (
                    <tr key={vendor.id} className="hover:bg-[#FDFCF9] transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="font-bold text-[#2D2D2A] text-sm">{vendor.name}</div>
                        {vendor.city && (
                          <div className="text-[11px] text-[#8A8882]">{vendor.city}</div>
                        )}
                      </td>

                      <td className="px-5 py-3.5 font-semibold text-[#2D2D2A]">
                        {vendor.contactPerson || '—'}
                      </td>

                      <td className="px-5 py-3.5 space-y-0.5">
                        {vendor.email && (
                          <div className="flex items-center gap-1.5 text-[#8A8882]">
                            <Mail className="w-3 h-3 text-[#8A8882]" />
                            <span>{vendor.email}</span>
                          </div>
                        )}
                        {vendor.phone && (
                          <div className="flex items-center gap-1.5 text-[#8A8882]">
                            <Phone className="w-3 h-3 text-[#8A8882]" />
                            <span>{vendor.phone}</span>
                          </div>
                        )}
                      </td>

                      <td className="px-5 py-3.5">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#F3F1ED] text-[#3E4A3D]">
                          {vendor.paymentTerms}
                        </span>
                      </td>

                      <td className="px-5 py-3.5 font-medium text-[#8A8882]">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-[#8A8882]" />
                          <span>{vendor.leadTimeDays} days</span>
                        </div>
                      </td>

                      <td className="px-5 py-3.5">
                        <span
                          className={`font-bold font-mono text-sm ${
                            hasDue ? 'text-[#C97B5A]' : 'text-[#8A8882]'
                          }`}
                        >
                          {formatCurrency(
                            vendor.outstandingPayable,
                            businessProfile.currencySymbol
                          )}
                        </span>
                      </td>

                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {hasDue && (
                            <button
                              onClick={() => setPayTargetVendor(vendor)}
                              className="px-3 py-1 bg-[#A7C4BC]/20 hover:bg-[#A7C4BC]/30 text-[#3E4A3D] text-[11px] font-semibold rounded-full transition-colors flex items-center gap-1 border border-[#A7C4BC]/30"
                              title="Disburse Payment"
                            >
                              <CreditCard className="w-3 h-3" /> Disburse Pay
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setVendorToEdit(vendor);
                              setIsModalOpen(true);
                            }}
                            className="p-1.5 text-[#8A8882] hover:text-[#3E4A3D] hover:bg-[#F3F1ED] rounded-full transition-colors"
                            title="Edit Supplier"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteTargetId(vendor.id)}
                            className="p-1.5 text-[#8A8882] hover:text-[#C97B5A] hover:bg-[#C97B5A]/10 rounded-full transition-colors"
                            title="Delete Supplier"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Vendor Modal */}
      <VendorModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        vendorToEdit={vendorToEdit}
      />

      {/* Vendor Payment Modal */}
      <RecordVendorPaymentModal
        isOpen={!!payTargetVendor}
        onClose={() => setPayTargetVendor(null)}
        initialVendor={payTargetVendor}
      />

      {/* Confirm Delete */}
      <ConfirmModal
        isOpen={!!deleteTargetId}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={() => {
          if (deleteTargetId) deleteVendor(deleteTargetId);
        }}
        title="Delete Supplier"
        message="Are you sure you want to remove this vendor from your supplier list?"
        confirmLabel="Delete"
        isDestructive={true}
      />
    </div>
  );
};
