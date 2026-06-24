import { useState, useEffect } from 'react';
import { getMyWishlist, removeFromWishlist } from '../services/wishlistService';
import { formatDateTime } from '../utils/helpers';
import { Link } from 'react-router-dom';

const WishlistPage = () => {
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchWishlist = async () => {
    try {
      const res = await getMyWishlist();
      setWishlist(res.data || []);
    } catch (err) {
      setError('Failed to load wishlist');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWishlist();
  }, []);

  const handleRemove = async (e, eventId) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await removeFromWishlist(eventId);
      setWishlist(wishlist.filter(item => item.event_id !== eventId));
    } catch (err) {
      alert('Failed to remove event from wishlist');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">My Wishlist</h1>
        <p className="text-gray-500">{wishlist.length} item(s)</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      ) : error ? (
        <div className="bg-rose-50 text-rose-700 px-4 py-3 rounded-xl mb-4 border border-rose-100">{error}</div>
      ) : wishlist.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl shadow-sm border border-gray-100">
          <p className="text-gray-500 text-lg mb-4">Your wishlist is empty.</p>
          <Link to="/events" className="text-indigo-600 hover:text-indigo-700 font-medium transition">
            Explore Events
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {wishlist.map((item) => {
            const event = item.event;
            return (
              <div key={item.id} className="relative group bg-white rounded-3xl shadow-sm hover:shadow-lg border border-gray-100 overflow-hidden transition-all duration-300">
                
                {/* Banner/Grad */}
                <div className="h-44 bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center relative">
                  {event.banner_url ? (
                    <img src={event.banner_url} alt={event.title} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-white text-4xl font-bold opacity-30">{event.title[0]}</span>
                  )}
                  {/* Remove heart button absolute */}
                  <button
                    onClick={(e) => handleRemove(e, event.id)}
                    className="absolute top-4 right-4 p-2 rounded-full bg-white/95 backdrop-blur shadow-sm hover:bg-rose-50 text-rose-500 transition transform hover:scale-105 active:scale-95"
                    title="Remove from wishlist"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                    </svg>
                  </button>
                </div>

                {/* Content */}
                <div className="p-5 flex flex-col justify-between">
                  <div>
                    <span className={`px-2 py-0.5 text-2xs rounded-full font-semibold uppercase tracking-wider ${
                      event.event_type === 'ONLINE' ? 'bg-emerald-100 text-emerald-700' :
                      event.event_type === 'HYBRID' ? 'bg-indigo-100 text-indigo-700' :
                      'bg-amber-100 text-amber-700'
                    }`}>
                      {event.event_type}
                    </span>
                    <h3 className="font-bold text-gray-900 mt-2 truncate group-hover:text-indigo-600 transition">
                      {event.title}
                    </h3>
                    <p className="text-xs text-gray-500 mt-1 font-medium">{formatDateTime(event.start_time)}</p>
                    {event.location && (
                      <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                        {event.location}
                      </p>
                    )}
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-50 flex gap-2">
                    <Link
                      to={`/events/${event.id}`}
                      className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-center text-xs font-semibold shadow-sm transition"
                    >
                      Book Ticket
                    </Link>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default WishlistPage;
