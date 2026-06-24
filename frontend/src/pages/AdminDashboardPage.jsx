import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { Users, Calendar, Ticket, DollarSign, Activity, Settings, CheckCircle, XCircle, Shield, BarChart3 } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { getAdminDashboard, getAdminOrganizers, verifyOrganizer, unverifyOrganizer } from '../services/adminService';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const StatCard = ({ icon: Icon, label, value, color }) => (
  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 relative overflow-hidden group hover:shadow-md transition-all">
    <div className={`absolute -top-6 -right-6 w-24 h-24 ${color} opacity-5 rounded-full group-hover:opacity-10 transition-opacity`} />
    <div className={`w-11 h-11 ${color} bg-opacity-10 rounded-xl flex items-center justify-center mb-4`}>
      <Icon size={21} className={`${color.replace('bg-', 'text-')}`} />
    </div>
    <p className="text-sm font-medium text-gray-500 mb-1">{label}</p>
    <p className="text-3xl font-bold text-gray-900">{value}</p>
  </div>
);

const AdminDashboardPage = () => {
  const { user } = useContext(AuthContext);
  const [stats, setStats] = useState(null);
  const [organizers, setOrganizers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDashboard = async () => {
    try {
      const [statsRes, organizersRes] = await Promise.all([
        getAdminDashboard(),
        getAdminOrganizers()
      ]);
      setStats(statsRes.data);
      setOrganizers(organizersRes.data);
    } catch (err) {
      console.error('Admin Dashboard Error:', err);
      setError(err.response?.data?.detail || err.message || 'Failed to load admin dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const handleVerify = async (userId, currentStatus) => {
    try {
      if (currentStatus) {
        await unverifyOrganizer(userId);
      } else {
        await verifyOrganizer(userId);
      }
      fetchDashboard();
    } catch (err) {
      alert('Failed to update verification status');
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
      <p className="text-gray-500 text-sm">Loading admin dashboard...</p>
    </div>
  );

  if (error) return <div className="text-center py-20 text-red-500">{error}</div>;

  const roleData = stats?.roles_breakdown ? Object.entries(stats.roles_breakdown).map(([name, value]) => ({ name, value })) : [];
  const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899'];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
            <Shield className="text-indigo-600" />
            Admin Dashboard
          </h1>
          <p className="text-gray-500 mt-1">Platform overview and management</p>
        </div>
        <div className="flex gap-3">
          <Link to="/admin/bi-dashboard" className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition shadow-sm">
            <BarChart3 size={18} />
            BI Dashboard
          </Link>
          <Link to="/admin/audit-logs" className="flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition shadow-sm">
            <Activity size={18} />
            Audit Logs
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={Users} label="Total Users" value={stats?.total_users || 0} color="bg-indigo-500" />
        <StatCard icon={Calendar} label="Total Events" value={stats?.total_events || 0} color="bg-emerald-500" />
        <StatCard icon={Ticket} label="Total Bookings" value={stats?.total_bookings || 0} color="bg-blue-500" />
        <StatCard icon={DollarSign} label="Platform Revenue" value={`$${(stats?.total_revenue || 0).toFixed(2)}`} color="bg-purple-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Roles Chart */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <Activity size={18} className="text-indigo-600" />
            <h3 className="font-semibold text-gray-800">Users by Role</h3>
          </div>
          {roleData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={roleData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  innerRadius={60}
                  dataKey="value"
                  paddingAngle={5}
                >
                  {roleData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
             <div className="flex items-center justify-center h-[250px] text-gray-400 text-sm">No user data</div>
          )}
        </div>

        {/* Organizer Management */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
             <div className="flex items-center gap-2">
               <Users size={18} className="text-emerald-600" />
               <h3 className="font-semibold text-gray-800">Organizer Management</h3>
             </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Organizer</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Joined</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {organizers.map(o => (
                  <tr key={o.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-4 text-sm font-medium text-gray-900">{o.full_name}</td>
                    <td className="px-4 py-4 text-sm text-gray-500">{o.email}</td>
                    <td className="px-4 py-4 text-sm text-gray-500">{new Date(o.created_at).toLocaleDateString()}</td>
                    <td className="px-4 py-4 text-sm">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                        o.is_verified ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {o.is_verified ? 'Verified' : 'Pending'}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm">
                      <button
                        onClick={() => handleVerify(o.id, o.is_verified)}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                          o.is_verified
                            ? 'bg-red-50 text-red-600 hover:bg-red-100'
                            : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                        }`}
                      >
                        {o.is_verified ? <XCircle size={14} /> : <CheckCircle size={14} />}
                        {o.is_verified ? 'Revoke' : 'Verify'}
                      </button>
                    </td>
                  </tr>
                ))}
                {organizers.length === 0 && (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400 text-sm">No organizers found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
