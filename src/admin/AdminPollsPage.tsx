import React, { useEffect, useState } from 'react';
import { Plus, Trash2, Power, X } from 'lucide-react';
import { AdminLayout } from '../layouts/AdminLayout';
import { api } from '../services/api';
import { useLang } from '../context/LangContext';
import { useAuth } from '../context/AuthContext';
import { PollItem } from '../types';

export function AdminPollsPage() {
  const { tx } = useLang();
  const { isAdmin } = useAuth();
  const [polls, setPolls] = useState<PollItem[]>([]);
  const [modalOpen, setModalOpen] = useState(false);

  const [question, setQuestion] = useState('');
  const [description, setDescription] = useState('');
  const [options, setOptions] = useState(['', '', '']);

  const loadPolls = () => {
    api.get<{ items: PollItem[] }>('/polls').then((r) => setPolls(r.data.items));
  };

  useEffect(() => {
    loadPolls();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = options.map((o) => o.trim()).filter(Boolean);
    if (!question.trim() || cleaned.length < 2) return;
    await api.post('/polls', { question, description, options: cleaned });
    setModalOpen(false);
    setQuestion('');
    setDescription('');
    setOptions(['', '', '']);
    loadPolls();
  };

  const toggleActive = async (id: number) => {
    await api.put(`/polls/${id}/toggle`);
    loadPolls();
  };

  const deletePoll = async (id: number) => {
    if (!window.confirm(tx("So'rovnomani o'chirishni tasdiqlaysizmi?"))) return;
    await api.delete(`/polls/${id}`);
    loadPolls();
  };

  return (
    <AdminLayout title="So'rovnomalar">
      <div className="space-y-5">
        <div className="flex items-center justify-between gap-4">
          <p className="text-sm text-[#718096]">
            {tx("Aholi o'rtasida so'rovnomalar yaratish va natijalarni kuzatish")}
          </p>
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#078A59] hover:bg-[#064B3C] text-white text-xs font-semibold"
          >
            <Plus className="w-4 h-4" />
            <span>{tx("Yangi so'rovnoma")}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {polls.map((poll) => (
            <div key={poll.id} className="bg-white rounded-2xl border border-[#E5ECE8] p-6 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span
                    className={`text-xs font-semibold ${
                      poll.is_active ? 'text-[#078A59]' : 'text-[#718096]'
                    }`}
                  >
                    {poll.is_active ? tx('Faol') : tx('Yopiq')} · {poll.total_votes} {tx('ovoz')}
                  </span>
                  <h2 className="text-base font-bold text-[#17212B] mt-1">{tx(poll.question)}</h2>
                </div>
                {isAdmin && (
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => toggleActive(poll.id)}
                      className="p-2 rounded-lg text-[#078A59] hover:bg-[#E8F7F0]"
                      title={poll.is_active ? 'Yopish' : 'Faollashtirish'}
                    >
                      <Power className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => deletePoll(poll.id)}
                      className="p-2 rounded-lg text-red-600 hover:bg-red-50"
                      title="O'chirish"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-2.5">
                {poll.options.map((opt) => {
                  const pct =
                    poll.total_votes > 0 ? Math.round((opt.votes / poll.total_votes) * 100) : 0;
                  return (
                    <div key={opt.id} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="font-medium text-[#17212B]">{tx(opt.option_text)}</span>
                        <span className="font-semibold text-[#064B3C] tabular-nums">
                          {opt.votes} ({pct}%)
                        </span>
                      </div>
                      <div className="h-2 bg-[#F5F8FA] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#078A59] rounded-full transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/45 flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white rounded-2xl border border-[#E5ECE8] shadow-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-[#E5ECE8] flex items-center justify-between">
              <h3 className="text-base font-bold">{tx("Yangi so'rovnoma yaratish")}</h3>
              <button type="button" onClick={() => setModalOpen(false)} className="p-1 text-[#718096]">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1">{tx('Savol')} *</label>
                <input
                  type="text"
                  required
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  className="w-full px-3.5 py-2 border border-[#E5ECE8] rounded-xl text-sm outline-none focus:border-[#078A59]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">{tx('Izoh')}</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2 border border-[#E5ECE8] rounded-xl text-sm outline-none focus:border-[#078A59]"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-xs font-semibold">{tx('Javob variantlari')}</label>
                {options.map((opt, idx) => (
                  <input
                    key={idx}
                    type="text"
                    value={opt}
                    onChange={(e) => {
                      const next = [...options];
                      next[idx] = e.target.value;
                      setOptions(next);
                    }}
                    placeholder={`${idx + 1}-variant`}
                    className="w-full px-3.5 py-2 border border-[#E5ECE8] rounded-xl text-sm outline-none focus:border-[#078A59]"
                  />
                ))}
                <button
                  type="button"
                  onClick={() => setOptions((p) => [...p, ''])}
                  className="text-xs font-semibold text-[#078A59] hover:underline"
                >
                  + {tx("Variant qo'shish")}
                </button>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-[#E5ECE8] text-xs font-semibold"
                >
                  {tx('Bekor qilish')}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#078A59] text-white text-xs font-semibold"
                >
                  {tx('Yaratish')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
