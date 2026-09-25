import React, { useMemo, useState } from 'react';
import {
  AlertCircle,
  CreditCard,
  Download,
  Edit2,
  Mail,
  MapPin,
  Phone,
  Plus,
  Receipt,
  Search,
  Trash2,
  User,
  Users,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Customer } from '../../types';
import { exportToCSV, formatCurrency } from '../../utils/formatters';
import { ConfirmModal } from '../common/ConfirmModal';
import { RecordCustomerPaymentModal } from '../sales/RecordCustomerPaymentModal';
import { CustomerModal } from './CustomerModal';

export const CustomersView: React.FC = () => {
  const { customers, deleteCustomer, businessProfile } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [customerToEdit, setCustomerToEdit] = useState<Customer | null>(null);
  const [payTargetCustomer, setPayTargetCustomer] = useState<Customer | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  // Filtered
  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      const matchesSearch =
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.email && c.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (c.phone && c.phone.includes(searchQuery)) ||
        (c.company && c.company.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesType = typeFilter === 'all' || c.customerType === typeFilter;

      return matchesSearch && matchesType;
    });
  }, [customers, searchQuery, typeFilter]);

  // Aggregate metrics
  const totalReceivables = useMemo(() => {
    return customers.reduce((sum, c) => sum + c.outstandingReceivable, 0);
  }, [customers]);

  const handleExportCSV = () => {
    const data = filteredCustomers.map((c) => ({
      Name: c.name,
      Company: c.company || '',
      Type: c.customerType,
      Email: c.email || '',
      Phone: c.phone || '',
      OutstandingReceivable: c.outstandingReceivable,
      CreditLimit: c.creditLimit,
      Address: c.address || '',
      City: c.city || '',
      State: c.state || '',
      TaxNumber: c.taxNumber || '',
    }));
    exportToCSV(`customers_directory_${new Date().toISOString().split('T')[0]}`, data);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-serif italic text-[#3E4A3D]">Customer Directory & Accounts</h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#A7C4BC]/20 text-[#3E4A3D] border border-[#A7C4BC]/30">
              {filteredCustomers.length} Accounts
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#8A8882] mt-0.5">
            Manage wholesale clients, corporate credit terms, billing history, and outstanding accounts receivables.
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
              setCustomerToEdit(null);
              setIsModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-5 py-2 bg-[#3E4A3D] hover:bg-[#2D362C] text-white text-xs font-semibold rounded-full shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Customer
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-[#E6E4DF] shadow-xs">
          <span className="text-[10px] font-semibold text-[#8A8882] uppercase tracking-wider block">
            Total Active Accounts
          </span>
          <div className="text-xl font-bold font-mono text-[#3E4A3D] mt-2">
            {customers.length} Customers
          </div>
          <span className="text-[11px] text-[#8A8882] mt-0.5 block">
            Wholesale, Corporate & Walk-ins
          </span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-[#E6E4DF] shadow-xs">
          <span className="text-[10px] font-semibold text-[#8A8882] uppercase tracking-wider block">
            Total Outstanding Receivables
          </span>
          <div className="text-xl font-bold font-mono text-[#C97B5A] mt-2">
            {formatCurrency(totalReceivables, businessProfile.currencySymbol)}
          </div>
          <span className="text-[11px] text-[#C97B5A] mt-0.5 block font-medium">
            Pending cash collection
          </span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-[#E6E4DF] shadow-xs">
          <span className="text-[10px] font-semibold text-[#8A8882] uppercase tracking-wider block">
            Average Credit Limit
          </span>
          <div className="text-xl font-bold font-mono text-[#3E4A3D] mt-2">
            {formatCurrency(
              customers.reduce((s, c) => s + c.creditLimit, 0) / (customers.length || 1),
              businessProfile.currencySymbol
            )}
          </div>
          <span className="text-[11px] text-[#8A8882] mt-0.5 block font-medium">
            Standard corporate term limit
          </span>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-3xl border border-[#E6E4DF] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8A8882]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search customers by name, company, email, or phone..."
            className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm border border-[#E6E4DF] rounded-full focus:ring-2 focus:ring-[#3E4A3D] bg-[#FDFCF9] text-[#2D2D2A]"
          />
        </div>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-4 py-2 border border-[#E6E4DF] rounded-full focus:ring-2 focus:ring-[#3E4A3D] bg-white font-semibold text-[#2D2D2A] text-xs"
        >
          <option value="all">All Customer Types</option>
          <option value="B2B Wholesale">B2B Wholesale</option>
          <option value="Corporate">Corporate Enterprise</option>
          <option value="Retail">Retail Walk-in</option>
          <option value="Distributor">Regional Distributor</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-3xl border border-[#E6E4DF] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FDFCF9] text-[#8A8882] font-semibold text-[10px] uppercase tracking-wider border-b border-[#E6E4DF]">
              <tr>
                <th className="px-5 py-3.5 font-semibold">Customer Name</th>
                <th className="px-5 py-3.5 font-semibold">Category</th>
                <th className="px-5 py-3.5 font-semibold">Contact Details</th>
                <th className="px-5 py-3.5 font-semibold">Location</th>
                <th className="px-5 py-3.5 font-semibold">Credit Limit</th>
                <th className="px-5 py-3.5 font-semibold">Receivables Due</th>
                <th className="px-5 py-3.5 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F3F1ED]">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#8A8882]">
                    No customer accounts found.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((cust) => {
                  const hasDue = cust.outstandingReceivable > 0;
                  return (
                    <tr key={cust.id} className="hover:bg-[#FDFCF9] transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="font-bold text-[#2D2D2A] text-sm">{cust.name}</div>
                        {cust.company && (
                          <div className="text-[11px] text-[#8A8882]">{cust.company}</div>
                        )}
                      </td>

                      <td className="px-5 py-3.5">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#A7C4BC]/25 text-[#3E4A3D] border border-[#A7C4BC]/35">
                          {cust.customerType}
                        </span>
                      </td>

                      <td className="px-5 py-3.5 space-y-0.5">
                        {cust.email && (
                          <div className="flex items-center gap-1.5 text-[#8A8882]">
                            <Mail className="w-3 h-3 text-[#8A8882]" />
                            <span>{cust.email}</span>
                          </div>
                        )}
                        {cust.phone && (
                          <div className="flex items-center gap-1.5 text-[#8A8882]">
                            <Phone className="w-3 h-3 text-[#8A8882]" />
                            <span>{cust.phone}</span>
                          </div>
                        )}
                      </td>

                      <td className="px-5 py-3.5 text-[#8A8882]">
                        {cust.city ? `${cust.city}, ${cust.state || ''}` : '—'}
                      </td>

                      <td className="px-5 py-3.5 font-bold font-mono text-[#2D2D2A]">
                        {formatCurrency(cust.creditLimit, businessProfile.currencySymbol)}
                      </td>

                      <td className="px-5 py-3.5">
                        <span
                          className={`font-bold font-mono text-sm ${
                            hasDue ? 'text-[#C97B5A]' : 'text-[#3E4A3D]'
                          }`}
                        >
                          {formatCurrency(
                            cust.outstandingReceivable,
                            businessProfile.currencySymbol
                          )}
                        </span>
                      </td>

                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {hasDue && (
                            <button
                              onClick={() => setPayTargetCustomer(cust)}
                              className="px-3 py-1 bg-[#A7C4BC]/20 hover:bg-[#A7C4BC]/30 text-[#3E4A3D] text-[11px] font-semibold rounded-full transition-colors flex items-center gap-1 border border-[#A7C4BC]/30"
                              title="Receive Payment"
                            >
                              <CreditCard className="w-3 h-3" /> Receive Pay
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setCustomerToEdit(cust);
                              setIsModalOpen(true);
                            }}
                            className="p-1.5 text-[#8A8882] hover:text-[#3E4A3D] hover:bg-[#F3F1ED] rounded-full transition-colors"
                            title="Edit Profile"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteTargetId(cust.id)}
                            className="p-1.5 text-[#8A8882] hover:text-[#C97B5A] hover:bg-[#C97B5A]/10 rounded-full transition-colors"
                            title="Delete Customer"
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

      {/* Customer Modal */}
      <CustomerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        customerToEdit={customerToEdit}
      />

      {/* Payment Receive Modal */}
      <RecordCustomerPaymentModal
        isOpen={!!payTargetCustomer}
        onClose={() => setPayTargetCustomer(null)}
        initialCustomer={payTargetCustomer}
      />

      {/* Confirm Delete Modal */}
      <ConfirmModal
        isOpen={!!deleteTargetId}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={() => {
          if (deleteTargetId) deleteCustomer(deleteTargetId);
        }}
        title="Delete Customer Account"
        message="Are you sure you want to remove this customer record?"
        confirmLabel="Delete"
        isDestructive={true}
      />
    </div>
  );
};
