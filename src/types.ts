export type StockStatus = 'all' | 'in_stock' | 'low_stock' | 'out_of_stock' | 'overstocked';

export interface Category {
  id: string;
  name: string;
  code: string;
  description: string;
  color: string;
  iconName?: string;
  createdAt: string;
}

export interface Product {
  id: string;
  sku: string;
  barcode: string;
  name: string;
  categoryId: string;
  description: string;
  unit: string; // 'pcs' | 'box' | 'kg' | 'pack' | 'set' | 'litre' | 'meter'
  purchasePrice: number;
  sellingPrice: number;
  currentStock: number;
  minReorderLevel: number;
  maxStockLevel: number;
  location: string; // e.g. "Aisle 3, Shelf B"
  supplierId?: string;
  status: 'active' | 'archived';
  createdAt: string;
  updatedAt: string;
}

export interface Vendor {
  id: string;
  code?: string;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  taxNumber?: string;
  taxId?: string;
  paymentTerms: string;
  leadTimeDays?: number;
  totalPurchases?: number;
  outstandingPayable: number;
  status?: 'active' | 'inactive';
  notes?: string;
  createdAt?: string;
}

export interface Customer {
  id: string;
  code?: string;
  name: string;
  company?: string;
  contactPerson?: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state?: string;
  zip?: string;
  customerType: 'Retail' | 'Wholesale' | 'Corporate' | 'Distributor' | 'B2B Wholesale';
  taxNumber?: string;
  taxId?: string;
  creditLimit: number;
  totalSales?: number;
  outstandingReceivable: number;
  status?: 'active' | 'inactive';
  notes?: string;
  createdAt?: string;
}

export interface PurchaseOrderItem {
  productId: string;
  productName: string;
  sku: string;
  unitCost: number;
  quantity: number;
  receivedQuantity?: number;
  taxRate: number; // e.g. 5, 10, 18
  discount: number; // in percentage or fixed
  total: number;
}

export type POStatus = 'draft' | 'ordered' | 'received' | 'partially_received' | 'cancelled';
export type PaymentStatus = 'unpaid' | 'partial' | 'paid';

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  vendorId: string;
  vendorName: string;
  orderDate: string;
  expectedDate?: string;
  expectedDeliveryDate?: string;
  receivedDate?: string;
  items: PurchaseOrderItem[];
  subtotal: number;
  taxTotal: number;
  discountTotal: number;
  shippingFee: number;
  grandTotal: number;
  status: POStatus;
  paymentStatus: PaymentStatus;
  paidAmount: number;
  paymentMethod?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SalesOrderItem {
  productId: string;
  productName: string;
  sku: string;
  unitPrice: number;
  costPrice: number;
  quantity: number;
  taxRate: number;
  discount: number; // in percentage
  total: number;
  profit?: number;
}

export type SalesOrderStatus = 'draft' | 'confirmed' | 'fulfilled' | 'cancelled';

export interface SalesOrder {
  id: string;
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  customerPhone?: string;
  orderDate: string;
  dueDate: string;
  items: SalesOrderItem[];
  subtotal: number;
  taxTotal: number;
  discountTotal: number;
  shippingFee: number;
  grandTotal: number;
  totalCost: number;
  grossProfit: number;
  status: SalesOrderStatus;
  paymentStatus: PaymentStatus;
  paidAmount: number;
  paymentMethod: 'Cash' | 'Card' | 'Bank Transfer' | 'UPI' | 'Store Credit' | 'Mixed' | string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type MovementType = 
  | 'PURCHASE_RECEIPT'
  | 'SALES_FULFILLMENT'
  | 'ADJUSTMENT_ADD'
  | 'ADJUSTMENT_REDUCE'
  | 'DAMAGE_WRITEOFF'
  | 'CUSTOMER_RETURN'
  | 'VENDOR_RETURN'
  | 'INITIAL_STOCK';

export interface StockMovement {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  type: MovementType;
  quantityChange: number; // e.g. +50, -5
  previousStock: number;
  newStock: number;
  referenceId: string; // PO#, INV#, or ADJ#
  reason: string;
  unitCost?: number;
  performedBy: string;
  timestamp: string;
}

export type PaymentTransactionType = 
  | 'CUSTOMER_PAYMENT' 
  | 'VENDOR_PAYMENT' 
  | 'INFLOW_SALE' 
  | 'OUTFLOW_PURCHASE' 
  | 'CUSTOMER_SETTLEMENT' 
  | 'VENDOR_SETTLEMENT';

export interface Payment {
  id: string;
  type?: 'CUSTOMER_PAYMENT' | 'VENDOR_PAYMENT' | string;
  transactionType?: PaymentTransactionType;
  referenceType?: 'SALES_INVOICE' | 'PURCHASE_ORDER' | 'DIRECT_EXPENSE' | 'DIRECT_INCOME' | string;
  referenceId?: string; // Invoice number or PO number
  partyType?: 'customer' | 'vendor' | 'other';
  partyId?: string;
  partyName?: string;
  entityName?: string;
  amount: number;
  paymentMethod: 'Cash' | 'Card' | 'Bank Transfer' | 'UPI' | 'Cheque' | 'Store Credit' | string;
  paymentDate: string;
  referenceNumber?: string; // Cheque number, Bank transaction ID
  notes?: string;
  recordedAt?: string;
}

export type PaymentRecord = Payment;

export interface BusinessProfile {
  companyName: string;
  tagline: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  taxRegistrationNumber: string; // GST/VAT/EIN
  currencySymbol: string;
  currencyCode: string;
  defaultTaxRate: number;
  invoiceFooterNote: string;
}

export type UserRole = 'admin' | 'sales_cashier' | 'inventory_manager' | 'accountant';

export interface AppUser {
  id: string;
  username: string;
  fullName: string;
  email?: string;
  phone?: string;
  role: UserRole;
  status: 'active' | 'inactive';
  password?: string;
  pin?: string;
  avatarColor?: string;
  lastLogin?: string;
  createdAt: string;
}

export type ActiveTab = 
  | 'dashboard'
  | 'products'
  | 'categories'
  | 'inventory'
  | 'inventory_movements'
  | 'sales'
  | 'pos'
  | 'purchases'
  | 'customers'
  | 'vendors'
  | 'payments'
  | 'reports'
  | 'settings';

