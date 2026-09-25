import React, { useState } from 'react';
import {
  AlertCircle,
  Edit2,
  FolderTree,
  Layers,
  Package,
  Plus,
  Search,
  Tag,
  Trash2,
  X,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Category } from '../../types';
import { formatCurrency } from '../../utils/formatters';
import { ConfirmModal } from '../common/ConfirmModal';

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

export const CategoriesView: React.FC = () => {
  const { categories, products, addCategory, updateCategory, deleteCategory, businessProfile } =
    useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [categoryToEdit, setCategoryToEdit] = useState<Category | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    color: '#3E4A3D',
  });
  const [error, setError] = useState('');
  const [deleteTargetCat, setDeleteTargetCat] = useState<Category | null>(null);

  const handleOpenAdd = () => {
    setCategoryToEdit(null);
    setFormData({
      name: '',
      code: `CAT-${Math.floor(100 + Math.random() * 900)}`,
      description: '',
      color: COLOR_PRESETS[Math.floor(Math.random() * COLOR_PRESETS.length)],
    });
    setError('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (cat: Category) => {
    setCategoryToEdit(cat);
    setFormData({
      name: cat.name,
      code: cat.code,
      description: cat.description || '',
      color: cat.color || '#3E4A3D',
    });
    setError('');
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError('Please provide a category name.');
      return;
    }
    if (!formData.code.trim()) {
      setError('Please provide a category code / prefix.');
      return;
    }

    if (categoryToEdit) {
      updateCategory(categoryToEdit.id, {
        name: formData.name.trim(),
        code: formData.code.trim().toUpperCase(),
        description: formData.description.trim(),
        color: formData.color,
      });
    } else {
      addCategory({
        name: formData.name.trim(),
        code: formData.code.trim().toUpperCase(),
        description: formData.description.trim(),
        color: formData.color,
      });
    }

    setIsModalOpen(false);
  };

  const filteredCategories = categories.filter((c) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      c.name.toLowerCase().includes(q) ||
      c.code.toLowerCase().includes(q) ||
      (c.description && c.description.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-2xl font-serif italic text-[#3E4A3D]">Product Categories & Catalog Hierarchy</h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#A7C4BC]/25 text-[#3E4A3D] border border-[#A7C4BC]/40">
              {categories.length} Categories
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#8A8882] mt-0.5">
            Organize catalog inventory hierarchy, SKU prefix classifications, and category stock valuation.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8A8882]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search categories..."
              className="pl-9 pr-4 py-2 text-xs border border-[#E6E4DF] rounded-full focus:ring-2 focus:ring-[#3E4A3D] bg-[#FDFCF9] text-[#2D2D2A] w-48 sm:w-60"
            />
          </div>

          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#3E4A3D] hover:bg-[#2D362C] text-white text-xs font-semibold rounded-full shadow-xs transition-colors shrink-0"
          >
            <Plus className="w-4 h-4" />
            Add Category
          </button>
        </div>
      </div>

      {/* Grid of Categories */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredCategories.map((cat) => {
          const catProducts = products.filter((p) => p.categoryId === cat.id);
          const totalUnits = catProducts.reduce((sum, p) => sum + p.currentStock, 0);
          const totalValuation = catProducts.reduce(
            (sum, p) => sum + p.currentStock * p.purchasePrice,
            0
          );

          return (
            <div
              key={cat.id}
              className="bg-white rounded-3xl p-5 border border-[#E6E4DF] shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span
                      className="w-3.5 h-3.5 rounded-full shrink-0 shadow-2xs border border-white"
                      style={{ backgroundColor: cat.color || '#3E4A3D' }}
                    />
                    <h3 className="font-serif italic text-lg text-[#3E4A3D] font-medium">{cat.name}</h3>
                  </div>
                  <span className="font-mono text-[11px] font-semibold px-2.5 py-1 rounded-full bg-[#F3F1ED] text-[#3E4A3D] border border-[#E6E4DF]">
                    {cat.code}
                  </span>
                </div>

                <p className="text-xs text-[#8A8882] mt-2 line-clamp-2 leading-relaxed">
                  {cat.description || 'No description added for this department.'}
                </p>

                <div className="mt-4 p-3.5 bg-[#FDFCF9] border border-[#E6E4DF] rounded-2xl grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[#8A8882] block text-[10px] uppercase font-semibold tracking-wider">Active SKUs</span>
                    <span className="font-bold text-[#2D2D2A] text-sm">
                      {catProducts.length} Items
                    </span>
                  </div>
                  <div>
                    <span className="text-[#8A8882] block text-[10px] uppercase font-semibold tracking-wider">Stock Valuation</span>
                    <span className="font-bold text-[#3E4A3D] text-sm">
                      {formatCurrency(totalValuation, businessProfile.currencySymbol)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3.5 border-t border-[#E6E4DF] flex items-center justify-between text-xs">
                <span className="text-[#8A8882] font-medium">{totalUnits} total units in stock</span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEdit(cat)}
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
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Category Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2D2D2A]/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-[#E6E4DF] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-[#E6E4DF] flex items-center justify-between bg-[#FDFCF9]">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-[#A7C4BC]/25 flex items-center justify-center text-[#3E4A3D]">
                  <FolderTree className="w-3.5 h-3.5" />
                </div>
                <h3 className="font-serif italic text-[#3E4A3D] text-lg">
                  {categoryToEdit ? 'Edit Category' : 'Add New Category'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-full text-[#8A8882] hover:text-[#2D2D2A] hover:bg-[#F3F1ED] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && (
                <div className="p-3 rounded-2xl bg-[#C97B5A]/15 border border-[#C97B5A]/25 text-[#C97B5A] text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label className="block text-[10px] font-semibold text-[#8A8882] uppercase tracking-wider mb-1">
                  Category Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Computers & Laptops"
                  className="w-full px-4 py-2 text-xs sm:text-sm border border-[#E6E4DF] rounded-full focus:ring-2 focus:ring-[#3E4A3D] bg-[#FDFCF9] text-[#2D2D2A] font-bold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-[#8A8882] uppercase tracking-wider mb-1">
                  Code / SKU Prefix *
                </label>
                <input
                  type="text"
                  required
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  placeholder="e.g. ELEC-PC"
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
                      onClick={() => setFormData({ ...formData, color: col })}
                      className={`w-7 h-7 rounded-full transition-transform ${
                        formData.color === col
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
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Items belonging to this product family..."
                  className="w-full px-4 py-2 text-xs sm:text-sm border border-[#E6E4DF] rounded-2xl focus:ring-2 focus:ring-[#3E4A3D] bg-[#FDFCF9] text-[#2D2D2A]"
                />
              </div>

              <div className="pt-4 border-t border-[#E6E4DF] flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
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

      {/* Delete Modal */}
      <ConfirmModal
        isOpen={!!deleteTargetCat}
        onClose={() => setDeleteTargetCat(null)}
        onConfirm={() => {
          if (deleteTargetCat) {
            deleteCategory(deleteTargetCat.id);
            setDeleteTargetCat(null);
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
    </div>
  );
};
