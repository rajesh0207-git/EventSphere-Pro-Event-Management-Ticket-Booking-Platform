import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getMyBookings, cancelBooking } from '../services/bookingService';
import { requestRefund } from '../services/refundService';
import { formatDateTime, formatCurrency } from '../utils/helpers';

const MyBookingsPage = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchBookings = async () => {
    try {
      const res = await getMyBookings();
      setBookings(res.data || []);
    } catch (err) {
      console.error('Failed to fetch bookings', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBookings(); }, []);

  const handleCancel = async (id) => {
    if (!window.confirm('Cancel this booking?')) return;
    try {
      await cancelBooking(id);
      setBookings(bookings.map(b => b.id === id ? { ...b, status: 'CANCELLED' } : b));
    } catch (err) {
      alert('Failed to cancel booking');
    }
  };

  const handleRefund = async (id) => {
    const reason = window.prompt('Please provide a reason for the refund request:');
    if (!reason) return;
    try {
      await requestRefund({ booking_id: id, reason });
      alert('Refund requested successfully');
      setBookings(bookings.map(b => b.id === id ? { ...b, refund_requested: true } : b));
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to request refund');
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">My Bookings</h1>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      ) : bookings.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl shadow-sm">
          <p className="text-gray-500 text-lg mb-4">No bookings yet.</p>
          <Link to="/events" className="text-indigo-600 hover:text-indigo-700 font-medium">Browse events</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map(booking => (
            <div key={booking.id} className="bg-white rounded-xl shadow-sm p-5 flex items-center justify-between">
              <div>
                <Link to={`/events/${booking.event_id}`} className="font-semibold text-gray-900 hover:text-indigo-600 transition">
                  Event #{booking.event_id}
                </Link>
                <p className="text-sm text-gray-500">Ticket #{booking.ticket_id} &middot; Qty: {booking.quantity}</p>
                <p className="text-sm text-gray-500">{formatDateTime(booking.booked_at)}</p>
                <div className="flex items-center gap-3 mt-1">
                  <span className="font-semibold text-gray-900">{formatCurrency(booking.total_amount)}</span>
                  <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${
                    booking.status === 'CONFIRMED' ? 'bg-green-100 text-green-700' :
                    booking.status === 'ATTENDED' ? 'bg-emerald-100 text-emerald-700' :
                    booking.status === 'CANCELLED' ? 'bg-red-100 text-red-700' :
                    'bg-blue-100 text-blue-700'
                  }`}>{booking.status}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {(booking.status === 'CONFIRMED' || booking.status === 'ATTENDED') && (
                  <Link to={`/tickets/${booking.id}`} className="px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow-sm transition">
                    View Ticket
                  </Link>
                )}
                {booking.status === 'CONFIRMED' && booking.total_amount === 0 && (
                  <button onClick={() => handleCancel(booking.id)} className="px-4 py-2 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition">
                    Cancel
                  </button>
                )}
                {booking.status === 'CONFIRMED' && booking.total_amount > 0 && !booking.has_pending_refund && !booking.refund_requested && (
                  <button onClick={() => handleRefund(booking.id)} className="px-4 py-2 text-sm text-amber-600 border border-amber-200 rounded-lg hover:bg-amber-50 transition">
                    Request Refund
                  </button>
                )}
                {(booking.has_pending_refund || booking.refund_requested) && (
                  <span className="px-4 py-2 text-sm text-amber-600 font-medium bg-amber-50 rounded-lg">
                    Refund Pending
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyBookingsPage;
