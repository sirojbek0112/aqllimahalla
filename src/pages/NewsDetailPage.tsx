import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Calendar, User as UserIcon, Eye, ArrowRight } from 'lucide-react';
import { api } from '../services/api';
import { useLang } from '../context/LangContext';
import { MediaImage } from '../components/MediaImage';
import { formatUzDate } from '../components/StatusLabel';
import { NewsItem } from '../types';

export function NewsDetailPage() {
  const { id } = useParams();
  const { t, tx } = useLang();
  const [item, setItem] = useState<NewsItem | null>(null);
  const [related, setRelated] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api
      .get<{ item: NewsItem; related: NewsItem[] }>(`/news/${id}`)
      .then((res) => {
        setItem(res.data.item);
        setRelated(res.data.related);
      })
      .catch(() => setItem(null))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="h-96 bg-white rounded-2xl border border-[#E5ECE8] animate-pulse" />
      </div>
    );
  }

  if (!item) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <p className="text-base text-[#718096]">{t('noData')}</p>
        <Link to="/news" className="inline-flex items-center gap-2 mt-4 text-sm font-semibold text-[#078A59]">
          <ArrowLeft className="w-4 h-4" />
          {t('navNews')}
        </Link>
      </div>
    );
  }

  let extraImages: string[] = [];
  try {
    extraImages = item.extra_images ? JSON.parse(item.extra_images) : [];
  } catch {
    extraImages = [];
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link
        to="/news"
        className="inline-flex items-center gap-2 text-sm font-semibold text-[#078A59] hover:text-[#064B3C] mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>{t('navNews')}</span>
      </Link>

      <article className="bg-white rounded-2xl border border-[#E5ECE8] overflow-hidden shadow-xs">
        <div className="aspect-[16/9] max-h-[460px] w-full bg-[#F5F8FA] overflow-hidden">
          <MediaImage src={item.image_url} alt={tx(item.title)} className="w-full h-full object-cover" />
        </div>

        <div className="p-6 sm:p-10">
          <div className="flex flex-wrap items-center gap-4 text-xs text-[#718096] mb-3">
            <span className="font-semibold text-[#078A59]">{tx(item.category_name)}</span>
            <span aria-hidden="true">·</span>
            <span className="inline-flex items-center gap-1 tabular-nums">
              <Calendar className="w-3.5 h-3.5" />
              {formatUzDate(item.published_at)}
            </span>
            <span aria-hidden="true">·</span>
            <span className="inline-flex items-center gap-1">
              <UserIcon className="w-3.5 h-3.5" />
              {tx(item.author_name || 'Mahalla matbuot xizmati')}
            </span>
            <span aria-hidden="true">·</span>
            <span className="inline-flex items-center gap-1 tabular-nums">
              <Eye className="w-3.5 h-3.5" />
              {item.views}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#17212B] leading-snug text-balance">
            {tx(item.title)}
          </h1>

          <p className="mt-4 text-base font-medium text-[#064B3C] bg-[#E8F7F0]/70 rounded-xl p-4">
            {tx(item.summary)}
          </p>

          <div
            className="mt-6 text-base text-[#17212B] rich-content"
            dangerouslySetInnerHTML={{ __html: tx(item.content) }}
          />

          {extraImages.length > 0 && (
            <div className="mt-8 pt-6 border-t border-[#E5ECE8]">
              <h3 className="text-sm font-bold text-[#17212B] mb-4">{tx("Qo'shimcha rasmlar")}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {extraImages.map((img, i) => (
                  <div key={i} className="aspect-[4/3] rounded-xl overflow-hidden border border-[#E5ECE8]">
                    <MediaImage src={img} alt={`${tx(item.title)} ${i + 1}`} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </article>

      {related.length > 0 && (
        <section className="mt-10">
          <h2 className="text-xl font-bold text-[#17212B] mb-5">{tx('Boshqa yangiliklar')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {related.map((r) => (
              <Link
                key={r.id}
                to={`/news/${r.id}`}
                className="bg-white rounded-2xl border border-[#E5ECE8] overflow-hidden hover:shadow-sm transition-all flex flex-col"
              >
                <div className="aspect-[4/3] bg-[#F5F8FA]">
                  <MediaImage src={r.image_url} alt={tx(r.title)} />
                </div>
                <div className="p-4 flex-1 flex flex-col">
                  <span className="text-xs text-[#718096] tabular-nums">{formatUzDate(r.published_at)}</span>
                  <h3 className="text-sm font-bold text-[#17212B] mt-1 line-clamp-2">{tx(r.title)}</h3>
                  <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-[#078A59]">
                    {t('details')}
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
