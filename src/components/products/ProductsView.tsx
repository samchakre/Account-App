import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  Boxes,
  Download,
  Edit2,
  Eye,
  Filter,
  History,
  LayoutGrid,
  List,
  MoreVertical,
  Package,
  PackagePlus,
  Plus,
  Search,
  SlidersHorizontal,
  Trash2,
  Truck,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Product, StockStatus } from '../../types';
import { exportToCSV, formatCurrency } from '../../utils/formatters';
import { ConfirmModal } from '../common/ConfirmModal';
import { ProductHistoryModal } from './ProductHistoryModal';
import { ProductModal } from './ProductModal';
import { StockAdjustModal } from './StockAdjustModal';

interface ProductsViewProps {
  onQuickNewPOWithProduct?: (productId: string) => void;
}

export const ProductsView: React.FC<ProductsViewProps> = ({ onQuickNewPOWithProduct }) => {
  const { products, categories, vendors, deleteProduct, businessProfile, setActiveTab } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [stockFilter, setStockFilter] = useState<StockStatus>('all');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);
  const [adjustProductId, setAdjustProductId] = useState<string | undefined>(undefined);
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [historyProduct, setHistoryProduct] = useState<Product | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  // Filtered products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      // Search
      const matchesSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.barcode && p.barcode.includes(searchQuery)) ||
        (p.location && p.location.toLowerCase().includes(searchQuery.toLowerCase()));

      // Category
      const matchesCat = selectedCategory === 'all' || p.categoryId === selectedCategory;

      // Stock status
      let matchesStock = true;
      if (stockFilter === 'in_stock') {
        matchesStock = p.currentStock > p.minReorderLevel;
      } else if (stockFilter === 'low_stock') {
        matchesStock = p.currentStock > 0 && p.currentStock <= p.minReorderLevel;
      } else if (stockFilter === 'out_of_stock') {
        matchesStock = p.currentStock <= 0;
      }

      return matchesSearch && matchesCat && matchesStock;
    });
  }, [products, searchQuery, selectedCategory, stockFilter]);

  // Export CSV
  const handleExportCSV = () => {
    const data = filteredProducts.map((p) => {
      const cat = categories.find((c) => c.id === p.categoryId);
      const ven = vendors.find((v) => v.id === p.supplierId);
      return {
        SKU: p.sku,
        Barcode: p.barcode || '',
        Name: p.name,
        Category: cat ? cat.name : '',
        PurchasePrice: p.purchasePrice,
        SellingPrice: p.sellingPrice,
        CurrentStock: p.currentStock,
        Unit: p.unit,
        MinReorderLevel: p.minReorderLevel,
        MaxStockLevel: p.maxStockLevel,
        Location: p.location,
        Supplier: ven ? ven.name : '',
        InventoryCostValue: (Number(p.currentStock || 0) * Number(p.purchasePrice || 0)).toFixed(2),
        InventoryRetailValue: (Number(p.currentStock || 0) * Number(p.sellingPrice || 0)).toFixed(2),
      };
    });
    exportToCSV(`inventory_products_${new Date().toISOString().split('T')[0]}`, data);
  };

  const getCategoryBadge = (catId: string) => {
    const cat = categories.find((c) => c.id === catId);
    if (!cat) return null;
    return (
      <span
        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#A7C4BC]/20 text-[#3E4A3D] border border-[#A7C4BC]/30"
      >
        {cat.name}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header & Primary Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-serif italic text-[#3E4A3D]">Products Catalog & Pricing</h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#A7C4BC]/20 text-[#3E4A3D] border border-[#A7C4BC]/30">
              {filteredProducts.length} Items
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#8A8882] mt-0.5">
            Manage product catalog, cost & retail margins, warehouse bins, and reorder levels.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            id="products-export-btn"
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-[#FDFCF9] text-[#3E4A3D] text-xs font-semibold rounded-full border border-[#E6E4DF] shadow-xs transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-[#8A8882]" />
            Export CSV
          </button>
          <button
            id="products-stock-adjust-btn"
            onClick={() => {
              setAdjustProductId(undefined);
              setIsAdjustModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#F3F1ED] hover:bg-[#E6E4DF] text-[#3E4A3D] text-xs font-semibold rounded-full transition-colors"
          >
            <Boxes className="w-3.5 h-3.5 text-[#3E4A3D]" />
            Audit Stock
          </button>
          <button
            id="products-add-btn"
            onClick={() => {
              setProductToEdit(null);
              setIsAddModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-5 py-2 bg-[#3E4A3D] hover:bg-[#2D362C] text-white text-xs font-semibold rounded-full shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Product
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-5 rounded-3xl border border-[#E6E4DF] shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8A8882]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by product name, SKU, barcode, or bin location..."
              className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm border border-[#E6E4DF] rounded-full focus:ring-2 focus:ring-[#3E4A3D] focus:border-[#3E4A3D] bg-[#FDFCF9] text-[#2D2D2A]"
            />
          </div>

          {/* View Toggles & Status Filter */}
          <div className="flex items-center gap-2">
            <div className="flex items-center p-1 bg-[#F3F1ED] rounded-full border border-[#E6E4DF] text-xs">
              <button
                onClick={() => setStockFilter('all')}
                className={`px-3 py-1 rounded-full font-semibold transition-all ${
                  stockFilter === 'all'
                    ? 'bg-white text-[#3E4A3D] shadow-xs'
                    : 'text-[#8A8882] hover:text-[#2D2D2A]'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setStockFilter('low_stock')}
                className={`px-3 py-1 rounded-full font-semibold transition-all ${
                  stockFilter === 'low_stock'
                    ? 'bg-[#C97B5A] text-white shadow-xs'
                    : 'text-[#8A8882] hover:text-[#2D2D2A]'
                }`}
              >
                Low Stock
              </button>
              <button
                onClick={() => setStockFilter('out_of_stock')}
                className={`px-3 py-1 rounded-full font-semibold transition-all ${
                  stockFilter === 'out_of_stock'
                    ? 'bg-[#3E4A3D] text-white shadow-xs'
                    : 'text-[#8A8882] hover:text-[#2D2D2A]'
                }`}
              >
                Out of Stock
              </button>
            </div>

            {/* View Mode (Table/Grid) */}
            <div className="flex items-center p-1 bg-[#F3F1ED] rounded-full border border-[#E6E4DF]">
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-full transition-all ${
                  viewMode === 'table' ? 'bg-white text-[#3E4A3D] shadow-xs' : 'text-[#8A8882]'
                }`}
                title="Table View"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-full transition-all ${
                  viewMode === 'grid' ? 'bg-white text-[#3E4A3D] shadow-xs' : 'text-[#8A8882]'
                }`}
                title="Grid View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <span className="text-[#8A8882] font-semibold text-[11px] uppercase mr-1 flex items-center gap-1">
            <Filter className="w-3 h-3" /> Category:
          </span>
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3.5 py-1 rounded-full font-semibold shrink-0 transition-all ${
              selectedCategory === 'all'
                ? 'bg-[#3E4A3D] text-white'
                : 'bg-[#F3F1ED] text-[#8A8882] hover:text-[#2D2D2A]'
            }`}
          >
            All Categories
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3.5 py-1 rounded-full font-semibold shrink-0 transition-all flex items-center gap-1.5 ${
                selectedCategory === cat.id
                  ? 'bg-[#A7C4BC] text-[#2D362C] shadow-xs'
                  : 'bg-[#F3F1ED] text-[#8A8882] hover:text-[#2D2D2A]'
              }`}
            >
              <span>{cat.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Products Content: Table or Grid */}
      {filteredProducts.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 border border-[#E6E4DF] text-center">
          <Package className="w-12 h-12 text-[#8A8882] mx-auto mb-3 opacity-40" />
          <h3 className="text-base font-serif italic text-[#3E4A3D]">No products found</h3>
          <p className="text-xs text-[#8A8882] mt-1 max-w-sm mx-auto">
            Try adjusting your search keywords or stock filter, or register a new product SKU.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('all');
              setStockFilter('all');
            }}
            className="mt-4 px-4 py-2 bg-[#F3F1ED] hover:bg-[#E6E4DF] text-[#3E4A3D] text-xs font-semibold rounded-full transition-colors"
          >
            Reset Filters
          </button>
        </div>
      ) : viewMode === 'table' ? (
        <div className="bg-white rounded-3xl border border-[#E6E4DF] shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FDFCF9] text-[#8A8882] font-semibold text-[10px] uppercase tracking-wider border-b border-[#E6E4DF]">
                <tr>
                  <th className="px-5 py-3.5 font-semibold">Product & SKU</th>
                  <th className="px-5 py-3.5 font-semibold">Category</th>
                  <th className="px-5 py-3.5 font-semibold">Cost Price</th>
                  <th className="px-5 py-3.5 font-semibold">Selling Price</th>
                  <th className="px-5 py-3.5 font-semibold">Margin</th>
                  <th className="px-5 py-3.5 font-semibold">Stock Level</th>
                  <th className="px-5 py-3.5 font-semibold">Location</th>
                  <th className="px-5 py-3.5 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F3F1ED]">
                {filteredProducts.map((product) => {
                  const isOutOfStock = product.currentStock <= 0;
                  const isLowStock = product.currentStock > 0 && product.currentStock <= product.minReorderLevel;
                  const marginAmt = product.sellingPrice - product.purchasePrice;
                  const marginPct =
                    product.sellingPrice > 0 ? (marginAmt / product.sellingPrice) * 100 : 0;

                  return (
                    <tr key={product.id} className="hover:bg-[#FDFCF9] transition-colors">
                      {/* Product Name & SKU */}
                      <td className="px-5 py-3.5 min-w-[220px]">
                        <div className="font-bold text-[#2D2D2A] text-sm">{product.name}</div>
                        <div className="flex items-center gap-2 mt-0.5 text-[11px] text-[#8A8882]">
                          <code className="font-mono bg-[#F3F1ED] px-1.5 py-0.5 rounded text-[#3E4A3D]">
                            {product.sku}
                          </code>
                          {product.barcode && <span>• {product.barcode}</span>}
                        </div>
                      </td>

                      {/* Category */}
                      <td className="px-5 py-3.5">{getCategoryBadge(product.categoryId)}</td>

                      {/* Cost Price */}
                      <td className="px-5 py-3.5 font-semibold text-[#3E4A3D] font-mono">
                        {formatCurrency(product.purchasePrice, businessProfile.currencySymbol)}
                      </td>

                      {/* Selling Price */}
                      <td className="px-5 py-3.5 font-bold text-[#3E4A3D] font-mono">
                        {formatCurrency(product.sellingPrice, businessProfile.currencySymbol)}
                      </td>

                      {/* Profit Margin */}
                      <td className="px-5 py-3.5">
                        <span className="font-bold text-[#3E4A3D] font-mono">
                          {formatCurrency(marginAmt, businessProfile.currencySymbol)}
                        </span>
                        <span className="text-[11px] text-[#8A8882] block">
                          ({(marginPct || 0).toFixed(1)}%)
                        </span>
                      </td>

                      {/* Stock Level */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2.5 py-1 rounded-full text-xs font-bold font-mono ${
                              isOutOfStock
                                ? 'bg-[#C97B5A]/20 text-[#C97B5A]'
                                : isLowStock
                                ? 'bg-[#D4A373]/25 text-[#9C6644]'
                                : 'bg-[#A7C4BC]/30 text-[#2D362C]'
                            }`}
                          >
                            {product.currentStock} {product.unit}
                          </span>
                          {isLowStock && (
                            <span className="text-[10px] text-[#C97B5A] font-medium">
                              (Min: {product.minReorderLevel})
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Location */}
                      <td className="px-5 py-3.5 text-[#8A8882] font-medium truncate max-w-[130px]">
                        {product.location || '—'}
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => {
                              setAdjustProductId(product.id);
                              setIsAdjustModalOpen(true);
                            }}
                            className="p-1.5 text-[#8A8882] hover:text-[#3E4A3D] hover:bg-[#F3F1ED] rounded-full transition-colors"
                            title="Audit Stock"
                          >
                            <Boxes className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setHistoryProduct(product)}
                            className="p-1.5 text-[#8A8882] hover:text-[#3E4A3D] hover:bg-[#F3F1ED] rounded-full transition-colors"
                            title="Stock Movement Ledger"
                          >
                            <History className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setProductToEdit(product);
                              setIsAddModalOpen(true);
                            }}
                            className="p-1.5 text-[#8A8882] hover:text-[#3E4A3D] hover:bg-[#F3F1ED] rounded-full transition-colors"
                            title="Edit Product"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteTargetId(product.id)}
                            className="p-1.5 text-[#8A8882] hover:text-[#C97B5A] hover:bg-[#C97B5A]/10 rounded-full transition-colors"
                            title="Delete Product"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Grid View */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredProducts.map((product) => {
            const isOutOfStock = product.currentStock <= 0;
            const isLowStock = product.currentStock > 0 && product.currentStock <= product.minReorderLevel;

            return (
              <div
                key={product.id}
                className="bg-white rounded-3xl p-5 border border-[#E6E4DF] shadow-xs hover:border-[#A7C4BC] transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    {getCategoryBadge(product.categoryId)}
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        isOutOfStock
                          ? 'bg-[#C97B5A]/20 text-[#C97B5A]'
                          : isLowStock
                          ? 'bg-[#D4A373]/25 text-[#9C6644]'
                          : 'bg-[#A7C4BC]/30 text-[#2D362C]'
                      }`}
                    >
                      {isOutOfStock
                        ? 'Out of Stock'
                        : isLowStock
                        ? 'Low Stock'
                        : 'In Stock'}
                    </span>
                  </div>

                  <h3 className="font-bold text-[#2D2D2A] text-sm mt-3 line-clamp-2">
                    {product.name}
                  </h3>
                  <div className="text-xs text-[#8A8882] font-mono mt-0.5">{product.sku}</div>

                  <p className="text-xs text-[#8A8882] mt-2 line-clamp-2 leading-relaxed">
                    {product.description || 'No additional description provided.'}
                  </p>

                  <div className="mt-4 p-3 bg-[#FDFCF9] rounded-2xl border border-[#E6E4DF] grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-[#8A8882] block text-[10px] uppercase font-semibold">Cost Price</span>
                      <span className="font-semibold text-[#3E4A3D] font-mono">
                        {formatCurrency(product.purchasePrice, businessProfile.currencySymbol)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[#8A8882] block text-[10px] uppercase font-semibold">Selling Price</span>
                      <span className="font-bold text-[#3E4A3D] font-mono">
                        {formatCurrency(product.sellingPrice, businessProfile.currencySymbol)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-[#E6E4DF] flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-[#8A8882] block uppercase font-semibold">Current Stock</span>
                    <span className="font-bold text-[#3E4A3D] text-sm font-mono">
                      {product.currentStock} {product.unit}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setAdjustProductId(product.id);
                        setIsAdjustModalOpen(true);
                      }}
                      className="p-1.5 text-[#8A8882] hover:text-[#3E4A3D] hover:bg-[#F3F1ED] rounded-full transition-colors"
                      title="Audit Stock"
                    >
                      <Boxes className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setHistoryProduct(product)}
                      className="p-1.5 text-[#8A8882] hover:text-[#3E4A3D] hover:bg-[#F3F1ED] rounded-full transition-colors"
                      title="History"
                    >
                      <History className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        setProductToEdit(product);
                        setIsAddModalOpen(true);
                      }}
                      className="p-1.5 text-[#8A8882] hover:text-[#3E4A3D] hover:bg-[#F3F1ED] rounded-full transition-colors"
                      title="Edit"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Product Modal */}
      <ProductModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        productToEdit={productToEdit}
      />

      {/* Stock Adjust Modal */}
      <StockAdjustModal
        isOpen={isAdjustModalOpen}
        onClose={() => setIsAdjustModalOpen(false)}
        initialProductId={adjustProductId}
      />

      {/* Product Stock Movement History Modal */}
      <ProductHistoryModal
        isOpen={!!historyProduct}
        onClose={() => setHistoryProduct(null)}
        product={historyProduct}
      />

      {/* Confirm Delete Modal */}
      <ConfirmModal
        isOpen={!!deleteTargetId}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={() => {
          if (deleteTargetId) deleteProduct(deleteTargetId);
        }}
        title="Delete Product"
        message="Are you sure you want to remove this product from your catalog? This will delete the SKU record."
        confirmLabel="Delete"
        isDestructive={true}
      />
    </div>
  );
};
