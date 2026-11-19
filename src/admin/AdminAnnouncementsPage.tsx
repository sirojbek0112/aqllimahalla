import React, { useEffect, useState } from 'react';
import { ArrowLeft, Plus, Pencil, Trash2, UploadCloud } from 'lucide-react';
import { AdminLayout } from '../layouts/AdminLayout';
import { api, uploadFile } from '../services/api';
import { useLang } from '../context/LangContext';
import { useAuth } from '../context/AuthContext';
import { RichTextEditor } from '../components/RichTextEditor';
import { MediaImage } from '../components/MediaImage';
import { formatUzDate } from '../components/StatusLabel';
import { AnnouncementCategory, AnnouncementItem } from '../types';

export function AdminAnnouncementsPage() {
  const { tx } = useLang();
  const { isAdmin } = useAuth();
  const [items, setItems] = useState<AnnouncementItem[]>([]);
  const [categories, setCategories] = useState<AnnouncementCategory[]>([]);
  const [mode, setMode] = useState<'form' | 'list'>('form');
  const [editId, setEditId] = useState<number | null>(null);

  // Screenshot-matched 2-column form state
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [categoryId, setCategoryId] = useState<number>(1);
  const [imageUrl, setImageUrl] = useState('');
  const [isImportant, setIsImportant] = useState(true);
  const [isBanner, setIsBanner] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  const loadData = () => {
    api.get<{ items: AnnouncementItem[] }>('/announcements').then((r) => setItems(r.data.items));
  };

  useEffect(() => {
    api.get<{ categories: AnnouncementCategory[] }>('/announcements/categories').then((r) => {
      setCategories(r.data.categories);
      if (r.data.categories[0]) setCategoryId(r.data.categories[0].id);
    });
    loadData();
  }, []);

  const resetForm = () => {
    setEditId(null);
    setTitle('');
    setContent('');
    setImageUrl('');
    setIsImportant(true);
    setIsBanner(false);
    setErr('');
    setMsg('');
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setErr('');
    try {
      const url = await uploadFile(file);
      setImageUrl(url);
    } catch (error: any) {
      setErr(error?.response?.data?.error || tx('Rasm yuklashda xatolik'));
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr('');
    setMsg('');
    if (!title.trim() || !content.trim()) {
      setErr(tx("E'lon sarlavhasi va matnini kiriting"));
      return;
    }
    setSaving(true);
    try {
      const payload = {
        title,
        category_id: categoryId,
        image_url: imageUrl,
        content,
        is_important: isImportant,
        is_banner: isBanner,
      };
      if (editId) {
        await api.put(`/announcements/${editId}`, payload);
        setMsg(tx("E'lon yangilandi va ommaviy sahifada aks etdi!"));
      } else {
        await api.post('/announcements', payload);
        setMsg(tx("E'lon saqlandi va ommaviy sahifada chop etildi!"));
      }
      resetForm();
      loadData();
    } catch (error: any) {
      setErr(error?.response?.data?.error || tx('Saqlashda xatolik'));
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (a: AnnouncementItem) => {
    setEditId(a.id);
    setTitle(a.title);
    setCategoryId(a.category_id);
    setImageUrl(a.image_url);
    setContent(a.content);
    setIsImportant(Boolean(a.is_important));
    setIsBanner(Boolean(a.is_banner));
    setMode('form');
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm(tx("Ushbu e'lonni o'chirishni tasdiqlaysizmi?"))) return;
    await api.delete(`/announcements/${id}`);
    loadData();
  };

  return (
    <AdminLayout title={mode === 'form' ? (editId ? "E'lonni tahrirlash" : "Yangi e'lon yaratish") : "E'lonlar ro'yxati"}>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="inline-flex bg-white border border-[#E5ECE8] rounded-xl p-1">
            <button
              type="button"
              onClick={() => {
                resetForm();
                setMode('form');
              }}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold ${
                mode === 'form' ? 'bg-[#078A59] text-white' : 'text-[#718096]'
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{tx("Yangi e'lon yaratish")}</span>
            </button>
            <button
              type="button"
              onClick={() => setMode('list')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold ${
                mode === 'list' ? 'bg-[#078A59] text-white' : 'text-[#718096]'
              }`}
            >
              {tx(`Barcha e'lonlar (${items.length})`)}
            </button>
          </div>

          {mode === 'form' && (
            <button
              type="button"
              onClick={() => setMode('list')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-[#E5ECE8] text-xs font-semibold text-[#17212B]"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{tx('Orqaga')}</span>
            </button>
          )}
        </div>

        {msg && (
          <div className="p-4 rounded-xl bg-[#E8F7F0] border border-[#BCE8D4] text-sm font-medium text-[#064B3C]">
            {msg}
          </div>
        )}
        {err && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
            {err}
          </div>
        )}

        {mode === 'form' ? (
          <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Main Column (8 cols) */}
            <div className="lg:col-span-8 bg-white rounded-2xl border border-[#E5ECE8] p-6 space-y-5">
              <div>
                <label className="block text-xs font-bold text-[#17212B] mb-2">
                  {tx('Sarlavha')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={tx("E'lon sarlavhasini kiriting...")}
                  className="w-full px-4 py-3 border border-[#E5ECE8] rounded-xl text-sm outline-none focus:border-[#078A59]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#17212B] mb-2">
                  {tx("E'lon matni")} <span className="text-red-500">*</span>
                </label>
                <RichTextEditor
                  value={content}
                  onChange={setContent}
                  placeholder={tx("E'lon matnini kiriting...")}
                  minHeight={280}
                />
              </div>
            </div>

            {/* Right Sidebar Column (4 cols) */}
            <div className="lg:col-span-4 space-y-4">
              <div className="bg-white rounded-2xl border border-[#E5ECE8] p-5 space-y-5">
                <div>
                  <label className="block text-xs font-bold text-[#17212B] mb-2">
                    {tx('Kategoriya')}
                  </label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 border border-[#E5ECE8] rounded-xl text-sm bg-white outline-none focus:border-[#078A59]"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {tx(c.name)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#17212B] mb-2">
                    {tx('Rasm')}
                  </label>
                  {imageUrl && (
                    <div className="aspect-[4/3] rounded-xl overflow-hidden border border-[#E5ECE8] mb-3">
                      <MediaImage src={imageUrl} alt="Preview" />
                    </div>
                  )}
                  <label className="flex flex-col items-center justify-center py-8 px-4 border-2 border-dashed border-[#E5ECE8] rounded-2xl cursor-pointer hover:border-[#078A59] bg-[#F5F8FA]/50 transition-colors text-center">
                    <UploadCloud className="w-7 h-7 text-[#718096] mb-2" />
                    <span className="text-sm font-semibold text-[#17212B]">
                      {uploading ? tx('Yuklanmoqda...') : tx('Rasm yuklash')}
                    </span>
                    <span className="text-xs text-[#718096] mt-1">
                      {tx('(Fayl hajmi 5MB gacha)')}
                    </span>
                    <input type="file" accept="image/*" onChange={handleUpload} className="hidden" />
                  </label>
                </div>

                <div className="space-y-2.5 pt-1">
                  <label className="flex items-center gap-2.5 text-xs font-medium text-[#17212B] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isImportant}
                      onChange={(e) => setIsImportant(e.target.checked)}
                      className="rounded border-[#E5ECE8] text-[#078A59]"
                    />
                    <span>{tx("Muhim e'lon (aholiga bildirishnoma yuborish)")}</span>
                  </label>
                  <label className="flex items-center gap-2.5 text-xs font-medium text-[#17212B] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isBanner}
                      onChange={(e) => setIsBanner(e.target.checked)}
                      className="rounded border-[#E5ECE8] text-[#078A59]"
                    />
                    <span>{tx("Bosh sahifa e'lonlar panelida ko'rsatish")}</span>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={saving || uploading}
                  className="w-full py-3 rounded-xl bg-[#078A59] hover:bg-[#064B3C] text-white text-sm font-bold transition-colors shadow-xs"
                >
                  {saving ? '...' : tx("E'lonni saqlash")}
                </button>
              </div>
            </div>
          </form>
        ) : (
          <div className="bg-white rounded-2xl border border-[#E5ECE8] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#F5F8FA] text-xs font-semibold text-[#718096] border-b border-[#E5ECE8]">
                    <th className="py-3 px-5">{tx('Sarlavha')}</th>
                    <th className="py-3 px-5">{tx('Kategoriya')}</th>
                    <th className="py-3 px-5">{tx('Muhimlik')}</th>
                    <th className="py-3 px-5">{tx('Sana')}</th>
                    <th className="py-3 px-5 text-right">{tx('Amallar')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5ECE8] text-sm">
                  {items.map((a) => (
                    <tr key={a.id} className="hover:bg-[#F5F8FA]">
                      <td className="py-3.5 px-5 font-semibold text-[#17212B]">{tx(a.title)}</td>
                      <td className="py-3.5 px-5 text-xs text-[#718096]">{tx(a.category_name)}</td>
                      <td className="py-3.5 px-5 text-xs">
                        {a.is_important ? (
                          <span className="text-amber-700 font-semibold">{tx('Muhim')}</span>
                        ) : (
                          <span className="text-[#718096]">{tx('Oddiy')}</span>
                        )}
                      </td>
                      <td className="py-3.5 px-5 text-xs text-[#718096] tabular-nums">
                        {formatUzDate(a.published_at)}
                      </td>
                      <td className="py-3.5 px-5 text-right space-x-2">
                        <button
                          type="button"
                          onClick={() => handleEdit(a)}
                          className="p-2 rounded-lg text-[#078A59] hover:bg-[#E8F7F0]"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        {isAdmin && (
                          <button
                            type="button"
                            onClick={() => handleDelete(a.id)}
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
        )}
      </div>
    </AdminLayout>
  );
}
