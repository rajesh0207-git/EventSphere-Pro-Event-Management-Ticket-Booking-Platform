import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getMyBookings } from '../services/bookingService';
import { getEvent } from '../services/eventService';
import { getTickets } from '../services/ticketService';
import QRTicket from '../components/Tickets/QRTicket';

const DigitalTicketPage = () => {
  const { id } = useParams(); // Booking ID
  const [booking, setBooking] = useState(null);
  const [event, setEvent] = useState(null);
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchTicketData = async () => {
      try {
        const bookingsRes = await getMyBookings();
        const foundBooking = bookingsRes.data.find(b => b.id === parseInt(id));
        
        if (!foundBooking) {
          setError('Ticket booking not found');
          setLoading(false);
          return;
        }
        
        setBooking(foundBooking);

        const [eventRes, ticketsRes] = await Promise.all([
          getEvent(foundBooking.event_id),
          getTickets(foundBooking.event_id)
        ]);

        setEvent(eventRes.data);
        const foundTicket = ticketsRes.data.find(t => t.id === foundBooking.ticket_id);
        setTicket(foundTicket);

      } catch (err) {
        setError('Failed to load digital ticket details');
      } finally {
        setLoading(false);
      }
    };

    fetchTicketData();
  }, [id]);

  if (loading) return (
    <div className="flex justify-center items-center min-h-[60vh]">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
    </div>
  );

  if (error) return (
    <div className="max-w-md mx-auto mt-12 p-6 bg-rose-50 text-rose-700 rounded-3xl border border-rose-100 text-center">
      <p className="font-bold mb-4">{error}</p>
      <Link to="/my-bookings" className="text-indigo-600 font-semibold hover:underline">
        Back to Bookings
      </Link>
    </div>
  );

  return (
    <div className="max-w-md mx-auto px-4 py-12 flex flex-col items-center">
      <div className="w-full flex justify-between items-center mb-6">
        <Link to="/my-bookings" className="text-sm font-semibold text-gray-500 hover:text-indigo-600 flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
          My Bookings
        </Link>
        <button
          onClick={() => window.print()}
          className="px-4 py-2 border border-gray-200 bg-white hover:bg-gray-50 rounded-xl text-xs font-semibold text-gray-700 shadow-sm transition flex items-center gap-1"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
          Print / PDF
        </button>
      </div>

      <QRTicket booking={booking} event={event} ticket={ticket} />
    </div>
  );
};

export default DigitalTicketPage;
