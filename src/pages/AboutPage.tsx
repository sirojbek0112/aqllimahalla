import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Building2, MapPin, Phone, Mail, UserCheck, Users, ChevronRight, Calendar } from 'lucide-react';
import { api } from '../services/api';
import { useLang } from '../context/LangContext';
import { MediaImage } from '../components/MediaImage';
import { MahallaSettings, StaffMember } from '../types';

export function AboutPage() {
  const { t, tx } = useLang();
  const [settings, setSettings] = useState<MahallaSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<{ settings: MahallaSettings }>('/settings')
      .then((res) => setSettings(res.data.settings))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  let staff: StaffMember[] = [];
  try {
    staff = settings?.staff_json ? JSON.parse(settings.staff_json) : [];
  } catch {
    staff = [];
  }

  return (
    <div>
      <section className="bg-gradient-to-r from-[#064B3C] via-[#078A59] to-[#18A66A] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/15 flex items-center justify-center shrink-0">
              <Building2 className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                {tx(settings?.mahalla_name || t('navAbout'))}
              </h1>
              <p className="text-sm text-white/85 mt-1">
                {tx('Mahalla tarixi, rahbariyat, hudud xaritasi va faoliyati')}
              </p>
            </div>
          </div>
          <nav className="flex items-center gap-1.5 text-xs text-white/85">
            <Link to="/" className="hover:text-white">
              {t('navHome')}
            </Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="font-semibold text-white">{t('navAbout')}</span>
          </nav>
        </div>
      </section>

      {loading ? (
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="h-64 bg-white rounded-2xl border border-[#E5ECE8] animate-pulse" />
        </div>
      ) : (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 space-y-8">
          {/* History + Photo */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            <div className="lg:col-span-7 bg-white rounded-2xl border border-[#E5ECE8] p-6 sm:p-8 flex flex-col justify-between">
              <div>
                <h2 className="text-xl font-bold text-[#17212B]">{tx('Mahalla tarixi va faoliyati')}</h2>
                <p className="mt-4 text-sm sm:text-base text-[#17212B]/85 leading-relaxed">
                  {tx(settings?.history || '')}
                </p>
                <p className="mt-4 text-sm sm:text-base text-[#718096] leading-relaxed">
                  {tx(settings?.activities || '')}
                </p>
              </div>
              <div className="mt-6 pt-5 border-t border-[#E5ECE8] grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div className="flex items-center gap-2 text-[#17212B]">
                  <Phone className="w-4 h-4 text-[#078A59] shrink-0" />
                  <span className="font-semibold tabular-nums">{settings?.phone}</span>
                </div>
                <div className="flex items-center gap-2 text-[#17212B]">
                  <Mail className="w-4 h-4 text-[#078A59] shrink-0" />
                  <span className="font-semibold">{settings?.email}</span>
                </div>
                <div className="flex items-center gap-2 text-[#17212B]">
                  <Users className="w-4 h-4 text-[#078A59] shrink-0" />
                  <span className="font-semibold tabular-nums">
                    {settings?.population_count.toLocaleString('uz-UZ')} {tx('nafar aholi')}
                  </span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-5 rounded-2xl overflow-hidden border border-[#E5ECE8] bg-white min-h-[280px]">
              <MediaImage
                src="/src/assets/images/hero_mahalla_park_1794910575937.jpg"
                alt={tx(settings?.mahalla_name || 'Mahalla hududi')}
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Chairman + Staff */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-5 bg-white rounded-2xl border border-[#E5ECE8] p-6">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#078A59] mb-3">
                <UserCheck className="w-4 h-4" />
                <span>{tx('Mahalla raisi haqida')}</span>
              </div>
              <h2 className="text-xl font-bold text-[#17212B]">{tx(settings?.chairman_name || '')}</h2>
              <p className="mt-3 text-sm text-[#718096] leading-relaxed">
                {tx(settings?.chairman_bio || '')}
              </p>
              <div className="mt-5 pt-4 border-t border-[#E5ECE8] text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[#718096]">{tx('Qabul telefoni')}</span>
                  <span className="font-semibold text-[#17212B] tabular-nums">{settings?.chairman_phone}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#718096]">{tx('Manzil')}</span>
                  <span className="font-semibold text-[#17212B] text-right max-w-[230px]">
                    {tx(settings?.address || '')}
                  </span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-7 bg-white rounded-2xl border border-[#E5ECE8] p-6">
              <h2 className="text-lg font-bold text-[#17212B] mb-4">{tx("Mas'ul xodimlar")}</h2>
              <div className="divide-y divide-[#E5ECE8]">
                {staff.map((st, idx) => (
                  <div key={idx} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-bold text-[#17212B]">{tx(st.name)}</h3>
                      <p className="text-xs text-[#078A59] font-medium mt-0.5">{tx(st.role)}</p>
                    </div>
                    <div className="text-xs text-[#718096] sm:text-right">
                      <div className="font-semibold text-[#17212B] tabular-nums">{st.phone}</div>
                      <div className="inline-flex items-center gap-1 mt-0.5">
                        <Calendar className="w-3 h-3" />
                        <span>{tx(st.schedule)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Neighborhood Location Map Card */}
          <div className="bg-white rounded-2xl border border-[#E5ECE8] p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <h2 className="text-lg font-bold text-[#17212B]">{tx('Mahalla hududi xaritasi')}</h2>
                <p className="text-xs text-[#718096] mt-0.5 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#078A59]" />
                  <span>{tx(settings?.address || '')}</span>
                </p>
              </div>
              <span className="font-mono text-xs text-[#718096] tabular-nums">
                {settings?.map_lat}, {settings?.map_lng}
              </span>
            </div>
            <div className="rounded-xl overflow-hidden border border-[#E5ECE8] h-72 bg-[#F5F8FA]">
              <iframe
                title="Mahalla xaritasi"
                className="w-full h-full border-0"
                loading="lazy"
                src={`https://www.openstreetmap.org/export/embed.html?bbox=${
                  (settings?.map_lng || 66.2481) - 0.01
                }%2C${(settings?.map_lat || 38.6203) - 0.008}%2C${
                  (settings?.map_lng || 66.2481) + 0.01
                }%2C${(settings?.map_lat || 38.6203) + 0.008}&layer=mapnik&marker=${
                  settings?.map_lat || 38.6203
                }%2C${settings?.map_lng || 66.2481}`}
              />
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
