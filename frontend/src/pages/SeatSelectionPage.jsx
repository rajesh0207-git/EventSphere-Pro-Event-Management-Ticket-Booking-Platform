import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { getEvent } from '../services/eventService';
import { reserveSeat, releaseSeatReservation } from '../services/seatService';
import { createBooking } from '../services/bookingService';
import SeatMap from '../components/Seats/SeatMap';
import PaymentModal from '../components/Payment/PaymentModal';
import { formatCurrency } from '../utils/helpers';

const SeatSelectionPage = () => {
  const { id } = useParams(); // Event ID
  const navigate = useNavigate();
  const location = useLocation();
  
  // Retrieve selected ticket details from router state
  const ticket = location.state?.ticket;
  const couponCode = location.state?.couponCode;
  const discountPercentage = location.state?.discountPercentage;
  
  const [event, setEvent] = useState(null);
  const [selectedSeat, setSelectedSeat] = useState(null);
  const [reservedSeatId, setReservedSeatId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Timer for seat hold
  const [timeLeft, setTimeLeft] = useState(0);
  
  // Booking & payment modal trigger
  const [createdBooking, setCreatedBooking] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);

  useEffect(() => {
    const fetchEventData = async () => {
      try {
        const res = await getEvent(id);
        setEvent(res.data);
        if (!ticket) {
          setError('Invalid access. Please select a ticket category first.');
        }
      } catch (err) {
        setError('Event not found');
      } finally {
        setLoading(false);
      }
    };
    fetchEventData();
  }, [id, ticket]);

  // Seat hold timer countdown
  useEffect(() => {
    if (timeLeft <= 0) {
      if (reservedSeatId) {
        // Automatically release seat in state on timeout
        releaseSeatReservation(reservedSeatId).catch(console.error);
        setReservedSeatId(null);
        setSelectedSeat(null);
        alert('Seat reservation hold expired. Please select a seat again.');
      }
      return;
    }
    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft, reservedSeatId]);

  const handleSeatSelect = async (seat) => {
    setError('');
    
    // Release existing hold if user switches seats
    if (reservedSeatId) {
      try {
        await releaseSeatReservation(reservedSeatId);
        setReservedSeatId(null);
      } catch (err) {
        console.error('Failed to release previous seat', err);
      }
    }

    try {
      const res = await reserveSeat(seat.id);
      setSelectedSeat(res.data);
      setReservedSeatId(res.data.id);
      setTimeLeft(15 * 60); // 15 mins countdown
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to reserve seat. Try another.');
    }
  };

  const handleConfirmReservation = async () => {
    if (!reservedSeatId) return;
    setBookingLoading(true);
    setError('');
    
    try {
      // Create a booking with seat_id parameter
      const payload = {
        event_id: parseInt(id),
        ticket_id: ticket.id,
        quantity: 1,
        seat_id: reservedSeatId
      };
      if (couponCode) {
        payload.coupon_code = couponCode;
      }
      const res = await createBooking(payload);
      
      setCreatedBooking(res.data);
      
      // If free, it will auto-confirm, so redirect to bookings/tickets
      if (ticket.price === 0) {
        navigate(`/tickets/${res.data.id}`);
      } else {
        setShowPaymentModal(true);
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to initiate booking details.');
    } finally {
      setBookingLoading(false);
    }
  };

  // Release hold if user navigates away manually
  useEffect(() => {
    return () => {
      if (reservedSeatId) {
        releaseSeatReservation(reservedSeatId).catch(console.error);
      }
    };
  }, [reservedSeatId]);

  if (loading) return (
    <div className="flex justify-center items-center min-h-[60vh]">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      {/* Breadcrumb / Back button */}
      <Link to={`/events/${id}`} className="text-sm font-semibold text-gray-500 hover:text-indigo-600 transition flex items-center gap-1 mb-6">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
        Back to Event Details
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Seat Map Column */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm mb-4">
            <h2 className="text-xl font-bold text-gray-950 mb-2">Select Your Seat</h2>
            <p className="text-gray-400 text-sm mb-6">Choose a seat from the interactive floor map below. Ticket: <strong className="text-indigo-600 font-semibold">{ticket?.name}</strong></p>
            <SeatMap eventId={parseInt(id)} selectedSeatId={selectedSeat?.id} onSeatSelect={handleSeatSelect} />
          </div>
        </div>

        {/* Checkout Card Column */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm sticky top-6 space-y-6">
            <h3 className="text-lg font-bold text-gray-950">Selection Summary</h3>
            
            {error && <div className="bg-rose-50 text-rose-700 p-4 rounded-2xl border border-rose-100 text-xs font-semibold">{error}</div>}

            {selectedSeat ? (
              <div className="space-y-4">
                <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 space-y-3">
                  <div className="flex justify-between text-xs text-emerald-800 font-medium">
                    <span>SEAT RESERVED</span>
                    <span>
                      Hold: {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-emerald-950 font-extrabold text-2xl">
                    <span>{selectedSeat.label}</span>
                    <span>{formatCurrency(selectedSeat.price)}</span>
                  </div>
                  <div className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">
                    {selectedSeat.type} SECTION
                  </div>
                </div>

                <div className="space-y-3 text-sm text-gray-600">
                  <div className="flex justify-between"><span>Ticket Subtotal</span><span className="font-semibold text-gray-900">{formatCurrency(ticket?.price || 0)}</span></div>
                  <div className="flex justify-between"><span>Seat Surcharge</span><span className="font-semibold text-gray-900">{formatCurrency(selectedSeat.price - (ticket?.price || 0))}</span></div>
                  {couponCode && (
                    <div className="flex justify-between text-emerald-600">
                      <span>Discount ({discountPercentage}%)</span>
                      <span>-{formatCurrency(selectedSeat.price * (discountPercentage / 100))}</span>
                    </div>
                  )}
                  <div className="border-t border-gray-100 pt-3 flex justify-between font-bold text-gray-900 text-base">
                    <span>Total</span>
                    <span>{formatCurrency(couponCode ? selectedSeat.price - (selectedSeat.price * (discountPercentage / 100)) : selectedSeat.price)}</span>
                  </div>
                </div>

                <button
                  disabled={bookingLoading}
                  onClick={handleConfirmReservation}
                  className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold shadow-md transition disabled:opacity-50 text-sm"
                >
                  {bookingLoading ? 'Reserving...' : 'Proceed to Checkout'}
                </button>
              </div>
            ) : (
              <div className="p-8 text-center text-gray-400 text-sm border-2 border-dashed border-gray-200 rounded-2xl">
                Please click on any seat in the venue layout to reserve it.
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Payment checkout modal */}
      {showPaymentModal && createdBooking && (
        <PaymentModal
          booking={createdBooking}
          event={event}
          ticket={ticket}
          onClose={() => setShowPaymentModal(false)}
          onSuccess={() => {
            setShowPaymentModal(false);
            navigate(`/tickets/${createdBooking.id}`);
          }}
        />
      )}
    </div>
  );
};

export default SeatSelectionPage;
