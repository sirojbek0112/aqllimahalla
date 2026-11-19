import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User as UserIcon,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  CheckCircle2,
  MapPin,
  Home,
  Phone,
  FileText,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LangContext';
import { api } from '../services/api';
import { BrandLogo } from './BrandLogo';

interface AuthPortalProps {
  initialMode?: 'login' | 'register';
}

export function AuthPortal({ initialMode = 'login' }: AuthPortalProps) {
  const { user, isStaff, login, register, completeProfile, logout } = useAuth();
  const { tx } = useLang();
  const navigate = useNavigate();

  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [step, setStep] = useState<'credentials' | 'details'>('credentials');

  // Login form
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPass, setShowLoginPass] = useState(false);

  // Forgot password
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotId, setForgotId] = useState('');
  const [forgotMsg, setForgotMsg] = useState('');

  // Step 1: Register login + password
  const [regUsername, setRegUsername] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirm, setRegConfirm] = useState('');
  const [showRegPass, setShowRegPass] = useState(false);

  // Step 2: Profile & address details (asked once after first registration)
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('+998');
  const [address, setAddress] = useState('');
  const [houseNumber, setHouseNumber] = useState('');
  const [extraInfo, setExtraInfo] = useState('');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setMode(initialMode);
    setError('');
  }, [initialMode]);

  useEffect(() => {
    if (!user) return;
    if (isStaff) {
      navigate('/admin', { replace: true });
      return;
    }
    if (user.profile_completed) {
      navigate('/cabinet', { replace: true });
      return;
    }
    // Logged-in citizen whose profile is not completed yet -> show Step 2
    setMode('register');
    setStep('details');
    setFirstName(user.first_name || '');
    setLastName(user.last_name || '');
    setPhone(user.phone || '+998');
    setAddress(user.address || '');
    setHouseNumber(user.house_number || '');
    setExtraInfo(user.extra_info || '');
  }, [user, isStaff, navigate]);

  const routeAfterLogin = (loggedUser: NonNullable<typeof user>) => {
    if (loggedUser.roles.some((r) => ['super_admin', 'mahalla_raisi', 'masul_xodim'].includes(r))) {
      navigate('/admin');
      return;
    }
    if (loggedUser.profile_completed) {
      navigate('/cabinet');
      return;
    }
    setMode('register');
    setStep('details');
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const loggedUser = await login(loginUsername.trim(), loginPassword);
      routeAfterLogin(loggedUser);
    } catch (err: any) {
      setError(err?.response?.data?.error || tx('Login yoki parol noto‘g‘ri'));
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterStep1 = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const cleanUser = regUsername.trim();
    if (!/^[a-zA-Z0-9._-]{3,32}$/.test(cleanUser)) {
      setError(tx("Login kamida 3 ta lotin harfi yoki raqamdan iborat bo'lishi kerak (bo'sh joysiz)"));
      return;
    }
    if (regPassword.length < 6) {
      setError(tx("Parol kamida 6 ta belgidan iborat bo'lishi kerak"));
      return;
    }
    if (regPassword !== regConfirm) {
      setError(tx('Parollar mos kelmadi'));
      return;
    }

    setLoading(true);
    try {
      await register({ username: cleanUser, password: regPassword });
      setStep('details');
    } catch (err: any) {
      setError(err?.response?.data?.error || tx("Ro'yxatdan o'tishda xatolik"));
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterStep2 = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!firstName.trim() || !lastName.trim() || !address.trim() || !houseNumber.trim()) {
      setError(tx("Ism, familiya, manzil va uy raqamini to'liq kiriting"));
      return;
    }
    setLoading(true);
    try {
      await completeProfile({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        phone: phone.trim(),
        address: address.trim(),
        house_number: houseNumber.trim(),
        extra_info: extraInfo.trim(),
      });
      navigate('/cabinet');
    } catch (err: any) {
      setError(err?.response?.data?.error || tx("Ma'lumotlarni saqlashda xatolik"));
    } finally {
      setLoading(false);
    }
  };

  const quickCitizenDemo = async () => {
    setError('');
    setLoading(true);
    try {
      const loggedUser = await login('azizbek', 'Fuqaro2026!');
      routeAfterLogin(loggedUser);
    } catch (err: any) {
      setError(err?.response?.data?.error || tx('Kirishda xatolik'));
    } finally {
      setLoading(false);
    }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotMsg('');
    try {
      const res = await api.post<{ message: string }>('/auth/forgot-password', {
        identifier: forgotId,
      });
      setForgotMsg(tx(res.data.message));
    } catch (err: any) {
      setForgotMsg(err?.response?.data?.error || tx('Xatolik'));
    }
  };

  const isOnboardingLocked = Boolean(user && !user.profile_completed && !isStaff);

  return (
    <div className="min-h-[calc(100vh-140px)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg bg-white rounded-2xl border border-[#E5ECE8] shadow-sm p-6 sm:p-8">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <BrandLogo />
            <h1 className="text-2xl font-extrabold text-[#17212B] mt-4">
              {isOnboardingLocked
                ? tx("Ma'lumotlaringizni kiriting")
                : mode === 'login'
                ? tx("Ro'yxatdan o'tganmisiz?")
                : tx("Ro'yxatdan o'tish")}
            </h1>
            <p className="text-sm text-[#718096] mt-1">
              {isOnboardingLocked
                ? tx("Bu ma'lumotlar faqat bir marta so'raladi. Keyingi kirishlarda faqat login va parol kifoya.")
                : mode === 'login'
                ? tx('Login va parolingizni kiritib tizimga kiring')
                : tx('Avval login va parol yarating, so‘ng manzil ma’lumotlaringizni kiriting')}
            </p>
          </div>
          {isOnboardingLocked && (
            <button
              type="button"
              onClick={() => {
                logout();
                setStep('credentials');
                setMode('login');
              }}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-600 hover:underline shrink-0"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>{tx('Chiqish')}</span>
            </button>
          )}
        </div>

        {/* 2 xil rejim: Ro'yxatdan o'tgan | Ro'yxatdan o'tish */}
        {!isOnboardingLocked && (
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-[#F5F8FA] border border-[#E5ECE8] rounded-xl mb-6">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setStep('credentials');
                setError('');
              }}
              className={`py-2.5 px-3 rounded-lg text-xs sm:text-sm font-semibold transition-colors ${
                mode === 'login'
                  ? 'bg-[#078A59] text-white shadow-xs'
                  : 'text-[#718096] hover:text-[#17212B]'
              }`}
            >
              {tx("Ro'yxatdan o'tgan (Kirish)")}
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setStep('credentials');
                setError('');
              }}
              className={`py-2.5 px-3 rounded-lg text-xs sm:text-sm font-semibold transition-colors ${
                mode === 'register'
                  ? 'bg-[#078A59] text-white shadow-xs'
                  : 'text-[#718096] hover:text-[#17212B]'
              }`}
            >
              {tx("Ro'yxatdan o'tish")}
            </button>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">
            {error}
          </div>
        )}

        {/* TAB 1: RO'YXATDAN O'TGAN — FAQAT LOGIN VA PAROL */}
        {mode === 'login' && !isOnboardingLocked && (
          <>
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#17212B] mb-1.5">
                  {tx('Login')}
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-[#718096] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={loginUsername}
                    onChange={(e) => setLoginUsername(e.target.value)}
                    placeholder={tx('Loginingizni kiriting (masalan: azizbek)')}
                    className="w-full pl-10 pr-4 py-2.5 border border-[#E5ECE8] rounded-xl text-sm outline-none focus:border-[#078A59]"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-[#17212B]">{tx('Parol')}</label>
                  <button
                    type="button"
                    onClick={() => setForgotOpen((p) => !p)}
                    className="text-xs font-medium text-[#078A59] hover:underline"
                  >
                    {tx('Parolni unutdingizmi?')}
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#718096] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showLoginPass ? 'text' : 'password'}
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-2.5 border border-[#E5ECE8] rounded-xl text-sm outline-none focus:border-[#078A59]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPass((p) => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#718096]"
                  >
                    {showLoginPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-[#078A59] hover:bg-[#064B3C] text-white text-sm font-semibold transition-colors inline-flex items-center justify-center gap-2"
              >
                <span>{loading ? '...' : tx('Kirish')}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            {forgotOpen && (
              <form onSubmit={handleForgot} className="mt-4 p-4 rounded-xl bg-[#F5F8FA] border border-[#E5ECE8] space-y-2.5">
                <p className="text-xs font-semibold text-[#17212B]">{tx('Parolni tiklash')}</p>
                <input
                  type="text"
                  required
                  value={forgotId}
                  onChange={(e) => setForgotId(e.target.value)}
                  placeholder={tx('Login yoki telefon raqamingiz')}
                  className="w-full px-3 py-2 bg-white border border-[#E5ECE8] rounded-lg text-xs outline-none focus:border-[#078A59]"
                />
                <button
                  type="submit"
                  className="px-3.5 py-1.5 rounded-lg bg-[#078A59] text-white text-xs font-semibold"
                >
                  {tx("So'rov yuborish")}
                </button>
                {forgotMsg && <p className="text-xs text-[#064B3C]">{forgotMsg}</p>}
              </form>
            )}

            <div className="mt-5 pt-4 border-t border-[#E5ECE8]">
              <button
                type="button"
                onClick={quickCitizenDemo}
                className="w-full px-3 py-2 rounded-lg bg-[#F5F8FA] hover:bg-[#E8F7F0] border border-[#E5ECE8] text-xs font-semibold text-[#17212B] text-center transition-colors"
              >
                {tx('Fuqaro hisobida sinab ko‘rish (azizbek)')}
              </button>
            </div>
          </>
        )}

        {/* TAB 2: RO'YXATDAN O'TISH — 1-BOSQICH: LOGIN VA PAROL YARATISH */}
        {mode === 'register' && step === 'credentials' && !isOnboardingLocked && (
          <form onSubmit={handleRegisterStep1} className="space-y-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#064B3C] bg-[#E8F7F0] border border-[#C6EBDA] rounded-xl px-3.5 py-2.5">
              <span className="w-5 h-5 rounded-full bg-[#078A59] text-white flex items-center justify-center text-[11px] font-bold">
                1
              </span>
              <span>{tx('1-bosqich: O‘zingiz uchun login va parol yarating')}</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#17212B] mb-1.5">
                {tx('Login yarating')} *
              </label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-[#718096] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={regUsername}
                  onChange={(e) => setRegUsername(e.target.value)}
                  placeholder={tx('Masalan: sardor_01')}
                  className="w-full pl-10 pr-4 py-2.5 border border-[#E5ECE8] rounded-xl text-sm outline-none focus:border-[#078A59]"
                />
              </div>
              <p className="text-[11px] text-[#718096] mt-1">
                {tx("Kamida 3 ta lotin harfi, raqam yoki _ belgisidan iborat bo'lsin")}
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#17212B] mb-1.5">
                {tx('Parol yarating')} *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#718096] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showRegPass ? 'text' : 'password'}
                  required
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder={tx('Kamida 6 ta belgi')}
                  className="w-full pl-10 pr-10 py-2.5 border border-[#E5ECE8] rounded-xl text-sm outline-none focus:border-[#078A59]"
                />
                <button
                  type="button"
                  onClick={() => setShowRegPass((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#718096]"
                >
                  {showRegPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#17212B] mb-1.5">
                {tx('Parolni tasdiqlang')} *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#718096] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showRegPass ? 'text' : 'password'}
                  required
                  value={regConfirm}
                  onChange={(e) => setRegConfirm(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 border border-[#E5ECE8] rounded-xl text-sm outline-none focus:border-[#078A59]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-[#078A59] hover:bg-[#064B3C] text-white text-sm font-semibold transition-colors inline-flex items-center justify-center gap-2"
            >
              <span>{loading ? '...' : tx('Davom etish')}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* TAB 2 / ONBOARDING: 2-BOSQICH: UY, MANZIL VA SHAXSIY MA'LUMOTLAR (FAQAT 1 MARTA) */}
        {(step === 'details' || isOnboardingLocked) && (
          <form onSubmit={handleRegisterStep2} className="space-y-4">
            <div className="flex items-center justify-between gap-2 text-xs font-semibold text-[#064B3C] bg-[#E8F7F0] border border-[#C6EBDA] rounded-xl px-3.5 py-2.5">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#078A59] shrink-0" />
                <span>
                  {tx('2-bosqich: Manzil va shaxsiy ma’lumotlar')}
                  {user?.username ? ` (@${user.username})` : ''}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#17212B] mb-1.5">
                  {tx('Ism')} *
                </label>
                <input
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder={tx('Ismingiz')}
                  className="w-full px-3.5 py-2.5 border border-[#E5ECE8] rounded-xl text-sm outline-none focus:border-[#078A59]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#17212B] mb-1.5">
                  {tx('Familiya')} *
                </label>
                <input
                  type="text"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder={tx('Familiyangiz')}
                  className="w-full px-3.5 py-2.5 border border-[#E5ECE8] rounded-xl text-sm outline-none focus:border-[#078A59]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#17212B] mb-1.5">
                {tx('Telefon raqami')} *
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-[#718096] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+998901234567"
                  className="w-full pl-10 pr-4 py-2.5 border border-[#E5ECE8] rounded-xl text-sm outline-none focus:border-[#078A59]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#17212B] mb-1.5">
                  {tx("Ko'cha / mahalla manzili")} *
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-[#718096] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder={tx("Batosh ko'chasi")}
                    className="w-full pl-10 pr-4 py-2.5 border border-[#E5ECE8] rounded-xl text-sm outline-none focus:border-[#078A59]"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#17212B] mb-1.5">
                  {tx('Uy / xonadon raqami')} *
                </label>
                <div className="relative">
                  <Home className="w-4 h-4 text-[#718096] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={houseNumber}
                    onChange={(e) => setHouseNumber(e.target.value)}
                    placeholder={tx('14-uy, 22-xonadon')}
                    className="w-full pl-10 pr-4 py-2.5 border border-[#E5ECE8] rounded-xl text-sm outline-none focus:border-[#078A59]"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#17212B] mb-1.5">
                {tx("Boshqa qo'shimcha ma'lumotlar (ixtiyoriy)")}
              </label>
              <div className="relative">
                <FileText className="w-4 h-4 text-[#718096] absolute left-3.5 top-3" />
                <textarea
                  rows={2}
                  value={extraInfo}
                  onChange={(e) => setExtraInfo(e.target.value)}
                  placeholder={tx("Mo'ljal, podyezd, qavat yoki boshqa manzil tafsilotlari")}
                  className="w-full pl-10 pr-4 py-2.5 border border-[#E5ECE8] rounded-xl text-sm outline-none focus:border-[#078A59] resize-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-[#078A59] hover:bg-[#064B3C] text-white text-sm font-semibold transition-colors inline-flex items-center justify-center gap-2"
            >
              <span>{loading ? '...' : tx('Saqlash va kabinetga kirish')}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
