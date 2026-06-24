import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getMyEvents, deleteEvent, publishEvent } from '../services/eventService';
import { formatDateTime } from '../utils/helpers';

const MyEventsPage = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchEvents = async () => {
    try {
      const res = await getMyEvents();
      setEvents(res.data || []);
    } catch (err) {
      console.error('Failed to fetch events', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchEvents(); }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this event?')) return;
    try {
      await deleteEvent(id);
      setEvents(events.filter(e => e.id !== id));
    } catch (err) {
      alert('Failed to delete event');
    }
  };

  const handlePublish = async (id) => {
    try {
      await publishEvent(id);
      setEvents(events.map(e => e.id === id ? { ...e, status: 'PUBLISHED' } : e));
    } catch (err) {
      alert('Failed to publish event');
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">My Events</h1>
        <Link to="/create-event" className="px-5 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition">
          + Create Event
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      ) : events.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl shadow-sm">
          <p className="text-gray-500 text-lg mb-4">You haven't created any events yet.</p>
          <Link to="/create-event" className="text-indigo-600 hover:text-indigo-700 font-medium">Create your first event</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {events.map(event => (
            <div key={event.id} className="bg-white rounded-xl shadow-sm p-5 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-xl font-bold">{event.title[0]}</span>
                </div>
                <div>
                  <Link to={`/events/${event.id}`} className="font-semibold text-gray-900 hover:text-indigo-600 transition">{event.title}</Link>
                  <p className="text-sm text-gray-500">{formatDateTime(event.start_time)}</p>
                  <span className={`inline-block mt-1 px-2 py-0.5 text-xs rounded-full font-medium ${
                    event.status === 'PUBLISHED' ? 'bg-green-100 text-green-700' :
                    event.status === 'DRAFT' ? 'bg-yellow-100 text-yellow-700' :
                    event.status === 'CANCELLED' ? 'bg-red-100 text-red-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>{event.status}</span>
                </div>
              </div>
              <div className="flex gap-2">
                {event.status === 'DRAFT' && (
                  <button onClick={() => handlePublish(event.id)} className="px-3 py-1.5 text-sm text-green-600 hover:bg-green-50 rounded-lg transition font-medium">
                    Publish
                  </button>
                )}
                <Link to={`/events/${event.id}/tickets`} className="px-3 py-1.5 text-sm text-indigo-600 hover:bg-indigo-50 rounded-lg transition">
                  Tickets
                </Link>
                <Link to={`/events/${event.id}/edit`} className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition">
                  Edit
                </Link>
                <button onClick={() => handleDelete(event.id)} className="px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition">
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyEventsPage;
