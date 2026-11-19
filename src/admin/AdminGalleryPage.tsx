import React, { useEffect, useState } from 'react';
import { Plus, Trash2, Upload, X } from 'lucide-react';
import { AdminLayout } from '../layouts/AdminLayout';
import { api, uploadFile } from '../services/api';
import { useLang } from '../context/LangContext';
import { useAuth } from '../context/AuthContext';
import { MediaImage } from '../components/MediaImage';
import { GalleryItem } from '../types';

export function AdminGalleryPage() {
  const { tx } = useLang();
  const { isAdmin } = useAuth();
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [modalOpen, setModalOpen] = useState(false);

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Hashar');
  const [imageUrl, setImageUrl] = useState('');
  const [description, setDescription] = useState('');
  const [uploading, setUploading] = useState(false);

  const loadGallery = () => {
    api.get<{ items: GalleryItem[] }>('/gallery').then((r) => setItems(r.data.items));
  };

  useEffect(() => {
    loadGallery();
  }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadFile(file);
      setImageUrl(url);
    } finally {
      setUploading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !imageUrl) return;
    await api.post('/gallery', { title, category, image_url: imageUrl, description });
    setModalOpen(false);
    setTitle('');
    setImageUrl('');
    setDescription('');
    loadGallery();
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm(tx("Rasmni galereyadan o'chirishni tasdiqlaysizmi?"))) return;
    await api.delete(`/gallery/${id}`);
    loadGallery();
  };

  return (
    <AdminLayout title="Galereya">
      <div className="space-y-5">
        <div className="flex items-center justify-between gap-4">
          <p className="text-sm text-[#718096]">{tx('Mahalla foto galereyasini boshqarish')}</p>
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#078A59] hover:bg-[#064B3C] text-white text-xs font-semibold"
          >
            <Plus className="w-4 h-4" />
            <span>{tx("Rasm qo'shish")}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {items.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-2xl border border-[#E5ECE8] overflow-hidden flex flex-col"
            >
              <div className="aspect-[4/3] bg-[#F5F8FA]">
                <MediaImage src={item.image_url} alt={tx(item.title)} />
              </div>
              <div className="p-4 flex items-start justify-between gap-3">
                <div>
                  <span className="text-xs font-semibold text-[#078A59]">{tx(item.category)}</span>
                  <h3 className="text-sm font-bold text-[#17212B] mt-0.5">{tx(item.title)}</h3>
                  {item.description && (
                    <p className="text-xs text-[#718096] mt-1">{tx(item.description)}</p>
                  )}
                </div>
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => handleDelete(item.id)}
                    className="p-2 rounded-lg text-red-600 hover:bg-red-50 shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/45 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-2xl border border-[#E5ECE8] shadow-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-[#E5ECE8] flex items-center justify-between">
              <h3 className="text-base font-bold">{tx("Galereyaga rasm qo'shish")}</h3>
              <button type="button" onClick={() => setModalOpen(false)} className="p-1 text-[#718096]">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1">{tx('Sarlavha')} *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2 border border-[#E5ECE8] rounded-xl text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">{tx('Kategoriya')}</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3.5 py-2 border border-[#E5ECE8] rounded-xl text-sm bg-white"
                >
                  <option value="Hashar">Hashar</option>
                  <option value="Tadbirlar">Tadbirlar</option>
                  <option value="Uchrashuvlar">Uchrashuvlar</option>
                  <option value="Sport">Sport</option>
                  <option value="Hudud">Hudud</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">{tx('Rasm')} *</label>
                {imageUrl && (
                  <div className="aspect-[4/3] rounded-xl overflow-hidden border border-[#E5ECE8] mb-2">
                    <MediaImage src={imageUrl} alt="Preview" />
                  </div>
                )}
                <label className="flex items-center justify-center gap-2 p-4 border border-dashed border-[#E5ECE8] rounded-xl cursor-pointer hover:border-[#078A59] text-xs font-semibold">
                  <Upload className="w-4 h-4 text-[#078A59]" />
                  <span>{uploading ? tx('Yuklanmoqda...') : tx('Rasm yuklash')}</span>
                  <input type="file" accept="image/*" onChange={handleUpload} className="hidden" />
                </label>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">{tx('Izoh')}</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2 border border-[#E5ECE8] rounded-xl text-sm"
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
                  disabled={!imageUrl}
                  className="px-5 py-2 rounded-xl bg-[#078A59] text-white text-xs font-semibold disabled:opacity-50"
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
