import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CalendarDays, Clock, MapPin, Users, ChevronRight, CheckCircle2 } from 'lucide-react';
import { api } from '../services/api';
import { useLang } from '../context/LangContext';
import { useAuth } from '../context/AuthContext';
import { getMonthShortUz } from '../components/StatusLabel';
import { EventItem } from '../types';

export function EventsPage() {
  const { lang, t, tx } = useLang();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming');
  const [upcoming, setUpcoming] = useState<EventItem[]>([]);
  const [past, setPast] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [feedback, setFeedback] = useState('');

  const loadEvents = () => {
    setLoading(true);
    api
      .get<{ upcoming: EventItem[]; past: EventItem[] }>('/events')
      .then((res) => {
        setUpcoming(res.data.upcoming);
        setPast(res.data.past);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadEvents();
  }, [user?.id]);

  const handleToggleRegister = async (ev: EventItem) => {
    if (!user) {
      navigate('/login');
      return;
    }
    setBusyId(ev.id);
    setFeedback('');
    try {
      if (ev.is_registered) {
        await api.delete(`/events/${ev.id}/register`);
        setFeedback(tx(`"${ev.title}" tadbiridan ro'yxatdan chiqdingiz.`));
      } else {
        await api.post(`/events/${ev.id}/register`);
        setFeedback(tx(`"${ev.title}" tadbiriga muvaffaqiyatli ro'yxatdan o'tdingiz!`));
      }
      loadEvents();
    } catch (err: any) {
      setFeedback(err?.response?.data?.error || tx('Xatolik yuz berdi'));
    } finally {
      setBusyId(null);
    }
  };

  const list = tab === 'upcoming' ? upcoming : past;

  return (
    <div>
      {/* Header Banner */}
      <section className="bg-[#E8F7F0] border-b border-[#D2EFE1]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white text-[#078A59] border border-[#C6EBDA] flex items-center justify-center shrink-0">
              <CalendarDays className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-[#17212B]">{t('navEvents')}</h1>
              <p className="text-sm text-[#064B3C] mt-0.5">{t('upcomingEvents')}</p>
            </div>
          </div>
          <nav className="flex items-center gap-1.5 text-xs text-[#718096]">
            <Link to="/" className="hover:text-[#078A59]">
              {t('navHome')}
            </Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="font-semibold text-[#17212B]">{t('navEvents')}</span>
          </nav>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        {/* Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="inline-flex bg-white border border-[#E5ECE8] rounded-xl p-1">
            <button
              type="button"
              onClick={() => setTab('upcoming')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${
                tab === 'upcoming' ? 'bg-[#078A59] text-white' : 'text-[#718096] hover:text-[#17212B]'
              }`}
            >
              {t('upcomingEvents')} ({upcoming.length})
            </button>
            <button
              type="button"
              onClick={() => setTab('past')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${
                tab === 'past' ? 'bg-[#078A59] text-white' : 'text-[#718096] hover:text-[#17212B]'
              }`}
            >
              {t('pastEvents')} ({past.length})
            </button>
          </div>
        </div>

        {feedback && (
          <div className="mb-4 px-4 py-3 rounded-xl bg-[#E8F7F0] border border-[#BCE8D4] text-sm font-medium text-[#064B3C]">
            {feedback}
          </div>
        )}

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-white rounded-2xl border border-[#E5ECE8] animate-pulse" />
            ))}
          </div>
        ) : list.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#E5ECE8] p-12 text-center text-sm text-[#718096]">
            {t('noData')}
          </div>
        ) : (
          <div className="space-y-3.5">
            {list.map((ev) => {
              const { day, month } = getMonthShortUz(ev.event_date, lang === 'cyr');
              return (
                <div
                  key={ev.id}
                  className="bg-white rounded-2xl border border-[#E5ECE8] p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:shadow-xs transition-all"
                >
                  <div className="flex items-start sm:items-center gap-4 min-w-0">
                    <div className="w-16 h-16 rounded-2xl bg-[#E8F7F0] text-[#064B3C] flex flex-col items-center justify-center shrink-0">
                      <span className="text-xl font-extrabold leading-none tabular-nums">{day}</span>
                      <span className="text-xs font-semibold mt-1">{month}</span>
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-[#078A59]">{tx(ev.category)}</div>
                      <h2 className="text-lg font-bold text-[#17212B] mt-0.5">{tx(ev.title)}</h2>
                      <p className="text-xs sm:text-sm text-[#718096] mt-1 line-clamp-2">
                        {tx(ev.description)}
                      </p>
                      <div className="flex flex-wrap items-center gap-4 mt-2.5 text-xs text-[#718096]">
                        <span className="inline-flex items-center gap-1 tabular-nums">
                          <Clock className="w-3.5 h-3.5 text-[#078A59]" />
                          {ev.event_time}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-[#078A59]" />
                          {tx(ev.location)}
                        </span>
                        <span className="inline-flex items-center gap-1 tabular-nums">
                          <Users className="w-3.5 h-3.5 text-[#078A59]" />
                          {ev.participants_count} / {ev.capacity}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center gap-2 self-start md:self-center">
                    {ev.is_past ? (
                      <span className="px-4 py-2 rounded-xl bg-[#F5F8FA] border border-[#E5ECE8] text-xs font-semibold text-[#718096]">
                        {tx("O'tkazildi")}
                      </span>
                    ) : ev.is_registered ? (
                      <button
                        type="button"
                        disabled={busyId === ev.id}
                        onClick={() => handleToggleRegister(ev)}
                        className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#E8F7F0] text-[#064B3C] border border-[#BCE8D4] hover:bg-red-50 hover:text-red-700 hover:border-red-200 text-xs font-semibold transition-colors whitespace-nowrap"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>{t('registered')}</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={busyId === ev.id}
                        onClick={() => handleToggleRegister(ev)}
                        className="px-5 py-2.5 rounded-xl bg-[#078A59] hover:bg-[#064B3C] text-white text-xs font-semibold transition-colors whitespace-nowrap"
                      >
                        {busyId === ev.id ? '...' : t('participate')}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
