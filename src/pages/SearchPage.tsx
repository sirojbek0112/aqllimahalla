import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, Newspaper, Megaphone, CalendarDays, Building2 } from 'lucide-react';
import { api } from '../services/api';
import { useLang } from '../context/LangContext';
import { formatUzDate } from '../components/StatusLabel';

export function SearchPage() {
  const { t, tx } = useLang();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQ = searchParams.get('q') || '';
  const [query, setQuery] = useState(initialQ);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{
    news: any[];
    announcements: any[];
    events: any[];
    mahalla: any | null;
  }>({ news: [], announcements: [], events: [], mahalla: null });

  const runSearch = (qStr: string) => {
    if (!qStr.trim()) {
      setResults({ news: [], announcements: [], events: [], mahalla: null });
      return;
    }
    setLoading(true);
    api
      .get('/search', { params: { q: qStr } })
      .then((res) => setResults(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    const q = searchParams.get('q') || '';
    setQuery(q);
    runSearch(q);
  }, [searchParams]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchParams(query.trim() ? { q: query.trim() } : {});
  };

  const total =
    results.news.length +
    results.announcements.length +
    results.events.length +
    (results.mahalla ? 1 : 0);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="bg-white rounded-2xl border border-[#E5ECE8] p-6">
        <h1 className="text-xl font-bold text-[#17212B] mb-4">{tx("Sayt bo'ylab qidiruv")}</h1>
        <form onSubmit={handleSubmit} className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#718096] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('searchPlaceholder')}
              className="w-full pl-10 pr-4 py-3 border border-[#E5ECE8] rounded-xl text-sm outline-none focus:border-[#078A59]"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-3 rounded-xl bg-[#078A59] hover:bg-[#064B3C] text-white text-sm font-semibold transition-colors"
          >
            {tx('Izlash')}
          </button>
        </form>
      </div>

      {loading ? (
        <div className="p-8 text-center text-sm text-[#718096]">{t('loading')}</div>
      ) : (
        <div className="space-y-6">
          {searchParams.get('q') && (
            <p className="text-xs text-[#718096]">
              {tx(`Topilgan natijalar: ${total}`)}
            </p>
          )}

          {results.news.length > 0 && (
            <div className="bg-white rounded-2xl border border-[#E5ECE8] p-5">
              <div className="flex items-center gap-2 text-sm font-bold text-[#064B3C] mb-3">
                <Newspaper className="w-4 h-4 text-[#078A59]" />
                <span>{t('navNews')}</span>
              </div>
              <div className="divide-y divide-[#E5ECE8]">
                {results.news.map((n) => (
                  <Link
                    key={n.id}
                    to={`/news/${n.id}`}
                    className="block py-3 hover:text-[#078A59] transition-colors"
                  >
                    <div className="text-sm font-semibold">{tx(n.title)}</div>
                    <div className="text-xs text-[#718096] mt-0.5 line-clamp-1">{tx(n.summary)}</div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {results.announcements.length > 0 && (
            <div className="bg-white rounded-2xl border border-[#E5ECE8] p-5">
              <div className="flex items-center gap-2 text-sm font-bold text-[#064B3C] mb-3">
                <Megaphone className="w-4 h-4 text-[#078A59]" />
                <span>{t('navAnnouncements')}</span>
              </div>
              <div className="divide-y divide-[#E5ECE8]">
                {results.announcements.map((a) => (
                  <Link
                    key={a.id}
                    to={`/announcements?highlight=${a.id}`}
                    className="block py-3 hover:text-[#078A59] transition-colors"
                  >
                    <div className="text-sm font-semibold">{tx(a.title)}</div>
                    <div className="text-xs text-[#718096] mt-0.5 tabular-nums">
                      {formatUzDate(a.published_at)}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {results.events.length > 0 && (
            <div className="bg-white rounded-2xl border border-[#E5ECE8] p-5">
              <div className="flex items-center gap-2 text-sm font-bold text-[#064B3C] mb-3">
                <CalendarDays className="w-4 h-4 text-[#078A59]" />
                <span>{t('navEvents')}</span>
              </div>
              <div className="divide-y divide-[#E5ECE8]">
                {results.events.map((ev) => (
                  <Link key={ev.id} to="/events" className="block py-3 hover:text-[#078A59]">
                    <div className="text-sm font-semibold">{tx(ev.title)}</div>
                    <div className="text-xs text-[#718096] mt-0.5 tabular-nums">
                      {ev.event_date} · {ev.event_time} · {tx(ev.location)}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {results.mahalla && (
            <div className="bg-white rounded-2xl border border-[#E5ECE8] p-5">
              <div className="flex items-center gap-2 text-sm font-bold text-[#064B3C] mb-2">
                <Building2 className="w-4 h-4 text-[#078A59]" />
                <span>{t('navAbout')}</span>
              </div>
              <Link to="/about" className="text-sm font-semibold text-[#078A59] hover:underline">
                {tx(results.mahalla.mahalla_name)} — {tx(results.mahalla.address)}
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
