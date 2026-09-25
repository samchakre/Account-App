import React, { useEffect, useState } from 'react';
import { AlertCircle, Barcode, DollarSign, FolderPlus, Layers, Package, Plus, Tag, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Product } from '../../types';

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  productToEdit?: Product | null;
}

export const ProductModal: React.FC<ProductModalProps> = ({
  isOpen,
  onClose,
  productToEdit,
}) => {
  const { addProduct, updateProduct, categories, addCategory, vendors, businessProfile } =
    useApp();

  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    barcode: '',
    categoryId: '',
    description: '',
    unit: 'pcs',
    purchasePrice: '',
    sellingPrice: '',
    currentStock: '',
    minReorderLevel: '10',
    maxStockLevel: '100',
    location: '',
    supplierId: '',
  });

  const [error, setError] = useState('');
  const [isQuickAddCategoryOpen, setIsQuickAddCategoryOpen] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatCode, setNewCatCode] = useState('');

  useEffect(() => {
    if (productToEdit) {
      setFormData({
        name: productToEdit.name,
        sku: productToEdit.sku,
        barcode: productToEdit.barcode || '',
        categoryId: productToEdit.categoryId,
        description: productToEdit.description || '',
        unit: productToEdit.unit || 'pcs',
        purchasePrice: String(productToEdit.purchasePrice),
        sellingPrice: String(productToEdit.sellingPrice),
        currentStock: String(productToEdit.currentStock),
        minReorderLevel: String(productToEdit.minReorderLevel),
        maxStockLevel: String(productToEdit.maxStockLevel),
        location: productToEdit.location || '',
        supplierId: productToEdit.supplierId || '',
      });
    } else {
      setFormData({
        name: '',
        sku: `SKU-${Math.floor(100000 + Math.random() * 900000)}`,
        barcode: `${Math.floor(1000000000 + Math.random() * 9000000000)}`,
        categoryId: categories[0]?.id || '',
        description: '',
        unit: 'pcs',
        purchasePrice: '',
        sellingPrice: '',
        currentStock: '0',
        minReorderLevel: '10',
        maxStockLevel: '100',
        location: 'Warehouse A, Shelf 1',
        supplierId: vendors[0]?.id || '',
      });
    }
    setError('');
    setIsQuickAddCategoryOpen(false);
  }, [productToEdit, isOpen, categories, vendors]);

  if (!isOpen) return null;

  const handleQuickAddCategory = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    const code = newCatCode.trim().toUpperCase() || `CAT-${Math.floor(100 + Math.random() * 900)}`;
    addCategory({
      name: newCatName.trim(),
      code,
      color: '#3E4A3D',
      description: 'Quick created from product registration.',
    });
    setNewCatName('');
    setNewCatCode('');
    setIsQuickAddCategoryOpen(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError('Please provide a product name.');
      return;
    }
    if (!formData.sku.trim()) {
      setError('Please provide a unique SKU.');
      return;
    }
    const pPrice = parseFloat(formData.purchasePrice);
    const sPrice = parseFloat(formData.sellingPrice);
    const stock = parseInt(formData.currentStock, 10);
    const minLevel = parseInt(formData.minReorderLevel, 10);
    const maxLevel = parseInt(formData.maxStockLevel, 10);

    if (isNaN(pPrice) || pPrice < 0) {
      setError('Invalid purchase price.');
      return;
    }
    if (isNaN(sPrice) || sPrice < 0) {
      setError('Invalid selling price.');
      return;
    }

    const assignedCategoryId = formData.categoryId || (categories[0]?.id ?? 'general');

    if (productToEdit) {
      updateProduct(productToEdit.id, {
        name: formData.name.trim(),
        sku: formData.sku.trim().toUpperCase(),
        barcode: formData.barcode.trim(),
        categoryId: assignedCategoryId,
        description: formData.description.trim(),
        unit: formData.unit,
        purchasePrice: pPrice,
        sellingPrice: sPrice,
        minReorderLevel: isNaN(minLevel) ? 10 : minLevel,
        maxStockLevel: isNaN(maxLevel) ? 100 : maxLevel,
        location: formData.location.trim(),
        supplierId: formData.supplierId,
      });
    } else {
      addProduct({
        name: formData.name.trim(),
        sku: formData.sku.trim().toUpperCase(),
        barcode: formData.barcode.trim(),
        categoryId: assignedCategoryId,
        description: formData.description.trim(),
        unit: formData.unit,
        purchasePrice: pPrice,
        sellingPrice: sPrice,
        currentStock: isNaN(stock) ? 0 : Math.max(0, stock),
        minReorderLevel: isNaN(minLevel) ? 10 : minLevel,
        maxStockLevel: isNaN(maxLevel) ? 100 : maxLevel,
        location: formData.location.trim(),
        supplierId: formData.supplierId,
        status: 'active',
      });
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2D2D2A]/60 backdrop-blur-xs overflow-y-auto">
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-[#E6E4DF] overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-[#E6E4DF] flex items-center justify-between bg-[#FDFCF9]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#A7C4BC]/25 flex items-center justify-center text-[#3E4A3D]">
              <Package className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-lg font-serif italic text-[#3E4A3D]">
                {productToEdit ? 'Edit Product Catalog Item' : 'Add New Inventory Product'}
              </h2>
              <p className="text-[11px] text-[#8A8882]">Configure category, pricing, SKU tracking & reorder thresholds</p>
            </div>
          </div>
          <button
            onClick={onClose}
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-[10px] font-semibold text-[#8A8882] uppercase tracking-wider mb-1">
                Product Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Organic Ceremonial Grade Matcha"
                className="w-full px-4 py-2 text-xs sm:text-sm border border-[#E6E4DF] rounded-full focus:ring-2 focus:ring-[#3E4A3D] bg-[#FDFCF9] font-bold text-[#2D2D2A]"
              />
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-[#8A8882] uppercase tracking-wider mb-1">
                SKU (Stock Keeping Unit) *
              </label>
              <input
                type="text"
                required
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                placeholder="e.g. TEA-MATCHA-100G"
                className="w-full px-4 py-2 text-xs sm:text-sm font-mono border border-[#E6E4DF] rounded-full focus:ring-2 focus:ring-[#3E4A3D] bg-[#FDFCF9] text-[#2D2D2A]"
              />
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-[#8A8882] uppercase tracking-wider mb-1">
                Barcode / UPC Code
              </label>
              <input
                type="text"
                value={formData.barcode}
                onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                placeholder="e.g. 89012345678"
                className="w-full px-4 py-2 text-xs sm:text-sm font-mono border border-[#E6E4DF] rounded-full focus:ring-2 focus:ring-[#3E4A3D] bg-[#FDFCF9] text-[#2D2D2A]"
              />
            </div>

            {/* Category Dropdown & Quick Add */}
            <div className="sm:col-span-2">
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[10px] font-semibold text-[#8A8882] uppercase tracking-wider">
                  Category Classification *
                </label>
                <button
                  type="button"
                  onClick={() => setIsQuickAddCategoryOpen(!isQuickAddCategoryOpen)}
                  className="text-[11px] font-semibold text-[#3E4A3D] hover:underline flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  <span>{isQuickAddCategoryOpen ? 'Close Category Form' : 'New Category'}</span>
                </button>
              </div>

              {isQuickAddCategoryOpen ? (
                <div className="p-3 bg-[#FDFCF9] border border-[#A7C4BC]/50 rounded-2xl mb-2 flex flex-col sm:flex-row gap-2 items-center animate-in fade-in">
                  <input
                    type="text"
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    placeholder="New category name (e.g. Herbal Blends)"
                    className="flex-1 px-3 py-1.5 text-xs border border-[#E6E4DF] rounded-full bg-white text-[#2D2D2A]"
                  />
                  <input
                    type="text"
                    value={newCatCode}
                    onChange={(e) => setNewCatCode(e.target.value)}
                    placeholder="Prefix (e.g. HRB)"
                    className="w-24 px-3 py-1.5 text-xs font-mono border border-[#E6E4DF] rounded-full bg-white text-[#2D2D2A]"
                  />
                  <button
                    type="button"
                    onClick={handleQuickAddCategory}
                    className="px-3 py-1.5 bg-[#3E4A3D] hover:bg-[#2D362C] text-white text-xs font-semibold rounded-full shrink-0"
                  >
                    Add Category
                  </button>
                </div>
              ) : null}

              <select
                value={formData.categoryId}
                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                className="w-full px-4 py-2 text-xs sm:text-sm border border-[#E6E4DF] rounded-full focus:ring-2 focus:ring-[#3E4A3D] bg-[#FDFCF9] text-[#2D2D2A] font-medium"
              >
                {categories.length === 0 ? (
                  <option value="">No categories defined</option>
                ) : (
                  categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.code})
                    </option>
                  ))
                )}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-[#8A8882] uppercase tracking-wider mb-1">
                मापन इकाई (Measurement Unit) *
              </label>
              <select
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                className="w-full px-4 py-2 text-xs sm:text-sm border border-[#E6E4DF] rounded-full focus:ring-2 focus:ring-[#3E4A3D] bg-[#FDFCF9] text-[#2D2D2A]"
              >
                <option value="pcs">थान / Pieces (pcs)</option>
                <option value="pkt">प्याकेट / Packet (pkt)</option>
                <option value="kg">केजी / Kilograms (kg)</option>
                <option value="sack">बोरा / Sack (sack)</option>
                <option value="ctn">कार्टुन / Carton (ctn)</option>
                <option value="bottle">बोतल / Bottle (bottle)</option>
                <option value="jar">जार / Jar (jar)</option>
                <option value="ream">रिम / Ream (ream)</option>
                <option value="box">बक्स / Box (box)</option>
                <option value="litre">लिटर / Litre (ltr)</option>
                <option value="meter">मिटर / Meter (mtr)</option>
                <option value="set">सेट / Set (set)</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-[#8A8882] uppercase tracking-wider mb-1">
                खरिद दर (Cost Price - {businessProfile.currencySymbol.trim()}) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={formData.purchasePrice}
                onChange={(e) => setFormData({ ...formData, purchasePrice: e.target.value })}
                placeholder="250.00"
                className="w-full px-4 py-2 text-xs sm:text-sm font-semibold border border-[#E6E4DF] rounded-full focus:ring-2 focus:ring-[#3E4A3D] bg-[#FDFCF9] text-[#2D2D2A]"
              />
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-[#8A8882] uppercase tracking-wider mb-1">
                बिक्री दर (Retail Price - {businessProfile.currencySymbol.trim()}) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={formData.sellingPrice}
                onChange={(e) => setFormData({ ...formData, sellingPrice: e.target.value })}
                placeholder="320.00"
                className="w-full px-4 py-2 text-xs sm:text-sm font-semibold text-[#3E4A3D] border border-[#E6E4DF] rounded-full focus:ring-2 focus:ring-[#3E4A3D] bg-[#FDFCF9]"
              />
            </div>

            {!productToEdit && (
              <div>
                <label className="block text-[10px] font-semibold text-[#8A8882] uppercase tracking-wider mb-1">
                  Initial Opening Stock Quantity
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.currentStock}
                  onChange={(e) => setFormData({ ...formData, currentStock: e.target.value })}
                  placeholder="0"
                  className="w-full px-4 py-2 text-xs sm:text-sm border border-[#E6E4DF] rounded-full focus:ring-2 focus:ring-[#3E4A3D] bg-[#FDFCF9] text-[#2D2D2A]"
                />
              </div>
            )}

            <div>
              <label className="block text-[10px] font-semibold text-[#8A8882] uppercase tracking-wider mb-1">
                Min Reorder Alert Threshold
              </label>
              <input
                type="number"
                min="0"
                value={formData.minReorderLevel}
                onChange={(e) => setFormData({ ...formData, minReorderLevel: e.target.value })}
                placeholder="10"
                className="w-full px-4 py-2 text-xs sm:text-sm border border-[#E6E4DF] rounded-full focus:ring-2 focus:ring-[#3E4A3D] bg-[#FDFCF9] text-[#2D2D2A]"
              />
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-[#8A8882] uppercase tracking-wider mb-1">
                Default Supplier / Vendor
              </label>
              <select
                value={formData.supplierId}
                onChange={(e) => setFormData({ ...formData, supplierId: e.target.value })}
                className="w-full px-4 py-2 text-xs sm:text-sm border border-[#E6E4DF] rounded-full focus:ring-2 focus:ring-[#3E4A3D] bg-[#FDFCF9] text-[#2D2D2A]"
              >
                <option value="">None / Unassigned</option>
                {vendors.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-[#8A8882] uppercase tracking-wider mb-1">
                Warehouse Bin / Aisle Location
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="e.g. Aisle 3, Shelf B-12"
                className="w-full px-4 py-2 text-xs sm:text-sm border border-[#E6E4DF] rounded-full focus:ring-2 focus:ring-[#3E4A3D] bg-[#FDFCF9] text-[#2D2D2A]"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[10px] font-semibold text-[#8A8882] uppercase tracking-wider mb-1">
                Product Description & Notes
              </label>
              <textarea
                rows={2}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Product attributes, grade certification, origin details..."
                className="w-full px-4 py-2.5 text-xs sm:text-sm border border-[#E6E4DF] rounded-2xl focus:ring-2 focus:ring-[#3E4A3D] bg-[#FDFCF9] text-[#2D2D2A]"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-[#E6E4DF] flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-[#8A8882] hover:text-[#2D2D2A] bg-white hover:bg-[#F3F1ED] border border-[#E6E4DF] rounded-full transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold text-white bg-[#3E4A3D] hover:bg-[#2D362C] rounded-full shadow-xs transition-colors"
            >
              {productToEdit ? 'Save Changes' : 'Register Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
