import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import {
  TrendingUp, Users, DollarSign, Ticket, ArrowLeft,
  BarChart2, Calendar, Target
} from 'lucide-react';
import { getEventAnalytics } from '../services/dashboardService';

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6'];

const StatCard = ({ icon: Icon, label, value, subValue, color }) => (
  <div className={`bg-white rounded-2xl border border-gray-100 shadow-sm p-6 relative overflow-hidden`}>
    <div className={`absolute top-0 right-0 w-24 h-24 ${color}/10 rounded-full -mr-8 -mt-8`} />
    <div className={`w-10 h-10 ${color}/10 rounded-xl flex items-center justify-center mb-3`}>
      <Icon size={20} className={`${color.replace('bg-', 'text-')}`} />
    </div>
    <p className="text-sm text-gray-500 font-medium mb-1">{label}</p>
    <p className="text-3xl font-bold text-gray-900">{value}</p>
    {subValue && <p className="text-xs text-gray-400 mt-1">{subValue}</p>}
  </div>
);

const EventAnalyticsPage = () => {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await getEventAnalytics(id);
        setData(res.data);
      } catch {
        setError('Failed to load analytics. Make sure you are the organizer of this event.');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [id]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
      <p className="text-gray-500 text-sm">Loading analytics...</p>
    </div>
  );

  if (error) return (
    <div className="max-w-2xl mx-auto px-4 py-20 text-center">
      <BarChart2 size={48} className="text-gray-300 mx-auto mb-4" />
      <h2 className="text-xl font-bold text-gray-700 mb-2">Analytics Unavailable</h2>
      <p className="text-red-500 text-sm">{error}</p>
      <Link to="/dashboard" className="mt-4 inline-flex items-center gap-2 text-indigo-600 hover:underline text-sm">
        <ArrowLeft size={14} /> Back to Dashboard
      </Link>
    </div>
  );

  const attendanceRate = data.capacity
    ? Math.min(100, Math.round((data.total_bookings / data.capacity) * 100))
    : 0;

  const checkInRate = data.total_bookings > 0
    ? Math.round((data.total_attended / data.total_bookings) * 100)
    : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <Link to="/my-events" className="flex items-center gap-1 text-sm text-gray-500 hover:text-indigo-600 mb-2 transition-colors">
            <ArrowLeft size={14} /> My Events
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">{data.title}</h1>
          <div className="flex items-center gap-3 mt-2">
            <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase ${
              data.status === 'PUBLISHED' ? 'bg-emerald-100 text-emerald-700' :
              data.status === 'DRAFT' ? 'bg-yellow-100 text-yellow-700' :
              'bg-gray-100 text-gray-600'
            }`}>{data.status}</span>
            {data.start_time && (
              <span className="flex items-center gap-1 text-sm text-gray-500">
                <Calendar size={13} />
                {new Date(data.start_time).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            )}
          </div>
        </div>
        <div className="hidden md:flex items-center gap-2">
          {['overview', 'tickets', 'sales'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-xl text-sm font-medium capitalize transition-all ${
                activeTab === tab
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-indigo-300'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={Ticket} label="Total Bookings" value={data.total_bookings} color="bg-indigo-500" />
        <StatCard icon={DollarSign} label="Total Revenue" value={`$${data.total_revenue.toFixed(2)}`} color="bg-emerald-500" />
        <StatCard icon={Users} label="Attended" value={data.total_attended} subValue={`${checkInRate}% check-in rate`} color="bg-purple-500" />
        <StatCard
          icon={Target}
          label="Capacity Used"
          value={data.capacity ? `${attendanceRate}%` : 'Unlimited'}
          subValue={data.capacity ? `${data.total_bookings} / ${data.capacity}` : ''}
          color="bg-orange-500"
        />
      </div>

      {/* Progress bars */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="font-semibold text-gray-800 mb-4">Attendance Rate</h3>
          <div className="flex items-center gap-4 mb-2">
            <span className="text-4xl font-bold text-indigo-600">{attendanceRate}%</span>
            <span className="text-sm text-gray-400">of capacity filled</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-3">
            <div
              className="bg-gradient-to-r from-indigo-500 to-purple-500 h-3 rounded-full transition-all duration-500"
              style={{ width: `${attendanceRate}%` }}
            />
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="font-semibold text-gray-800 mb-4">Check-In Rate</h3>
          <div className="flex items-center gap-4 mb-2">
            <span className="text-4xl font-bold text-emerald-600">{checkInRate}%</span>
            <span className="text-sm text-gray-400">of bookings attended</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-3">
            <div
              className="bg-gradient-to-r from-emerald-500 to-teal-400 h-3 rounded-full transition-all duration-500"
              style={{ width: `${checkInRate}%` }}
            />
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-8">
        {/* Daily Sales Line Chart */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-5">
            <TrendingUp size={18} className="text-indigo-600" />
            <h3 className="font-semibold text-gray-800">Sales Over Last 30 Days</h3>
          </div>
          {data.daily_bookings.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={data.daily_bookings}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={d => d.slice(5)} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}
                />
                <Legend />
                <Line type="monotone" dataKey="bookings" stroke="#6366f1" strokeWidth={2.5} dot={{ fill: '#6366f1', r: 4 }} name="Bookings" />
                <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2.5} dot={{ fill: '#10b981', r: 4 }} name="Revenue ($)" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[250px] text-gray-400 text-sm">No booking data in the last 30 days</div>
          )}
        </div>

        {/* Ticket Pie Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-5">
            <Ticket size={18} className="text-purple-600" />
            <h3 className="font-semibold text-gray-800">Ticket Type Split</h3>
          </div>
          {data.ticket_breakdown.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={data.ticket_breakdown}
                  cx="50%"
                  cy="45%"
                  outerRadius={80}
                  dataKey="sold"
                  nameKey="name"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {data.ticket_breakdown.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(val, name) => [val, 'Sold']} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[250px] text-gray-400 text-sm">No ticket data</div>
          )}
        </div>
      </div>

      {/* Ticket Breakdown Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 flex items-center gap-2">
          <BarChart2 size={18} className="text-gray-600" />
          <h3 className="font-semibold text-gray-800">Ticket Breakdown</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                {['Ticket', 'Type', 'Price', 'Total', 'Sold', 'Available', 'Revenue'].map(h => (
                  <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {data.ticket_breakdown.length > 0 ? data.ticket_breakdown.map((t, i) => (
                <tr key={t.ticket_id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-900">{t.name}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      t.type === 'VIP' ? 'bg-yellow-100 text-yellow-700' :
                      t.type === 'PAID' ? 'bg-indigo-100 text-indigo-700' :
                      'bg-green-100 text-green-700'
                    }`}>{t.type}</span>
                  </td>
                  <td className="px-6 py-4 text-gray-600">${t.price.toFixed(2)}</td>
                  <td className="px-6 py-4 text-gray-600">{t.quantity}</td>
                  <td className="px-6 py-4 font-semibold text-indigo-600">{t.sold}</td>
                  <td className="px-6 py-4 text-gray-600">{t.available}</td>
                  <td className="px-6 py-4 font-semibold text-emerald-600">${t.revenue.toFixed(2)}</td>
                </tr>
              )) : (
                <tr><td colSpan={7} className="px-6 py-8 text-center text-gray-400 text-sm">No tickets configured</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default EventAnalyticsPage;
