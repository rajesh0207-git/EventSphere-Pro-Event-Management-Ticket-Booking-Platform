import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useState, useEffect } from 'react';
import { 
  Bell, ChevronDown, User as UserIcon, LogOut, Settings, 
  Calendar, Ticket, Tag, Heart, CreditCard, MessageSquare, 
  ShieldAlert, Menu, X, Landmark, Compass, Search, BarChart3, Presentation, Globe
} from 'lucide-react';
import { getNotifications } from '../../services/notificationService';
import { useTranslation } from 'react-i18next';

const Navbar = () => {
  const { user, isAuthenticated, isOrganizer, isAdmin, isAttendee, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  
  const { t, i18n } = useTranslation();

  // Dropdown states
  const [profileOpen, setProfileOpen] = useState(false);
  const [organizerOpen, setOrganizerOpen] = useState(false);
  const [attendeeOpen, setAttendeeOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) return;
    const fetchUnread = async () => {
      try {
        const res = await getNotifications();
        setUnreadCount(res.data.filter(n => !n.is_read).length);
      } catch {}
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000); // poll every 30 sec
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  // Click outside to close dropdowns
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (!e.target.closest('.nav-dropdown')) {
        setProfileOpen(false);
        setOrganizerOpen(false);
        setAttendeeOpen(false);
        setLangOpen(false);
      }
    };
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
    setMobileOpen(false);
  };

  const getInitials = (name) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U';
  };

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
    setLangOpen(false);
  };

  return (
    <nav className="bg-white/95 backdrop-blur-md border-b border-gray-100 sticky top-0 z-50 shadow-sm transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          
          {/* Logo & Brand */}
          <Link to="/" className="flex items-center space-x-2.5 group">
            <div className="w-9 h-9 bg-gradient-to-tr from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-md shadow-indigo-200 group-hover:scale-105 transition-transform duration-300">
              <span className="text-white font-extrabold text-lg tracking-wider">E</span>
            </div>
            <span className="text-xl font-extrabold bg-gradient-to-r from-gray-900 via-indigo-950 to-indigo-900 bg-clip-text text-transparent tracking-tight">
              EventSphere
            </span>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center space-x-1">
            <Link to="/events" className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-gray-600 hover:text-indigo-600 hover:bg-indigo-50/50 rounded-xl transition duration-200">
              <Compass size={16} />
              <span>{t('nav.events', 'Events')}</span>
            </Link>
            <Link to="/search" className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-gray-600 hover:text-indigo-600 hover:bg-indigo-50/50 rounded-xl transition duration-200">
              <Search size={16} />
              <span>{t('nav.search', 'Search')}</span>
            </Link>

            {/* Language Switcher */}
            <div className="relative nav-dropdown ml-2">
              <button 
                onClick={() => { setLangOpen(!langOpen); setProfileOpen(false); setOrganizerOpen(false); }}
                className={`flex items-center gap-1.5 px-3 py-2 text-sm font-semibold rounded-xl transition duration-200 ${
                  langOpen 
                    ? 'bg-gray-100 text-gray-800' 
                    : 'text-gray-600 hover:text-indigo-600 hover:bg-indigo-50/50'
                }`}
              >
                <Globe size={16} />
                <span>{i18n.language.toUpperCase()}</span>
                <ChevronDown size={14} className={`transition-transform duration-300 ${langOpen ? 'rotate-180' : ''}`} />
              </button>

              {langOpen && (
                <div className="absolute right-0 mt-2 w-32 bg-white border border-gray-100 rounded-2xl shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-3 duration-200">
                  <button onClick={() => changeLanguage('en')} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50/60 hover:text-indigo-600 transition-colors">English</button>
                  <button onClick={() => changeLanguage('es')} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50/60 hover:text-indigo-600 transition-colors">Español</button>
                  <button onClick={() => changeLanguage('fr')} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50/60 hover:text-indigo-600 transition-colors">Français</button>
                </div>
              )}
            </div>

            {/* Attendee "My Account" Dropdown */}
            {isAttendee && (
              <div className="relative nav-dropdown">
                <button
                  onClick={() => { setAttendeeOpen(!attendeeOpen); setProfileOpen(false); setOrganizerOpen(false); }}
                  className={`flex items-center gap-1.5 px-3 py-2 text-sm font-semibold rounded-xl transition duration-200 ${
                    attendeeOpen
                      ? 'bg-indigo-50 text-indigo-600'
                      : 'text-gray-600 hover:text-indigo-600 hover:bg-indigo-50/50'
                  }`}
                >
                  <Ticket size={16} />
                  <span>My Account</span>
                  <ChevronDown size={14} className={`transition-transform duration-300 ${attendeeOpen ? 'rotate-180' : ''}`} />
                </button>

                {attendeeOpen && (
                  <div className="absolute left-0 mt-2 w-52 bg-white border border-gray-100 rounded-2xl shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-3 duration-200">
                    <Link to="/my-bookings" onClick={() => setAttendeeOpen(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-indigo-50/60 hover:text-indigo-600 transition-colors">
                      <Ticket size={16} className="text-gray-400" />
                      <span>My Bookings</span>
                    </Link>
                    <Link to="/wishlist" onClick={() => setAttendeeOpen(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-indigo-50/60 hover:text-indigo-600 transition-colors">
                      <Heart size={16} className="text-gray-400" />
                      <span>Wishlist</span>
                    </Link>
                    <Link to="/payment-history" onClick={() => setAttendeeOpen(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-indigo-50/60 hover:text-indigo-600 transition-colors">
                      <CreditCard size={16} className="text-gray-400" />
                      <span>Payment History</span>
                    </Link>
                    <Link to="/inbox" onClick={() => setAttendeeOpen(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-indigo-50/60 hover:text-indigo-600 transition-colors">
                      <MessageSquare size={16} className="text-gray-400" />
                      <span>Messages</span>
                    </Link>
                    <Link to="/sponsorships" onClick={() => setAttendeeOpen(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-indigo-50/60 hover:text-indigo-600 transition-colors">
                      <Presentation size={16} className="text-gray-400" />
                      <span>Sponsorships</span>
                    </Link>
                  </div>
                )}
              </div>
            )}

            {/* Organizer Dropdown */}
            {isOrganizer && (
              <div className="relative nav-dropdown">
                <button 
                  onClick={() => { setOrganizerOpen(!organizerOpen); setProfileOpen(false); }}
                  className={`flex items-center gap-1.5 px-3 py-2 text-sm font-semibold rounded-xl transition duration-200 ${
                    organizerOpen 
                      ? 'bg-indigo-50 text-indigo-600' 
                      : 'text-gray-600 hover:text-indigo-600 hover:bg-indigo-50/50'
                  }`}
                >
                  <span>Organizer Tools</span>
                  <ChevronDown size={14} className={`transition-transform duration-300 ${organizerOpen ? 'rotate-180' : ''}`} />
                </button>

                {organizerOpen && (
                  <div className="absolute left-0 mt-2 w-52 bg-white border border-gray-100 rounded-2xl shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-3 duration-200">
                    <Link to="/dashboard" onClick={() => setOrganizerOpen(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-indigo-50/60 hover:text-indigo-600 transition-colors">
                      <Calendar size={16} className="text-gray-400" />
                      <span>Dashboard</span>
                    </Link>
                    <Link to="/my-events" onClick={() => setOrganizerOpen(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-indigo-50/60 hover:text-indigo-600 transition-colors">
                      <Ticket size={16} className="text-gray-400" />
                      <span>My Events</span>
                    </Link>
                    <Link to="/check-in" onClick={() => setOrganizerOpen(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-indigo-50/60 hover:text-indigo-600 transition-colors">
                      <Landmark size={16} className="text-gray-400" />
                      <span>Gate Check-In</span>
                    </Link>
                    <Link to="/coupons" onClick={() => setOrganizerOpen(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-indigo-50/60 hover:text-indigo-600 transition-colors">
                      <Tag size={16} className="text-gray-400" />
                      <span>Coupons</span>
                    </Link>
                    <Link to="/refunds" onClick={() => setOrganizerOpen(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-indigo-50/60 hover:text-indigo-600 transition-colors">
                      <CreditCard size={16} className="text-gray-400" />
                      <span>Manage Refunds</span>
                    </Link>
                    <Link to="/reports" onClick={() => setOrganizerOpen(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-indigo-50/60 hover:text-indigo-600 transition-colors">
                      <BarChart3 size={16} className="text-gray-400" />
                      <span>Reports & Exports</span>
                    </Link>
                  </div>
                )}
              </div>
            )}

            {/* Admin Panel Button */}
            {isAdmin && (
              <Link to="/admin/dashboard" className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100/70 rounded-xl transition duration-200">
                <ShieldAlert size={16} />
                <span>Admin Panel</span>
              </Link>
            )}
          </div>

          {/* Desktop Right Side Auth */}
          <div className="hidden md:flex items-center space-x-3.5">
            {isAuthenticated ? (
              <>
                {/* Notification Bell */}
                <Link
                  to="/notifications"
                  className="relative p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50/60 rounded-xl transition-all duration-200"
                  title="Notifications"
                >
                  <Bell size={20} />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-4.5 h-4.5 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center animate-pulse border-2 border-white">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Link>

                {/* User Dropdown */}
                <div className="relative nav-dropdown">
                  <button 
                    onClick={() => { setProfileOpen(!profileOpen); setOrganizerOpen(false); }}
                    className="flex items-center gap-2 p-1.5 pr-3 hover:bg-gray-50 border border-transparent hover:border-gray-100 rounded-xl transition duration-200"
                  >
                    <div className="w-8 h-8 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center shadow-sm">
                      <span className="text-white text-xs font-bold">
                        {getInitials(user?.full_name)}
                      </span>
                    </div>
                    <span className="text-sm font-semibold text-gray-800 truncate max-w-[120px]">{user?.full_name?.split(' ')[0]}</span>
                    <ChevronDown size={14} className={`text-gray-400 transition-transform duration-300 ${profileOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {profileOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-100 rounded-2xl shadow-xl py-2.5 z-50 animate-in fade-in slide-in-from-top-3 duration-200">
                      <div className="px-4 py-2 border-b border-gray-50 mb-1">
                        <p className="text-xs text-gray-400 font-medium">Signed in as</p>
                        <p className="text-sm font-bold text-gray-800 truncate">{user?.email}</p>
                        <span className={`inline-block mt-1 px-2 py-0.5 text-[10px] font-bold rounded-full uppercase tracking-wide ${
                          isAdmin ? 'bg-red-100 text-red-600' :
                          isOrganizer ? 'bg-indigo-100 text-indigo-600' :
                          'bg-emerald-100 text-emerald-600'
                        }`}>
                          {user?.role}
                        </span>
                      </div>

                      <Link to="/profile" onClick={() => setProfileOpen(false)} className="flex items-center gap-2.5 px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50/60 hover:text-indigo-600 transition-colors">
                        <UserIcon size={16} className="text-gray-400" />
                        <span>My Profile</span>
                      </Link>
                      <Link to="/my-bookings" onClick={() => setProfileOpen(false)} className="flex items-center gap-2.5 px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50/60 hover:text-indigo-600 transition-colors">
                        <Ticket size={16} className="text-gray-400" />
                        <span>My Bookings</span>
                      </Link>
                      <Link to="/wishlist" onClick={() => setProfileOpen(false)} className="flex items-center gap-2.5 px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50/60 hover:text-indigo-600 transition-colors">
                        <Heart size={16} className="text-gray-400" />
                        <span>Wishlist</span>
                      </Link>
                      <Link to="/payment-history" onClick={() => setProfileOpen(false)} className="flex items-center gap-2.5 px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50/60 hover:text-indigo-600 transition-colors">
                        <CreditCard size={16} className="text-gray-400" />
                        <span>Payments</span>
                      </Link>
                      <Link to="/inbox" onClick={() => setProfileOpen(false)} className="flex items-center gap-2.5 px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50/60 hover:text-indigo-600 transition-colors">
                        <MessageSquare size={16} className="text-gray-400" />
                        <span>Messages</span>
                      </Link>

                      <div className="border-t border-gray-50 mt-1.5 pt-1.5">
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors text-left"
                        >
                          <LogOut size={16} />
                          <span>Logout</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link to="/login" className="px-4 py-2 text-sm font-semibold text-gray-600 hover:text-indigo-600 transition">
                  {t('nav.login', 'Login')}
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 hover:shadow-md hover:shadow-indigo-100 transition duration-200"
                >
                  {t('nav.register', 'Sign Up')}
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-3">
            {isAuthenticated && (
              <Link to="/notifications" className="relative p-1.5 text-gray-500 hover:text-indigo-600" onClick={() => setMobileOpen(false)}>
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center border border-white">
                    {unreadCount}
                  </span>
                )}
              </Link>
            )}
            <button 
              onClick={() => setMobileOpen(!mobileOpen)}
              className="p-2 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition"
            >
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white px-4 py-4 space-y-4 shadow-inner animate-in fade-in slide-in-from-top-5 duration-200">
          <div className="space-y-1">
            <Link to="/events" className="flex items-center gap-2.5 px-3 py-2 text-base font-semibold text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-xl transition" onClick={() => setMobileOpen(false)}>
              <Compass size={18} className="text-gray-400" />
              <span>Events</span>
            </Link>
            <Link to="/search" className="flex items-center gap-2.5 px-3 py-2 text-base font-semibold text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-xl transition" onClick={() => setMobileOpen(false)}>
              <Search size={18} className="text-gray-400" />
              <span>Search</span>
            </Link>
          </div>

          {/* Attendee Account Section (Mobile) */}
          {isAttendee && (
            <div className="border-t border-gray-50 pt-3">
              <p className="px-3 text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">My Account</p>
              <div className="space-y-1">
                <Link to="/my-bookings" className="flex items-center gap-2.5 px-3 py-2 text-base font-semibold text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-xl transition" onClick={() => setMobileOpen(false)}>
                  <Ticket size={18} className="text-gray-400" />
                  <span>My Bookings</span>
                </Link>
                <Link to="/wishlist" className="flex items-center gap-2.5 px-3 py-2 text-base font-semibold text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-xl transition" onClick={() => setMobileOpen(false)}>
                  <Heart size={18} className="text-gray-400" />
                  <span>Wishlist</span>
                </Link>
                <Link to="/payment-history" className="flex items-center gap-2.5 px-3 py-2 text-base font-semibold text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-xl transition" onClick={() => setMobileOpen(false)}>
                  <CreditCard size={18} className="text-gray-400" />
                  <span>Payment History</span>
                </Link>
                <Link to="/inbox" className="flex items-center gap-2.5 px-3 py-2 text-base font-semibold text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-xl transition" onClick={() => setMobileOpen(false)}>
                  <MessageSquare size={18} className="text-gray-400" />
                  <span>Messages</span>
                </Link>
                <Link to="/sponsorships" className="flex items-center gap-2.5 px-3 py-2 text-base font-semibold text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-xl transition" onClick={() => setMobileOpen(false)}>
                  <Presentation size={18} className="text-gray-400" />
                  <span>Sponsorships</span>
                </Link>
              </div>
            </div>
          )}

          {/* Organizer Tools Section */}
          {isOrganizer && (
            <div className="border-t border-gray-50 pt-3">
              <p className="px-3 text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Organizer Tools</p>
              <div className="space-y-1">
                <Link to="/dashboard" className="flex items-center gap-2.5 px-3 py-2 text-base font-semibold text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-xl transition" onClick={() => setMobileOpen(false)}>
                  <Calendar size={18} className="text-gray-400" />
                  <span>Dashboard</span>
                </Link>
                <Link to="/my-events" className="flex items-center gap-2.5 px-3 py-2 text-base font-semibold text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-xl transition" onClick={() => setMobileOpen(false)}>
                  <Ticket size={18} className="text-gray-400" />
                  <span>My Events</span>
                </Link>
                <Link to="/check-in" className="flex items-center gap-2.5 px-3 py-2 text-base font-semibold text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-xl transition" onClick={() => setMobileOpen(false)}>
                  <Landmark size={18} className="text-gray-400" />
                  <span>Gate Check-In</span>
                </Link>
                <Link to="/coupons" className="flex items-center gap-2.5 px-3 py-2 text-base font-semibold text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-xl transition" onClick={() => setMobileOpen(false)}>
                  <Tag size={18} className="text-gray-400" />
                  <span>Coupons</span>
                </Link>
                <Link to="/refunds" className="flex items-center gap-2.5 px-3 py-2 text-base font-semibold text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-xl transition" onClick={() => setMobileOpen(false)}>
                  <CreditCard size={18} className="text-gray-400" />
                  <span>Manage Refunds</span>
                </Link>
                <Link to="/reports" className="flex items-center gap-2.5 px-3 py-2 text-base font-semibold text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-xl transition" onClick={() => setMobileOpen(false)}>
                  <BarChart3 size={18} className="text-gray-400" />
                  <span>Reports & Exports</span>
                </Link>
              </div>
            </div>
          )}

          {/* Admin Panel */}
          {isAdmin && (
            <div className="border-t border-gray-50 pt-3">
              <Link to="/admin/dashboard" className="flex items-center gap-2.5 px-3 py-2 text-base font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition" onClick={() => setMobileOpen(false)}>
                <ShieldAlert size={18} />
                <span>Admin Panel</span>
              </Link>
            </div>
          )}

          {/* User Account Section */}
          <div className="border-t border-gray-100 pt-4">
            {isAuthenticated ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3 px-3">
                  <div className="w-10 h-10 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center text-white font-bold shadow-sm">
                    {getInitials(user?.full_name)}
                  </div>
                  <div>
                    <p className="font-bold text-gray-800 text-sm leading-none mb-1">{user?.full_name}</p>
                    <p className="text-xs text-gray-400 leading-none truncate max-w-[200px]">{user?.email}</p>
                  </div>
                </div>

                <div className="space-y-1">
                  <Link to="/profile" className="flex items-center gap-2.5 px-3 py-2 text-base font-semibold text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-xl transition" onClick={() => setMobileOpen(false)}>
                    <UserIcon size={18} className="text-gray-400" />
                    <span>My Profile</span>
                  </Link>
                  <Link to="/my-bookings" className="flex items-center gap-2.5 px-3 py-2 text-base font-semibold text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-xl transition" onClick={() => setMobileOpen(false)}>
                    <Ticket size={18} className="text-gray-400" />
                    <span>My Bookings</span>
                  </Link>
                  <Link to="/sponsorships" className="flex items-center gap-2.5 px-3 py-2 text-base font-semibold text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-xl transition" onClick={() => setMobileOpen(false)}>
                    <Presentation size={18} className="text-gray-400" />
                    <span>Sponsorships</span>
                  </Link>
                  <Link to="/wishlist" className="flex items-center gap-2.5 px-3 py-2 text-base font-semibold text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-xl transition" onClick={() => setMobileOpen(false)}>
                    <Heart size={18} className="text-gray-400" />
                    <span>Wishlist</span>
                  </Link>
                  <Link to="/payment-history" className="flex items-center gap-2.5 px-3 py-2 text-base font-semibold text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-xl transition" onClick={() => setMobileOpen(false)}>
                    <CreditCard size={18} className="text-gray-400" />
                    <span>Payments</span>
                  </Link>
                  <Link to="/inbox" className="flex items-center gap-2.5 px-3 py-2 text-base font-semibold text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-xl transition" onClick={() => setMobileOpen(false)}>
                    <MessageSquare size={18} className="text-gray-400" />
                    <span>Messages</span>
                  </Link>
                </div>

                <div className="pt-2 border-t border-gray-50">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 text-base font-bold text-red-600 hover:bg-red-50 rounded-xl transition text-left"
                  >
                    <LogOut size={18} />
                    <span>Logout</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-2 px-3">
                <Link
                  to="/login"
                  className="w-full py-2.5 text-center text-gray-700 font-semibold border border-gray-200 rounded-xl hover:bg-gray-50 transition"
                  onClick={() => setMobileOpen(false)}
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="w-full py-2.5 text-center bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition"
                  onClick={() => setMobileOpen(false)}
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
