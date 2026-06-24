import { formatDateTime, formatCurrency } from '../../utils/helpers';

const QRTicket = ({ booking, event, ticket }) => {
  if (!booking || !event) return null;

  return (
    <div className="max-w-md mx-auto bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-900 rounded-3xl shadow-2xl overflow-hidden border border-white/10 text-white relative">
      {/* Decorative side cuts for ticket look */}
      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-8 bg-gray-50 rounded-r-full z-10"></div>
      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-8 bg-gray-50 rounded-l-full z-10"></div>

      <div className="p-6 pb-4">
        <span className="bg-indigo-600/30 text-indigo-400 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider border border-indigo-500/20">
          Admission Ticket
        </span>
        <h2 className="text-2xl font-bold mt-3 leading-tight tracking-tight">{event.title}</h2>
        <p className="text-gray-400 text-sm mt-1">{event.location || "Online Event"}</p>
      </div>

      <div className="px-6 py-2 grid grid-cols-2 gap-4 border-t border-b border-white/5 bg-black/20">
        <div>
          <p className="text-gray-500 text-xs uppercase font-medium">Date & Time</p>
          <p className="text-sm font-semibold text-gray-200 mt-0.5">{formatDateTime(event.start_time)}</p>
        </div>
        <div>
          <p className="text-gray-500 text-xs uppercase font-medium">Ticket Type</p>
          <p className="text-sm font-semibold text-gray-200 mt-0.5">{ticket?.name || `Ticket #${booking.ticket_id}`}</p>
        </div>
        <div>
          <p className="text-gray-500 text-xs uppercase font-medium">Quantity</p>
          <p className="text-sm font-semibold text-gray-200 mt-0.5">{booking.quantity} Attendee(s)</p>
        </div>
        <div>
          <p className="text-gray-500 text-xs uppercase font-medium">Total Paid</p>
          <p className="text-sm font-semibold text-gray-200 mt-0.5">{formatCurrency(booking.total_amount)}</p>
        </div>
      </div>

      {/* Dashed line */}
      <div className="border-t border-dashed border-white/10 mx-6 my-4"></div>

      <div className="p-6 pt-0 flex flex-col items-center">
        {booking.qr_code ? (
          <div className="bg-white p-3 rounded-2xl shadow-inner mb-4">
            <img src={booking.qr_code} alt="QR Code Ticket" className="w-48 h-48" />
          </div>
        ) : (
          <div className="w-48 h-48 bg-slate-800 rounded-2xl flex items-center justify-center mb-4 border border-white/5">
            <p className="text-xs text-yellow-500 font-semibold px-4 text-center">Payment pending or QR code generating...</p>
          </div>
        )}
        <p className="text-xs text-gray-500 font-mono tracking-widest uppercase">
          Ticket ID: #{booking.id}-{booking.user_id}
        </p>
        <p className="text-2xs text-gray-400 mt-2 text-center max-w-xs leading-normal">
          Present this unique QR code at the entrance. Duplication or tampering void entry validation.
        </p>
      </div>
    </div>
  );
};

export default QRTicket;
