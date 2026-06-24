import { useState, useEffect } from 'react';
import { getSeatsForEvent } from '../../services/seatService';

const SeatMap = ({ eventId, selectedSeatId, onSeatSelect }) => {
  const [seats, setSeats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchSeats = async () => {
      try {
        const res = await getSeatsForEvent(eventId);
        setSeats(res.data || []);
      } catch (err) {
        setError('Failed to fetch seat layout');
      } finally {
        setLoading(false);
      }
    };
    fetchSeats();
  }, [eventId]);

  if (loading) return (
    <div className="flex justify-center py-8">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
    </div>
  );

  if (error) return <div className="text-red-500 text-sm">{error}</div>;

  // Group seats by row
  const rows = seats.reduce((acc, seat) => {
    if (!acc[seat.row]) acc[seat.row] = [];
    acc[seat.row].push(seat);
    return acc;
  }, {});

  const getSeatColorClass = (seat) => {
    if (seat.id === selectedSeatId) return 'bg-emerald-500 text-white ring-4 ring-emerald-300 transform scale-110';
    if (seat.status === 'BOOKED') return 'bg-rose-600 text-rose-200 cursor-not-allowed opacity-60';
    if (seat.status === 'RESERVED') return 'bg-amber-500 text-amber-950 cursor-not-allowed opacity-80';
    
    // Available states by type
    if (seat.type === 'VIP') return 'bg-purple-100 text-purple-700 border border-purple-300 hover:bg-purple-500 hover:text-white';
    if (seat.type === 'PREMIUM') return 'bg-blue-100 text-blue-700 border border-blue-300 hover:bg-blue-500 hover:text-white';
    return 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-indigo-600 hover:text-white';
  };

  return (
    <div className="bg-slate-900/5 backdrop-blur-md rounded-3xl p-6 border border-slate-200/50 shadow-inner flex flex-col items-center">
      {/* Stage graphic */}
      <div className="w-2/3 h-6 bg-gradient-to-r from-indigo-500 via-indigo-600 to-purple-600 rounded-b-2xl shadow-lg flex items-center justify-center mb-12 relative">
        <span className="text-[10px] text-white font-bold uppercase tracking-widest">STAGE / SCREEN</span>
        <div className="absolute top-8 w-full border-t border-dashed border-gray-300/40"></div>
      </div>

      {/* Seat layout */}
      <div className="space-y-4 w-full overflow-x-auto py-2 flex flex-col items-center">
        {Object.entries(rows).map(([rowName, rowSeats]) => (
          <div key={rowName} className="flex items-center gap-3 min-w-max">
            {/* Row Identifier left */}
            <span className="w-6 text-sm font-bold text-gray-500 text-right font-mono mr-2">{rowName}</span>

            {/* Row seats */}
            <div className="flex gap-2">
              {rowSeats.sort((a, b) => a.number - b.number).map((seat) => {
                const isUnavailable = seat.status === 'BOOKED' || seat.status === 'RESERVED';
                return (
                  <button
                    key={seat.id}
                    disabled={isUnavailable}
                    onClick={() => onSeatSelect(seat)}
                    className={`w-10 h-10 rounded-xl flex flex-col items-center justify-center text-xs font-bold transition-all duration-200 transform ${getSeatColorClass(seat)}`}
                    title={`${seat.label} (${seat.type}) - ${seat.price > 0 ? `$${seat.price}` : 'Free'} [${seat.status}]`}
                  >
                    <span>{seat.number}</span>
                  </button>
                );
              })}
            </div>

            {/* Row Identifier right */}
            <span className="w-6 text-sm font-bold text-gray-500 text-left font-mono ml-2">{rowName}</span>
          </div>
        ))}
      </div>

      {/* Seat Legend */}
      <div className="mt-8 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 text-xs w-full border-t border-gray-200/50 pt-6">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-purple-100 border border-purple-300 rounded"></div>
          <span className="text-gray-600 font-medium">VIP Seat</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-100 border border-blue-300 rounded"></div>
          <span className="text-gray-600 font-medium">Premium Seat</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-gray-100 border border-gray-300 rounded"></div>
          <span className="text-gray-600 font-medium">General Seat</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-emerald-500 rounded"></div>
          <span className="text-gray-600 font-medium">Selected</span>
        </div>
        <div className="flex items-center gap-2 col-span-2 md:col-span-1">
          <div className="w-4 h-4 bg-rose-600 opacity-60 rounded"></div>
          <span className="text-gray-600 font-medium">Unavailable</span>
        </div>
      </div>
    </div>
  );
};

export default SeatMap;
