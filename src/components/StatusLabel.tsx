import { Clock, CheckCircle2, Loader2, Eye, Lock } from 'lucide-react';
import { AppealStatus } from '../types';
import { useLang } from '../context/LangContext';

export function AppealStatusText({ status }: { status: AppealStatus | string }) {
  const { t } = useLang();

  const map: Record<string, { label: string; cls: string; Icon: typeof Clock }> = {
    yangi: { label: t('statusYangi'), cls: 'text-sky-700 bg-sky-50 border-sky-200', Icon: Clock },
    korib_chiqilmoqda: {
      label: t('statusKorib'),
      cls: 'text-indigo-700 bg-indigo-50 border-indigo-200',
      Icon: Eye,
    },
    jarayonda: {
      label: t('statusJarayonda'),
      cls: 'text-amber-700 bg-amber-50 border-amber-200',
      Icon: Loader2,
    },
    javob_berildi: {
      label: t('statusJavob'),
      cls: 'text-[#078A59] bg-[#E8F7F0] border-[#BCE8D4]',
      Icon: CheckCircle2,
    },
    yopildi: {
      label: t('statusYopildi'),
      cls: 'text-slate-600 bg-slate-100 border-slate-200',
      Icon: Lock,
    },
  };

  const info = map[status] || map.yangi;
  const Icon = info.Icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-medium whitespace-nowrap ${info.cls}`}
    >
      <Icon className="w-3.5 h-3.5 shrink-0" />
      <span>{info.label}</span>
    </span>
  );
}

export function formatUzDate(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr.replace(' ', 'T'));
  if (isNaN(d.getTime())) return dateStr.slice(0, 10);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}.${mm}.${yyyy}`;
}

export function formatUzDateTime(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr.replace(' ', 'T'));
  if (isNaN(d.getTime())) return dateStr;
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, '0');
  const mi = String(d.getMinutes()).padStart(2, '0');
  return `${dd}.${mm}.${yyyy} ${hh}:${mi}`;
}

export function getMonthShortUz(dateStr: string, cyr = false): { day: string; month: string } {
  const monthsLat = ['Yan', 'Fev', 'Mar', 'Apr', 'May', 'Iyun', 'Iyul', 'Avg', 'Sen', 'Okt', 'Noy', 'Dek'];
  const monthsCyr = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'];
  const parts = dateStr.slice(0, 10).split('-');
  if (parts.length !== 3) return { day: '01', month: 'Yan' };
  const mIdx = Math.max(0, Math.min(11, Number(parts[1]) - 1));
  return {
    day: parts[2],
    month: cyr ? monthsCyr[mIdx] : monthsLat[mIdx],
  };
}
