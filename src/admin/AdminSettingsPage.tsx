import React, { useEffect, useState } from 'react';
import { Save } from 'lucide-react';
import { AdminLayout } from '../layouts/AdminLayout';
import { api } from '../services/api';
import { useLang } from '../context/LangContext';
import { MahallaSettings } from '../types';

export function AdminSettingsPage() {
  const { tx } = useLang();
  const [form, setForm] = useState<MahallaSettings | null>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    api.get<{ settings: MahallaSettings }>('/settings').then((r) => setForm(r.data.settings));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;
    setSaving(true);
    setMsg('');
    try {
      const res = await api.put<{ settings: MahallaSettings }>('/settings', form);
      setForm(res.data.settings);
      setMsg(tx('Mahalla sozlamalari muvaffaqiyatli yangilandi!'));
    } finally {
      setSaving(false);
    }
  };

  if (!form) {
    return (
      <AdminLayout title="Sozlamalar">
        <div className="p-8 text-sm text-[#718096]">{tx('Yuklanmoqda...')}</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Sozlamalar">
      <form onSubmit={handleSave} className="space-y-6 max-w-4xl">
        {msg && (
          <div className="p-4 rounded-xl bg-[#E8F7F0] border border-[#BCE8D4] text-sm font-medium text-[#064B3C]">
            {msg}
          </div>
        )}

        <div className="bg-white rounded-2xl border border-[#E5ECE8] p-6 space-y-4">
          <h2 className="text-base font-bold text-[#17212B]">
            {tx('Yagona mahalla asosiy sozlamalari')}
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold mb-1">{tx('Mahalla nomi')}</label>
              <input
                type="text"
                value={form.mahalla_name}
                onChange={(e) => setForm({ ...form, mahalla_name: e.target.value })}
                className="w-full px-3.5 py-2.5 border border-[#E5ECE8] rounded-xl text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">{tx('Aholi soni')}</label>
              <input
                type="number"
                value={form.population_count}
                onChange={(e) => setForm({ ...form, population_count: Number(e.target.value) })}
                className="w-full px-3.5 py-2.5 border border-[#E5ECE8] rounded-xl text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1">{tx('Bosh sahifa shiori')}</label>
            <input
              type="text"
              value={form.tagline}
              onChange={(e) => setForm({ ...form, tagline: e.target.value })}
              className="w-full px-3.5 py-2.5 border border-[#E5ECE8] rounded-xl text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1">
              {tx("Bosh sahifa e'lonlar paneli matni")}
            </label>
            <input
              type="text"
              value={form.banner_text}
              onChange={(e) => setForm({ ...form, banner_text: e.target.value })}
              className="w-full px-3.5 py-2.5 border border-[#E5ECE8] rounded-xl text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1">{tx('Mahalla tarixi')}</label>
            <textarea
              rows={3}
              value={form.history}
              onChange={(e) => setForm({ ...form, history: e.target.value })}
              className="w-full px-3.5 py-2.5 border border-[#E5ECE8] rounded-xl text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1">{tx('Mahalla faoliyati')}</label>
            <textarea
              rows={2}
              value={form.activities}
              onChange={(e) => setForm({ ...form, activities: e.target.value })}
              className="w-full px-3.5 py-2.5 border border-[#E5ECE8] rounded-xl text-sm"
            />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#E5ECE8] p-6 space-y-4">
          <h2 className="text-base font-bold text-[#17212B]">
            {tx('Mahalla raisi va aloqa ma’lumotlari')}
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold mb-1">{tx('Mahalla raisi F.I.O.')}</label>
              <input
                type="text"
                value={form.chairman_name}
                onChange={(e) => setForm({ ...form, chairman_name: e.target.value })}
                className="w-full px-3.5 py-2.5 border border-[#E5ECE8] rounded-xl text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">{tx('Rais telefoni')}</label>
              <input
                type="text"
                value={form.chairman_phone}
                onChange={(e) => setForm({ ...form, chairman_phone: e.target.value })}
                className="w-full px-3.5 py-2.5 border border-[#E5ECE8] rounded-xl text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1">{tx('Mahalla raisi haqida')}</label>
            <textarea
              rows={2}
              value={form.chairman_bio}
              onChange={(e) => setForm({ ...form, chairman_bio: e.target.value })}
              className="w-full px-3.5 py-2.5 border border-[#E5ECE8] rounded-xl text-sm"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold mb-1">{tx('Umumiy telefon')}</label>
              <input
                type="text"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full px-3.5 py-2.5 border border-[#E5ECE8] rounded-xl text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">{tx('Email')}</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full px-3.5 py-2.5 border border-[#E5ECE8] rounded-xl text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">{tx('Manzil')}</label>
              <input
                type="text"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                className="w-full px-3.5 py-2.5 border border-[#E5ECE8] rounded-xl text-sm"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#078A59] hover:bg-[#064B3C] text-white text-sm font-semibold transition-colors"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? '...' : tx('Sozlamalarni saqlash')}</span>
          </button>
        </div>
      </form>
    </AdminLayout>
  );
}
