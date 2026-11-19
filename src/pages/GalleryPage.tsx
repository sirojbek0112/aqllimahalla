import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Image as ImageIcon, ChevronRight, X } from 'lucide-react';
import { api } from '../services/api';
import { useLang } from '../context/LangContext';
import { MediaImage } from '../components/MediaImage';
import { GalleryItem } from '../types';

const GALLERY_CATS = ['Hashar', 'Tadbirlar', 'Uchrashuvlar', 'Sport', 'Hudud'];

export function GalleryPage() {
  const { t, tx } = useLang();
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [cat, setCat] = useState('all');
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState<GalleryItem | null>(null);

  useEffect(() => {
    setLoading(true);
    api
      .get<{ items: GalleryItem[] }>('/gallery', { params: { category: cat } })
      .then((res) => setItems(res.data.items))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [cat]);

  return (
    <div>
      <section className="bg-[#E8F7F0] border-b border-[#D2EFE1]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white text-[#078A59] border border-[#C6EBDA] flex items-center justify-center shrink-0">
              <ImageIcon className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-[#17212B]">{t('navGallery')}</h1>
              <p className="text-sm text-[#064B3C] mt-0.5">
                {tx('Mahallamiz hayotidan foto lavhalar')}
              </p>
            </div>
          </div>
          <nav className="flex items-center gap-1.5 text-xs text-[#718096]">
            <Link to="/" className="hover:text-[#078A59]">
              {t('navHome')}
            </Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="font-semibold text-[#17212B]">{t('navGallery')}</span>
          </nav>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <div className="flex flex-wrap items-center gap-2 mb-6">
          <button
            type="button"
            onClick={() => setCat('all')}
            className={`px-4 py-2 rounded-full text-xs font-semibold transition-colors ${
              cat === 'all'
                ? 'bg-[#078A59] text-white'
                : 'bg-white border border-[#E5ECE8] text-[#17212B]'
            }`}
          >
            {t('all')}
          </button>
          {GALLERY_CATS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCat(c)}
              className={`px-4 py-2 rounded-full text-xs font-semibold transition-colors ${
                cat === c
                  ? 'bg-[#078A59] text-white'
                  : 'bg-white border border-[#E5ECE8] text-[#17212B]'
              }`}
            >
              {tx(c)}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3].map((n) => (
              <div key={n} className="aspect-[4/3] bg-white rounded-2xl border border-[#E5ECE8] animate-pulse" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#E5ECE8] p-12 text-center text-sm text-[#718096]">
            {t('noData')}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {items.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setActive(item)}
                className="group text-left bg-white rounded-2xl border border-[#E5ECE8] overflow-hidden hover:shadow-md transition-all"
              >
                <div className="aspect-[4/3] overflow-hidden bg-[#F5F8FA]">
                  <MediaImage
                    src={item.image_url}
                    alt={tx(item.title)}
                    className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300"
                  />
                </div>
                <div className="p-4">
                  <span className="text-xs font-semibold text-[#078A59]">{tx(item.category)}</span>
                  <h2 className="text-sm font-bold text-[#17212B] mt-1">{tx(item.title)}</h2>
                  {item.description && (
                    <p className="text-xs text-[#718096] mt-1 line-clamp-2">{tx(item.description)}</p>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </section>

      {active && (
        <div
          className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4"
          onClick={() => setActive(null)}
        >
          <div
            className="max-w-3xl w-full bg-white rounded-2xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative bg-black aspect-[16/10]">
              <MediaImage src={active.image_url} alt={tx(active.title)} className="w-full h-full object-contain" />
              <button
                type="button"
                onClick={() => setActive(null)}
                className="absolute top-3 right-3 p-2 rounded-full bg-black/50 text-white hover:bg-black/80"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5">
              <span className="text-xs font-semibold text-[#078A59]">{tx(active.category)}</span>
              <h3 className="text-lg font-bold text-[#17212B] mt-1">{tx(active.title)}</h3>
              <p className="text-sm text-[#718096] mt-1">{tx(active.description)}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
