import React, { useState, useEffect, useContext } from 'react';
import { Bell, Check, CheckCheck, Info, Calendar, Ticket, Settings } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { getNotifications, markAsRead, markAllAsRead } from '../services/notificationService';

const typeConfig = {
  BOOKING: { icon: Ticket, color: 'text-indigo-500', bg: 'bg-indigo-50', label: 'Booking' },
  REMINDER: { icon: Calendar, color: 'text-yellow-500', bg: 'bg-yellow-50', label: 'Reminder' },
  UPDATE: { icon: Settings, color: 'text-blue-500', bg: 'bg-blue-50', label: 'Update' },
  SYSTEM: { icon: Info, color: 'text-gray-500', bg: 'bg-gray-50', label: 'System' },
};

const NotificationsPage = () => {
  const { user } = useContext(AuthContext);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all' | 'unread'

  const fetchNotifications = async () => {
    try {
      const res = await getNotifications();
      setNotifications(res.data);
    } catch {
      /* silent */
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAsRead = async (id) => {
    try {
      await markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
    } catch {}
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch {}
  };

  const filtered = filter === 'unread' ? notifications.filter((n) => !n.is_read) : notifications;
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const formatTime = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    const now = new Date();
    const diff = Math.floor((now - d) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return d.toLocaleDateString();
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
            <Bell size={20} className="text-indigo-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
            {unreadCount > 0 && (
              <p className="text-sm text-gray-500">{unreadCount} unread notification{unreadCount > 1 ? 's' : ''}</p>
            )}
          </div>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllAsRead}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-all"
          >
            <CheckCheck size={16} />
            Mark all as read
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6">
        {['all', 'unread'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-full text-sm font-medium capitalize transition-all ${
              filter === f
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                : 'bg-white text-gray-600 border border-gray-200 hover:border-indigo-300'
            }`}
          >
            {f === 'unread' ? `Unread (${unreadCount})` : 'All'}
          </button>
        ))}
      </div>

      {/* Notification List */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Bell size={28} className="text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-700 mb-1">No notifications</h3>
          <p className="text-gray-400 text-sm">
            {filter === 'unread' ? "You're all caught up!" : "You haven't received any notifications yet."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((n) => {
            const config = typeConfig[n.type] || typeConfig.SYSTEM;
            const Icon = config.icon;
            return (
              <div
                key={n.id}
                className={`group relative flex gap-4 p-5 rounded-2xl border transition-all duration-200 cursor-pointer hover:shadow-md ${
                  n.is_read
                    ? 'bg-white border-gray-100'
                    : 'bg-gradient-to-r from-indigo-50/60 to-purple-50/30 border-indigo-100 shadow-sm'
                }`}
                onClick={() => !n.is_read && handleMarkAsRead(n.id)}
              >
                {/* Unread dot */}
                {!n.is_read && (
                  <span className="absolute top-4 right-4 w-2.5 h-2.5 bg-indigo-500 rounded-full" />
                )}

                {/* Icon */}
                <div className={`flex-shrink-0 w-10 h-10 ${config.bg} rounded-xl flex items-center justify-center`}>
                  <Icon size={18} className={config.color} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full ${config.bg} ${config.color}`}>
                      {config.label}
                    </span>
                    <span className="text-xs text-gray-400">{formatTime(n.created_at)}</span>
                  </div>
                  <h3 className={`font-semibold mb-0.5 ${n.is_read ? 'text-gray-700' : 'text-gray-900'}`}>
                    {n.title}
                  </h3>
                  <p className={`text-sm leading-relaxed ${n.is_read ? 'text-gray-400' : 'text-gray-600'}`}>
                    {n.message}
                  </p>
                </div>

                {/* Mark as read icon */}
                {!n.is_read && (
                  <button
                    className="flex-shrink-0 opacity-0 group-hover:opacity-100 self-center p-2 text-indigo-500 hover:bg-indigo-100 rounded-lg transition-all"
                    onClick={(e) => { e.stopPropagation(); handleMarkAsRead(n.id); }}
                    title="Mark as read"
                  >
                    <Check size={14} />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;
