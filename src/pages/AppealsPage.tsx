import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  MessageSquareText,
  Plus,
  ChevronRight,
  Search,
  Upload,
  X,
  CheckCircle2,
} from 'lucide-react';
import { api, uploadFile } from '../services/api';
import { useLang } from '../context/LangContext';
import { useAuth } from '../context/AuthContext';
import { AppealStatusText, formatUzDate } from '../components/StatusLabel';
import { AppealCategory, AppealItem } from '../types';

export function AppealsPage() {
  const { t, tx } = useLang();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [categories, setCategories] = useState<AppealCategory[]>([]);
  const [appeals, setAppeals] = useState<AppealItem[]>([]);
  const [loading, setLoading] = useState(false);

  // Modal form state
  const [modalOpen, setModalOpen] = useState(false);
  const [subject, setSubject] = useState('');
  const [categoryId, setCategoryId] = useState<number>(1);
  const [message, setMessage] = useState('');
  const [attachmentUrl, setAttachmentUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [createdCode, setCreatedCode] = useState('');

  // Tracking lookup
  const [trackCode, setTrackCode] = useState('');
  const [trackResult, setTrackResult] = useState<{
    appeal: {
      id: number;
      tracking_number: string;
      subject: string;
      status: string;
      category_name: string;
      created_at: string;
      assigned_name?: string;
    };
    history: Array<{ new_status: string; note: string; changed_at: string }>;
  } | null>(null);
  const [trackError, setTrackError] = useState('');

  const loadMyAppeals = () => {
    if (!user) return;
    setLoading(true);
    api
      .get<{ items: AppealItem[] }>('/appeals')
      .then((res) => setAppeals(res.data.items))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    api.get<{ categories: AppealCategory[] }>('/appeals/categories').then((r) => {
      setCategories(r.data.categories);
      if (r.data.categories[0]) setCategoryId(r.data.categories[0].id);
    });
  }, []);

  useEffect(() => {
    loadMyAppeals();
  }, [user?.id]);

  const handleOpenNew = () => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (!user.profile_completed) {
      navigate('/complete-profile');
      return;
    }
    setError('');
    setModalOpen(true);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      const url = await uploadFile(file);
      setAttachmentUrl(url);
    } catch (err: any) {
      setError(err?.response?.data?.error || tx('Fayl yuklashda xatolik'));
    } finally {
      setUploading(false);
    }
  };

  const handleSubmitAppeal = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const res = await api.post<{ appeal: AppealItem }>('/appeals', {
        subject,
        category_id: categoryId,
        message,
        attachment_url: attachmentUrl,
      });
      setCreatedCode(res.data.appeal.tracking_number);
      setSubject('');
      setMessage('');
      setAttachmentUrl('');
      setModalOpen(false);
      loadMyAppeals();
    } catch (err: any) {
      setError(err?.response?.data?.error || tx('Murojaat yuborishda xatolik'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    setTrackError('');
    setTrackResult(null);
    if (!trackCode.trim()) return;
    try {
      const res = await api.get(`/appeals/track/${encodeURIComponent(trackCode.trim())}`);
      setTrackResult(res.data);
    } catch (err: any) {
      setTrackError(err?.response?.data?.error || tx('Murojaat topilmadi'));
    }
  };

  return (
    <div>
      {/* Header Banner */}
      <section className="bg-[#E8F7F0] border-b border-[#D2EFE1]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white text-[#078A59] border border-[#C6EBDA] flex items-center justify-center shrink-0">
              <MessageSquareText className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-[#17212B]">
                {tx('Murojaatlar markazi')}
              </h1>
              <p className="text-sm text-[#064B3C] mt-0.5">
                {tx('Fikr va murojaatlaringizni bildiring')}
              </p>
            </div>
          </div>
          <nav className="flex items-center gap-1.5 text-xs text-[#718096]">
            <Link to="/" className="hover:text-[#078A59]">
              {t('navHome')}
            </Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="font-semibold text-[#17212B]">{t('navAppeals')}</span>
          </nav>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 space-y-6">
        {/* Top Action + Tracking Lookup */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <button
            type="button"
            onClick={handleOpenNew}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#078A59] hover:bg-[#064B3C] text-white text-sm font-semibold transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>{tx('Yangi murojaat')}</span>
          </button>

          <form onSubmit={handleTrack} className="flex items-center gap-2 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="w-4 h-4 text-[#718096] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={trackCode}
                onChange={(e) => setTrackCode(e.target.value)}
                placeholder={tx('Raqam bo‘yicha tekshirish (MRJ-2026-0001)')}
                className="w-full pl-9 pr-3 py-2.5 bg-white border border-[#E5ECE8] rounded-xl text-xs outline-none focus:border-[#078A59]"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2.5 rounded-xl bg-white border border-[#E5ECE8] hover:border-[#078A59] text-xs font-semibold text-[#17212B] transition-colors"
            >
              {tx('Tekshirish')}
            </button>
          </form>
        </div>

        {createdCode && (
          <div className="bg-[#E8F7F0] border border-[#BCE8D4] rounded-2xl p-4 flex items-center gap-3 text-sm text-[#064B3C]">
            <CheckCircle2 className="w-5 h-5 text-[#078A59] shrink-0" />
            <span>
              {tx('Murojaatingiz qabul qilindi! Noyob kuzatuv raqamingiz:')}{' '}
              <strong className="font-mono">{createdCode}</strong>
            </span>
          </div>
        )}

        {trackError && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
            {trackError}
          </div>
        )}

        {trackResult && (
          <div className="bg-white rounded-2xl border border-[#078A59]/40 p-5">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#E5ECE8]">
              <div>
                <span className="font-mono text-xs font-bold text-[#078A59]">
                  {trackResult.appeal.tracking_number}
                </span>
                <h3 className="text-base font-bold text-[#17212B] mt-0.5">
                  {tx(trackResult.appeal.subject)}
                </h3>
              </div>
              <AppealStatusText status={trackResult.appeal.status} />
            </div>
            <div className="mt-3 space-y-2">
              {trackResult.history.map((h, i) => (
                <div key={i} className="flex items-center justify-between text-xs text-[#718096]">
                  <span>{tx(h.note || h.new_status)}</span>
                  <span className="tabular-nums">{formatUzDate(h.changed_at)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* My Appeals Table */}
        <div className="bg-white rounded-2xl border border-[#E5ECE8] overflow-hidden">
          <div className="px-6 py-4 border-b border-[#E5ECE8] flex items-center justify-between">
            <h2 className="text-base font-bold text-[#17212B]">{t('myAppeals')}</h2>
            {user && (
              <span className="text-xs text-[#718096] tabular-nums">
                {appeals.length} {tx('ta murojaat')}
              </span>
            )}
          </div>

          {!user ? (
            <div className="p-10 text-center">
              <p className="text-sm text-[#718096]">
                {tx("Murojaat yuborish va o'z murojaatlaringiz holatini kuzatish uchun tizimga kiring.")}
              </p>
              <Link
                to="/login"
                className="inline-flex items-center mt-4 px-5 py-2.5 rounded-xl bg-[#078A59] text-white text-xs font-semibold hover:bg-[#064B3C]"
              >
                {t('login')}
              </Link>
            </div>
          ) : loading ? (
            <div className="p-8 text-center text-sm text-[#718096]">{t('loading')}</div>
          ) : appeals.length === 0 ? (
            <div className="p-10 text-center text-sm text-[#718096]">{t('noData')}</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#F5F8FA] text-xs font-semibold text-[#718096] border-b border-[#E5ECE8]">
                    <th className="py-3.5 px-5">№</th>
                    <th className="py-3.5 px-5">{tx('Mavzu')}</th>
                    <th className="py-3.5 px-5">{tx('Kategoriya')}</th>
                    <th className="py-3.5 px-5">{tx('Holat')}</th>
                    <th className="py-3.5 px-5">{tx('Sana')}</th>
                    <th className="py-3.5 px-5 text-right"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5ECE8] text-sm">
                  {appeals.map((a, idx) => (
                    <tr
                      key={a.id}
                      onClick={() => navigate(`/appeals/${a.id}`)}
                      className="hover:bg-[#F5F8FA] cursor-pointer transition-colors"
                    >
                      <td className="py-3.5 px-5 font-mono text-xs text-[#718096] tabular-nums">
                        {idx + 1} · {a.tracking_number}
                      </td>
                      <td className="py-3.5 px-5 font-semibold text-[#17212B]">{tx(a.subject)}</td>
                      <td className="py-3.5 px-5 text-xs text-[#718096]">{tx(a.category_name)}</td>
                      <td className="py-3.5 px-5">
                        <AppealStatusText status={a.status} />
                      </td>
                      <td className="py-3.5 px-5 text-xs text-[#718096] tabular-nums">
                        {formatUzDate(a.created_at)}
                      </td>
                      <td className="py-3.5 px-5 text-right text-[#718096]">
                        <ChevronRight className="w-4 h-4 inline" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      {/* New Appeal Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/45 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setModalOpen(false)}
        >
          <div
            className="w-full max-w-lg bg-white rounded-2xl border border-[#E5ECE8] shadow-xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-[#E5ECE8] flex items-center justify-between">
              <h3 className="text-base font-bold text-[#17212B]">{tx('Yangi murojaat yuborish')}</h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-lg text-[#718096] hover:bg-[#F5F8FA]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmitAppeal} className="p-6 space-y-4">
              {error && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-[#17212B] mb-1.5">
                  {tx('Murojaat mavzusi')} *
                </label>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder={tx("Masalan: Ko'cha yoritgichini ta'mirlash")}
                  className="w-full px-3.5 py-2.5 border border-[#E5ECE8] rounded-xl text-sm outline-none focus:border-[#078A59]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#17212B] mb-1.5">
                  {tx('Murojaat kategoriyasi')} *
                </label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 border border-[#E5ECE8] rounded-xl text-sm bg-white outline-none focus:border-[#078A59]"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {tx(c.name)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#17212B] mb-1.5">
                  {tx('Murojaat matni')} *
                </label>
                <textarea
                  rows={4}
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={tx('Muammoni batafsil bayon qiling...')}
                  className="w-full px-3.5 py-2.5 border border-[#E5ECE8] rounded-xl text-sm outline-none focus:border-[#078A59]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#17212B] mb-1.5">
                  {tx("Qo'shimcha fayl yoki rasm (ixtiyoriy, 5MB gacha)")}
                </label>
                <label className="flex items-center justify-center gap-2 px-4 py-3 border border-dashed border-[#E5ECE8] rounded-xl cursor-pointer hover:border-[#078A59] text-xs text-[#718096]">
                  <Upload className="w-4 h-4 text-[#078A59]" />
                  <span>
                    {uploading
                      ? tx('Yuklanmoqda...')
                      : attachmentUrl
                      ? tx('Fayl biriktirildi')
                      : tx('Rasm yoki hujjat tanlang')}
                  </span>
                  <input type="file" accept="image/*,.pdf" onChange={handleFileChange} className="hidden" />
                </label>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-[#E5ECE8] text-xs font-semibold text-[#718096]"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  disabled={submitting || uploading}
                  className="px-5 py-2.5 rounded-xl bg-[#078A59] hover:bg-[#064B3C] text-white text-xs font-semibold transition-colors"
                >
                  {submitting ? '...' : t('sendAppeal')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
