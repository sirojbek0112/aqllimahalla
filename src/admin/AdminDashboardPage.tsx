import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Users, MessageSquareText, CalendarDays, FileText, ArrowRight } from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
} from 'recharts';
import { AdminLayout } from '../layouts/AdminLayout';
import { api } from '../services/api';
import { useLang } from '../context/LangContext';
import { AppealStatusText, formatUzDateTime } from '../components/StatusLabel';

interface DashboardPayload {
  kpis: {
    population_count: number;
    registered_citizens: number;
    appeals_count: number;
    events_count: number;
    announcements_count: number;
    news_count: number;
  };
  statusCounts: Array<{ status: string; count: number }>;
  monthlySeries: Array<{ month: string; murojaatlar: number }>;
  eventsSeries: Array<{ name: string; ishtirokchilar: number; sigim: number }>;
  latestAppeals: Array<{
    id: number;
    tracking_number: string;
    subject: string;
    status: string;
    created_at: string;
    citizen_name: string;
    category_name: string;
  }>;
}

export function AdminDashboardPage() {
  const { t, tx } = useLang();
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardPayload | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<DashboardPayload>('/admin/dashboard')
      .then((res) => setData(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const statusLabels: Record<string, string> = {
    yangi: t('statusYangi'),
    korib_chiqilmoqda: t('statusKorib'),
    jarayonda: t('statusJarayonda'),
    javob_berildi: t('statusJavob'),
    yopildi: t('statusYopildi'),
  };

  const statusChartData = (data?.statusCounts || []).map((s) => ({
    name: statusLabels[s.status] || s.status,
    soni: s.count,
  }));

  const cards = [
    {
      label: t('populationCount'),
      value: data?.kpis.population_count ?? 0,
      icon: Users,
      bg: 'bg-sky-50 text-sky-600',
    },
    {
      label: t('navAppeals'),
      value: data?.kpis.appeals_count ?? 0,
      icon: MessageSquareText,
      bg: 'bg-[#E8F7F0] text-[#078A59]',
    },
    {
      label: t('navEvents'),
      value: data?.kpis.events_count ?? 0,
      icon: CalendarDays,
      bg: 'bg-amber-50 text-amber-600',
    },
    {
      label: t('navAnnouncements'),
      value: data?.kpis.announcements_count ?? 0,
      icon: FileText,
      bg: 'bg-purple-50 text-purple-600',
    },
  ];

  return (
    <AdminLayout title="Boshqaruv paneli">
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-white rounded-2xl border border-[#E5ECE8] animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          {/* 4 Large Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {cards.map((c) => {
              const Icon = c.icon;
              return (
                <div
                  key={c.label}
                  className="bg-white rounded-2xl border border-[#E5ECE8] p-5 flex items-center gap-4 shadow-2xs"
                >
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${c.bg}`}
                  >
                    <Icon className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-2xl font-extrabold text-[#17212B] tabular-nums leading-none">
                      {c.value.toLocaleString('uz-UZ')}
                    </div>
                    <div className="text-xs font-medium text-[#718096] mt-1.5">{c.label}</div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Row 2: Monthly Appeals Chart + Latest Appeals Table */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-6 bg-white rounded-2xl border border-[#E5ECE8] p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-bold text-[#17212B]">
                  {tx('Murojaatlar statistikasi (oylar kesimida)')}
                </h2>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data?.monthlySeries || []}>
                    <defs>
                      <linearGradient id="murojaatGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#078A59" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#078A59" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5ECE8" />
                    <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#718096' }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#718096' }} />
                    <Tooltip />
                    <Area
                      type="monotone"
                      dataKey="murojaatlar"
                      stroke="#078A59"
                      strokeWidth={2.5}
                      fill="url(#murojaatGrad)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="lg:col-span-6 bg-white rounded-2xl border border-[#E5ECE8] p-6 flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-bold text-[#17212B]">{tx("So'nggi murojaatlar")}</h2>
                <Link
                  to="/admin/appeals"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-[#078A59] hover:text-[#064B3C]"
                >
                  <span>{tx("Barchasini ko'rish")}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="overflow-x-auto flex-1">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="text-xs text-[#718096] border-b border-[#E5ECE8]">
                      <th className="py-2 pr-3">№</th>
                      <th className="py-2 pr-3">{tx('Mavzu')}</th>
                      <th className="py-2 pr-3">{tx('Fuqaro')}</th>
                      <th className="py-2 pr-3">{tx('Holat')}</th>
                      <th className="py-2 text-right">{tx('Sana')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5ECE8] text-xs">
                    {(data?.latestAppeals || []).map((a, idx) => (
                      <tr
                        key={a.id}
                        onClick={() => navigate(`/admin/appeals?id=${a.id}`)}
                        className="hover:bg-[#F5F8FA] cursor-pointer transition-colors"
                      >
                        <td className="py-3 pr-3 font-mono text-[#718096] tabular-nums">
                          {idx + 1}
                        </td>
                        <td className="py-3 pr-3 font-semibold text-[#17212B] max-w-[160px] truncate">
                          {tx(a.subject)}
                        </td>
                        <td className="py-3 pr-3 text-[#718096] whitespace-nowrap">
                          {tx(a.citizen_name)}
                        </td>
                        <td className="py-3 pr-3">
                          <AppealStatusText status={a.status} />
                        </td>
                        <td className="py-3 text-right text-[#718096] tabular-nums whitespace-nowrap">
                          {formatUzDateTime(a.created_at)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Row 3: Appeals by Status + Events Participation */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-6 bg-white rounded-2xl border border-[#E5ECE8] p-6">
              <h2 className="text-base font-bold text-[#17212B] mb-4">
                {tx('Murojaatlar holati')}
              </h2>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={statusChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5ECE8" />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#718096' }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#718096' }} />
                    <Tooltip />
                    <Bar dataKey="soni" fill="#18A66A" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="lg:col-span-6 bg-white rounded-2xl border border-[#E5ECE8] p-6">
              <h2 className="text-base font-bold text-[#17212B] mb-4">
                {tx('Tadbirlar statistikasi (ishtirokchilar)')}
              </h2>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data?.eventsSeries || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5ECE8" />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#718096' }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#718096' }} />
                    <Tooltip />
                    <Bar dataKey="ishtirokchilar" fill="#078A59" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
