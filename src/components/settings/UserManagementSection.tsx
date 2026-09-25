import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { AppUser, UserRole } from '../../types';
import { 
  UserPlus, 
  ShieldCheck, 
  ShoppingCart, 
  Boxes, 
  Receipt, 
  KeyRound, 
  Edit3, 
  Trash2, 
  CheckCircle2, 
  XCircle, 
  UserCheck, 
  Lock, 
  Phone, 
  Mail, 
  Check, 
  AlertTriangle,
  LogIn,
  Info,
  Shield,
  Eye,
  EyeOff
} from 'lucide-react';

export const UserManagementSection: React.FC = () => {
  const { 
    users, 
    currentUser, 
    createUser, 
    updateUser, 
    deleteUser, 
    resetUserPassword, 
    toggleUserStatus,
    switchUser 
  } = useApp();

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AppUser | null>(null);
  const [passwordResetUser, setPasswordResetUser] = useState<AppUser | null>(null);
  const [deleteConfirmUser, setDeleteConfirmUser] = useState<AppUser | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Form states for Add User
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<UserRole>('sales_cashier');
  const [password, setPassword] = useState('');
  const [pin, setPin] = useState('1234');
  const [status, setStatus] = useState<'active' | 'inactive'>('active');

  // Form states for Reset Password
  const [newPassword, setNewPassword] = useState('');
  const [newPin, setNewPin] = useState('');
  const [showPass, setShowPass] = useState(false);

  const getRoleIcon = (userRole: UserRole) => {
    switch (userRole) {
      case 'admin':
        return <ShieldCheck className="w-4 h-4 text-amber-600" />;
      case 'sales_cashier':
        return <ShoppingCart className="w-4 h-4 text-emerald-600" />;
      case 'inventory_manager':
        return <Boxes className="w-4 h-4 text-blue-600" />;
      case 'accountant':
        return <Receipt className="w-4 h-4 text-purple-600" />;
      default:
        return <Shield className="w-4 h-4 text-stone-600" />;
    }
  };

  const getRoleBadge = (userRole: UserRole) => {
    switch (userRole) {
      case 'admin':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
            Admin (Full Access)
          </span>
        );
      case 'sales_cashier':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <ShoppingCart className="w-3.5 h-3.5 text-emerald-600" />
            Sales & POS Cashier
          </span>
        );
      case 'inventory_manager':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-800 border border-blue-200">
            <Boxes className="w-3.5 h-3.5 text-blue-600" />
            Storekeeper / Inventory
          </span>
        );
      case 'accountant':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-800 border border-purple-200">
            <Receipt className="w-3.5 h-3.5 text-purple-600" />
            Accountant / Finance
          </span>
        );
    }
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);

    const cleanUsername = username.trim().toLowerCase();
    if (!cleanUsername) {
      setActionError('Username is required.');
      return;
    }

    if (users.some((u) => u.username.toLowerCase() === cleanUsername)) {
      setActionError(`Username "${cleanUsername}" is already taken.`);
      return;
    }

    createUser({
      fullName: fullName.trim(),
      username: cleanUsername,
      email: email.trim() || undefined,
      phone: phone.trim() || undefined,
      role,
      password: password.trim(),
      pin: pin.trim() || undefined,
      status,
    });

    setActionSuccess(`User "${fullName}" added successfully!`);
    setIsAddModalOpen(false);
    // Reset form
    setFullName('');
    setUsername('');
    setEmail('');
    setPhone('');
    setPassword('');
    setPin('1234');
    setRole('sales_cashier');
    setTimeout(() => setActionSuccess(null), 4000);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setActionError(null);

    const cleanUsername = editingUser.username.trim().toLowerCase();
    if (users.some((u) => u.id !== editingUser.id && u.username.toLowerCase() === cleanUsername)) {
      setActionError(`Username "${cleanUsername}" is already taken.`);
      return;
    }

    updateUser(editingUser.id, {
      fullName: editingUser.fullName.trim(),
      username: cleanUsername,
      email: editingUser.email?.trim() || undefined,
      phone: editingUser.phone?.trim() || undefined,
      role: editingUser.role,
      status: editingUser.status,
    });

    setActionSuccess(`User "${editingUser.fullName}" updated successfully!`);
    setEditingUser(null);
    setTimeout(() => setActionSuccess(null), 4000);
  };

  const handlePasswordResetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordResetUser) return;

    if (!newPassword && !newPin) {
      setActionError('Please enter at least a new password or a new PIN.');
      return;
    }

    resetUserPassword(
      passwordResetUser.id,
      newPassword.trim() || undefined,
      newPin.trim() || undefined
    );

    setActionSuccess(`Credentials updated for "${passwordResetUser.fullName}"!`);
    setPasswordResetUser(null);
    setNewPassword('');
    setNewPin('');
    setTimeout(() => setActionSuccess(null), 4000);
  };

  const handleDeleteConfirm = () => {
    if (!deleteConfirmUser) return;
    const res = deleteUser(deleteConfirmUser.id);
    if (!res.success) {
      setActionError(res.error || 'Failed to delete user.');
    } else {
      setActionSuccess(`User account removed.`);
      setTimeout(() => setActionSuccess(null), 4000);
    }
    setDeleteConfirmUser(null);
  };

  return (
    <div className="space-y-6">
      {/* Alert Notices */}
      {actionSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="font-medium">{actionSuccess}</span>
          </div>
          <button onClick={() => setActionSuccess(null)} className="text-emerald-700 hover:text-emerald-900 text-xs font-semibold">
            Dismiss
          </button>
        </div>
      )}

      {actionError && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
            <span className="font-medium">{actionError}</span>
          </div>
          <button onClick={() => setActionError(null)} className="text-rose-700 hover:text-rose-900 text-xs font-semibold">
            Dismiss
          </button>
        </div>
      )}

      {/* Header and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white border border-stone-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck className="w-5 h-5 text-emerald-700" />
            <h3 className="text-lg font-bold text-stone-900 tracking-tight">
              User Accounts & Role Permissions (प्रयोगकर्ता व्यवस्थापन)
            </h3>
          </div>
          <p className="text-sm text-stone-600">
            Control employee logins, assign role-based access, configure POS PINs, and switch user accounts.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setActionError(null);
            setIsAddModalOpen(true);
          }}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-semibold shadow-xs transition cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add New User (नयाँ प्रयोगकर्ता)</span>
        </button>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-stone-50 border-b border-stone-200 text-xs font-semibold text-stone-600 uppercase tracking-wider">
                <th className="py-3.5 px-4 sm:px-6">Staff Member</th>
                <th className="py-3.5 px-4">Username & Contact</th>
                <th className="py-3.5 px-4">Assigned Role</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4">Last Login</th>
                <th className="py-3.5 px-4 sm:px-6 text-right">Admin Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {users.map((u) => {
                const isCurrent = currentUser?.id === u.id;
                return (
                  <tr key={u.id} className={`hover:bg-stone-50/80 transition ${isCurrent ? 'bg-emerald-50/30' : ''}`}>
                    {/* User Identity */}
                    <td className="py-3.5 px-4 sm:px-6">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-xs shrink-0"
                          style={{ backgroundColor: u.avatarColor || '#3E4A3D' }}
                        >
                          {u.fullName.charAt(0)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-stone-900">{u.fullName}</span>
                            {isCurrent && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                YOU (Active Session)
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-stone-500 font-mono">ID: {u.id}</span>
                        </div>
                      </div>
                    </td>

                    {/* Username & Contact */}
                    <td className="py-3.5 px-4">
                      <div className="space-y-0.5">
                        <div className="font-medium text-stone-800 font-mono text-xs">
                          @{u.username}
                        </div>
                        {u.email && (
                          <div className="text-xs text-stone-500 flex items-center gap-1">
                            <Mail className="w-3 h-3 text-stone-400" />
                            {u.email}
                          </div>
                        )}
                        {u.phone && (
                          <div className="text-xs text-stone-500 flex items-center gap-1">
                            <Phone className="w-3 h-3 text-stone-400" />
                            {u.phone}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Role Badge */}
                    <td className="py-3.5 px-4">
                      {getRoleBadge(u.role)}
                    </td>

                    {/* Status Toggle */}
                    <td className="py-3.5 px-4 text-center">
                      {isCurrent ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
                          <Check className="w-3.5 h-3.5" /> Active
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => toggleUserStatus(u.id)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold transition cursor-pointer ${
                            u.status === 'active'
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                              : 'bg-stone-200 text-stone-600 hover:bg-stone-300'
                          }`}
                          title="Click to toggle status"
                        >
                          {u.status === 'active' ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Active
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3.5 h-3.5 text-stone-500" /> Inactive
                            </>
                          )}
                        </button>
                      )}
                    </td>

                    {/* Last Login */}
                    <td className="py-3.5 px-4 text-xs text-stone-600">
                      {u.lastLogin || 'Never'}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 sm:px-6 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Switch to this user */}
                        {!isCurrent && u.status === 'active' && (
                          <button
                            type="button"
                            onClick={() => switchUser(u.id)}
                            className="p-1.5 text-stone-600 hover:text-emerald-700 hover:bg-stone-100 rounded-lg transition"
                            title="Switch session to this user (Test View)"
                          >
                            <LogIn className="w-4 h-4" />
                          </button>
                        )}

                        {/* Reset Password */}
                        <button
                          type="button"
                          onClick={() => {
                            setActionError(null);
                            setPasswordResetUser(u);
                            setNewPassword(u.password || '');
                            setNewPin(u.pin || '');
                          }}
                          className="p-1.5 text-stone-600 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition"
                          title="Reset Password & PIN"
                        >
                          <KeyRound className="w-4 h-4" />
                        </button>

                        {/* Edit User */}
                        <button
                          type="button"
                          onClick={() => {
                            setActionError(null);
                            setEditingUser({ ...u });
                          }}
                          className="p-1.5 text-stone-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition"
                          title="Edit User Details"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>

                        {/* Delete User */}
                        {!isCurrent && (
                          <button
                            type="button"
                            onClick={() => {
                              setActionError(null);
                              setDeleteConfirmUser(u);
                            }}
                            className="p-1.5 text-stone-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition"
                            title="Delete User"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Role Permission Matrix Card */}
      <div className="p-6 rounded-2xl bg-stone-50 border border-stone-200">
        <div className="flex items-center gap-2 mb-3">
          <Info className="w-5 h-5 text-stone-700" />
          <h4 className="font-bold text-stone-900 text-sm">
            Role-Based Access Control (RBAC) Matrix
          </h4>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
          <div className="p-4 rounded-xl bg-white border border-stone-200 shadow-xs">
            <div className="flex items-center gap-2 mb-2">
              <ShieldCheck className="w-4 h-4 text-amber-600" />
              <span className="font-bold text-stone-900 text-xs uppercase tracking-wider">Admin</span>
            </div>
            <p className="text-xs text-stone-600 leading-relaxed">
              Full control over all 12 modules, staff management, system settings, category creation, database backup & reset.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-white border border-stone-200 shadow-xs">
            <div className="flex items-center gap-2 mb-2">
              <ShoppingCart className="w-4 h-4 text-emerald-600" />
              <span className="font-bold text-stone-900 text-xs uppercase tracking-wider">Sales & Cashier</span>
            </div>
            <p className="text-xs text-stone-600 leading-relaxed">
              POS Terminal checkout, Sales Invoices, Customer ledger entries, Product catalogue search.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-white border border-stone-200 shadow-xs">
            <div className="flex items-center gap-2 mb-2">
              <Boxes className="w-4 h-4 text-blue-600" />
              <span className="font-bold text-stone-900 text-xs uppercase tracking-wider">Storekeeper</span>
            </div>
            <p className="text-xs text-stone-600 leading-relaxed">
              Direct Purchases (खरिद), Stock adjustments, Inventory movements, Product master data, Vendor directory.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-white border border-stone-200 shadow-xs">
            <div className="flex items-center gap-2 mb-2">
              <Receipt className="w-4 h-4 text-purple-600" />
              <span className="font-bold text-stone-900 text-xs uppercase tracking-wider">Accountant</span>
            </div>
            <p className="text-xs text-stone-600 leading-relaxed">
              Cash & bank settlements, Customer collections, Vendor payouts, Financial P&L and sales reporting.
            </p>
          </div>
        </div>
      </div>

      {/* ADD USER MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-lg bg-white rounded-2xl border border-stone-200 shadow-2xl p-6 relative my-8">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
                  <UserPlus className="w-4 h-4" />
                </div>
                <h3 className="text-lg font-bold text-stone-900">Add New Staff User (नयाँ प्रयोगकर्ता)</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                  Full Name (पूरा नाम) *
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  placeholder="e.g. Ramesh Thapa"
                  className="w-full px-3.5 py-2 rounded-xl border border-stone-300 text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-600 text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                    Username *
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    placeholder="e.g. ramesh.store"
                    className="w-full px-3.5 py-2 rounded-xl border border-stone-300 text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-600 text-sm font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                    Operational Role (पद) *
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                    className="w-full px-3.5 py-2 rounded-xl border border-stone-300 text-stone-900 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 text-sm"
                  >
                    <option value="admin">👑 Administrator (Full Control)</option>
                    <option value="sales_cashier">🛒 Sales & POS Cashier</option>
                    <option value="inventory_manager">📦 Storekeeper / Inventory</option>
                    <option value="accountant">💼 Accountant / Finance</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                    Password (पासवर्ड) *
                  </label>
                  <input
                    type="text"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="e.g. store123"
                    className="w-full px-3.5 py-2 rounded-xl border border-stone-300 text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-600 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                    Quick 4-Digit POS PIN
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    placeholder="e.g. 3333"
                    className="w-full px-3.5 py-2 rounded-xl border border-stone-300 text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-600 text-sm font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="staff@store.com.np"
                    className="w-full px-3.5 py-2 rounded-xl border border-stone-300 text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-600 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                    Phone / Mobile (फोन)
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+977-9800000000"
                    className="w-full px-3.5 py-2 rounded-xl border border-stone-300 text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-600 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                  Account Status
                </label>
                <div className="flex items-center gap-4 mt-1">
                  <label className="flex items-center gap-2 text-sm text-stone-700 cursor-pointer">
                    <input
                      type="radio"
                      name="status"
                      value="active"
                      checked={status === 'active'}
                      onChange={() => setStatus('active')}
                      className="text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>Active (सक्रिय)</span>
                  </label>
                  <label className="flex items-center gap-2 text-sm text-stone-700 cursor-pointer">
                    <input
                      type="radio"
                      name="status"
                      value="inactive"
                      checked={status === 'inactive'}
                      onChange={() => setStatus('inactive')}
                      className="text-stone-600 focus:ring-stone-500"
                    />
                    <span>Inactive (निष्क्रिय)</span>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-stone-300 text-stone-700 hover:bg-stone-50 text-sm font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-semibold shadow-xs transition"
                >
                  Save & Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT USER MODAL */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-lg bg-white rounded-2xl border border-stone-200 shadow-2xl p-6 relative my-8">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center">
                  <Edit3 className="w-4 h-4" />
                </div>
                <h3 className="text-lg font-bold text-stone-900">Edit User Details ({editingUser.fullName})</h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                  Full Name (पूरा नाम) *
                </label>
                <input
                  type="text"
                  value={editingUser.fullName}
                  onChange={(e) => setEditingUser({ ...editingUser, fullName: e.target.value })}
                  required
                  className="w-full px-3.5 py-2 rounded-xl border border-stone-300 text-stone-900 focus:outline-none focus:ring-2 focus:ring-blue-600 text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                    Username *
                  </label>
                  <input
                    type="text"
                    value={editingUser.username}
                    onChange={(e) => setEditingUser({ ...editingUser, username: e.target.value })}
                    required
                    className="w-full px-3.5 py-2 rounded-xl border border-stone-300 text-stone-900 focus:outline-none focus:ring-2 focus:ring-blue-600 text-sm font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                    Role (पद) *
                  </label>
                  <select
                    value={editingUser.role}
                    onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value as UserRole })}
                    className="w-full px-3.5 py-2 rounded-xl border border-stone-300 text-stone-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 text-sm"
                  >
                    <option value="admin">👑 Administrator (Full Control)</option>
                    <option value="sales_cashier">🛒 Sales & POS Cashier</option>
                    <option value="inventory_manager">📦 Storekeeper / Inventory</option>
                    <option value="accountant">💼 Accountant / Finance</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={editingUser.email || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-stone-300 text-stone-900 focus:outline-none focus:ring-2 focus:ring-blue-600 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                    Phone / Mobile
                  </label>
                  <input
                    type="text"
                    value={editingUser.phone || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, phone: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-stone-300 text-stone-900 focus:outline-none focus:ring-2 focus:ring-blue-600 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                  Account Status
                </label>
                <div className="flex items-center gap-4 mt-1">
                  <label className="flex items-center gap-2 text-sm text-stone-700 cursor-pointer">
                    <input
                      type="radio"
                      name="edit-status"
                      value="active"
                      checked={editingUser.status === 'active'}
                      onChange={() => setEditingUser({ ...editingUser, status: 'active' })}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span>Active (सक्रिय)</span>
                  </label>
                  <label className="flex items-center gap-2 text-sm text-stone-700 cursor-pointer">
                    <input
                      type="radio"
                      name="edit-status"
                      value="inactive"
                      checked={editingUser.status === 'inactive'}
                      onChange={() => setEditingUser({ ...editingUser, status: 'inactive' })}
                      className="text-stone-600 focus:ring-stone-500"
                    />
                    <span>Inactive (निष्क्रिय)</span>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 rounded-xl border border-stone-300 text-stone-700 hover:bg-stone-50 text-sm font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-sm font-semibold shadow-xs transition"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RESET PASSWORD / PIN MODAL */}
      {passwordResetUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-md bg-white rounded-2xl border border-stone-200 shadow-2xl p-6 relative my-8">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center">
                  <KeyRound className="w-4 h-4" />
                </div>
                <h3 className="text-lg font-bold text-stone-900">Reset Password & PIN</h3>
              </div>
              <button
                type="button"
                onClick={() => setPasswordResetUser(null)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-stone-600 mb-4">
              Updating credentials for <strong>{passwordResetUser.fullName}</strong> (@{passwordResetUser.username}).
            </p>

            <form onSubmit={handlePasswordResetSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                  New Password (नयाँ पासवर्ड)
                </label>
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    className="w-full pl-3.5 pr-10 py-2 rounded-xl border border-stone-300 text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-600 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-stone-400 hover:text-stone-600"
                  >
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                  New 4-Digit POS PIN
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value)}
                  placeholder="e.g. 1234"
                  className="w-full px-3.5 py-2 rounded-xl border border-stone-300 text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-600 text-sm font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setPasswordResetUser(null)}
                  className="px-4 py-2 rounded-xl border border-stone-300 text-stone-700 hover:bg-stone-50 text-sm font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-700 hover:bg-amber-800 text-white text-sm font-semibold shadow-xs transition"
                >
                  Update Credentials
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteConfirmUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-2xl border border-stone-200 shadow-2xl p-6 relative">
            <div className="flex items-center gap-3 mb-3 text-rose-700">
              <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-stone-900">Delete User Account?</h3>
                <p className="text-xs text-stone-500">This action cannot be undone.</p>
              </div>
            </div>

            <p className="text-sm text-stone-600 mb-5 leading-relaxed">
              Are you sure you want to permanently delete the staff profile for <strong>{deleteConfirmUser.fullName}</strong> (@{deleteConfirmUser.username})?
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmUser(null)}
                className="px-4 py-2 rounded-xl border border-stone-300 text-stone-700 hover:bg-stone-50 text-sm font-semibold transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                className="px-5 py-2 rounded-xl bg-rose-700 hover:bg-rose-800 text-white text-sm font-semibold shadow-xs transition"
              >
                Yes, Delete User
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
