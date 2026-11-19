import React, { useEffect, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Search, Menu, X, Phone, MapPin, Mail, User as UserIcon, Shield, Send } from 'lucide-react';
import { BrandLogo } from '../components/BrandLogo';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LangContext';
import { api } from '../services/api';
import { MahallaSettings } from '../types';

export function PublicLayout({ children }: { children: React.ReactNode }) {
  const { user, isStaff } = useAuth();
  const { lang, setLang, t, tx } = useLang();
  const navigate = useNavigate();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [settings, setSettings] = useState<MahallaSettings | null>(null);

  useEffect(() => {
    api
      .get<{ settings: MahallaSettings }>('/settings')
      .then((res) => setSettings(res.data.settings))
      .catch(() => {});
  }, []);

  const navItems = [
    { to: '/', label: t('navHome'), end: true },
    { to: '/news', label: t('navNews') },
    { to: '/announcements', label: t('navAnnouncements') },
    { to: '/events', label: t('navEvents') },
    { to: '/appeals', label: t('navAppeals') },
    { to: '/about', label: t('navAbout') },
  ];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setSearchOpen(false);
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  let social: Record<string, string> = {};
  try {
    social = settings?.social_links_json ? JSON.parse(settings.social_links_json) : {};
  } catch {
    social = {};
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F5F8FA] text-[#17212B]">
      {/* Sticky Top Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-[#E5ECE8]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <Link to="/" className="shrink-0 focus:outline-none">
            <BrandLogo />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-6">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `text-sm font-medium whitespace-nowrap shrink-0 py-1 border-b-2 transition-colors ${
                    isActive
                      ? 'text-[#078A59] border-[#078A59]'
                      : 'text-[#17212B] border-transparent hover:text-[#078A59]'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          {/* Right Controls */}
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="p-2 rounded-lg text-[#718096] hover:text-[#17212B] hover:bg-[#F5F8FA] transition-colors"
              aria-label="Qidiruv"
            >
              <Search className="w-5 h-5" />
            </button>

            {/* Lotin / Кирилл Toggle */}
            <div className="hidden sm:flex items-center bg-[#F5F8FA] border border-[#E5ECE8] rounded-lg p-0.5">
              <button
                type="button"
                onClick={() => setLang('lat')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
                  lang === 'lat' ? 'bg-[#078A59] text-white' : 'text-[#718096] hover:text-[#17212B]'
                }`}
              >
                Lotin
              </button>
              <button
                type="button"
                onClick={() => setLang('cyr')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
                  lang === 'cyr' ? 'bg-[#078A59] text-white' : 'text-[#718096] hover:text-[#17212B]'
                }`}
              >
                Кирилл
              </button>
            </div>

            {user ? (
              <div className="flex items-center gap-2">
                {isStaff && (
                  <Link
                    to="/admin"
                    className="hidden md:inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#064B3C] bg-[#E8F7F0] hover:bg-[#d5efe3] rounded-lg transition-colors whitespace-nowrap shrink-0"
                  >
                    <Shield className="w-3.5 h-3.5" />
                    <span>{t('adminPanel')}</span>
                  </Link>
                )}
                <Link
                  to="/cabinet"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-[#078A59] hover:bg-[#064B3C] rounded-lg transition-colors whitespace-nowrap shrink-0"
                >
                  <UserIcon className="w-3.5 h-3.5" />
                  <span>{user.first_name || user.username}</span>
                </Link>
              </div>
            ) : (
              <Link
                to="/login"
                className="inline-flex items-center px-4 py-2 text-xs font-semibold text-white bg-[#078A59] hover:bg-[#064B3C] rounded-lg transition-colors whitespace-nowrap shrink-0"
              >
                {t('login')}
              </Link>
            )}

            <button
              type="button"
              onClick={() => setMobileOpen((p) => !p)}
              className="lg:hidden p-2 rounded-lg text-[#17212B] hover:bg-[#F5F8FA]"
              aria-label="Menyu"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Drawer */}
        {mobileOpen && (
          <div className="lg:hidden bg-white border-t border-[#E5ECE8] px-4 py-4 space-y-2">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `block px-3 py-2.5 rounded-lg text-sm font-medium ${
                    isActive ? 'bg-[#E8F7F0] text-[#078A59]' : 'text-[#17212B] hover:bg-[#F5F8FA]'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
            <div className="pt-2 border-t border-[#E5ECE8] flex items-center justify-between">
              <div className="flex items-center bg-[#F5F8FA] border border-[#E5ECE8] rounded-lg p-0.5">
                <button
                  type="button"
                  onClick={() => setLang('lat')}
                  className={`px-3 py-1 text-xs font-semibold rounded-md ${
                    lang === 'lat' ? 'bg-[#078A59] text-white' : 'text-[#718096]'
                  }`}
                >
                  Lotin
                </button>
                <button
                  type="button"
                  onClick={() => setLang('cyr')}
                  className={`px-3 py-1 text-xs font-semibold rounded-md ${
                    lang === 'cyr' ? 'bg-[#078A59] text-white' : 'text-[#718096]'
                  }`}
                >
                  Кирилл
                </button>
              </div>
              {isStaff && (
                <Link
                  to="/admin"
                  onClick={() => setMobileOpen(false)}
                  className="text-xs font-semibold text-[#078A59]"
                >
                  {t('adminPanel')}
                </Link>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1">{children}</main>

      {/* Dark Green Footer */}
      <footer className="bg-[#064B3C] text-white mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div>
              <BrandLogo light />
              <p className="mt-4 text-sm text-white/80 leading-relaxed">
                {tx(settings?.tagline || 'Mahallamiz — endi bir qadam yaqinroq!')}
              </p>
              <p className="mt-2 text-xs text-white/60">
                {tx(settings?.mahalla_name || 'Batosh MFY')}
              </p>
            </div>

            <div>
              <h4 className="text-sm font-semibold mb-4 text-white">{t('quickLinks')}</h4>
              <ul className="space-y-2.5 text-sm text-white/80">
                <li>
                  <Link to="/" className="hover:text-white transition-colors">
                    {t('navHome')}
                  </Link>
                </li>
                <li>
                  <Link to="/news" className="hover:text-white transition-colors">
                    {t('navNews')}
                  </Link>
                </li>
                <li>
                  <Link to="/announcements" className="hover:text-white transition-colors">
                    {t('navAnnouncements')}
                  </Link>
                </li>
                <li>
                  <Link to="/events" className="hover:text-white transition-colors">
                    {t('navEvents')}
                  </Link>
                </li>
                <li>
                  <Link to="/polls" className="hover:text-white transition-colors">
                    {t('navPolls')}
                  </Link>
                </li>
                <li>
                  <Link to="/gallery" className="hover:text-white transition-colors">
                    {t('navGallery')}
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-semibold mb-4 text-white">{t('contact')}</h4>
              <ul className="space-y-3 text-sm text-white/80">
                <li className="flex items-center gap-2.5">
                  <Phone className="w-4 h-4 shrink-0 text-[#18A66A]" />
                  <span className="tabular-nums">{settings?.phone || '+998 90 123 45 67'}</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 shrink-0 mt-0.5 text-[#18A66A]" />
                  <span>
                    {tx(settings?.address || 'Qashqadaryo viloyati, G‘uzor tumani, Batosh MFY, Markaziy ko‘cha, 1-uy')}
                  </span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Mail className="w-4 h-4 shrink-0 text-[#18A66A]" />
                  <span>{settings?.email || 'info@batoshmfy.uz'}</span>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-semibold mb-4 text-white">{t('socialMedia')}</h4>
              <div className="flex items-center gap-3">
                <a
                  href={social.telegram || 'https://t.me'}
                  target="_blank"
                  rel="noreferrer"
                  className="w-10 h-10 rounded-full bg-white/10 hover:bg-[#18A66A] flex items-center justify-center transition-colors"
                  aria-label="Telegram"
                >
                  <Send className="w-4 h-4" />
                </a>
                <a
                  href={social.youtube || 'https://youtube.com'}
                  target="_blank"
                  rel="noreferrer"
                  className="w-10 h-10 rounded-full bg-white/10 hover:bg-[#18A66A] flex items-center justify-center transition-colors text-xs font-bold"
                  aria-label="YouTube"
                >
                  YT
                </a>
                <a
                  href={social.facebook || 'https://facebook.com'}
                  target="_blank"
                  rel="noreferrer"
                  className="w-10 h-10 rounded-full bg-white/10 hover:bg-[#18A66A] flex items-center justify-center transition-colors text-xs font-bold"
                  aria-label="Facebook"
                >
                  FB
                </a>
                <a
                  href={social.instagram || 'https://instagram.com'}
                  target="_blank"
                  rel="noreferrer"
                  className="w-10 h-10 rounded-full bg-white/10 hover:bg-[#18A66A] flex items-center justify-center transition-colors text-xs font-bold"
                  aria-label="Instagram"
                >
                  IG
                </a>
              </div>
              <p className="mt-4 text-xs text-white/65 leading-relaxed">
                {tx("Fuqarolar qabuli: Dushanba–Juma, 09:00 dan 18:00 gacha")}
              </p>
            </div>
          </div>

          <div className="mt-10 pt-6 border-t border-white/15 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-white/70">
            <span>{t('copyright')}</span>
            <div className="flex items-center gap-4">
              <Link to="/about" className="hover:text-white transition-colors">
                {t('privacy')}
              </Link>
              <span aria-hidden="true">|</span>
              <Link to="/about" className="hover:text-white transition-colors">
                {t('terms')}
              </Link>
            </div>
          </div>
        </div>
      </footer>

      {/* Global Search Modal */}
      {searchOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/45 backdrop-blur-xs flex items-start justify-center pt-20 px-4"
          onClick={() => setSearchOpen(false)}
        >
          <div
            className="w-full max-w-xl bg-white rounded-2xl shadow-xl border border-[#E5ECE8] p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <form onSubmit={handleSearchSubmit} className="flex items-center gap-3">
              <Search className="w-5 h-5 text-[#718096] shrink-0" />
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('searchPlaceholder')}
                className="flex-1 text-base text-[#17212B] outline-none placeholder:text-[#718096]"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-[#078A59] text-white text-sm font-semibold rounded-lg hover:bg-[#064B3C] transition-colors"
              >
                {tx('Izlash')}
              </button>
              <button
                type="button"
                onClick={() => setSearchOpen(false)}
                className="p-2 text-[#718096] hover:text-[#17212B]"
              >
                <X className="w-5 h-5" />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
