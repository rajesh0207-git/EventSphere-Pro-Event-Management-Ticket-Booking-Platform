import { useState, useEffect } from 'react';
import { getRefunds, processRefund } from '../services/refundService';
import { formatDateTime, formatCurrency } from '../utils/helpers';

const ManageRefundsPage = () => {
  const [refunds, setRefunds] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchRefunds = async () => {
    try {
      const data = await getRefunds();
      setRefunds(data);
    } catch (err) {
      console.error('Failed to fetch refunds', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRefunds();
  }, []);

  const handleProcess = async (id, status) => {
    let adminNotes = '';
    if (status === 'REJECTED') {
      adminNotes = window.prompt('Please provide a reason for rejection (optional):') || '';
    }
    
    try {
      await processRefund(id, status, adminNotes);
      alert(`Refund ${status.toLowerCase()} successfully`);
      fetchRefunds();
    } catch (err) {
      alert('Failed to process refund');
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Manage Refunds</h1>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      ) : refunds.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl shadow-sm">
          <p className="text-gray-500 text-lg">No refund requests found.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-6 py-4 font-semibold text-sm text-gray-600">Event</th>
                  <th className="px-6 py-4 font-semibold text-sm text-gray-600">User</th>
                  <th className="px-6 py-4 font-semibold text-sm text-gray-600">Amount</th>
                  <th className="px-6 py-4 font-semibold text-sm text-gray-600">Reason</th>
                  <th className="px-6 py-4 font-semibold text-sm text-gray-600">Status</th>
                  <th className="px-6 py-4 font-semibold text-sm text-gray-600">Date</th>
                  <th className="px-6 py-4 font-semibold text-sm text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {refunds.map(refund => (
                  <tr key={refund.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-900">{refund.event_title}</p>
                      <p className="text-xs text-gray-500">Booking #{refund.booking_id}</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{refund.user_name}</td>
                    <td className="px-6 py-4 font-semibold text-gray-900">{formatCurrency(refund.amount)}</td>
                    <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate" title={refund.reason}>
                      {refund.reason}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                        refund.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                        refund.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {refund.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {formatDateTime(refund.created_at)}
                    </td>
                    <td className="px-6 py-4">
                      {refund.status === 'PENDING' ? (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleProcess(refund.id, 'APPROVED')}
                            className="text-sm font-medium text-green-600 hover:text-green-700 bg-green-50 hover:bg-green-100 px-3 py-1.5 rounded transition"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleProcess(refund.id, 'REJECTED')}
                            className="text-sm font-medium text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded transition"
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">Processed</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageRefundsPage;
