import React, { useState } from 'react';
import {
  AlertCircle,
  Building,
  CheckCircle2,
  Database,
  Download,
  Edit2,
  FileJson,
  FolderTree,
  Layers,
  Plus,
  Save,
  Search,
  Sparkles,
  Tag,
  Trash2,
  Upload,
  Users,
  X,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Category } from '../../types';
import { formatCurrency } from '../../utils/formatters';
import { ConfirmModal } from '../common/ConfirmModal';
import { UserManagementSection } from './UserManagementSection';


const COLOR_PRESETS = [
  '#3E4A3D', // Evergreen
  '#5B7059', // Sage Dark
  '#A7C4BC', // Sage Light
  '#C97B5A', // Terracotta
  '#D99B6A', // Warm Ochre
  '#8B6B58', // Earth Clay
  '#4A6B6C', // Slate Teal
  '#6B7280', // Charcoal
  '#8B5CF6', // Purple
  '#3B82F6', // Blue
];

export const SettingsView: React.FC = () => {
  const {
    businessProfile,
    updateBusinessProfile,
    categories,
    products,
    addCategory,
    updateCategory,
    deleteCategory,
    exportAllDataAsJSON,
    importDataFromJSON,
    resetToDemoData,
    clearAllData,
  } = useApp();

  const [formData, setFormData] = useState({ ...businessProfile });
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [importError, setImportError] = useState('');
  const [importSuccess, setImportSuccess] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isFlushModalOpen, setIsFlushModalOpen] = useState(false);
  const [flushSuccess, setFlushSuccess] = useState(false);
  const [settingsTab, setSettingsTab] = useState<'users' | 'profile' | 'categories' | 'database'>('users');

  // Category Management State in Admin Panel

  const [categorySearch, setCategorySearch] = useState('');
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [categoryToEdit, setCategoryToEdit] = useState<Category | null>(null);
  const [categoryFormData, setCategoryFormData] = useState({
    name: '',
    code: '',
    description: '',
    color: '#3E4A3D',
  });
  const [categoryError, setCategoryError] = useState('');
  const [categorySuccess, setCategorySuccess] = useState('');
  const [deleteTargetCat, setDeleteTargetCat] = useState<Category | null>(null);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateBusinessProfile({
      ...formData,
      defaultTaxRate: Number(formData.defaultTaxRate) || 0,
    });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImportError('');
    setImportSuccess(false);
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const success = importDataFromJSON(text);
        if (success) {
          setImportSuccess(true);
          setTimeout(() => setImportSuccess(false), 3000);
        } else {
          setImportError('Invalid backup file format. Could not restore database.');
        }
      } catch (err) {
        setImportError('Failed to read backup file.');
      }
    };
    reader.readAsText(file);
  };

  // Category CRUD Handlers
  const handleOpenAddCategory = () => {
    setCategoryToEdit(null);
    setCategoryFormData({
      name: '',
      code: `CAT-${Math.floor(100 + Math.random() * 900)}`,
      description: '',
      color: COLOR_PRESETS[Math.floor(Math.random() * COLOR_PRESETS.length)],
    });
    setCategoryError('');
    setIsCategoryModalOpen(true);
  };

  const handleOpenEditCategory = (cat: Category) => {
    setCategoryToEdit(cat);
    setCategoryFormData({
      name: cat.name,
      code: cat.code,
      description: cat.description || '',
      color: cat.color || '#3E4A3D',
    });
    setCategoryError('');
    setIsCategoryModalOpen(true);
  };

  const handleCategorySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryFormData.name.trim()) {
      setCategoryError('Please provide a category name.');
      return;
    }
    if (!categoryFormData.code.trim()) {
      setCategoryError('Please provide a category code / prefix.');
      return;
    }

    if (categoryToEdit) {
      updateCategory(categoryToEdit.id, {
        name: categoryFormData.name.trim(),
        code: categoryFormData.code.trim().toUpperCase(),
        description: categoryFormData.description.trim(),
        color: categoryFormData.color,
      });
      setCategorySuccess(`Updated category "${categoryFormData.name.trim()}"`);
    } else {
      addCategory({
        name: categoryFormData.name.trim(),
        code: categoryFormData.code.trim().toUpperCase(),
        description: categoryFormData.description.trim(),
        color: categoryFormData.color,
      });
      setCategorySuccess(`Created category "${categoryFormData.name.trim()}"`);
    }

    setIsCategoryModalOpen(false);
    setTimeout(() => setCategorySuccess(''), 3500);
  };

  const filteredCategories = categories.filter((c) => {
    const q = categorySearch.toLowerCase().trim();
    if (!q) return true;
    return (
      c.name.toLowerCase().includes(q) ||
      c.code.toLowerCase().includes(q) ||
      (c.description && c.description.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Header & Tabs */}
      <div className="space-y-4">
        <div>
          <h2 className="text-2xl font-serif italic text-[#3E4A3D]">Admin Control Panel & System Settings</h2>
          <p className="text-xs sm:text-sm text-[#8A8882] mt-0.5">
            Manage staff user accounts, role permissions, product categories, business profile, and database backups.
          </p>
        </div>

        {/* Tab Navigation Pill Bar */}
        <div className="flex flex-wrap items-center gap-2 p-1.5 rounded-2xl bg-white border border-[#E6E4DF] shadow-xs">
          <button
            type="button"
            onClick={() => setSettingsTab('users')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer ${
              settingsTab === 'users'
                ? 'bg-[#3E4A3D] text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Staff Users & Access Control (प्रयोगकर्ता)</span>
          </button>

          <button
            type="button"
            onClick={() => setSettingsTab('categories')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer ${
              settingsTab === 'categories'
                ? 'bg-[#3E4A3D] text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
            }`}
          >
            <FolderTree className="w-4 h-4" />
            <span>Categories & Classification ({categories.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setSettingsTab('profile')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer ${
              settingsTab === 'profile'
                ? 'bg-[#3E4A3D] text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
            }`}
          >
            <Building className="w-4 h-4" />
            <span>Company & Invoice Profile</span>
          </button>

          <button
            type="button"
            onClick={() => setSettingsTab('database')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer ${
              settingsTab === 'database'
                ? 'bg-[#3E4A3D] text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>Database Backup & Maintenance</span>
          </button>
        </div>
      </div>

      {/* 1. User Management Section */}
      {settingsTab === 'users' && <UserManagementSection />}

      {/* 2. Category Management Section in Admin Panel */}
      {settingsTab === 'categories' && (
      <div id="admin-category-management" className="bg-white rounded-3xl border border-[#E6E4DF] shadow-xs overflow-hidden">

        <div className="px-6 py-4.5 border-b border-[#E6E4DF] bg-[#FDFCF9] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#A7C4BC]/25 flex items-center justify-center text-[#3E4A3D]">
              <FolderTree className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif italic text-[#3E4A3D] text-lg">Product Category Management</h3>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#A7C4BC]/25 text-[#3E4A3D] border border-[#A7C4BC]/40">
                  {categories.length} Total
                </span>
              </div>
              <p className="text-xs text-[#8A8882]">
                Configure catalog hierarchy, SKU prefix classifications, and category valuation.
              </p>
            </div>
          </div>

          <button
            onClick={handleOpenAddCategory}
            className="flex items-center justify-center gap-1.5 px-4 py-2 bg-[#3E4A3D] hover:bg-[#2D362C] text-white text-xs font-semibold rounded-full shadow-xs transition-colors shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Add Category</span>
          </button>
        </div>

        <div className="p-6 space-y-4">
          {categorySuccess && (
            <div className="p-3.5 rounded-2xl bg-[#A7C4BC]/20 border border-[#A7C4BC]/30 text-[#3E4A3D] text-xs flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{categorySuccess}</span>
            </div>
          )}

          {/* Search Bar */}
          <div className="relative max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8A8882]" />
            <input
              type="text"
              value={categorySearch}
              onChange={(e) => setCategorySearch(e.target.value)}
              placeholder="Search categories by name, prefix, or description..."
              className="w-full pl-10 pr-4 py-2 text-xs border border-[#E6E4DF] rounded-full focus:ring-2 focus:ring-[#3E4A3D] bg-[#FDFCF9] text-[#2D2D2A]"
            />
          </div>

          {/* Categories Table / List */}
          <div className="border border-[#E6E4DF] rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-[#FDFCF9] border-b border-[#E6E4DF] text-[10px] uppercase font-semibold text-[#8A8882] tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Category Name</th>
                    <th className="py-3 px-4">Prefix / Code</th>
                    <th className="py-3 px-4">Description</th>
                    <th className="py-3 px-4 text-center">Active SKUs</th>
                    <th className="py-3 px-4 text-right">Inventory Valuation</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E6E4DF]">
                  {filteredCategories.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-[#8A8882]">
                        <div className="flex flex-col items-center justify-center gap-1.5">
                          <FolderTree className="w-6 h-6 text-[#A7C4BC]" />
                          <p className="font-semibold text-[#2D2D2A]">No product categories found</p>
                          <p className="text-[11px]">Click "Add Category" above to create your first inventory category.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredCategories.map((cat) => {
                      const catProducts = products.filter((p) => p.categoryId === cat.id);
                      const totalUnits = catProducts.reduce((sum, p) => sum + p.currentStock, 0);
                      const totalValuation = catProducts.reduce(
                        (sum, p) => sum + p.currentStock * p.purchasePrice,
                        0
                      );

                      return (
                        <tr key={cat.id} className="hover:bg-[#FDFCF9]/70 transition-colors">
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2.5">
                              <span
                                className="w-3.5 h-3.5 rounded-full shrink-0 shadow-2xs border border-white"
                                style={{ backgroundColor: cat.color || '#3E4A3D' }}
                              />
                              <span className="font-bold text-[#2D2D2A]">{cat.name}</span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="font-mono text-[11px] font-semibold px-2.5 py-1 rounded-full bg-[#F3F1ED] text-[#3E4A3D] border border-[#E6E4DF]">
                              {cat.code}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-[#8A8882] max-w-xs truncate">
                            {cat.description || <span className="italic text-[#8A8882]/70">No description provided</span>}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <span className="font-semibold text-[#2D2D2A]">
                              {catProducts.length} <span className="text-[#8A8882] font-normal">({totalUnits} units)</span>
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right font-semibold text-[#3E4A3D]">
                            {formatCurrency(totalValuation, businessProfile.currencySymbol)}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleOpenEditCategory(cat)}
                                className="p-1.5 text-[#8A8882] hover:text-[#3E4A3D] hover:bg-[#F3F1ED] rounded-lg transition-colors"
                                title="Edit Category"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setDeleteTargetCat(cat)}
                                className="p-1.5 text-[#8A8882] hover:text-[#C97B5A] hover:bg-[#C97B5A]/10 rounded-lg transition-colors"
                                title="Delete Category"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
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
        </div>
      </div>
      )}

      {/* 3. Business Information Card */}
      {settingsTab === 'profile' && (
      <div className="bg-white rounded-3xl border border-[#E6E4DF] shadow-xs overflow-hidden">
        <div className="px-6 py-4.5 border-b border-[#E6E4DF] bg-[#FDFCF9] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building className="w-5 h-5 text-[#3E4A3D]" />
            <h3 className="font-serif italic text-[#3E4A3D] text-lg">Company & Invoice Information</h3>
          </div>
          {saveSuccess && (
            <span className="flex items-center gap-1 text-xs font-semibold text-[#3E4A3D] bg-[#A7C4BC]/25 px-3 py-1 rounded-full border border-[#A7C4BC]/35 animate-in fade-in">
              <CheckCircle2 className="w-3.5 h-3.5" /> Saved successfully
            </span>
          )}
        </div>

        <form onSubmit={handleSaveProfile} className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-semibold text-[#8A8882] uppercase tracking-wider mb-1">
                Company Name *
              </label>
              <input
                type="text"
                required
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                className="w-full px-4 py-2 text-xs sm:text-sm border border-[#E6E4DF] rounded-full focus:ring-2 focus:ring-[#3E4A3D] bg-[#FDFCF9] font-bold text-[#2D2D2A]"
              />
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-[#8A8882] uppercase tracking-wider mb-1">
                Company Tagline / Subtitle
              </label>
              <input
                type="text"
                value={formData.tagline}
                onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                className="w-full px-4 py-2 text-xs sm:text-sm border border-[#E6E4DF] rounded-full focus:ring-2 focus:ring-[#3E4A3D] bg-[#FDFCF9] text-[#2D2D2A]"
              />
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-[#8A8882] uppercase tracking-wider mb-1">
                Business Email Address
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-2 text-xs sm:text-sm border border-[#E6E4DF] rounded-full focus:ring-2 focus:ring-[#3E4A3D] bg-[#FDFCF9] text-[#2D2D2A]"
              />
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-[#8A8882] uppercase tracking-wider mb-1">
                Business Contact Phone
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-2 text-xs sm:text-sm border border-[#E6E4DF] rounded-full focus:ring-2 focus:ring-[#3E4A3D] bg-[#FDFCF9] text-[#2D2D2A]"
              />
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-[#8A8882] uppercase tracking-wider mb-1">
                Tax Registration / VAT / GST #
              </label>
              <input
                type="text"
                value={formData.taxRegistrationNumber}
                onChange={(e) =>
                  setFormData({ ...formData, taxRegistrationNumber: e.target.value })
                }
                className="w-full px-4 py-2 text-xs sm:text-sm font-mono border border-[#E6E4DF] rounded-full focus:ring-2 focus:ring-[#3E4A3D] bg-[#FDFCF9] text-[#2D2D2A]"
              />
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-[#8A8882] uppercase tracking-wider mb-1">
                Currency Symbol
              </label>
              <select
                value={formData.currencySymbol}
                onChange={(e) => setFormData({ ...formData, currencySymbol: e.target.value })}
                className="w-full px-4 py-2 text-xs sm:text-sm border border-[#E6E4DF] rounded-full focus:ring-2 focus:ring-[#3E4A3D] bg-[#FDFCF9] font-bold text-[#2D2D2A]"
              >
                <option value="Rs. ">Nepalese Rupee - Rs. (नेपाली रुपैयाँ - NPR)</option>
                <option value="रू ">Nepalese Rupee - रू (रू NPR)</option>
                <option value="₹">Indian Rupee (₹ INR)</option>
                <option value="$">US Dollar ($ USD)</option>
                <option value="€">Euro (€ EUR)</option>
                <option value="£">British Pound (£ GBP)</option>
                <option value="AED ">UAE Dirham (AED)</option>
                <option value="SAR ">Saudi Riyal (SAR)</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-[#8A8882] uppercase tracking-wider mb-1">
                Default Sales Tax Rate (%)
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={formData.defaultTaxRate}
                onChange={(e) =>
                  setFormData({ ...formData, defaultTaxRate: parseFloat(e.target.value) || 0 })
                }
                className="w-full px-4 py-2 text-xs sm:text-sm border border-[#E6E4DF] rounded-full focus:ring-2 focus:ring-[#3E4A3D] bg-[#FDFCF9] text-[#2D2D2A]"
              />
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-[#8A8882] uppercase tracking-wider mb-1">
                City / State / Zip
              </label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full px-4 py-2 text-xs sm:text-sm border border-[#E6E4DF] rounded-full focus:ring-2 focus:ring-[#3E4A3D] bg-[#FDFCF9] text-[#2D2D2A]"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[10px] font-semibold text-[#8A8882] uppercase tracking-wider mb-1">
                Company Physical Address
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-4 py-2 text-xs sm:text-sm border border-[#E6E4DF] rounded-full focus:ring-2 focus:ring-[#3E4A3D] bg-[#FDFCF9] text-[#2D2D2A]"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[10px] font-semibold text-[#8A8882] uppercase tracking-wider mb-1">
                Default Invoice Footer Note & Payment Instructions
              </label>
              <textarea
                rows={3}
                value={formData.invoiceFooterNote}
                onChange={(e) => setFormData({ ...formData, invoiceFooterNote: e.target.value })}
                className="w-full px-4 py-2.5 text-xs sm:text-sm border border-[#E6E4DF] rounded-2xl focus:ring-2 focus:ring-[#3E4A3D] bg-[#FDFCF9] text-[#2D2D2A]"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-[#E6E4DF] flex justify-end">
            <button
              type="submit"
              className="flex items-center gap-2 px-6 py-2.5 bg-[#3E4A3D] hover:bg-[#2D362C] text-white font-semibold text-xs sm:text-sm rounded-full shadow-xs transition-colors"
            >
              <Save className="w-4 h-4" /> Save Business Profile
            </button>
          </div>
        </form>
      </div>
      )}

      {/* 4. Backup & Database Maintenance */}
      {settingsTab === 'database' && (
      <div className="bg-white rounded-3xl border border-[#E6E4DF] shadow-xs overflow-hidden">

        <div className="px-6 py-4.5 border-b border-[#E6E4DF] bg-[#FDFCF9] flex items-center gap-2">
          <Database className="w-5 h-5 text-[#3E4A3D]" />
          <h3 className="font-serif italic text-[#3E4A3D] text-lg">Local Database & Backup Management</h3>
        </div>

        <div className="p-6 space-y-6">
          {flushSuccess && (
            <div className="p-3.5 rounded-2xl bg-[#A7C4BC]/20 border border-[#A7C4BC]/30 text-[#3E4A3D] text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>All sample inventory, orders, customers, suppliers, and payments have been completely wiped! You now have a clean blank slate.</span>
            </div>
          )}

          {importSuccess && (
            <div className="p-3.5 rounded-2xl bg-[#A7C4BC]/20 border border-[#A7C4BC]/30 text-[#3E4A3D] text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Full ERP database successfully restored from JSON backup!</span>
            </div>
          )}

          {importError && (
            <div className="p-3.5 rounded-2xl bg-[#C97B5A]/15 border border-[#C97B5A]/25 text-[#C97B5A] text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{importError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Export JSON */}
            <div className="p-5 rounded-3xl border border-[#E6E4DF] bg-[#FDFCF9] flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 font-bold text-[#2D2D2A] text-sm">
                  <Download className="w-4 h-4 text-[#3E4A3D]" />
                  <span>Download Complete Backup</span>
                </div>
                <p className="text-xs text-[#8A8882] mt-1.5">
                  Export all products, categories, sales orders, purchase orders, customers, suppliers, and stock ledger movements to a portable JSON backup.
                </p>
              </div>
              <button
                onClick={exportAllDataAsJSON}
                className="mt-4 flex items-center justify-center gap-2 w-full py-2.5 bg-white hover:bg-[#F3F1ED] text-[#3E4A3D] border border-[#E6E4DF] font-semibold text-xs rounded-full shadow-xs transition-colors"
              >
                <FileJson className="w-4 h-4 text-[#3E4A3D]" />
                Export ERP Database (.json)
              </button>
            </div>

            {/* Import JSON */}
            <div className="p-5 rounded-3xl border border-[#E6E4DF] bg-[#FDFCF9] flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 font-bold text-[#2D2D2A] text-sm">
                  <Upload className="w-4 h-4 text-[#3E4A3D]" />
                  <span>Restore from JSON File</span>
                </div>
                <p className="text-xs text-[#8A8882] mt-1.5">
                  Upload a previously exported OmniStock backup file to recover your categories, products, orders, and ledger records.
                </p>
              </div>
              <label className="mt-4 flex items-center justify-center gap-2 w-full py-2.5 bg-white hover:bg-[#F3F1ED] text-[#3E4A3D] border border-[#E6E4DF] font-semibold text-xs rounded-full shadow-xs transition-colors cursor-pointer">
                <Upload className="w-4 h-4 text-[#3E4A3D]" />
                Select Backup File (.json)
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Reset Demo Data & Flush Data */}
          <div className="pt-4 border-t border-[#E6E4DF] space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-[#C97B5A]/5 border border-[#C97B5A]/20">
              <div>
                <div className="font-bold text-[#C97B5A] text-sm flex items-center gap-1.5">
                  <Trash2 className="w-4 h-4 text-[#C97B5A]" />
                  <span>Flush All Sample Data (Start Blank for Production)</span>
                </div>
                <p className="text-xs text-[#8A8882] mt-0.5">
                  Completely wipes all sample products, customer khata records, supplier orders, invoices, and payment logs so you can enter your own real business data.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsFlushModalOpen(true)}
                className="px-4 py-2.5 bg-[#C97B5A] hover:bg-[#B66B4B] text-white text-xs font-semibold rounded-full shadow-xs transition-colors shrink-0 flex items-center justify-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Flush Sample Data
              </button>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
              <div>
                <div className="font-bold text-[#2D2D2A] text-sm flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-[#5B7059]" />
                  <span>Reset to Demo Dataset</span>
                </div>
                <p className="text-xs text-[#8A8882] mt-0.5">
                  Repopulates fresh realistic catalog products, categories, customer accounts, and historical transactions.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsResetModalOpen(true)}
                className="px-4 py-2 bg-white hover:bg-[#F3F1ED] text-[#8A8882] hover:text-[#2D2D2A] text-xs font-semibold rounded-full border border-[#E6E4DF] transition-colors shrink-0"
              >
                Reset Demo Data
              </button>
            </div>
          </div>
        </div>
      </div>
      )}

      {/* Add / Edit Category Modal */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2D2D2A]/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-[#E6E4DF] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-[#E6E4DF] flex items-center justify-between bg-[#FDFCF9]">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-[#A7C4BC]/25 flex items-center justify-center text-[#3E4A3D]">
                  <FolderTree className="w-3.5 h-3.5" />
                </div>
                <h3 className="font-serif italic text-[#3E4A3D] text-lg">
                  {categoryToEdit ? 'Edit Product Category' : 'Add New Product Category'}
                </h3>
              </div>
              <button
                onClick={() => setIsCategoryModalOpen(false)}
                className="p-1 rounded-full text-[#8A8882] hover:text-[#2D2D2A] hover:bg-[#F3F1ED] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCategorySubmit} className="p-6 space-y-4">
              {categoryError && (
                <div className="p-3 rounded-2xl bg-[#C97B5A]/15 border border-[#C97B5A]/25 text-[#C97B5A] text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{categoryError}</span>
                </div>
              )}

              <div>
                <label className="block text-[10px] font-semibold text-[#8A8882] uppercase tracking-wider mb-1">
                  Category Name *
                </label>
                <input
                  type="text"
                  required
                  value={categoryFormData.name}
                  onChange={(e) => setCategoryFormData({ ...categoryFormData, name: e.target.value })}
                  placeholder="e.g. Organic Teas & Botanicals"
                  className="w-full px-4 py-2 text-xs sm:text-sm border border-[#E6E4DF] rounded-full focus:ring-2 focus:ring-[#3E4A3D] bg-[#FDFCF9] text-[#2D2D2A] font-bold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-[#8A8882] uppercase tracking-wider mb-1">
                  SKU Prefix / Code *
                </label>
                <input
                  type="text"
                  required
                  value={categoryFormData.code}
                  onChange={(e) => setCategoryFormData({ ...categoryFormData, code: e.target.value })}
                  placeholder="e.g. BOT-TEA"
                  className="w-full px-4 py-2 text-xs sm:text-sm font-mono border border-[#E6E4DF] rounded-full focus:ring-2 focus:ring-[#3E4A3D] bg-[#FDFCF9] text-[#2D2D2A]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-[#8A8882] uppercase tracking-wider mb-1.5">
                  Color Tag Accent
                </label>
                <div className="flex items-center gap-2 flex-wrap">
                  {COLOR_PRESETS.map((col) => (
                    <button
                      key={col}
                      type="button"
                      onClick={() => setCategoryFormData({ ...categoryFormData, color: col })}
                      className={`w-7 h-7 rounded-full transition-transform ${
                        categoryFormData.color === col
                          ? 'ring-2 ring-offset-2 ring-[#3E4A3D] scale-110'
                          : 'hover:scale-105 opacity-85 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: col }}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-[#8A8882] uppercase tracking-wider mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={categoryFormData.description}
                  onChange={(e) => setCategoryFormData({ ...categoryFormData, description: e.target.value })}
                  placeholder="Items belonging to this product category family..."
                  className="w-full px-4 py-2 text-xs sm:text-sm border border-[#E6E4DF] rounded-2xl focus:ring-2 focus:ring-[#3E4A3D] bg-[#FDFCF9] text-[#2D2D2A]"
                />
              </div>

              <div className="pt-4 border-t border-[#E6E4DF] flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-[#8A8882] hover:text-[#2D2D2A] bg-white hover:bg-[#F3F1ED] border border-[#E6E4DF] rounded-full transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-[#3E4A3D] hover:bg-[#2D362C] rounded-full shadow-xs transition-colors"
                >
                  {categoryToEdit ? 'Save Changes' : 'Create Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Category Modal */}
      <ConfirmModal
        isOpen={!!deleteTargetCat}
        onClose={() => setDeleteTargetCat(null)}
        onConfirm={() => {
          if (deleteTargetCat) {
            deleteCategory(deleteTargetCat.id);
            setCategorySuccess(`Deleted category "${deleteTargetCat.name}"`);
            setDeleteTargetCat(null);
            setTimeout(() => setCategorySuccess(''), 3500);
          }
        }}
        title="Delete Category"
        message={
          deleteTargetCat
            ? `Are you sure you want to delete "${deleteTargetCat.name}"? ${
                products.filter((p) => p.categoryId === deleteTargetCat.id).length
              } products currently linked to this category will remain in the catalog as unassigned.`
            : 'Are you sure you want to delete this category?'
        }
        confirmLabel="Delete Category"
        isDestructive={true}
      />

      {/* Reset System Modal */}
      <ConfirmModal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        onConfirm={() => {
          resetToDemoData();
          setFormData({ ...businessProfile });
        }}
        title="Reset Application Data"
        message="This will wipe your current records and reset the system with rich sample inventory products, categories, vendors, customers, and transactions. Continue?"
        confirmLabel="Reset Everything"
        isDestructive={true}
      />

      {/* Flush Sample Data Modal */}
      <ConfirmModal
        isOpen={isFlushModalOpen}
        onClose={() => setIsFlushModalOpen(false)}
        onConfirm={() => {
          clearAllData(true);
          setFlushSuccess(true);
          setTimeout(() => setFlushSuccess(false), 4500);
        }}
        title="Flush All Sample Data"
        message="This will permanently delete all sample products, customer accounts, suppliers, purchase orders, sales invoices, stock movements, and payment logs. Your category taxonomy and company profile settings will be preserved so you can immediately begin entering your real inventory. Are you sure?"
        confirmLabel="Flush All Data"
        isDestructive={true}
      />
    </div>
  );
};
