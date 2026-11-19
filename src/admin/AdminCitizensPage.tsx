import React, { useEffect, useState } from 'react';
import { Search, ShieldCheck, Ban, CheckCircle, Pencil, X } from 'lucide-react';
import { AdminLayout } from '../layouts/AdminLayout';
import { api } from '../services/api';
import { useLang } from '../context/LangContext';
import { useAuth } from '../context/AuthContext';
import { formatUzDate } from '../components/StatusLabel';

interface CitizenRow {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
  address: string;
  house_number: string;
  is_active: number;
  created_at: string;
  roles: string[];
  roles_display: string;
}

export function AdminCitizensPage() {
  const { tx } = useLang();
  const { isAdmin } = useAuth();
  const [users, setUsers] = useState<CitizenRow[]>([]);
  const [q, setQ] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  const [editUser, setEditUser] = useState<CitizenRow | null>(null);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [houseNumber, setHouseNumber] = useState('');

  const loadUsers = () => {
    setLoading(true);
    api
      .get<{ users: CitizenRow[] }>('/admin/users', {
        params: { q, role: roleFilter, status: statusFilter },
      })
      .then((res) => setUsers(res.data.users))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadUsers();
  }, [q, roleFilter, statusFilter]);

  const toggleActive = async (u: CitizenRow) => {
    await api.put(`/admin/users/${u.id}`, { is_active: !u.is_active });
    loadUsers();
  };

  const openEdit = (u: CitizenRow) => {
    setEditUser(u);
    setFirstName(u.first_name);
    setLastName(u.last_name);
    setPhone(u.phone);
    setAddress(u.address || '');
    setHouseNumber(u.house_number || '');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editUser) return;
    await api.put(`/admin/users/${editUser.id}`, {
      first_name: firstName,
      last_name: lastName,
      phone,
      address,
      house_number: houseNumber,
    });
    setEditUser(null);
    loadUsers();
  };

  return (
    <AdminLayout title="Aholi">
      <div className="space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-[#718096] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={tx("Ism, telefon yoki email bo'yicha qidirish...")}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#E5ECE8] rounded-xl text-xs outline-none focus:border-[#078A59]"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3.5 py-2.5 bg-white border border-[#E5ECE8] rounded-xl text-xs font-semibold outline-none"
            >
              <option value="all">{tx('Barcha rollar')}</option>
              <option value="fuqaro">{tx('Fuqaro')}</option>
              <option value="masul_xodim">{tx("Mas'ul xodim")}</option>
              <option value="mahalla_raisi">{tx('Mahalla raisi')}</option>
              <option value="super_admin">Super Admin</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3.5 py-2.5 bg-white border border-[#E5ECE8] rounded-xl text-xs font-semibold outline-none"
            >
              <option value="all">{tx('Barcha holatlar')}</option>
              <option value="active">{tx('Faol')}</option>
              <option value="blocked">{tx('Bloklangan')}</option>
            </select>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#E5ECE8] overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-sm text-[#718096]">{tx('Yuklanmoqda...')}</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#F5F8FA] text-xs font-semibold text-[#718096] border-b border-[#E5ECE8]">
                    <th className="py-3.5 px-4">ID</th>
                    <th className="py-3.5 px-4">{tx('Ism va familiya')}</th>
                    <th className="py-3.5 px-4">{tx('Login')}</th>
                    <th className="py-3.5 px-4">{tx('Telefon')}</th>
                    <th className="py-3.5 px-4">{tx('Manzil / Uy')}</th>
                    <th className="py-3.5 px-4">{tx('Rol')}</th>
                    <th className="py-3.5 px-4">{tx("Ro'yxatdan o'tgan")}</th>
                    <th className="py-3.5 px-4">{tx('Holat')}</th>
                    {isAdmin && <th className="py-3.5 px-4 text-right">{tx('Amallar')}</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5ECE8] text-sm">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-[#F5F8FA]">
                      <td className="py-3.5 px-4 font-mono text-xs text-[#718096] tabular-nums">
                        #{u.id}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-[#17212B]">
                        {[u.first_name, u.last_name].filter(Boolean).join(' ') || u.username || '—'}
                      </td>
                      <td className="py-3.5 px-4 text-xs font-mono text-[#064B3C]">
                        {u.username || '—'}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-[#17212B] tabular-nums">{u.phone || '—'}</td>
                      <td className="py-3.5 px-4 text-xs text-[#718096]">
                        {[u.address, u.house_number].filter(Boolean).join(', ') || '—'}
                      </td>
                      <td className="py-3.5 px-4 text-xs">
                        <span className="inline-flex items-center gap-1 font-medium text-[#064B3C]">
                          <ShieldCheck className="w-3.5 h-3.5 text-[#078A59]" />
                          {tx(u.roles_display || 'Fuqaro')}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-[#718096] tabular-nums">
                        {formatUzDate(u.created_at)}
                      </td>
                      <td className="py-3.5 px-4 text-xs">
                        {u.is_active ? (
                          <span className="text-[#078A59] font-semibold">{tx('Faol')}</span>
                        ) : (
                          <span className="text-red-600 font-semibold">{tx('Bloklangan')}</span>
                        )}
                      </td>
                      {isAdmin && (
                        <td className="py-3.5 px-4 text-right space-x-1 whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => openEdit(u)}
                            className="p-2 rounded-lg text-[#078A59] hover:bg-[#E8F7F0]"
                            title="Tahrirlash"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleActive(u)}
                            className={`p-2 rounded-lg ${
                              u.is_active
                                ? 'text-amber-600 hover:bg-amber-50'
                                : 'text-[#078A59] hover:bg-[#E8F7F0]'
                            }`}
                            title={u.is_active ? 'Bloklash' : 'Faollashtirish'}
                          >
                            {u.is_active ? (
                              <Ban className="w-4 h-4" />
                            ) : (
                              <CheckCircle className="w-4 h-4" />
                            )}
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {editUser && (
        <div className="fixed inset-0 z-50 bg-black/45 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-2xl border border-[#E5ECE8] shadow-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-[#E5ECE8] flex items-center justify-between">
              <h3 className="text-base font-bold">{tx("Foydalanuvchi ma'lumotlari")}</h3>
              <button type="button" onClick={() => setEditUser(null)} className="p-1 text-[#718096]">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1">{tx('Ism')}</label>
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full px-3 py-2 border border-[#E5ECE8] rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">{tx('Familiya')}</label>
                  <input
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full px-3 py-2 border border-[#E5ECE8] rounded-xl text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">{tx('Telefon')}</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 border border-[#E5ECE8] rounded-xl text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">{tx("Ko'cha / manzil")}</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3 py-2 border border-[#E5ECE8] rounded-xl text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">{tx('Uy / xonadon raqami')}</label>
                <input
                  type="text"
                  value={houseNumber}
                  onChange={(e) => setHouseNumber(e.target.value)}
                  className="w-full px-3 py-2 border border-[#E5ECE8] rounded-xl text-sm"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditUser(null)}
                  className="px-4 py-2 rounded-xl border border-[#E5ECE8] text-xs font-semibold"
                >
                  {tx('Bekor qilish')}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#078A59] text-white text-xs font-semibold"
                >
                  {tx('Saqlash')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
