import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BarChart3, CheckCircle2, ChevronRight } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';
import { api } from '../services/api';
import { useLang } from '../context/LangContext';
import { useAuth } from '../context/AuthContext';
import { PollItem } from '../types';

export function PollsPage() {
  const { t, tx } = useLang();
  const { user } = useAuth();
  const [polls, setPolls] = useState<PollItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  const loadPolls = () => {
    setLoading(true);
    api
      .get<{ items: PollItem[] }>('/polls')
      .then((res) => setPolls(res.data.items))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadPolls();
  }, [user?.id]);

  const handleVote = async (pollId: number, optionId: number) => {
    setMessage('');
    if (!user) {
      setMessage(tx("Ovoz berish uchun tizimga kiring."));
      return;
    }
    try {
      await api.post(`/polls/${pollId}/vote`, { option_id: optionId });
      setMessage(tx('Ovozingiz qabul qilindi!'));
      loadPolls();
    } catch (err: any) {
      setMessage(err?.response?.data?.error || tx('Ovoz berishda xatolik'));
    }
  };

  return (
    <div>
      <section className="bg-[#E8F7F0] border-b border-[#D2EFE1]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white text-[#078A59] border border-[#C6EBDA] flex items-center justify-center shrink-0">
              <BarChart3 className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-[#17212B]">{t('navPolls')}</h1>
              <p className="text-sm text-[#064B3C] mt-0.5">
                {tx("Mahalla rivoji bo'yicha aholi fikrini o'rganish")}
              </p>
            </div>
          </div>
          <nav className="flex items-center gap-1.5 text-xs text-[#718096]">
            <Link to="/" className="hover:text-[#078A59]">
              {t('navHome')}
            </Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="font-semibold text-[#17212B]">{t('navPolls')}</span>
          </nav>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 space-y-6">
        {message && (
          <div className="p-4 rounded-xl bg-[#E8F7F0] border border-[#BCE8D4] text-sm font-medium text-[#064B3C]">
            {message}
          </div>
        )}

        {loading ? (
          <div className="h-64 bg-white rounded-2xl border border-[#E5ECE8] animate-pulse" />
        ) : polls.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#E5ECE8] p-12 text-center text-sm text-[#718096]">
            {t('noData')}
          </div>
        ) : (
          polls.map((poll) => {
            const chartData = poll.options.map((o) => ({
              name: tx(o.option_text),
              votes: o.votes,
            }));
            const voted = Boolean(poll.user_voted_option_id);

            return (
              <div
                key={poll.id}
                className="bg-white rounded-2xl border border-[#E5ECE8] p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center"
              >
                <div className="lg:col-span-6">
                  <div className="text-xs font-semibold text-[#078A59] mb-1">
                    {poll.is_active ? tx("Faol so'rovnoma") : tx('Yakunlangan')}
                  </div>
                  <h2 className="text-lg font-bold text-[#17212B]">{tx(poll.question)}</h2>
                  {poll.description && (
                    <p className="text-xs text-[#718096] mt-1">{tx(poll.description)}</p>
                  )}

                  <div className="mt-4 space-y-2.5">
                    {poll.options.map((opt) => {
                      const pct =
                        poll.total_votes > 0 ? Math.round((opt.votes / poll.total_votes) * 100) : 0;
                      const isChosen = poll.user_voted_option_id === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          disabled={voted || !poll.is_active}
                          onClick={() => handleVote(poll.id, opt.id)}
                          className={`w-full text-left relative overflow-hidden rounded-xl border p-3.5 transition-colors ${
                            isChosen
                              ? 'border-[#078A59] bg-[#E8F7F0]/50'
                              : 'border-[#E5ECE8] hover:border-[#078A59]/50'
                          }`}
                        >
                          <div
                            className="absolute inset-y-0 left-0 bg-[#E8F7F0] transition-all duration-300"
                            style={{ width: `${voted || !poll.is_active ? pct : 0}%` }}
                          />
                          <div className="relative z-10 flex items-center justify-between gap-2 text-sm font-medium">
                            <span className="flex items-center gap-2 text-[#17212B]">
                              {isChosen && <CheckCircle2 className="w-4 h-4 text-[#078A59] shrink-0" />}
                              {tx(opt.option_text)}
                            </span>
                            <span className="text-xs font-bold text-[#064B3C] tabular-nums">
                              {opt.votes} ({pct}%)
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  <p className="mt-3 text-xs text-[#718096] tabular-nums">
                    {tx(`Jami ovozlar: ${poll.total_votes}`)}
                  </p>
                </div>

                <div className="lg:col-span-6 h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} layout="vertical" margin={{ left: 10, right: 20 }}>
                      <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                      <YAxis
                        type="category"
                        dataKey="name"
                        width={130}
                        tick={{ fontSize: 11, fill: '#17212B' }}
                      />
                      <Tooltip />
                      <Bar dataKey="votes" radius={[0, 6, 6, 0]}>
                        {chartData.map((_, i) => (
                          <Cell key={i} fill={i % 2 === 0 ? '#078A59' : '#18A66A'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            );
          })
        )}
      </section>
    </div>
  );
}
