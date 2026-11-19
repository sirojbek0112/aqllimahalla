import { useEffect, useState } from 'react';
import { Download, ShieldAlert } from 'lucide-react';
import { AdminLayout } from '../layouts/AdminLayout';
import { api } from '../services/api';
import { useLang } from '../context/LangContext';
import { useAuth } from '../context/AuthContext';
import { formatUzDateTime } from '../components/StatusLabel';

interface AuditRow {
  id: number;
  actor_name: string | null;
  action: string;
  entity_type: string;
  entity_id: number | null;
  details: string;
  created_at: string;
}

export function AdminReportsPage() {
  const { tx } = useLang();
  const { isAdmin } = useAuth();
  const [logs, setLogs] = useState<AuditRow[]>([]);
  const [kpis, setKpis] = useState<Record<string, number>>({});

  useEffect(() => {
    api.get('/admin/dashboard').then((r) => setKpis(r.data.kpis || {})).catch(() => {});
    if (isAdmin) {
      api.get<{ logs: AuditRow[] }>('/admin/audit-logs').then((r) => setLogs(r.data.logs)).catch(() => {});
    }
  }, [isAdmin]);

  const downloadCsv = async () => {
    const res = await api.get('/admin/reports/csv', { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'aqllimahalla_murojaatlar.csv';
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  return (
    <AdminLayout title="Hisobotlar">
      <div className="space-y-6">
        <div className="bg-white rounded-2xl border border-[#E5ECE8] p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-[#17212B]">
              {tx("Murojaatlar va mahalla faoliyati bo'yicha hisobot")}
            </h2>
            <p className="text-xs text-[#718096] mt-1">
              {tx("Barcha murojaatlar ro'yxatini CSV (Excel) formatida yuklab oling")}
            </p>
          </div>
          <button
            type="button"
            onClick={downloadCsv}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#078A59] hover:bg-[#064B3C] text-white text-xs font-semibold transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>{tx('CSV hisobotni yuklab olish')}</span>
          </button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl border border-[#E5ECE8] p-5">
            <div className="text-xs text-[#718096]">{tx("Ro'yxatdan o'tgan fuqarolar")}</div>
            <div className="text-2xl font-extrabold text-[#17212B] mt-1 tabular-nums">
              {kpis.registered_citizens ?? 0}
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-[#E5ECE8] p-5">
            <div className="text-xs text-[#718096]">{tx('Jami murojaatlar')}</div>
            <div className="text-2xl font-extrabold text-[#17212B] mt-1 tabular-nums">
              {kpis.appeals_count ?? 0}
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-[#E5ECE8] p-5">
            <div className="text-xs text-[#718096]">{tx('Yangiliklar soni')}</div>
            <div className="text-2xl font-extrabold text-[#17212B] mt-1 tabular-nums">
              {kpis.news_count ?? 0}
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-[#E5ECE8] p-5">
            <div className="text-xs text-[#718096]">{tx('Tadbirlar soni')}</div>
            <div className="text-2xl font-extrabold text-[#17212B] mt-1 tabular-nums">
              {kpis.events_count ?? 0}
            </div>
          </div>
        </div>

        {isAdmin && (
          <div className="bg-white rounded-2xl border border-[#E5ECE8] overflow-hidden">
            <div className="px-6 py-4 border-b border-[#E5ECE8] flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-[#078A59]" />
              <h3 className="text-base font-bold text-[#17212B]">
                {tx('Admin harakatlari audit jurnali')}
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#F5F8FA] text-xs font-semibold text-[#718096] border-b border-[#E5ECE8]">
                    <th className="py-3 px-4">{tx('Xodim')}</th>
                    <th className="py-3 px-4">{tx('Harakat')}</th>
                    <th className="py-3 px-4">{tx("Bo'lim")}</th>
                    <th className="py-3 px-4">{tx('Tafsilot')}</th>
                    <th className="py-3 px-4">{tx('Vaqt')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5ECE8] text-xs">
                  {logs.map((l) => (
                    <tr key={l.id} className="hover:bg-[#F5F8FA]">
                      <td className="py-3 px-4 font-semibold text-[#17212B]">
                        {tx(l.actor_name || 'Tizim')}
                      </td>
                      <td className="py-3 px-4 font-mono text-[#078A59]">{l.action}</td>
                      <td className="py-3 px-4 text-[#718096]">{l.entity_type}</td>
                      <td className="py-3 px-4 text-[#17212B] max-w-md truncate">{tx(l.details)}</td>
                      <td className="py-3 px-4 text-[#718096] tabular-nums whitespace-nowrap">
                        {formatUzDateTime(l.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
