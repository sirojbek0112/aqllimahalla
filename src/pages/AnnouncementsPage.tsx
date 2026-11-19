import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Megaphone, Search, ChevronRight, AlertCircle, Calendar, X } from 'lucide-react';
import { api } from '../services/api';
import { useLang } from '../context/LangContext';
import { MediaImage } from '../components/MediaImage';
import { formatUzDate } from '../components/StatusLabel';
import { AnnouncementCategory, AnnouncementItem } from '../types';

export function AnnouncementsPage() {
  const { t, tx } = useLang();
  const [searchParams] = useSearchParams();
  const [categories, setCategories] = useState<AnnouncementCategory[]>([]);
  const [items, setItems] = useState<AnnouncementItem[]>([]);
  const [selectedCat, setSelectedCat] = useState('all');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeItem, setActiveItem] = useState<AnnouncementItem | null>(null);

  useEffect(() => {
    api
      .get<{ categories: AnnouncementCategory[] }>('/announcements/categories')
      .then((r) => setCategories(r.data.categories));
  }, []);

  useEffect(() => {
    setLoading(true);
    api
      .get<{ items: AnnouncementItem[] }>('/announcements', {
        params: { category: selectedCat, q: query },
      })
      .then((res) => {
        setItems(res.data.items);
        const hi = Number(searchParams.get('highlight') || 0);
        if (hi) {
          const found = res.data.items.find((x) => x.id === hi);
          if (found) setActiveItem(found);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [selectedCat, query]);

  return (
    <div>
      <section className="bg-gradient-to-r from-[#064B3C] via-[#078A59] to-[#18A66A] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/15 flex items-center justify-center shrink-0">
              <Megaphone className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                {t('navAnnouncements')}
              </h1>
              <p className="text-sm text-white/85 mt-1">
                {tx("Mahalla aholisi uchun muhim e'lonlar va xabarnomalar")}
              </p>
            </div>
          </div>
          <nav className="flex items-center gap-1.5 text-xs text-white/85">
            <Link to="/" className="hover:text-white">
              {t('navHome')}
            </Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="font-semibold text-white">{t('navAnnouncements')}</span>
          </nav>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setSelectedCat('all')}
              className={`px-4 py-2 rounded-full text-xs font-semibold transition-colors ${
                selectedCat === 'all'
                  ? 'bg-[#078A59] text-white'
                  : 'bg-white border border-[#E5ECE8] text-[#17212B] hover:border-[#078A59]'
              }`}
            >
              {t('all')}
            </button>
            {categories.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setSelectedCat(c.slug)}
                className={`px-4 py-2 rounded-full text-xs font-semibold transition-colors ${
                  selectedCat === c.slug
                    ? 'bg-[#078A59] text-white'
                    : 'bg-white border border-[#E5ECE8] text-[#17212B] hover:border-[#078A59]'
                }`}
              >
                {tx(c.name)}
              </button>
            ))}
          </div>

          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-[#718096] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={tx("E'lonlarni qidirish...")}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#E5ECE8] rounded-xl text-sm outline-none focus:border-[#078A59]"
            />
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-6">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="h-48 bg-white rounded-2xl border border-[#E5ECE8] animate-pulse" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="mt-8 bg-white rounded-2xl border border-[#E5ECE8] p-12 text-center text-sm text-[#718096]">
            {t('noData')}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-6">
            {items.map((ann) => (
              <div
                key={ann.id}
                className={`bg-white rounded-2xl border overflow-hidden transition-all flex flex-col sm:flex-row ${
                  ann.is_important
                    ? 'border-[#078A59]/50 shadow-sm'
                    : 'border-[#E5ECE8]'
                }`}
              >
                {ann.image_url && (
                  <div className="sm:w-44 h-44 sm:h-auto shrink-0 bg-[#F5F8FA]">
                    <MediaImage src={ann.image_url} alt={tx(ann.title)} />
                  </div>
                )}
                <div className="p-5 flex-1 flex flex-col">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs mb-2">
                    <span className="font-semibold text-[#078A59] flex items-center gap-1">
                      {ann.is_important ? <AlertCircle className="w-3.5 h-3.5 text-amber-600" /> : null}
                      {tx(ann.category_name)}
                    </span>
                    <span className="text-[#718096] tabular-nums inline-flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {formatUzDate(ann.published_at)}
                    </span>
                  </div>
                  <h2 className="text-base font-bold text-[#17212B]">{tx(ann.title)}</h2>
                  <div
                    className="mt-2 text-sm text-[#718096] line-clamp-3 flex-1"
                    dangerouslySetInnerHTML={{ __html: tx(ann.content) }}
                  />
                  <div className="mt-4 flex items-center justify-between">
                    {ann.is_important ? (
                      <span className="text-xs font-semibold text-amber-700">{tx("Muhim e'lon")}</span>
                    ) : (
                      <span />
                    )}
                    <button
                      type="button"
                      onClick={() => setActiveItem(ann)}
                      className="text-xs font-semibold text-[#078A59] hover:text-[#064B3C]"
                    >
                      {t('details')} →
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Detail Modal */}
      {activeItem && (
        <div
          className="fixed inset-0 z-50 bg-black/45 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setActiveItem(null)}
        >
          <div
            className="w-full max-w-2xl bg-white rounded-2xl border border-[#E5ECE8] shadow-xl overflow-hidden max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-[#E5ECE8] flex items-center justify-between">
              <span className="text-xs font-semibold text-[#078A59]">{tx(activeItem.category_name)}</span>
              <button
                type="button"
                onClick={() => setActiveItem(null)}
                className="p-1.5 rounded-lg text-[#718096] hover:bg-[#F5F8FA]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto">
              {activeItem.image_url && (
                <div className="aspect-[16/9] rounded-xl overflow-hidden mb-5 border border-[#E5ECE8]">
                  <MediaImage src={activeItem.image_url} alt={tx(activeItem.title)} />
                </div>
              )}
              <div className="text-xs text-[#718096] mb-2 tabular-nums">
                {formatUzDate(activeItem.published_at)}
              </div>
              <h2 className="text-xl font-bold text-[#17212B]">{tx(activeItem.title)}</h2>
              <div
                className="mt-4 text-sm text-[#17212B] rich-content"
                dangerouslySetInnerHTML={{ __html: tx(activeItem.content) }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
