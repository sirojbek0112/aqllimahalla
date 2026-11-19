import React, { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Users, X } from 'lucide-react';
import { AdminLayout } from '../layouts/AdminLayout';
import { api } from '../services/api';
import { useLang } from '../context/LangContext';
import { useAuth } from '../context/AuthContext';
import { formatUzDateTime } from '../components/StatusLabel';
import { EventItem } from '../types';

export function AdminEventsPage() {
  const { tx } = useLang();
  const { isAdmin } = useAuth();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [participantsModal, setParticipantsModal] = useState<{
    event: EventItem;
    list: Array<{ id: number; first_name: string; last_name: string; phone: string; registered_at: string }>;
  } | null>(null);

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Hashar');
  const [description, setDescription] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventTime, setEventTime] = useState('09:00');
  const [location, setLocation] = useState('');
  const [capacity, setCapacity] = useState(100);

  const loadEvents = () => {
    api.get<{ all: EventItem[] }>('/events').then((r) => setEvents(r.data.all));
  };

  useEffect(() => {
    loadEvents();
  }, []);

  const openCreate = () => {
    setEditId(null);
    setTitle('');
    setCategory('Hashar');
    setDescription('');
    setEventDate(new Date().toISOString().slice(0, 10));
    setEventTime('09:00');
    setLocation('Mahalla hududi');
    setCapacity(100);
    setModalOpen(true);
  };

  const openEdit = (ev: EventItem) => {
    setEditId(ev.id);
    setTitle(ev.title);
    setCategory(ev.category);
    setDescription(ev.description);
    setEventDate(ev.event_date);
    setEventTime(ev.event_time);
    setLocation(ev.location);
    setCapacity(ev.capacity);
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      title,
      category,
      description,
      event_date: eventDate,
      event_time: eventTime,
      location,
      capacity,
    };
    if (editId) {
      await api.put(`/events/${editId}`, payload);
    } else {
      await api.post('/events', payload);
    }
    setModalOpen(false);
    loadEvents();
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm(tx("Ushbu tadbirni o'chirishni tasdiqlaysizmi?"))) return;
    await api.delete(`/events/${id}`);
    loadEvents();
  };

  const viewParticipants = async (ev: EventItem) => {
    const res = await api.get(`/events/${ev.id}/participants`);
    setParticipantsModal({ event: ev, list: res.data.participants });
  };

  return (
    <AdminLayout title="Tadbirlar">
      <div className="space-y-5">
        <div className="flex items-center justify-between gap-4">
          <p className="text-sm text-[#718096]">
            {tx('Tadbirlarni rejalashtirish va ishtirokchilarni kuzatish')}
          </p>
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#078A59] hover:bg-[#064B3C] text-white text-xs font-semibold"
          >
            <Plus className="w-4 h-4" />
            <span>{tx('Yangi tadbir')}</span>
          </button>
        </div>

        <div className="bg-white rounded-2xl border border-[#E5ECE8] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F5F8FA] text-xs font-semibold text-[#718096] border-b border-[#E5ECE8]">
                  <th className="py-3.5 px-5">{tx('Tadbir nomi')}</th>
                  <th className="py-3.5 px-5">{tx('Sana va vaqt')}</th>
                  <th className="py-3.5 px-5">{tx('Manzil')}</th>
                  <th className="py-3.5 px-5">{tx('Ishtirokchilar')}</th>
                  <th className="py-3.5 px-5">{tx('Holat')}</th>
                  <th className="py-3.5 px-5 text-right">{tx('Amallar')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5ECE8] text-sm">
                {events.map((ev) => (
                  <tr key={ev.id} className="hover:bg-[#F5F8FA]">
                    <td className="py-3.5 px-5">
                      <div className="font-semibold text-[#17212B]">{tx(ev.title)}</div>
                      <div className="text-xs text-[#718096]">{tx(ev.category)}</div>
                    </td>
                    <td className="py-3.5 px-5 text-xs text-[#17212B] tabular-nums">
                      {ev.event_date} · {ev.event_time}
                    </td>
                    <td className="py-3.5 px-5 text-xs text-[#718096]">{tx(ev.location)}</td>
                    <td className="py-3.5 px-5">
                      <button
                        type="button"
                        onClick={() => viewParticipants(ev)}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#078A59] hover:underline tabular-nums"
                      >
                        <Users className="w-3.5 h-3.5" />
                        <span>
                          {ev.participants_count} / {ev.capacity}
                        </span>
                      </button>
                    </td>
                    <td className="py-3.5 px-5 text-xs">
                      {ev.is_past ? (
                        <span className="text-[#718096]">{tx("O'tgan")}</span>
                      ) : (
                        <span className="font-semibold text-[#078A59]">{tx('Yaqinlashayotgan')}</span>
                      )}
                    </td>
                    <td className="py-3.5 px-5 text-right space-x-2">
                      <button
                        type="button"
                        onClick={() => openEdit(ev)}
                        className="p-2 rounded-lg text-[#078A59] hover:bg-[#E8F7F0]"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      {isAdmin && (
                        <button
                          type="button"
                          onClick={() => handleDelete(ev.id)}
                          className="p-2 rounded-lg text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Create/Edit Event Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/45 flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white rounded-2xl border border-[#E5ECE8] shadow-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-[#E5ECE8] flex items-center justify-between">
              <h3 className="text-base font-bold text-[#17212B]">
                {editId ? tx('Tadbirni tahrirlash') : tx('Yangi tadbir yaratish')}
              </h3>
              <button type="button" onClick={() => setModalOpen(false)} className="p-1 text-[#718096]">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1">{tx('Tadbir nomi')} *</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3.5 py-2 border border-[#E5ECE8] rounded-xl text-sm outline-none focus:border-[#078A59]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">{tx('Turi')}</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3.5 py-2 border border-[#E5ECE8] rounded-xl text-sm bg-white outline-none"
                  >
                    <option value="Hashar">Hashar</option>
                    <option value="Sport">Sport</option>
                    <option value="Bayram">Bayram</option>
                    <option value="Uchrashuv">Uchrashuv</option>
                    <option value="Ekologiya">Ekologiya</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1">{tx('Sana')} *</label>
                  <input
                    type="date"
                    required
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    className="w-full px-3 py-2 border border-[#E5ECE8] rounded-xl text-sm outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">{tx('Vaqt')} *</label>
                  <input
                    type="time"
                    required
                    value={eventTime}
                    onChange={(e) => setEventTime(e.target.value)}
                    className="w-full px-3 py-2 border border-[#E5ECE8] rounded-xl text-sm outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">{tx("Sig'im")}</label>
                  <input
                    type="number"
                    min={5}
                    value={capacity}
                    onChange={(e) => setCapacity(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-[#E5ECE8] rounded-xl text-sm outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">{tx('Manzil')} *</label>
                <input
                  type="text"
                  required
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full px-3.5 py-2 border border-[#E5ECE8] rounded-xl text-sm outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">{tx('Tavsif')}</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2 border border-[#E5ECE8] rounded-xl text-sm outline-none"
                />
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
                  {tx('Saqlash')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Participants Modal */}
      {participantsModal && (
        <div
          className="fixed inset-0 z-50 bg-black/45 flex items-center justify-center p-4"
          onClick={() => setParticipantsModal(null)}
        >
          <div
            className="w-full max-w-lg bg-white rounded-2xl border border-[#E5ECE8] shadow-xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-[#E5ECE8] flex items-center justify-between">
              <h3 className="text-base font-bold text-[#17212B]">
                {tx(participantsModal.event.title)} — {tx('Ishtirokchilar')}
              </h3>
              <button
                type="button"
                onClick={() => setParticipantsModal(null)}
                className="p-1 text-[#718096]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 max-h-96 overflow-y-auto">
              {participantsModal.list.length === 0 ? (
                <p className="text-sm text-[#718096] text-center py-6">
                  {tx("Hozircha ro'yxatdan o'tganlar yo'q")}
                </p>
              ) : (
                <div className="divide-y divide-[#E5ECE8]">
                  {participantsModal.list.map((p) => (
                    <div key={p.id} className="py-3 flex items-center justify-between text-xs">
                      <div>
                        <div className="font-semibold text-[#17212B]">
                          {p.first_name} {p.last_name}
                        </div>
                        <div className="text-[#718096] tabular-nums">{p.phone}</div>
                      </div>
                      <span className="text-[#718096] tabular-nums">
                        {formatUzDateTime(p.registered_at)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
