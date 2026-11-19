import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Newspaper,
  Megaphone,
  MessageSquareText,
  CalendarDays,
  ArrowRight,
  Users,
  FileText,
  MessageCircle,
  Clock,
  MapPin,
  CheckCircle2,
  BarChart3,
  Phone,
  Building2,
} from 'lucide-react';
import { api } from '../services/api';
import { useLang } from '../context/LangContext';
import { useAuth } from '../context/AuthContext';
import { MediaImage } from '../components/MediaImage';
import { formatUzDate, getMonthShortUz } from '../components/StatusLabel';
import { AnnouncementItem, EventItem, MahallaSettings, NewsItem, PollItem } from '../types';

interface HomePayload {
  settings: MahallaSettings;
  stats: {
    population_count: number;
    registered_citizens: number;
    new_announcements: number;
    appeals_count: number;
    upcoming_events_count: number;
  };
  latestNews: NewsItem[];
  upcomingEvents: EventItem[];
  importantAnnouncements: AnnouncementItem[];
  activePoll: (PollItem & { total_votes?: number }) | null;
}

export function HomePage() {
  const { lang, t, tx } = useLang();
  const { user } = useAuth();
  const [data, setData] = useState<HomePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [voteError, setVoteError] = useState('');
  const [voting, setVoting] = useState(false);

  const loadHome = () => {
    api
      .get<HomePayload>('/home')
      .then((res) => setData(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadHome();
  }, [user?.id]);

  const handleVote = async (pollId: number, optionId: number) => {
    setVoteError('');
    if (!user) {
      setVoteError(tx("Ovoz berish uchun avval tizimga kiring"));
      return;
    }
    setVoting(true);
    try {
      await api.post(`/polls/${pollId}/vote`, { option_id: optionId });
      loadHome();
    } catch (err: any) {
      setVoteError(err?.response?.data?.error || tx('Ovoz berishda xatolik'));
    } finally {
      setVoting(false);
    }
  };

  const settings = data?.settings;
  const stats = data?.stats;

  const quickServices = [
    {
      to: '/news',
      title: t('navNews'),
      desc: t('quickNewsDesc'),
      icon: Newspaper,
      iconBg: 'bg-[#E8F7F0] text-[#078A59]',
    },
    {
      to: '/announcements',
      title: t('navAnnouncements'),
      desc: t('quickAnnDesc'),
      icon: Megaphone,
      iconBg: 'bg-[#E8F7F0] text-[#078A59]',
    },
    {
      to: '/appeals',
      title: t('navAppeals'),
      desc: t('quickAppDesc'),
      icon: MessageSquareText,
      iconBg: 'bg-[#E8F7F0] text-[#078A59]',
    },
    {
      to: '/events',
      title: t('navEvents'),
      desc: t('quickEvtDesc'),
      icon: CalendarDays,
      iconBg: 'bg-[#E8F7F0] text-[#078A59]',
    },
  ];

  const pollTotal = data?.activePoll
    ? data.activePoll.options.reduce((sum, o) => sum + o.votes, 0)
    : 0;

  return (
    <div className="pb-6">
      {/* HERO BANNER */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <div className="relative rounded-2xl overflow-hidden border border-[#E5ECE8] bg-white shadow-sm min-h-[380px] lg:min-h-[420px] flex items-center">
          <img
            src="/src/assets/images/hero_mahalla_park_1794910575937.jpg"
            alt="AqlliMahalla hududi"
            className="absolute inset-0 w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-white/95 via-white/85 to-white/15 md:via-white/75" />

          <div className="relative z-10 w-full p-6 sm:p-10 lg:p-12 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
            <div className="max-w-xl">
              <p className="text-xs font-semibold tracking-wide text-[#078A59] mb-2">
                {tx(settings?.mahalla_name || 'Batosh MFY')} · {tx('Raqamli mahalla portali')}
              </p>
              <h1 className="text-4xl sm:text-5xl font-extrabold text-[#17212B] tracking-tight leading-tight">
                {t('brand')}
              </h1>
              <p className="mt-2.5 text-lg sm:text-xl font-bold text-[#064B3C] text-balance">
                {tx(settings?.tagline || 'Mahallamiz — endi bir qadam yaqinroq!')}
              </p>
              <p className="mt-3 text-sm sm:text-base text-[#17212B]/80 leading-relaxed max-w-md">
                {tx(
                  settings?.hero_description ||
                    'Yangiliklardan xabardor bo‘ling, murojaat qiling va mahalla hayotida faol ishtirok eting.'
                )}
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <Link
                  to="/news"
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#078A59] hover:bg-[#064B3C] text-white text-sm font-semibold transition-colors shadow-xs"
                >
                  <span>{t('viewNews')}</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  to="/appeals"
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white hover:bg-[#F5F8FA] text-[#17212B] border border-[#E5ECE8] text-sm font-semibold transition-colors shadow-xs"
                >
                  <span>{t('sendAppeal')}</span>
                </Link>
              </div>
            </div>

            {/* Right Floating Stats Card */}
            <div className="w-full lg:w-72 bg-white/95 backdrop-blur rounded-2xl border border-[#E5ECE8] shadow-md p-5 shrink-0">
              <h2 className="text-sm font-bold text-[#17212B] pb-3 border-b border-[#E5ECE8]">
                {t('todaysInfo')}
              </h2>
              <div className="mt-3 space-y-3.5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xl font-extrabold text-[#17212B] tabular-nums leading-none">
                      {loading ? '—' : stats?.population_count.toLocaleString('uz-UZ')}
                    </div>
                    <div className="text-xs text-[#718096] mt-1">{t('populationCount')}</div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#E8F7F0] text-[#078A59] flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xl font-extrabold text-[#17212B] tabular-nums leading-none">
                      {loading ? '—' : stats?.new_announcements}
                    </div>
                    <div className="text-xs text-[#718096] mt-1">{t('newAnnouncements')}</div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                    <MessageCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xl font-extrabold text-[#17212B] tabular-nums leading-none">
                      {loading ? '—' : stats?.appeals_count}
                    </div>
                    <div className="text-xs text-[#718096] mt-1">{t('appealsCount')}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4 QUICK SERVICE CARDS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickServices.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className="group bg-white rounded-2xl border border-[#E5ECE8] p-5 flex items-center gap-4 hover:border-[#078A59]/50 hover:shadow-sm transition-all"
              >
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${item.iconBg}`}
                >
                  <Icon className="w-6 h-6" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-base font-bold text-[#17212B] group-hover:text-[#078A59] transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-xs text-[#718096] mt-0.5 truncate">{item.desc}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ANNOUNCEMENT BAR */}
      {settings?.banner_text && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
          <div className="bg-[#E8F7F0] border border-[#C6EBDA] rounded-2xl px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-lg bg-white text-[#078A59] flex items-center justify-center shrink-0 border border-[#C6EBDA]">
                <Megaphone className="w-4 h-4" />
              </div>
              <p className="text-sm font-semibold text-[#064B3C] leading-snug">
                {tx(settings.banner_text)}
              </p>
            </div>
            <Link
              to={settings.banner_link || '/announcements'}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#078A59] hover:bg-[#064B3C] text-white text-xs font-semibold transition-colors whitespace-nowrap shrink-0 self-start sm:self-auto"
            >
              <span>{t('details')}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </section>
      )}

      {/* LATEST NEWS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
        <div className="flex items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold text-[#17212B]">{t('latestNews')}</h2>
            <p className="text-sm text-[#718096] mt-0.5">
              {tx('Mahalla hayotidagi muhim voqealar va yangilanishlar')}
            </p>
          </div>
          <Link
            to="/news"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#078A59] hover:text-[#064B3C] whitespace-nowrap"
          >
            <span>{t('all')}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {(data?.latestNews || []).map((item) => (
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
                <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/70 to-transparent" />
                <span className="absolute bottom-3 left-3 text-xs font-medium text-white tabular-nums">
                  {formatUzDate(item.published_at)}
                </span>
              </div>
              <div className="p-5 flex-1 flex flex-col">
                <div className="text-xs font-medium text-[#718096] mb-1.5">
                  {tx(item.category_name)}
                </div>
                <h3 className="text-base font-bold text-[#17212B] group-hover:text-[#078A59] transition-colors line-clamp-2">
                  {tx(item.title)}
                </h3>
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
      </section>

      {/* UPCOMING EVENTS + IMPORTANT ANNOUNCEMENTS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Upcoming Events (7 cols) */}
        <div className="lg:col-span-7">
          <div className="flex items-center justify-between gap-4 mb-5">
            <h2 className="text-xl font-bold text-[#17212B]">{t('upcomingEvents')}</h2>
            <Link
              to="/events"
              className="inline-flex items-center gap-1 text-sm font-semibold text-[#078A59] hover:text-[#064B3C]"
            >
              <span>{t('all')}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="space-y-3">
            {(data?.upcomingEvents || []).map((ev) => {
              const { day, month } = getMonthShortUz(ev.event_date, lang === 'cyr');
              return (
                <div
                  key={ev.id}
                  className="bg-white rounded-2xl border border-[#E5ECE8] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-[#078A59]/40 transition-colors"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-14 h-14 rounded-xl bg-[#E8F7F0] text-[#064B3C] flex flex-col items-center justify-center shrink-0">
                      <span className="text-lg font-extrabold leading-none tabular-nums">{day}</span>
                      <span className="text-xs font-medium mt-1">{month}</span>
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-base font-bold text-[#17212B] truncate">{tx(ev.title)}</h3>
                      <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-[#718096]">
                        <span className="inline-flex items-center gap-1 tabular-nums">
                          <Clock className="w-3.5 h-3.5 text-[#078A59]" />
                          {ev.event_time}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-[#078A59]" />
                          {tx(ev.location)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Link
                    to="/events"
                    className="px-4 py-2 rounded-xl bg-[#078A59] hover:bg-[#064B3C] text-white text-xs font-semibold transition-colors whitespace-nowrap self-start sm:self-center"
                  >
                    {t('participate')}
                  </Link>
                </div>
              );
            })}
          </div>
        </div>

        {/* Important Announcements + Active Poll (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div>
            <div className="flex items-center justify-between gap-4 mb-5">
              <h2 className="text-xl font-bold text-[#17212B]">{t('importantAnnouncements')}</h2>
              <Link
                to="/announcements"
                className="inline-flex items-center gap-1 text-sm font-semibold text-[#078A59]"
              >
                <span>{t('all')}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="bg-white rounded-2xl border border-[#E5ECE8] divide-y divide-[#E5ECE8]">
              {(data?.importantAnnouncements || []).map((ann) => (
                <Link
                  key={ann.id}
                  to={`/announcements?highlight=${ann.id}`}
                  className="block p-4 hover:bg-[#F5F8FA] transition-colors"
                >
                  <div className="flex items-center justify-between gap-2 text-xs text-[#718096] mb-1">
                    <span className="font-semibold text-[#078A59]">{tx(ann.category_name)}</span>
                    <span className="tabular-nums">{formatUzDate(ann.published_at)}</span>
                  </div>
                  <h3 className="text-sm font-bold text-[#17212B] line-clamp-2">
                    {tx(ann.title)}
                  </h3>
                </Link>
              ))}
            </div>
          </div>

          {/* Active Poll Card */}
          {data?.activePoll && (
            <div className="bg-white rounded-2xl border border-[#E5ECE8] p-5">
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-[#078A59]">
                  <BarChart3 className="w-4 h-4" />
                  <span>{t('navPolls')}</span>
                </div>
                <Link to="/polls" className="text-xs font-semibold text-[#078A59] hover:underline">
                  {t('all')}
                </Link>
              </div>
              <h3 className="text-base font-bold text-[#17212B]">{tx(data.activePoll.question)}</h3>
              <div className="mt-4 space-y-2.5">
                {data.activePoll.options.map((opt) => {
                  const pct = pollTotal > 0 ? Math.round((opt.votes / pollTotal) * 100) : 0;
                  const chosen = data.activePoll?.user_voted_option_id === opt.id;
                  const alreadyVoted = Boolean(data.activePoll?.user_voted_option_id);

                  return (
                    <button
                      key={opt.id}
                      type="button"
                      disabled={voting || alreadyVoted}
                      onClick={() => handleVote(data.activePoll!.id, opt.id)}
                      className={`w-full text-left relative overflow-hidden rounded-xl border p-3 transition-colors ${
                        chosen
                          ? 'border-[#078A59] bg-[#E8F7F0]/50'
                          : 'border-[#E5ECE8] hover:border-[#078A59]/50 bg-[#F5F8FA]/60'
                      }`}
                    >
                      <div
                        className="absolute inset-y-0 left-0 bg-[#E8F7F0] transition-all duration-300"
                        style={{ width: `${alreadyVoted ? pct : 0}%` }}
                      />
                      <div className="relative z-10 flex items-center justify-between gap-3 text-xs font-medium">
                        <span className="flex items-center gap-1.5 text-[#17212B]">
                          {chosen && <CheckCircle2 className="w-3.5 h-3.5 text-[#078A59] shrink-0" />}
                          {tx(opt.option_text)}
                        </span>
                        {alreadyVoted && (
                          <span className="font-bold text-[#064B3C] tabular-nums">{pct}%</span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
              {voteError && <p className="mt-2.5 text-xs text-red-600">{voteError}</p>}
              <p className="mt-3 text-xs text-[#718096] tabular-nums">
                {tx(`Jami ovozlar: ${pollTotal}`)}
              </p>
            </div>
          )}
        </div>
      </section>

      {/* ABOUT MAHALLA BRIEF & USEFUL LINKS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
        <div className="bg-white rounded-2xl border border-[#E5ECE8] p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-7">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#078A59] mb-2">
              <Building2 className="w-4 h-4" />
              <span>{t('navAbout')}</span>
            </div>
            <h2 className="text-2xl font-bold text-[#17212B]">
              {tx(settings?.mahalla_name || 'Batosh MFY')}
            </h2>
            <p className="mt-3 text-sm text-[#718096] leading-relaxed line-clamp-4">
              {tx(settings?.history || '')}
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-4 text-sm">
              <Link
                to="/about"
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#078A59] hover:bg-[#064B3C] text-white text-xs font-semibold transition-colors"
              >
                <span>{t('details')}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <Link
                to="/gallery"
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-[#E5ECE8] hover:bg-[#F5F8FA] text-[#17212B] text-xs font-semibold transition-colors"
              >
                <span>{t('navGallery')}</span>
              </Link>
            </div>
          </div>

          <div className="lg:col-span-5 bg-[#F5F8FA] rounded-xl p-5 border border-[#E5ECE8] space-y-3">
            <h3 className="text-sm font-bold text-[#17212B]">{tx("Foydali ma'lumotlar va aloqa")}</h3>
            <div className="text-xs text-[#718096] space-y-2">
              <div className="flex items-center justify-between gap-2 py-1.5 border-b border-[#E5ECE8]">
                <span>{tx('Mahalla raisi')}</span>
                <span className="font-semibold text-[#17212B]">{tx(settings?.chairman_name || '')}</span>
              </div>
              <div className="flex items-center justify-between gap-2 py-1.5 border-b border-[#E5ECE8]">
                <span>{tx('Ishonch telefoni')}</span>
                <span className="font-semibold text-[#078A59] tabular-nums inline-flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5" />
                  {settings?.phone}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2 py-1.5">
                <span>{tx('Qabul vaqti')}</span>
                <span className="font-semibold text-[#17212B] tabular-nums">09:00 – 18:00</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
