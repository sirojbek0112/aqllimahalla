import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, X, Send, UserCheck } from 'lucide-react';
import { AdminLayout } from '../layouts/AdminLayout';
import { api } from '../services/api';
import { useLang } from '../context/LangContext';
import { AppealStatusText, formatUzDateTime } from '../components/StatusLabel';
import { AppealHistoryItem, AppealItem, AppealResponse, AppealStatus } from '../types';

export function AdminAppealsPage() {
  const { t, tx } = useLang();
  const [searchParams] = useSearchParams();
  const [items, setItems] = useState<AppealItem[]>([]);
  const [staff, setStaff] = useState<Array<{ id: number; first_name: string; last_name: string; role_label: string }>>([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Selected appeal detail modal
  const [selected, setSelected] = useState<{
    appeal: AppealItem;
    responses: AppealResponse[];
    history: AppealHistoryItem[];
  } | null>(null);
  const [newStatus, setNewStatus] = useState<AppealStatus>('korib_chiqilmoqda');
  const [assignedTo, setAssignedTo] = useState<string>('');
  const [responseText, setResponseText] = useState('');
  const [saving, setSaving] = useState(false);

  const loadAppeals = () => {
    setLoading(true);
    api
      .get<{ items: AppealItem[] }>('/appeals', {
        params: { status: statusFilter, q: query },
      })
      .then((res) => setItems(res.data.items))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    api.get('/admin/dashboard').then((r) => setStaff(r.data.staffUsers || [])).catch(() => {});
  }, []);

  useEffect(() => {
    loadAppeals();
  }, [statusFilter, query]);

  useEffect(() => {
    const idParam = Number(searchParams.get('id') || 0);
    if (idParam) openDetail(idParam);
  }, [searchParams]);

  const openDetail = async (id: number) => {
    const res = await api.get<{
      appeal: AppealItem;
      responses: AppealResponse[];
      history: AppealHistoryItem[];
    }>(`/appeals/${id}`);
    setSelected(res.data);
    setNewStatus(res.data.appeal.status);
    setAssignedTo(res.data.appeal.assigned_to ? String(res.data.appeal.assigned_to) : '');
    setResponseText('');
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) return;
    setSaving(true);
    try {
      await api.put(`/appeals/${selected.appeal.id}/status`, {
        status: newStatus,
        assigned_to: assignedTo ? Number(assignedTo) : null,
        response_text: responseText,
      });
      await openDetail(selected.appeal.id);
      loadAppeals();
    } finally {
      setSaving(false);
    }
  };

  const statuses: Array<{ value: string; label: string }> = [
    { value: 'all', label: t('all') },
    { value: 'yangi', label: t('statusYangi') },
    { value: 'korib_chiqilmoqda', label: t('statusKorib') },
    { value: 'jarayonda', label: t('statusJarayonda') },
    { value: 'javob_berildi', label: t('statusJavob') },
    { value: 'yopildi', label: t('statusYopildi') },
  ];

  return (
    <AdminLayout title="Murojaatlar">
      <div className="space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            {statuses.map((s) => (
              <button
                key={s.value}
                type="button"
                onClick={() => setStatusFilter(s.value)}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors ${
                  statusFilter === s.value
                    ? 'bg-[#078A59] text-white'
                    : 'bg-white border border-[#E5ECE8] text-[#17212B]'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-[#718096] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={tx("Raqam yoki mavzu bo'yicha qidirish...")}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#E5ECE8] rounded-xl text-xs outline-none focus:border-[#078A59]"
            />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#E5ECE8] overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-sm text-[#718096]">{t('loading')}</div>
          ) : items.length === 0 ? (
            <div className="p-10 text-center text-sm text-[#718096]">{t('noData')}</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#F5F8FA] text-xs font-semibold text-[#718096] border-b border-[#E5ECE8]">
                    <th className="py-3.5 px-4">№</th>
                    <th className="py-3.5 px-4">{tx('Mavzu')}</th>
                    <th className="py-3.5 px-4">{tx('Fuqaro')}</th>
                    <th className="py-3.5 px-4">{tx('Kategoriya')}</th>
                    <th className="py-3.5 px-4">{tx("Mas'ul")}</th>
                    <th className="py-3.5 px-4">{tx('Holat')}</th>
                    <th className="py-3.5 px-4">{tx('Sana')}</th>
                    <th className="py-3.5 px-4 text-right">{tx('Batafsil')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5ECE8] text-sm">
                  {items.map((a) => (
                    <tr key={a.id} className="hover:bg-[#F5F8FA]">
                      <td className="py-3.5 px-4 font-mono text-xs text-[#718096] tabular-nums">
                        {a.tracking_number}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-[#17212B] max-w-[200px] truncate">
                        {tx(a.subject)}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-[#17212B]">
                        <div>{tx(a.citizen_name || '')}</div>
                        <div className="text-[#718096] tabular-nums">{a.citizen_phone}</div>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-[#718096]">{tx(a.category_name)}</td>
                      <td className="py-3.5 px-4 text-xs text-[#718096]">
                        {tx(a.assigned_name || 'Biriktirilmagan')}
                      </td>
                      <td className="py-3.5 px-4">
                        <AppealStatusText status={a.status} />
                      </td>
                      <td className="py-3.5 px-4 text-xs text-[#718096] tabular-nums whitespace-nowrap">
                        {formatUzDateTime(a.created_at)}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => openDetail(a.id)}
                          className="px-3 py-1.5 rounded-lg bg-[#E8F7F0] text-[#064B3C] hover:bg-[#078A59] hover:text-white text-xs font-semibold transition-colors"
                        >
                          {tx("Ko'rish")}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Appeal Inspection & Response Modal */}
      {selected && (
        <div
          className="fixed inset-0 z-50 bg-black/45 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setSelected(null)}
        >
          <div
            className="w-full max-w-2xl bg-white rounded-2xl border border-[#E5ECE8] shadow-xl max-h-[90vh] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-[#E5ECE8] flex items-center justify-between">
              <div>
                <span className="font-mono text-xs font-bold text-[#078A59]">
                  {selected.appeal.tracking_number}
                </span>
                <h3 className="text-base font-bold text-[#17212B]">
                  {tx(selected.appeal.subject)}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="p-1.5 rounded-lg text-[#718096] hover:bg-[#F5F8FA]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-5">
              <div className="bg-[#F5F8FA] rounded-xl p-4 border border-[#E5ECE8]">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#718096] mb-2">
                  <span>
                    {tx('Fuqaro')}:{' '}
                    <strong className="text-[#17212B]">{tx(selected.appeal.citizen_name || '')}</strong> (
                    {selected.appeal.citizen_phone})
                  </span>
                  <AppealStatusText status={selected.appeal.status} />
                </div>
                <p className="text-sm text-[#17212B] leading-relaxed">{tx(selected.appeal.message)}</p>
                {selected.appeal.attachment_url && (
                  <a
                    href={selected.appeal.attachment_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-block mt-3 text-xs font-semibold text-[#078A59] underline"
                  >
                    {tx("Biriktirilgan faylni ko'rish")}
                  </a>
                )}
              </div>

              {selected.responses.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-[#718096]">{tx('Oldingi javoblar')}</h4>
                  {selected.responses.map((r) => (
                    <div key={r.id} className="p-3.5 rounded-xl bg-[#E8F7F0]/60 border border-[#C6EBDA] text-xs">
                      <div className="flex justify-between font-semibold text-[#064B3C] mb-1">
                        <span>{tx(r.responder_name || "Mas'ul")}</span>
                        <span className="tabular-nums">{formatUzDateTime(r.created_at)}</span>
                      </div>
                      <p className="text-sm text-[#17212B]">{tx(r.response_text)}</p>
                    </div>
                  ))}
                </div>
              )}

              <form onSubmit={handleUpdate} className="space-y-4 pt-2 border-t border-[#E5ECE8]">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#17212B] mb-1">
                      {tx("Holatni o'zgartirish")}
                    </label>
                    <select
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value as AppealStatus)}
                      className="w-full px-3.5 py-2.5 border border-[#E5ECE8] rounded-xl text-sm bg-white outline-none focus:border-[#078A59]"
                    >
                      <option value="yangi">{t('statusYangi')}</option>
                      <option value="korib_chiqilmoqda">{t('statusKorib')}</option>
                      <option value="jarayonda">{t('statusJarayonda')}</option>
                      <option value="javob_berildi">{t('statusJavob')}</option>
                      <option value="yopildi">{t('statusYopildi')}</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#17212B] mb-1 flex items-center gap-1">
                      <UserCheck className="w-3.5 h-3.5 text-[#078A59]" />
                      <span>{tx("Mas'ul xodim")}</span>
                    </label>
                    <select
                      value={assignedTo}
                      onChange={(e) => setAssignedTo(e.target.value)}
                      className="w-full px-3.5 py-2.5 border border-[#E5ECE8] rounded-xl text-sm bg-white outline-none focus:border-[#078A59]"
                    >
                      <option value="">{tx('Tanlanmagan')}</option>
                      {staff.map((st) => (
                        <option key={st.id} value={st.id}>
                          {st.first_name} {st.last_name} ({st.role_label})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#17212B] mb-1">
                    {tx('Fuqaroga rasmiy javob yozish')}
                  </label>
                  <textarea
                    rows={3}
                    value={responseText}
                    onChange={(e) => setResponseText(e.target.value)}
                    placeholder={tx("Ko'rilgan choralar haqida javob yozing...")}
                    className="w-full px-3.5 py-2.5 border border-[#E5ECE8] rounded-xl text-sm outline-none focus:border-[#078A59]"
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#078A59] hover:bg-[#064B3C] text-white text-xs font-semibold"
                  >
                    <Send className="w-4 h-4" />
                    <span>{saving ? '...' : tx('Saqlash va javob yuborish')}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
