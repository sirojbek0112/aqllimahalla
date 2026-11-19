import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  User as UserIcon,
  MessageSquareText,
  CalendarDays,
  Bell,
  KeyRound,
  LogOut,
  ChevronRight,
  Phone,
  Mail,
  MapPin,
  Upload,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LangContext';
import { api, uploadFile } from '../services/api';
import { AppealStatusText, formatUzDate, formatUzDateTime } from '../components/StatusLabel';
import { AppealItem, EventItem, NotificationItem } from '../types';

type CabinetTab = 'profile' | 'appeals' | 'events' | 'notifications' | 'password';

export function CabinetPage() {
  const { user, logout, refreshUser } = useAuth();
  const { t, tx } = useLang();
  const navigate = useNavigate();

  const [tab, setTab] = useState<CabinetTab>('profile');
  const [appeals, setAppeals] = useState<AppealItem[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unread, setUnread] = useState(0);

  // Edit profile state
  const [editing, setEditing] = useState(false);
  const [firstName, setFirstName] = useState(user?.first_name || '');
  const [lastName, setLastName] = useState(user?.last_name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [address, setAddress] = useState(user?.address || '');
  const [houseNumber, setHouseNumber] = useState(user?.house_number || '');
  const [extraInfo, setExtraInfo] = useState(user?.extra_info || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || '');
  const [profileMsg, setProfileMsg] = useState('');

  // Password state
  const [curPass, setCurPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [passMsg, setPassMsg] = useState('');
  const [passErr, setPassErr] = useState('');

  const loadCabinetData = () => {
    api.get<{ items: AppealItem[] }>('/appeals').then((r) => setAppeals(r.data.items)).catch(() => {});
    api.get<{ items: EventItem[] }>('/events/my').then((r) => setEvents(r.data.items)).catch(() => {});
    api
      .get<{ items: NotificationItem[]; unread: number }>('/notifications')
      .then((r) => {
        setNotifications(r.data.items);
        setUnread(r.data.unread);
      })
      .catch(() => {});
  };

  useEffect(() => {
    if (user) {
      setFirstName(user.first_name);
      setLastName(user.last_name);
      setPhone(user.phone);
      setAddress(user.address || '');
      setHouseNumber(user.house_number || '');
      setExtraInfo(user.extra_info || '');
      setAvatarUrl(user.avatar_url || '');
      loadCabinetData();
    }
  }, [user?.id]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const url = await uploadFile(file);
      setAvatarUrl(url);
      await api.put('/auth/profile', { avatar_url: url });
      await refreshUser();
    } catch {
      // ignore
    }
  };

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMsg('');
    try {
      await api.put('/auth/profile', {
        first_name: firstName,
        last_name: lastName,
        phone,
        address,
        house_number: houseNumber,
        extra_info: extraInfo,
        avatar_url: avatarUrl,
      });
      await refreshUser();
      setEditing(false);
      setProfileMsg(tx("Ma'lumotlar saqlandi!"));
    } catch (err: any) {
      setProfileMsg(err?.response?.data?.error || tx('Saqlashda xatolik'));
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassErr('');
    setPassMsg('');
    try {
      const res = await api.put<{ message: string }>('/auth/password', {
        current_password: curPass,
        new_password: newPass,
      });
      setPassMsg(tx(res.data.message));
      setCurPass('');
      setNewPass('');
    } catch (err: any) {
      setPassErr(err?.response?.data?.error || tx("Parolni o'zgartirishda xatolik"));
    }
  };

  const handleMarkRead = async (id: number, link?: string) => {
    await api.put(`/notifications/${id}/read`);
    loadCabinetData();
    if (link) navigate(link);
  };

  const sidebarItems: Array<{ key: CabinetTab; label: string; icon: typeof UserIcon; badge?: number }> = [
    { key: 'profile', label: t('profile'), icon: UserIcon },
    { key: 'appeals', label: t('myAppeals'), icon: MessageSquareText, badge: appeals.length },
    { key: 'events', label: t('myEvents'), icon: CalendarDays, badge: events.length },
    { key: 'notifications', label: t('notifications'), icon: Bell, badge: unread },
    { key: 'password', label: t('changePassword'), icon: KeyRound },
  ];

  return (
    <div>
      {/* Header Strip matching screenshot */}
      <section className="bg-[#E8F7F0] border-b border-[#D2EFE1]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white text-[#078A59] border border-[#C6EBDA] flex items-center justify-center shrink-0">
              <UserIcon className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-[#17212B]">{t('cabinet')}</h1>
              <p className="text-sm text-[#064B3C] mt-0.5">
                {tx("Shaxsiy ma'lumotlaringiz va faoliyatingiz")}
              </p>
            </div>
          </div>
          <nav className="flex items-center gap-1.5 text-xs text-[#718096]">
            <Link to="/" className="hover:text-[#078A59]">
              {t('navHome')}
            </Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="font-semibold text-[#17212B]">{tx('Kabinet')}</span>
          </nav>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Sidebar */}
        <aside className="lg:col-span-3">
          <div className="bg-white rounded-2xl border border-[#E5ECE8] p-3 space-y-1">
            {sidebarItems.map((item) => {
              const Icon = item.icon;
              const active = tab === item.key;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setTab(item.key)}
                  className={`w-full flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                    active
                      ? 'bg-[#078A59] text-white'
                      : 'text-[#17212B] hover:bg-[#F5F8FA]'
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                  </span>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full tabular-nums ${
                        active ? 'bg-white/20 text-white' : 'bg-[#F5F8FA] text-[#718096]'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}

            <div className="pt-2 mt-2 border-t border-[#E5ECE8]">
              <button
                type="button"
                onClick={() => {
                  logout();
                  navigate('/');
                }}
                className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut className="w-4 h-4 shrink-0" />
                <span>{tx('Hisobdan chiqish')}</span>
              </button>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="lg:col-span-9 space-y-6">
          {tab === 'profile' && (
            <>
              <div className="bg-white rounded-2xl border border-[#E5ECE8] p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                  <div className="flex items-center gap-5">
                    <div className="relative w-20 h-20 rounded-full bg-[#E8F7F0] border border-[#C6EBDA] flex items-center justify-center overflow-hidden shrink-0">
                      {user?.avatar_url ? (
                        <img
                          src={user.avatar_url}
                          alt={user.first_name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-2xl font-extrabold text-[#064B3C]">
                          {user?.first_name?.[0]}
                          {user?.last_name?.[0]}
                        </span>
                      )}
                    </div>
                    <div>
                      <h2 className="text-xl font-extrabold text-[#17212B]">
                        {user?.last_name} {user?.first_name}
                      </h2>
                      <div className="mt-1.5 space-y-1 text-xs sm:text-sm text-[#718096]">
                        {user?.username && (
                          <div className="flex items-center gap-2">
                            <UserIcon className="w-3.5 h-3.5 text-[#078A59]" />
                            <span className="font-medium text-[#17212B]">Login: {user.username}</span>
                          </div>
                        )}
                        {user?.phone && (
                          <div className="flex items-center gap-2 tabular-nums">
                            <Phone className="w-3.5 h-3.5 text-[#078A59]" />
                            <span>{user.phone}</span>
                          </div>
                        )}
                        {(user?.address || user?.house_number) && (
                          <div className="flex items-center gap-2">
                            <MapPin className="w-3.5 h-3.5 text-[#078A59]" />
                            <span>
                              {tx([user.address, user.house_number].filter(Boolean).join(', '))}
                            </span>
                          </div>
                        )}
                        {user?.extra_info && (
                          <div className="flex items-center gap-2">
                            <Mail className="w-3.5 h-3.5 text-[#078A59]" />
                            <span>{tx(user.extra_info)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:items-end gap-2">
                    <button
                      type="button"
                      onClick={() => setEditing((p) => !p)}
                      className="px-4 py-2.5 rounded-xl bg-[#078A59] hover:bg-[#064B3C] text-white text-xs font-semibold transition-colors whitespace-nowrap"
                    >
                      {editing ? t('cancel') : t('editProfile')}
                    </button>
                    <label className="inline-flex items-center gap-1.5 text-xs font-medium text-[#078A59] cursor-pointer hover:underline">
                      <Upload className="w-3.5 h-3.5" />
                      <span>{tx('Rasmni yangilash')}</span>
                      <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
                    </label>
                  </div>
                </div>

                {profileMsg && (
                  <p className="mt-4 text-xs font-semibold text-[#078A59]">{profileMsg}</p>
                )}

                {editing && (
                  <form
                    onSubmit={handleProfileSave}
                    className="mt-6 pt-6 border-t border-[#E5ECE8] grid grid-cols-1 sm:grid-cols-2 gap-4"
                  >
                    <div>
                      <label className="block text-xs font-semibold text-[#17212B] mb-1">
                        {tx('Ism')}
                      </label>
                      <input
                        type="text"
                        required
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="w-full px-3.5 py-2 border border-[#E5ECE8] rounded-xl text-sm outline-none focus:border-[#078A59]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#17212B] mb-1">
                        {tx('Familiya')}
                      </label>
                      <input
                        type="text"
                        required
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className="w-full px-3.5 py-2 border border-[#E5ECE8] rounded-xl text-sm outline-none focus:border-[#078A59]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#17212B] mb-1">
                        {tx('Telefon')}
                      </label>
                      <input
                        type="text"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full px-3.5 py-2 border border-[#E5ECE8] rounded-xl text-sm outline-none focus:border-[#078A59]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#17212B] mb-1">
                        {tx('Uy / xonadon raqami')}
                      </label>
                      <input
                        type="text"
                        required
                        value={houseNumber}
                        onChange={(e) => setHouseNumber(e.target.value)}
                        className="w-full px-3.5 py-2 border border-[#E5ECE8] rounded-xl text-sm outline-none focus:border-[#078A59]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#17212B] mb-1">
                        {tx("Ko'cha / manzil")}
                      </label>
                      <input
                        type="text"
                        required
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        className="w-full px-3.5 py-2 border border-[#E5ECE8] rounded-xl text-sm outline-none focus:border-[#078A59]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#17212B] mb-1">
                        {tx("Qo'shimcha ma'lumotlar")}
                      </label>
                      <input
                        type="text"
                        value={extraInfo}
                        onChange={(e) => setExtraInfo(e.target.value)}
                        className="w-full px-3.5 py-2 border border-[#E5ECE8] rounded-xl text-sm outline-none focus:border-[#078A59]"
                      />
                    </div>
                    <div className="sm:col-span-2 flex justify-end">
                      <button
                        type="submit"
                        className="px-5 py-2.5 rounded-xl bg-[#078A59] hover:bg-[#064B3C] text-white text-xs font-semibold"
                      >
                        {t('save')}
                      </button>
                    </div>
                  </form>
                )}
              </div>

              {/* 3 Stat Cards matching screenshot */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <button
                  type="button"
                  onClick={() => setTab('appeals')}
                  className="bg-white rounded-2xl border border-[#E5ECE8] p-5 flex items-center gap-4 text-left hover:border-[#078A59]/50 transition-colors"
                >
                  <div className="w-12 h-12 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
                    <MessageSquareText className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-2xl font-extrabold text-[#17212B] tabular-nums">
                      {appeals.length}
                    </div>
                    <div className="text-xs text-[#718096] mt-0.5">{t('myAppeals')}</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setTab('events')}
                  className="bg-white rounded-2xl border border-[#E5ECE8] p-5 flex items-center gap-4 text-left hover:border-[#078A59]/50 transition-colors"
                >
                  <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                    <CalendarDays className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-2xl font-extrabold text-[#17212B] tabular-nums">
                      {events.length}
                    </div>
                    <div className="text-xs text-[#718096] mt-0.5">{t('myEvents')}</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setTab('notifications')}
                  className="bg-white rounded-2xl border border-[#E5ECE8] p-5 flex items-center gap-4 text-left hover:border-[#078A59]/50 transition-colors"
                >
                  <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                    <Bell className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-2xl font-extrabold text-[#17212B] tabular-nums">
                      {notifications.length}
                    </div>
                    <div className="text-xs text-[#718096] mt-0.5">{t('notifications')}</div>
                  </div>
                </button>
              </div>
            </>
          )}

          {tab === 'appeals' && (
            <div className="bg-white rounded-2xl border border-[#E5ECE8] overflow-hidden">
              <div className="px-6 py-4 border-b border-[#E5ECE8] flex items-center justify-between">
                <h2 className="text-base font-bold text-[#17212B]">{t('myAppeals')}</h2>
                <Link
                  to="/appeals"
                  className="px-3.5 py-2 rounded-xl bg-[#078A59] text-white text-xs font-semibold hover:bg-[#064B3C]"
                >
                  {t('newAppealBtn')}
                </Link>
              </div>
              {appeals.length === 0 ? (
                <div className="p-10 text-center text-sm text-[#718096]">{t('noData')}</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-[#F5F8FA] text-xs font-semibold text-[#718096] border-b border-[#E5ECE8]">
                        <th className="py-3 px-5">№</th>
                        <th className="py-3 px-5">{tx('Mavzu')}</th>
                        <th className="py-3 px-5">{tx('Holat')}</th>
                        <th className="py-3 px-5">{tx('Sana')}</th>
                        <th className="py-3 px-5"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E5ECE8] text-sm">
                      {appeals.map((a) => (
                        <tr
                          key={a.id}
                          onClick={() => navigate(`/appeals/${a.id}`)}
                          className="hover:bg-[#F5F8FA] cursor-pointer"
                        >
                          <td className="py-3.5 px-5 font-mono text-xs text-[#718096] tabular-nums">
                            {a.tracking_number}
                          </td>
                          <td className="py-3.5 px-5 font-semibold text-[#17212B]">{tx(a.subject)}</td>
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
          )}

          {tab === 'events' && (
            <div className="bg-white rounded-2xl border border-[#E5ECE8] overflow-hidden">
              <div className="px-6 py-4 border-b border-[#E5ECE8] flex items-center justify-between">
                <h2 className="text-base font-bold text-[#17212B]">{t('myEvents')}</h2>
                <Link to="/events" className="text-xs font-semibold text-[#078A59] hover:underline">
                  {tx('Barcha tadbirlar')}
                </Link>
              </div>
              {events.length === 0 ? (
                <div className="p-10 text-center text-sm text-[#718096]">{t('noData')}</div>
              ) : (
                <div className="divide-y divide-[#E5ECE8]">
                  {events.map((ev) => (
                    <div key={ev.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <span className="text-xs font-semibold text-[#078A59]">{tx(ev.category)}</span>
                        <h3 className="text-base font-bold text-[#17212B] mt-0.5">{tx(ev.title)}</h3>
                        <p className="text-xs text-[#718096] mt-1 tabular-nums">
                          {ev.event_date} · {ev.event_time} · {tx(ev.location)}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={async () => {
                          await api.delete(`/events/${ev.id}/register`);
                          loadCabinetData();
                        }}
                        className="px-4 py-2 rounded-xl border border-[#E5ECE8] hover:border-red-300 hover:text-red-600 text-xs font-semibold transition-colors self-start sm:self-center"
                      >
                        {t('cancelRegistration')}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === 'notifications' && (
            <div className="bg-white rounded-2xl border border-[#E5ECE8] overflow-hidden">
              <div className="px-6 py-4 border-b border-[#E5ECE8] flex items-center justify-between">
                <h2 className="text-base font-bold text-[#17212B]">{t('notifications')}</h2>
                {unread > 0 && (
                  <button
                    type="button"
                    onClick={async () => {
                      await api.put('/notifications/read-all');
                      loadCabinetData();
                    }}
                    className="text-xs font-semibold text-[#078A59] hover:underline"
                  >
                    {tx("Barchasini o'qilgan deb belgilash")}
                  </button>
                )}
              </div>
              {notifications.length === 0 ? (
                <div className="p-10 text-center text-sm text-[#718096]">{t('noData')}</div>
              ) : (
                <div className="divide-y divide-[#E5ECE8]">
                  {notifications.map((n) => (
                    <button
                      key={n.id}
                      type="button"
                      onClick={() => handleMarkRead(n.id, n.link)}
                      className={`w-full text-left p-5 flex items-start justify-between gap-4 hover:bg-[#F5F8FA] transition-colors ${
                        n.is_read ? 'opacity-75' : 'bg-[#E8F7F0]/40'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          {!n.is_read && <CheckCircle2 className="w-3.5 h-3.5 text-[#078A59]" />}
                          <span className="text-sm font-bold text-[#17212B]">{tx(n.title)}</span>
                        </div>
                        <p className="text-xs text-[#718096] mt-1">{tx(n.message)}</p>
                      </div>
                      <span className="text-xs text-[#718096] tabular-nums shrink-0">
                        {formatUzDateTime(n.created_at)}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === 'password' && (
            <div className="bg-white rounded-2xl border border-[#E5ECE8] p-6 max-w-lg">
              <h2 className="text-base font-bold text-[#17212B] mb-4">{t('changePassword')}</h2>
              {passErr && (
                <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">
                  {passErr}
                </div>
              )}
              {passMsg && (
                <div className="mb-4 p-3 rounded-xl bg-[#E8F7F0] border border-[#BCE8D4] text-xs text-[#064B3C]">
                  {passMsg}
                </div>
              )}
              <form onSubmit={handlePasswordChange} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#17212B] mb-1">
                    {tx('Joriy parol')}
                  </label>
                  <input
                    type="password"
                    required
                    value={curPass}
                    onChange={(e) => setCurPass(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-[#E5ECE8] rounded-xl text-sm outline-none focus:border-[#078A59]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#17212B] mb-1">
                    {tx('Yangi parol')}
                  </label>
                  <input
                    type="password"
                    required
                    value={newPass}
                    onChange={(e) => setNewPass(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-[#E5ECE8] rounded-xl text-sm outline-none focus:border-[#078A59]"
                  />
                </div>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#078A59] hover:bg-[#064B3C] text-white text-xs font-semibold"
                >
                  {t('save')}
                </button>
              </form>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
