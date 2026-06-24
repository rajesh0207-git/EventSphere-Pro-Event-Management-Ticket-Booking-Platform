import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getEvents } from '../services/eventService';
import { formatDateTime } from '../utils/helpers';
import WishlistButton from '../components/Events/WishlistButton';

const EventsPage = () => {
  const [events, setEvents] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEvents();
  }, [page]);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const res = await getEvents(page, 12);
      setEvents(res.data.items || []);
      setTotal(res.data.total || 0);
    } catch (err) {
      console.error('Failed to fetch events', err);
    } finally {
      setLoading(false);
    }
  };

  const totalPages = Math.ceil(total / 12);

  // Unique gradient per event based on first letter
  const getGradient = (title) => {
    const gradients = [
      'from-violet-500 to-purple-700',
      'from-indigo-500 to-blue-700',
      'from-rose-500 to-pink-700',
      'from-amber-500 to-orange-700',
      'from-teal-500 to-cyan-700',
      'from-emerald-500 to-green-700',
    ];
    const idx = (title?.charCodeAt(0) || 0) % gradients.length;
    return gradients[idx];
  };

  const getTypeStyle = (type) => {
    if (type === 'ONLINE') return 'text-emerald-700 border border-emerald-200 bg-emerald-50';
    if (type === 'HYBRID') return 'text-sky-700 border border-sky-200 bg-sky-50';
    return 'text-orange-700 border border-orange-200 bg-orange-50';
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">All Events</h1>
          <p className="text-gray-500 mt-1">{total} events found</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      ) : events.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-500 text-lg">No events found.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <Link
                key={event.id}
                to={`/events/${event.id}`}
                className="bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden group border border-gray-100 hover:-translate-y-1"
              >
                {/* Banner Image */}
                <div className="relative h-52 overflow-hidden">
                  {event.banner_url ? (
                    <>
                      <img
                        src={event.banner_url}
                        alt={event.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.parentElement.querySelector('.fallback-gradient').style.display = 'flex';
                        }}
                      />
                      {/* Hidden fallback in case image 404s */}
                      <div className={`fallback-gradient absolute inset-0 bg-gradient-to-br ${getGradient(event.title)} hidden items-center justify-center`}>
                        <span className="text-white text-6xl font-black opacity-30 select-none">
                          {event.title?.[0]?.toUpperCase()}
                        </span>
                      </div>
                    </>
                  ) : (
                    /* Gradient placeholder when no image uploaded */
                    <div className={`w-full h-full bg-gradient-to-br ${getGradient(event.title)} flex items-center justify-center`}>
                      <span className="text-white text-6xl font-black opacity-30 select-none">
                        {event.title?.[0]?.toUpperCase()}
                      </span>
                    </div>
                  )}
                  {/* Overlay gradient for readability */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                  {/* Wishlist button */}
                  <WishlistButton eventId={event.id} className="absolute top-3 right-3 z-10" />
                  {/* Event type badge overlaid on image */}
                  <div className="absolute bottom-3 left-3">
                    <span className={`px-2.5 py-1 text-xs font-bold rounded-full backdrop-blur-sm bg-white/90 ${getTypeStyle(event.event_type)}`}>
                      {event.event_type}
                    </span>
                  </div>
                </div>

                {/* Card Content */}
                <div className="p-5">
                  <h3 className="font-bold text-gray-900 text-lg mb-1 group-hover:text-indigo-600 transition-colors line-clamp-2 leading-snug">
                    {event.title}
                  </h3>
                  <p className="text-sm text-gray-500 mb-2">{formatDateTime(event.start_time)}</p>
                  {event.location && (
                    <p className="text-sm text-gray-400 flex items-center gap-1">
                      <span>📍</span> {event.location}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-10">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 border rounded-lg disabled:opacity-50 hover:bg-gray-50 transition"
              >
                Previous
              </button>
              <span className="px-4 py-2 text-gray-600">Page {page} of {totalPages}</span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 border rounded-lg disabled:opacity-50 hover:bg-gray-50 transition"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default EventsPage;
