import React, { useState, useEffect, useContext } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line
} from 'recharts';
import { Download } from 'lucide-react';
import reportService from '../services/reportService';
import { AuthContext } from '../context/AuthContext';

const ReportsDashboard = () => {
  const { user } = useContext(AuthContext);
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const data = await reportService.getDashboardReports();
      setReportData(data);
    } catch (err) {
      setError('Failed to fetch reports data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = async () => {
    try {
      await reportService.exportReportsCSV();
    } catch (err) {
      console.error('Failed to export CSV', err);
      alert('Failed to export CSV');
    }
  };

  const handlePrintPDF = () => {
    window.print();
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading reports...</div>;
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;
  if (!reportData) return null;

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Reports & Exports</h1>
        <div className="space-x-4">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
          >
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </button>
          <button
            onClick={handlePrintPDF}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition print:hidden"
          >
            Print PDF
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-600">Total Bookings</h3>
          <p className="text-4xl font-bold text-blue-600 mt-2">{reportData.total_bookings_all_time}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-600">Total Revenue</h3>
          <p className="text-4xl font-bold text-green-600 mt-2">${reportData.total_revenue_all_time.toFixed(2)}</p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Bookings Chart */}
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
          <h3 className="text-xl font-bold text-gray-800 mb-6">Bookings Over Time</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={reportData.bookings_by_date}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="total_bookings" name="Bookings" fill="#3b82f6" />
                <Bar dataKey="total_tickets" name="Tickets" fill="#60a5fa" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Revenue Chart */}
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
          <h3 className="text-xl font-bold text-gray-800 mb-6">Revenue Over Time</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={reportData.revenue_by_date}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip formatter={(value) => `$${value}`} />
                <Legend />
                <Line type="monotone" dataKey="total_revenue" name="Revenue" stroke="#10b981" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Events Summary Table */}
      <div className="bg-white rounded-lg shadow-md border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-gray-50">
          <h3 className="text-xl font-bold text-gray-800">Events Summary</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="px-6 py-4 font-semibold">Event Title</th>
                <th className="px-6 py-4 font-semibold">Bookings</th>
                <th className="px-6 py-4 font-semibold">Tickets Sold</th>
                <th className="px-6 py-4 font-semibold">Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {reportData.events_summary.map((event) => (
                <tr key={event.event_id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4 font-medium text-gray-800">{event.event_title}</td>
                  <td className="px-6 py-4">{event.total_bookings}</td>
                  <td className="px-6 py-4">{event.total_tickets_sold}</td>
                  <td className="px-6 py-4 font-medium text-green-600">${event.total_revenue.toFixed(2)}</td>
                </tr>
              ))}
              {reportData.events_summary.length === 0 && (
                <tr>
                  <td colSpan="4" className="px-6 py-8 text-center text-gray-500">
                    No events found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Print styles */}
      <style>{`
        @media print {
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .container { max-width: 100% !important; padding: 0 !important; }
          .shadow-md { box-shadow: none !important; border: 1px solid #e5e7eb; }
        }
      `}</style>
    </div>
  );
};

export default ReportsDashboard;
