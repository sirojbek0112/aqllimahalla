import React, { useEffect, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Newspaper,
  Megaphone,
  MessageSquareText,
  CalendarDays,
  Users,
  BarChart3,
  Image as ImageIcon,
  FileSpreadsheet,
  Settings,
  LogOut,
  Bell,
  Menu,
  X,
  ExternalLink,
} from 'lucide-react';
import { BrandLogo } from '../components/BrandLogo';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LangContext';
import { api } from '../services/api';
import { NotificationItem } from '../types';

export function AdminLayout({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const { user, logout } = useAuth();
  const { lang, setLang, tx } = useLang();
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unread, setUnread] = useState(0);

  const loadNotifications = () => {
    api
      .get<{ items: NotificationItem[]; unread: number }>('/notifications')
      .then((res) => {
        setNotifications(res.data.items);
        setUnread(res.data.unread);
      })
      .catch(() => {});
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const markRead = async (id: number, link?: string) => {
    await api.put(`/notifications/${id}/read`).catch(() => {});
    loadNotifications();
    setNotifOpen(false);
    if (link) navigate(link);
  };

  const menuItems = [
    { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/admin/news', label: 'Yangiliklar', icon: Newspaper },
    { to: '/admin/announcements', label: "E'lonlar", icon: Megaphone },
    { to: '/admin/appeals', label: 'Murojaatlar', icon: MessageSquareText },
    { to: '/admin/events', label: 'Tadbirlar', icon: CalendarDays },
    { to: '/admin/citizens', label: 'Aholi', icon: Users },
    { to: '/admin/polls', label: "So'rovnomalar", icon: BarChart3 },
    { to: '/admin/gallery', label: 'Galereya', icon: ImageIcon },
    { to: '/admin/reports', label: 'Hisobotlar', icon: FileSpreadsheet },
    { to: '/admin/settings', label: 'Sozlamalar', icon: Settings },
  ];

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const SidebarContent = () => (
    <div className="h-full flex flex-col bg-[#064B3C] text-white">
      <div className="px-5 py-5 border-b border-white/10">
        <Link to="/" className="block">
          <BrandLogo light />
        </Link>
        <p className="mt-1.5 pl-11 text-xs text-white/65">{tx('Admin panel')}</p>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-[#078A59] text-white shadow-xs'
                    : 'text-white/80 hover:bg-white/10 hover:text-white'
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{tx(item.label)}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="p-3 border-t border-white/10 space-y-1">
        <Link
          to="/"
          className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-white/80 hover:bg-white/10 hover:text-white transition-colors"
        >
          <ExternalLink className="w-4 h-4 shrink-0" />
          <span>{tx("Saytga o'tish")}</span>
        </Link>
        <button
          type="button"
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-white/80 hover:bg-red-500/20 hover:text-white transition-colors"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          <span>{tx('Chiqish')}</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-[#F5F8FA] text-[#17212B]">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-64 shrink-0 sticky top-0 h-screen">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50 lg:hidden flex"
          onClick={() => setSidebarOpen(false)}
        >
          <div className="w-64 h-full" onClick={(e) => e.stopPropagation()}>
            <SidebarContent />
          </div>
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="ml-auto m-4 p-2 rounded-lg bg-white text-[#17212B] h-fit"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Main Column */}
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="sticky top-0 z-30 bg-white border-b border-[#E5ECE8] h-16 px-4 sm:px-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg text-[#17212B] hover:bg-[#F5F8FA]"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-lg sm:text-xl font-bold text-[#17212B] truncate">{tx(title)}</h1>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="hidden sm:flex items-center bg-[#F5F8FA] border border-[#E5ECE8] rounded-lg p-0.5">
              <button
                type="button"
                onClick={() => setLang('lat')}
                className={`px-2 py-1 text-xs font-semibold rounded-md ${
                  lang === 'lat' ? 'bg-[#078A59] text-white' : 'text-[#718096]'
                }`}
              >
                Lotin
              </button>
              <button
                type="button"
                onClick={() => setLang('cyr')}
                className={`px-2 py-1 text-xs font-semibold rounded-md ${
                  lang === 'cyr' ? 'bg-[#078A59] text-white' : 'text-[#718096]'
                }`}
              >
                Кирилл
              </button>
            </div>

            <div className="relative">
              <button
                type="button"
                onClick={() => setNotifOpen((p) => !p)}
                className="relative p-2 rounded-lg text-[#718096] hover:text-[#17212B] hover:bg-[#F5F8FA] transition-colors"
                aria-label="Bildirishnomalar"
              >
                <Bell className="w-5 h-5" />
                {unread > 0 && (
                  <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 rounded-full bg-[#078A59] text-white text-[10px] font-bold flex items-center justify-center tabular-nums">
                    {unread}
                  </span>
                )}
              </button>

              {notifOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-[#E5ECE8] overflow-hidden z-50">
                  <div className="px-4 py-3 border-b border-[#E5ECE8] flex items-center justify-between">
                    <span className="text-sm font-semibold">{tx('Bildirishnomalar')}</span>
                    <button
                      type="button"
                      onClick={async () => {
                        await api.put('/notifications/read-all');
                        loadNotifications();
                      }}
                      className="text-xs text-[#078A59] font-medium hover:underline"
                    >
                      {tx("Barchasini o'qilgan")}
                    </button>
                  </div>
                  <div className="max-h-72 overflow-y-auto divide-y divide-[#E5ECE8]">
                    {notifications.length === 0 ? (
                      <div className="p-4 text-xs text-[#718096] text-center">
                        {tx('Bildirishnomalar mavjud emas')}
                      </div>
                    ) : (
                      notifications.slice(0, 8).map((n) => (
                        <button
                          key={n.id}
                          type="button"
                          onClick={() => markRead(n.id, n.link)}
                          className={`w-full text-left px-4 py-3 hover:bg-[#F5F8FA] transition-colors ${
                            n.is_read ? 'opacity-70' : 'bg-[#E8F7F0]/40'
                          }`}
                        >
                          <p className="text-xs font-semibold text-[#17212B]">{tx(n.title)}</p>
                          <p className="text-xs text-[#718096] mt-0.5 line-clamp-2">{tx(n.message)}</p>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2.5 pl-2 border-l border-[#E5ECE8]">
              <span className="hidden md:inline text-sm font-medium text-[#17212B]">
                {tx(`Assalomu alaykum, ${user?.first_name || 'Rais'}!`)}
              </span>
              <Link
                to="/cabinet"
                className="w-9 h-9 rounded-full bg-[#E8F7F0] text-[#064B3C] font-bold text-xs flex items-center justify-center border border-[#BCE8D4] overflow-hidden"
              >
                {user?.avatar_url ? (
                  <img src={user.avatar_url} alt={user.first_name} className="w-full h-full object-cover" />
                ) : (
                  `${user?.first_name?.[0] || 'A'}${user?.last_name?.[0] || ''}`
                )}
              </Link>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1400px] w-full mx-auto">{children}</main>
      </div>
    </div>
  );
}
