import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Calendar, UserCheck, FileText, Clock, MessageCircle } from 'lucide-react';
import { api } from '../services/api';
import { useLang } from '../context/LangContext';
import { AppealStatusText, formatUzDateTime } from '../components/StatusLabel';
import { AppealHistoryItem, AppealItem, AppealResponse } from '../types';

export function AppealDetailPage() {
  const { id } = useParams();
  const { t, tx } = useLang();
  const [appeal, setAppeal] = useState<AppealItem | null>(null);
  const [responses, setResponses] = useState<AppealResponse[]>([]);
  const [history, setHistory] = useState<AppealHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    api
      .get<{ appeal: AppealItem; responses: AppealResponse[]; history: AppealHistoryItem[] }>(
        `/appeals/${id}`
      )
      .then((res) => {
        setAppeal(res.data.appeal);
        setResponses(res.data.responses);
        setHistory(res.data.history);
      })
      .catch((err) => setError(err?.response?.data?.error || tx('Murojaat topilmadi')))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="h-64 bg-white rounded-2xl border border-[#E5ECE8] animate-pulse" />
      </div>
    );
  }

  if (error || !appeal) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <p className="text-sm text-red-600">{error || t('noData')}</p>
        <Link to="/appeals" className="inline-flex items-center gap-2 mt-4 text-sm font-semibold text-[#078A59]">
          <ArrowLeft className="w-4 h-4" />
          {t('navAppeals')}
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <Link
        to="/appeals"
        className="inline-flex items-center gap-2 text-sm font-semibold text-[#078A59] hover:text-[#064B3C]"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>{t('navAppeals')}</span>
      </Link>

      {/* Main Appeal Card */}
      <div className="bg-white rounded-2xl border border-[#E5ECE8] p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4 pb-5 border-b border-[#E5ECE8]">
          <div>
            <span className="font-mono text-xs font-bold text-[#078A59] tabular-nums">
              {appeal.tracking_number}
            </span>
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#17212B] mt-1">
              {tx(appeal.subject)}
            </h1>
            <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-[#718096]">
              <span>{tx(appeal.category_name)}</span>
              <span aria-hidden="true">·</span>
              <span className="inline-flex items-center gap-1 tabular-nums">
                <Calendar className="w-3.5 h-3.5" />
                {formatUzDateTime(appeal.created_at)}
              </span>
              {appeal.assigned_name && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="inline-flex items-center gap-1">
                    <UserCheck className="w-3.5 h-3.5 text-[#078A59]" />
                    {tx(`Mas'ul: ${appeal.assigned_name}`)}
                  </span>
                </>
              )}
            </div>
          </div>
          <AppealStatusText status={appeal.status} />
        </div>

        <div className="mt-5">
          <h2 className="text-xs font-semibold text-[#718096] mb-2">{tx('Murojaat matni')}</h2>
          <p className="text-sm sm:text-base text-[#17212B] leading-relaxed whitespace-pre-line">
            {tx(appeal.message)}
          </p>
        </div>

        {appeal.attachment_url && (
          <div className="mt-5 pt-5 border-t border-[#E5ECE8]">
            <h3 className="text-xs font-semibold text-[#718096] mb-2">{tx('Biriktirilgan fayl')}</h3>
            {/\.(jpg|jpeg|png|webp|gif)$/i.test(appeal.attachment_url) ? (
              <img
                src={appeal.attachment_url}
                alt="Biriktirilgan rasm"
                className="max-h-72 rounded-xl border border-[#E5ECE8]"
              />
            ) : (
              <a
                href={appeal.attachment_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#F5F8FA] border border-[#E5ECE8] text-xs font-semibold text-[#078A59]"
              >
                <FileText className="w-4 h-4" />
                <span>{tx("Faylni ko'rish")}</span>
              </a>
            )}
          </div>
        )}
      </div>

      {/* Admin Responses */}
      <div className="bg-white rounded-2xl border border-[#E5ECE8] p-6">
        <div className="flex items-center gap-2 mb-4">
          <MessageCircle className="w-4 h-4 text-[#078A59]" />
          <h2 className="text-base font-bold text-[#17212B]">{tx("Mas'ul javoblari")}</h2>
        </div>

        {responses.length === 0 ? (
          <p className="text-sm text-[#718096]">{tx("Hozircha rasmiy javob yozilmagan.")}</p>
        ) : (
          <div className="space-y-4">
            {responses.map((r) => (
              <div key={r.id} className="p-4 rounded-xl bg-[#E8F7F0]/60 border border-[#C6EBDA]">
                <div className="flex items-center justify-between gap-2 text-xs text-[#064B3C] mb-1.5">
                  <span className="font-bold">{tx(r.responder_name || 'Mahalla mas’uli')}</span>
                  <span className="tabular-nums text-[#718096]">{formatUzDateTime(r.created_at)}</span>
                </div>
                <p className="text-sm text-[#17212B] leading-relaxed">{tx(r.response_text)}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Status History */}
      <div className="bg-white rounded-2xl border border-[#E5ECE8] p-6">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-4 h-4 text-[#078A59]" />
          <h2 className="text-base font-bold text-[#17212B]">{tx("Holat o'zgarishlari tarixi")}</h2>
        </div>
        <div className="space-y-3">
          {history.map((h) => (
            <div
              key={h.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 py-2.5 border-b last:border-b-0 border-[#E5ECE8]"
            >
              <div className="flex items-center gap-3">
                <AppealStatusText status={h.new_status} />
                <span className="text-xs text-[#17212B]">{tx(h.note || '')}</span>
              </div>
              <div className="text-xs text-[#718096] tabular-nums">
                {h.changed_by_name ? `${tx(h.changed_by_name)} · ` : ''}
                {formatUzDateTime(h.changed_at)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
