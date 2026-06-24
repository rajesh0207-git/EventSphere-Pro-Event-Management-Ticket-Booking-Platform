import React, { useState, useEffect } from 'react';
import { getBIDashboard } from '../../services/adminService';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  LineChart, Line, AreaChart, Area
} from 'recharts';
import { TrendingUp, Users, DollarSign, Activity } from 'lucide-react';

const BIDashboard = () => {
  const [data, setData] = useState({
    popular_events: [],
    top_organizers: [],
    trends: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await getBIDashboard();
        setData(response.data);
      } catch (error) {
        console.error('Error fetching BI dashboard data', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Loading Business Intelligence Data...</div>;
  }

  // Calculate totals from trends
  const totalRevenue = data.trends.reduce((sum, item) => sum + item.revenue, 0);
  const totalBookings = data.trends.reduce((sum, item) => sum + item.bookings, 0);

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
          <Activity className="text-indigo-600" />
          Business Intelligence
        </h1>
        <p className="text-gray-500 mt-1">Advanced platform analytics and performance metrics</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center gap-4">
          <div className="p-3 bg-indigo-100 text-indigo-600 rounded-lg">
            <TrendingUp size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Recent Bookings</p>
            <h3 className="text-2xl font-bold text-gray-800">{totalBookings}</h3>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center gap-4">
          <div className="p-3 bg-green-100 text-green-600 rounded-lg">
            <DollarSign size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Recent Revenue</p>
            <h3 className="text-2xl font-bold text-gray-800">${totalRevenue.toLocaleString()}</h3>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Popular Events Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-6">Most Popular Events</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.popular_events} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{fontSize: 12}} />
                <YAxis />
                <RechartsTooltip cursor={{fill: '#f3f4f6'}} />
                <Legend />
                <Bar dataKey="bookings" fill="#4f46e5" radius={[4, 4, 0, 0]} name="Total Bookings" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Organizers Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-6">Top Organizers by Revenue</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.top_organizers} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{fontSize: 12}} />
                <YAxis />
                <RechartsTooltip cursor={{fill: '#f3f4f6'}} formatter={(value) => `$${value}`} />
                <Legend />
                <Bar dataKey="revenue" fill="#10b981" radius={[4, 4, 0, 0]} name="Revenue ($)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Booking & Revenue Trends */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
        <h2 className="text-lg font-bold text-gray-800 mb-6">Platform Growth Trends</h2>
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data.trends} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorBookings" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="date" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <RechartsTooltip />
              <Legend />
              <Area yAxisId="right" type="monotone" dataKey="revenue" stroke="#10b981" fillOpacity={1} fill="url(#colorRevenue)" name="Revenue ($)" />
              <Area yAxisId="left" type="monotone" dataKey="bookings" stroke="#4f46e5" fillOpacity={1} fill="url(#colorBookings)" name="Bookings" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default BIDashboard;
