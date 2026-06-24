import { useState, useEffect } from 'react';
import { getPaymentHistory } from '../services/paymentService';
import { formatDateTime, formatCurrency } from '../utils/helpers';
import { Link } from 'react-router-dom';

const PaymentHistoryPage = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        const res = await getPaymentHistory();
        setPayments(res.data || []);
      } catch (err) {
        setError('Failed to fetch payment history');
      } finally {
        setLoading(false);
      }
    };
    fetchPayments();
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Payment History</h1>
        <span className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-xs font-semibold">
          {payments.length} Transaction(s)
        </span>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      ) : error ? (
        <div className="bg-rose-50 text-rose-700 px-4 py-3 rounded-xl mb-4 border border-rose-100">{error}</div>
      ) : payments.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl shadow-sm border border-gray-100">
          <p className="text-gray-500 text-lg mb-4">No payments recorded yet.</p>
          <Link to="/events" className="text-indigo-600 hover:text-indigo-700 font-medium transition">
            Browse events
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {payments.map((p) => (
            <div key={p.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:shadow-md transition">
              <div className="space-y-1.5">
                <div className="flex items-center gap-3">
                  <span className="font-bold text-gray-900">Payment #{p.id}</span>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                    p.status === 'SUCCESS' ? 'bg-emerald-100 text-emerald-700' :
                    p.status === 'PENDING' ? 'bg-amber-100 text-amber-700' :
                    'bg-rose-100 text-rose-700'
                  }`}>
                    {p.status}
                  </span>
                </div>
                <div className="text-xs text-gray-400 font-mono">
                  Txn ID: {p.transaction_id || '—'}
                </div>
                <div className="text-sm text-gray-500">
                  Paid on {formatDateTime(p.created_at)}
                </div>
                <div className="text-sm">
                  <Link to={`/my-bookings`} className="text-indigo-600 hover:underline font-semibold text-xs">
                    View Booking #{p.booking_id}
                  </Link>
                </div>
              </div>

              <div className="flex flex-col items-start md:items-end justify-between">
                <span className="text-2xl font-black text-gray-900">{formatCurrency(p.amount)}</span>
                <span className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">
                  Via {p.method}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PaymentHistoryPage;
