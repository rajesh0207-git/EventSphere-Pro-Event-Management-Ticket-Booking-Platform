import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, AreaChart, Area
} from 'recharts';
import {
  TrendingUp, Calendar, DollarSign, Ticket, PlusCircle,
  BarChart2, Activity, Users, Eye
} from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { getOrganizerDashboard, getOrganizerEventsBreakdown } from '../services/dashboardService';

const StatCard = ({ icon: Icon, label, value, color, trend }) => (
  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 relative overflow-hidden group hover:shadow-md transition-all">
    <div className={`absolute -top-6 -right-6 w-24 h-24 ${color} opacity-5 rounded-full group-hover:opacity-10 transition-opacity`} />
    <div className={`w-11 h-11 ${color} bg-opacity-10 rounded-xl flex items-center justify-center mb-4`}>
      <Icon size={21} className={`${color.replace('bg-', 'text-')}`} />
    </div>
    <p className="text-sm font-medium text-gray-500 mb-1">{label}</p>
    <p className="text-3xl font-bold text-gray-900">{value}</p>
    {trend && <p className="text-xs text-emerald-500 font-medium mt-1">{trend}</p>}
  </div>
);

const OrganizerDashboardPage = () => {
  const { user } = useContext(AuthContext);
  const [stats, setStats] = useState(null);
  const [breakdown, setBreakdown] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [statsRes, breakdownRes] = await Promise.all([
          getOrganizerDashboard(),
          getOrganizerEventsBreakdown(),
        ]);
        setStats(statsRes.data);
        setBreakdown(breakdownRes.data);
      } catch {
        setError('Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
      <p className="text-gray-500 text-sm">Loading dashboard...</p>
    </div>
  );
  if (error) return <div className="text-center py-20 text-red-500">{error}</div>;

  const chartData = breakdown.slice(0, 8).map(e => ({
    name: e.title.length > 12 ? e.title.slice(0, 12) + '…' : e.title,
    bookings: e.total_bookings,
    revenue: e.revenue,
  }));

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Organizer Dashboard</h1>
          <p className="text-gray-500 mt-1">Welcome back, {user?.full_name?.split(' ')[0]}! Here's your overview.</p>
        </div>
        <Link
          to="/create-event"
          className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-indigo-700 transition-all shadow-md shadow-indigo-200 self-start md:self-auto"
        >
          <PlusCircle size={18} />
          Create Event
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <StatCard icon={Calendar} label="Total Events" value={stats?.total_events || 0} color="bg-indigo-500" />
        <StatCard icon={Eye} label="Published" value={stats?.published_events || 0} color="bg-emerald-500" />
        <StatCard icon={Activity} label="Drafts" value={stats?.draft_events || 0} color="bg-yellow-500" />
        <StatCard icon={Ticket} label="Total Bookings" value={stats?.total_bookings || 0} color="bg-blue-500" />
        <StatCard icon={DollarSign} label="Total Revenue" value={`$${(stats?.total_revenue || 0).toFixed(2)}`} color="bg-purple-500" />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Revenue by Event */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-5">
            <DollarSign size={18} className="text-emerald-600" />
            <h3 className="font-semibold text-gray-800">Revenue by Event</h3>
          </div>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={chartData} barSize={28}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}
                  formatter={(v) => [`$${v.toFixed(2)}`, 'Revenue']}
                />
                <Bar dataKey="revenue" fill="url(#revenueGrad)" radius={[6, 6, 0, 0]} />
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" />
                    <stop offset="100%" stopColor="#8b5cf6" />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-60 text-gray-400 text-sm">No events yet</div>
          )}
        </div>

        {/* Bookings by Event */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-5">
            <Users size={18} className="text-indigo-600" />
            <h3 className="font-semibold text-gray-800">Ticket Sales by Event</h3>
          </div>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={chartData} barSize={28}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}
                  formatter={(v) => [v, 'Bookings']}
                />
                <Bar dataKey="bookings" fill="url(#bookingsGrad)" radius={[6, 6, 0, 0]} />
                <defs>
                  <linearGradient id="bookingsGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" />
                    <stop offset="100%" stopColor="#3b82f6" />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-60 text-gray-400 text-sm">No booking data</div>
          )}
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {[
          { to: '/my-events', icon: Calendar, title: 'My Events', desc: 'View and manage all your events', color: 'from-indigo-500 to-purple-600' },
          { to: '/create-event', icon: PlusCircle, title: 'Create Event', desc: 'Launch a new event with tickets', color: 'from-emerald-500 to-teal-500' },
          { to: '/check-in', icon: Activity, title: 'Gate Check-In', desc: 'Scan QR codes and track attendance', color: 'from-orange-500 to-pink-500' },
        ].map(({ to, icon: Icon, title, desc, color }) => (
          <Link
            key={to}
            to={to}
            className="relative overflow-hidden bg-white rounded-2xl border border-gray-100 shadow-sm p-6 hover:shadow-md transition-all group"
          >
            <div className={`absolute -bottom-4 -right-4 w-24 h-24 bg-gradient-to-br ${color} opacity-10 rounded-full group-hover:opacity-20 transition-opacity`} />
            <div className={`w-10 h-10 bg-gradient-to-br ${color} rounded-xl flex items-center justify-center mb-3`}>
              <Icon size={18} className="text-white" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">{title}</h3>
            <p className="text-sm text-gray-500">{desc}</p>
          </Link>
        ))}
      </div>

      {/* Events Breakdown Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-8">
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart2 size={18} className="text-gray-600" />
            <h3 className="font-semibold text-gray-800">Events Overview</h3>
          </div>
          <Link to="/my-events" className="text-sm text-indigo-600 hover:underline">View all</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                {['Event', 'Status', 'Bookings', 'Revenue', 'Analytics'].map(h => (
                  <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {breakdown.length > 0 ? breakdown.map(e => (
                <tr key={e.event_id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-900">
                    <Link to={`/events/${e.event_id}`} className="hover:text-indigo-600 transition-colors">{e.title}</Link>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                      e.status === 'PUBLISHED' ? 'bg-emerald-100 text-emerald-700' :
                      e.status === 'DRAFT' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-gray-100 text-gray-600'
                    }`}>{e.status}</span>
                  </td>
                  <td className="px-6 py-4 text-gray-600">{e.total_bookings}</td>
                  <td className="px-6 py-4 font-semibold text-emerald-600">${e.revenue.toFixed(2)}</td>
                  <td className="px-6 py-4">
                    <Link
                      to={`/events/${e.event_id}/analytics`}
                      className="flex items-center gap-1.5 text-indigo-600 text-sm hover:underline"
                    >
                      <TrendingUp size={14} /> View
                    </Link>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan={5} className="px-6 py-10 text-center text-gray-400 text-sm">No events yet. <Link to="/create-event" className="text-indigo-600 hover:underline">Create one!</Link></td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Bookings */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 flex items-center gap-2">
          <Ticket size={18} className="text-gray-600" />
          <h3 className="font-semibold text-gray-800">Recent Bookings</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                {['Event', 'User', 'Qty', 'Amount', 'Date'].map(h => (
                  <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {stats?.recent_bookings?.length > 0 ? stats.recent_bookings.map(b => (
                <tr key={b.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4 text-sm">
                    <Link to={`/events/${b.event_id}`} className="text-indigo-600 hover:underline font-medium">#{b.event_id}</Link>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{b.user_id}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{b.quantity}</td>
                  <td className="px-6 py-4 text-sm font-semibold text-emerald-600">${parseFloat(b.total_amount).toFixed(2)}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{new Date(b.booked_at).toLocaleDateString()}</td>
                </tr>
              )) : (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-400 text-sm">No bookings yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default OrganizerDashboardPage;
