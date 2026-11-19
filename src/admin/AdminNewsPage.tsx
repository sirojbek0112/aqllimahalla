import React, { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Upload, ArrowLeft } from 'lucide-react';
import { AdminLayout } from '../layouts/AdminLayout';
import { api, uploadFile } from '../services/api';
import { useLang } from '../context/LangContext';
import { useAuth } from '../context/AuthContext';
import { RichTextEditor } from '../components/RichTextEditor';
import { MediaImage } from '../components/MediaImage';
import { formatUzDate } from '../components/StatusLabel';
import { NewsCategory, NewsItem } from '../types';

export function AdminNewsPage() {
  const { tx } = useLang();
  const { isAdmin } = useAuth();
  const [items, setItems] = useState<NewsItem[]>([]);
  const [categories, setCategories] = useState<NewsCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<'list' | 'form'>('list');
  const [editId, setEditId] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<NewsItem | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [categoryId, setCategoryId] = useState<number>(1);
  const [imageUrl, setImageUrl] = useState('');
  const [summary, setSummary] = useState('');
  const [content, setContent] = useState('');
  const [publishedAt, setPublishedAt] = useState(() => new Date().toISOString().slice(0, 10));
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const loadNews = () => {
    setLoading(true);
    api
      .get<{ items: NewsItem[] }>('/news', { params: { include_drafts: '1' } })
      .then((res) => setItems(res.data.items))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    api.get<{ categories: NewsCategory[] }>('/news/categories').then((r) => {
      setCategories(r.data.categories);
      if (r.data.categories[0]) setCategoryId(r.data.categories[0].id);
    });
    loadNews();
  }, []);

  const openCreate = () => {
    setEditId(null);
    setTitle('');
    setImageUrl('');
    setSummary('');
    setContent('');
    setPublishedAt(new Date().toISOString().slice(0, 10));
    setError('');
    setMode('form');
  };

  const openEdit = (n: NewsItem) => {
    setEditId(n.id);
    setTitle(n.title);
    setCategoryId(n.category_id);
    setImageUrl(n.image_url);
    setSummary(n.summary);
    setContent(n.content);
    setPublishedAt(n.published_at.slice(0, 10));
    setError('');
    setMode('form');
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadFile(file);
      setImageUrl(url);
    } catch (err: any) {
      setError(err?.response?.data?.error || tx('Rasm yuklashda xatolik'));
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async (status: 'published' | 'draft') => {
    setError('');
    if (!title || !summary || !content) {
      setError(tx("Sarlavha, qisqa tavsif va to'liq matnni kiriting"));
      return;
    }
    setSaving(true);
    try {
      const payload = {
        title,
        category_id: categoryId,
        image_url: imageUrl,
        summary,
        content,
        status,
        published_at: `${publishedAt} 12:00:00`,
      };
      if (editId) {
        await api.put(`/news/${editId}`, payload);
      } else {
        await api.post('/news', payload);
      }
      setMode('list');
      loadNews();
    } catch (err: any) {
      setError(err?.response?.data?.error || tx('Saqlashda xatolik'));
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    await api.delete(`/news/${deleteTarget.id}`);
    setDeleteTarget(null);
    loadNews();
  };

  return (
    <AdminLayout title="Yangiliklar">
      {mode === 'list' ? (
        <div className="space-y-5">
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm text-[#718096]">{tx("Mahalla yangiliklarini boshqarish")}</p>
            <button
              type="button"
              onClick={openCreate}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#078A59] hover:bg-[#064B3C] text-white text-xs font-semibold transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>{tx('Yangi yangilik')}</span>
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-[#E5ECE8] overflow-hidden">
            {loading ? (
              <div className="p-8 text-center text-sm text-[#718096]">{tx('Yuklanmoqda...')}</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#F5F8FA] text-xs font-semibold text-[#718096] border-b border-[#E5ECE8]">
                      <th className="py-3 px-4">{tx('Rasm')}</th>
                      <th className="py-3 px-4">{tx('Sarlavha')}</th>
                      <th className="py-3 px-4">{tx('Kategoriya')}</th>
                      <th className="py-3 px-4">{tx('Holat')}</th>
                      <th className="py-3 px-4">{tx('Sana')}</th>
                      <th className="py-3 px-4 text-right">{tx('Amallar')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5ECE8] text-sm">
                    {items.map((n) => (
                      <tr key={n.id} className="hover:bg-[#F5F8FA]">
                        <td className="py-3 px-4">
                          <div className="w-14 h-10 rounded-lg overflow-hidden border border-[#E5ECE8]">
                            <MediaImage src={n.image_url} alt={n.title} />
                          </div>
                        </td>
                        <td className="py-3 px-4 font-semibold text-[#17212B] max-w-xs truncate">
                          {tx(n.title)}
                        </td>
                        <td className="py-3 px-4 text-xs text-[#718096]">{tx(n.category_name)}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`text-xs font-semibold px-2.5 py-1 rounded-md ${
                              n.status === 'published'
                                ? 'bg-[#E8F7F0] text-[#078A59]'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {n.status === 'published' ? tx('Nashr qilingan') : tx('Qoralama')}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-xs text-[#718096] tabular-nums">
                          {formatUzDate(n.published_at)}
                        </td>
                        <td className="py-3 px-4 text-right space-x-2 whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => openEdit(n)}
                            className="p-2 rounded-lg text-[#078A59] hover:bg-[#E8F7F0]"
                            title="Tahrirlash"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          {isAdmin && (
                            <button
                              type="button"
                              onClick={() => setDeleteTarget(n)}
                              className="p-2 rounded-lg text-red-600 hover:bg-red-50"
                              title="O'chirish"
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
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-[#17212B]">
              {editId ? tx('Yangilikni tahrirlash') : tx('Yangi yangilik yaratish')}
            </h2>
            <button
              type="button"
              onClick={() => setMode('list')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-[#E5ECE8] text-xs font-semibold text-[#17212B]"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{tx('Orqaga')}</span>
            </button>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8 bg-white rounded-2xl border border-[#E5ECE8] p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#17212B] mb-1.5">
                  {tx('Sarlavha')} *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={tx('Yangilik sarlavhasini kiriting...')}
                  className="w-full px-3.5 py-2.5 border border-[#E5ECE8] rounded-xl text-sm outline-none focus:border-[#078A59]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#17212B] mb-1.5">
                  {tx('Qisqa tavsif')} *
                </label>
                <textarea
                  rows={2}
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  placeholder={tx("Kartada ko'rinadigan qisqacha izoh...")}
                  className="w-full px-3.5 py-2.5 border border-[#E5ECE8] rounded-xl text-sm outline-none focus:border-[#078A59]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#17212B] mb-1.5">
                  {tx("To'liq matn")} *
                </label>
                <RichTextEditor value={content} onChange={setContent} minHeight={260} />
              </div>
            </div>

            <div className="lg:col-span-4 space-y-4">
              <div className="bg-white rounded-2xl border border-[#E5ECE8] p-5 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#17212B] mb-1.5">
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
                  <label className="block text-xs font-semibold text-[#17212B] mb-1.5">
                    {tx('Nashr sanasi')}
                  </label>
                  <input
                    type="date"
                    value={publishedAt}
                    onChange={(e) => setPublishedAt(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-[#E5ECE8] rounded-xl text-sm outline-none focus:border-[#078A59]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#17212B] mb-1.5">
                    {tx('Asosiy rasm')}
                  </label>
                  {imageUrl && (
                    <div className="aspect-[4/3] rounded-xl overflow-hidden border border-[#E5ECE8] mb-2">
                      <MediaImage src={imageUrl} alt="Preview" />
                    </div>
                  )}
                  <label className="flex flex-col items-center justify-center p-5 border border-dashed border-[#E5ECE8] rounded-xl cursor-pointer hover:border-[#078A59] text-center">
                    <Upload className="w-5 h-5 text-[#078A59] mb-1.5" />
                    <span className="text-xs font-semibold text-[#17212B]">
                      {uploading ? tx('Yuklanmoqda...') : tx('Rasm yuklash')}
                    </span>
                    <span className="text-[11px] text-[#718096] mt-0.5">
                      {tx('Fayl hajmi 5MB gacha')}
                    </span>
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                  </label>
                </div>

                <div className="space-y-2 pt-2">
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => handleSave('published')}
                    className="w-full py-2.5 rounded-xl bg-[#078A59] hover:bg-[#064B3C] text-white text-xs font-semibold transition-colors"
                  >
                    {tx('Nashr qilish')}
                  </button>
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => handleSave('draft')}
                    className="w-full py-2.5 rounded-xl bg-[#F5F8FA] hover:bg-[#E5ECE8] text-[#17212B] text-xs font-semibold transition-colors"
                  >
                    {tx('Qoralama sifatida saqlash')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-black/45 flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white rounded-2xl p-6 border border-[#E5ECE8] shadow-xl">
            <h3 className="text-base font-bold text-[#17212B]">{tx("Yangilikni o'chirish")}</h3>
            <p className="text-xs text-[#718096] mt-2">
              {tx(`"${deleteTarget.title}" yangiligini o'chirishni tasdiqlaysizmi?`)}
            </p>
            <div className="mt-5 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 rounded-xl border border-[#E5ECE8] text-xs font-semibold"
              >
                {tx('Bekor qilish')}
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="px-4 py-2 rounded-xl bg-red-600 text-white text-xs font-semibold hover:bg-red-700"
              >
                {tx("O'chirish")}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
