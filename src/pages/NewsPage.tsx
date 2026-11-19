import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Newspaper, Search, ArrowRight, ChevronRight } from 'lucide-react';
import { api } from '../services/api';
import { useLang } from '../context/LangContext';
import { MediaImage } from '../components/MediaImage';
import { formatUzDate } from '../components/StatusLabel';
import { NewsCategory, NewsItem } from '../types';

export function NewsPage() {
  const { t, tx } = useLang();
  const [categories, setCategories] = useState<NewsCategory[]>([]);
  const [items, setItems] = useState<NewsItem[]>([]);
  const [selectedCat, setSelectedCat] = useState('all');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<{ categories: NewsCategory[] }>('/news/categories').then((r) => setCategories(r.data.categories));
  }, []);

  useEffect(() => {
    setLoading(true);
    api
      .get<{ items: NewsItem[] }>('/news', { params: { category: selectedCat, q: query } })
      .then((res) => setItems(res.data.items))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [selectedCat, query]);

  return (
    <div>
      {/* Green Gradient Banner */}
      <section className="bg-gradient-to-r from-[#064B3C] via-[#078A59] to-[#18A66A] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center shrink-0">
              <Newspaper className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">{t('navNews')}</h1>
              <p className="text-sm text-white/85 mt-1">
                {tx("Mahallamizdagi eng so'nggi yangiliklar")}
              </p>
            </div>
          </div>
          <nav className="flex items-center gap-1.5 text-xs text-white/85">
            <Link to="/" className="hover:text-white">
              {t('navHome')}
            </Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="font-semibold text-white">{t('navNews')}</span>
          </nav>
        </div>
      </section>

      {/* Filters & Search */}
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
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCat(cat.slug)}
                className={`px-4 py-2 rounded-full text-xs font-semibold transition-colors ${
                  selectedCat === cat.slug
                    ? 'bg-[#078A59] text-white'
                    : 'bg-white border border-[#E5ECE8] text-[#17212B] hover:border-[#078A59]'
                }`}
              >
                {tx(cat.name)}
              </button>
            ))}
          </div>

          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-[#718096] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={tx('Yangiliklarni qidirish...')}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#E5ECE8] rounded-xl text-sm outline-none focus:border-[#078A59]"
            />
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
            {[1, 2, 3].map((n) => (
              <div key={n} className="bg-white rounded-2xl border border-[#E5ECE8] h-80 animate-pulse" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="mt-8 bg-white rounded-2xl border border-[#E5ECE8] p-12 text-center text-sm text-[#718096]">
            {t('noData')}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
            {items.map((item) => (
              <Link
                key={item.id}
                to={`/news/${item.id}`}
                className="group bg-white rounded-2xl border border-[#E5ECE8] overflow-hidden hover:shadow-md transition-all flex flex-col"
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-[#F5F8FA]">
                  <MediaImage
                    src={item.image_url}
                    alt={tx(item.title)}
                    className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300"
                  />
                  <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/75 to-transparent" />
                  <span className="absolute bottom-3 left-3 text-xs font-medium text-white tabular-nums">
                    {formatUzDate(item.published_at)}
                  </span>
                </div>
                <div className="p-5 flex-1 flex flex-col">
                  <div className="text-xs font-medium text-[#718096] mb-1">
                    {tx(item.category_name)}
                  </div>
                  <h2 className="text-base font-bold text-[#17212B] group-hover:text-[#078A59] transition-colors line-clamp-2">
                    {tx(item.title)}
                  </h2>
                  <p className="mt-2 text-sm text-[#718096] line-clamp-2 flex-1">
                    {tx(item.summary)}
                  </p>
                  <div className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-[#078A59]">
                    <span>{t('details')}</span>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
