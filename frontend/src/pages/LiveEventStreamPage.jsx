import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getEvent } from '../services/eventService';
import { getMyBookings } from '../services/bookingService';

const LiveEventStreamPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [hasAccess, setHasAccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchEventData = async () => {
      try {
        const eventRes = await getEvent(id);
        const eventData = eventRes.data;
        setEvent(eventData);

        // Check if user has a confirmed booking for this event
        const bookingsRes = await getMyBookings();
        const bookings = bookingsRes.data || [];
        const hasBooking = bookings.some(
          (b) => b.event_id === parseInt(id) && (b.status === 'CONFIRMED' || b.status === 'ATTENDED')
        );

        if (hasBooking || eventData.organizer_id) { // Give access to organizer too, ideally check with auth context
            setHasAccess(true);
        } else {
            setError('You do not have access to this live stream. Please purchase a ticket.');
        }

      } catch (err) {
        setError('Failed to load event details or verify access.');
      } finally {
        setLoading(false);
      }
    };

    fetchEventData();

    // Auto-refresh every 10 seconds if not live
    let intervalId;
    if (event && !event.is_streaming_live) {
      intervalId = setInterval(fetchEventData, 10000);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [id, event?.is_streaming_live]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-900">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-indigo-500"></div>
      </div>
    );
  }

  if (error || !hasAccess) {
    return (
      <div className="max-w-2xl mx-auto py-20 px-4 text-center">
        <div className="bg-red-50 text-red-600 p-6 rounded-xl shadow-sm mb-6">
          <h2 className="text-xl font-bold mb-2">Access Denied</h2>
          <p>{error}</p>
        </div>
        <Link to={`/events/${id}`} className="text-indigo-600 font-medium hover:underline">
          Return to Event Page
        </Link>
      </div>
    );
  }

  // A very simple function to extract youtube ID for embedding
  const getYouTubeEmbedUrl = (url) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? `https://www.youtube.com/embed/${match[2]}?autoplay=1` : url;
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 py-4 px-6 flex justify-between items-center sticky top-0 z-10">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
            {event.title}
          </h1>
          <p className="text-gray-400 text-sm">{event.event_type} Event &bull; {event.stream_platform || 'Live Stream'}</p>
        </div>
        <button 
          onClick={() => navigate(`/events/${id}`)}
          className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm font-medium transition"
        >
          Leave Session
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col lg:flex-row p-4 gap-4">
        {/* Stream Container */}
        <div className="flex-1 bg-black rounded-xl overflow-hidden shadow-2xl flex items-center justify-center relative min-h-[500px]">
          {!event.is_streaming_live ? (
            <div className="text-center p-8">
              <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                </svg>
              </div>
              <h2 className="text-2xl font-bold mb-2">Stream is Offline</h2>
              <p className="text-gray-400 mb-4">The organizer has not started the live stream yet. Please wait.</p>
              <p className="text-xs text-gray-500 animate-pulse">Auto-refreshing...</p>
            </div>
          ) : event.stream_platform === 'YouTube' ? (
            <iframe 
              src={getYouTubeEmbedUrl(event.stream_url)} 
              className="absolute inset-0 w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
              allowFullScreen
              title="Live Stream"
            ></iframe>
          ) : event.stream_url ? (
            <div className="text-center p-8">
              <h2 className="text-2xl font-bold mb-4">Stream Available via {event.stream_platform || 'External Link'}</h2>
              <p className="text-gray-400 mb-6">Click the button below to join the live session.</p>
              <a 
                href={event.stream_url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-8 rounded-lg transition shadow-lg"
              >
                Join Live Stream
              </a>
            </div>
          ) : (
             <div className="text-center p-8">
               <h2 className="text-2xl font-bold mb-2">No Stream URL Provided</h2>
               <p className="text-gray-400">The organizer hasn't added a link yet.</p>
             </div>
          )}
        </div>

        {/* Sidebar Placeholder (e.g., for Chat / Q&A) */}
        <div className="w-full lg:w-80 bg-gray-800 rounded-xl flex flex-col hidden lg:flex border border-gray-700">
          <div className="p-4 border-b border-gray-700 font-semibold flex justify-between items-center">
            <span>Live Chat</span>
            <span className="text-xs bg-gray-700 px-2 py-1 rounded text-gray-300">Coming Soon</span>
          </div>
          <div className="flex-1 p-4 flex items-center justify-center text-gray-500 text-sm text-center">
            Chat functionality can be integrated here.
          </div>
        </div>
      </main>
    </div>
  );
};

export default LiveEventStreamPage;
