import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getEvents, getFeaturedEvents, getTrendingEvents } from '../services/eventService';
import { getCategories } from '../services/categoryService';
import { getAIRecommendations } from '../services/aiService';
import { useAuth } from '../context/AuthContext';
import { formatDateTime } from '../utils/helpers';
import { Sparkles } from 'lucide-react';

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

const EventCard = ({ event }) => (
  <Link
    to={`/events/${event.id}`}
    className="bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden group border border-gray-100 hover:-translate-y-1"
  >
    <div className="relative h-48 overflow-hidden">
      {event.banner_url ? (
        <img
          src={event.banner_url}
          alt={event.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          onError={(e) => {
            e.target.style.display = 'none';
            e.target.nextSibling.style.display = 'flex';
          }}
        />
      ) : null}
      {/* Gradient fallback - shows when banner_url is null or image fails */}
      <div
        className={`absolute inset-0 bg-gradient-to-br ${getGradient(event.title)} flex items-center justify-center ${event.banner_url ? 'hidden' : ''}`}
      >
        <span className="text-white text-5xl font-black opacity-30 select-none">
          {event.title?.[0]?.toUpperCase()}
        </span>
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
      <div className="absolute bottom-3 left-3">
        <span className={`px-2.5 py-1 text-xs font-bold rounded-full bg-white/90 backdrop-blur-sm ${
          event.event_type === 'ONLINE' ? 'text-emerald-700' :
          event.event_type === 'HYBRID' ? 'text-sky-700' :
          'text-orange-700'
        }`}>
          {event.event_type}
        </span>
      </div>
      {event.is_featured && (
        <div className="absolute top-3 left-3">
          <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-yellow-400/90 text-yellow-900 backdrop-blur-sm">⭐ Featured</span>
        </div>
      )}
    </div>
    <div className="p-5">
      <h3 className="font-bold text-gray-900 mb-1 group-hover:text-indigo-600 transition-colors line-clamp-2 leading-snug">{event.title}</h3>
      <p className="text-sm text-gray-500 mb-1">{formatDateTime(event.start_time)}</p>
      {event.location && <p className="text-sm text-gray-400">📍 {event.location}</p>}
    </div>
  </Link>
);

const HomePage = () => {
  const [events, setEvents] = useState([]);
  const [featured, setFeatured] = useState([]);
  const [trending, setTrending] = useState([]);
  const [categories, setCategories] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const { isAuthenticated } = useAuth();
  const { t } = useTranslation();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [eventsRes, featuredRes, trendingRes, catsRes] = await Promise.all([
          getEvents(1, 6),
          getFeaturedEvents(1, 6),
          getTrendingEvents(6),
          getCategories(),
        ]);
        setEvents(eventsRes.data.items || []);
        setFeatured(featuredRes.data.items || []);
        setTrending(trendingRes.data.items || []);
        setCategories(catsRes.data || []);
        
      } catch (err) {
        console.error('Failed to fetch initial data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      getAIRecommendations()
        .then(res => setRecommendations(res || []))
        .catch(() => {});
    } else {
      setRecommendations([]);
    }
  }, [isAuthenticated]);

  return (
    <div>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-indigo-950 via-purple-900 to-indigo-900 pt-32 pb-24 lg:pt-40 lg:pb-32 overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-[30%] -right-[10%] w-[70%] h-[70%] rounded-full bg-gradient-to-b from-indigo-500/20 to-purple-500/20 blur-3xl" />
          <div className="absolute -bottom-[20%] -left-[10%] w-[60%] h-[60%] rounded-full bg-gradient-to-t from-blue-500/20 to-indigo-500/20 blur-3xl" />
          <div className="absolute top-[20%] left-[15%] w-2 h-2 rounded-full bg-white/50 shadow-[0_0_15px_rgba(255,255,255,0.8)] animate-pulse" />
          <div className="absolute top-[40%] right-[20%] w-3 h-3 rounded-full bg-purple-400/50 shadow-[0_0_20px_rgba(168,85,247,0.8)] animate-pulse delay-700" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 backdrop-blur-md mb-8 animate-fade-in-up">
              <Sparkles className="w-4 h-4 text-purple-300" />
              <span className="text-sm font-semibold text-purple-100 tracking-wide">The New Standard in Event Management</span>
            </div>
            
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-white mb-8 tracking-tight leading-[1.1] animate-fade-in-up animation-delay-100">
              {t('home.hero_title', 'Discover Unforgettable Experiences')}
            </h1>
            
            <p className="text-lg md:text-xl text-indigo-100 mb-12 max-w-2xl mx-auto leading-relaxed font-light animate-fade-in-up animation-delay-200">
              {t('home.hero_subtitle', 'Find, book, and create events that leave lasting memories.')}
            </p>

            <div className="flex flex-col sm:flex-row justify-center gap-4 animate-fade-in-up animation-delay-300">
              <Link 
                to="/search" 
                className="inline-flex justify-center items-center px-8 py-4 rounded-xl text-lg font-bold bg-white text-indigo-900 hover:bg-indigo-50 hover:scale-105 transition-all duration-300 shadow-[0_0_30px_rgba(255,255,255,0.3)]"
              >
                {t('home.search_btn', 'Find Events')}
              </Link>
              <Link 
                to="/create-event" 
                className="inline-flex justify-center items-center px-8 py-4 rounded-xl text-lg font-bold bg-indigo-600/30 text-white border border-indigo-400/50 hover:bg-indigo-600/50 hover:border-indigo-300 backdrop-blur-sm transition-all duration-300"
              >
                {t('home.create_btn', 'Create Event')}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      {categories.length > 0 && (
        <section className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">{t('home.browse_category', 'Browse by Category')}</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  to={`/search?category_id=${cat.id}`}
                  className="bg-white p-4 rounded-xl shadow-sm hover:shadow-md transition text-center"
                >
                  <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <span className="text-indigo-600 text-lg font-bold">{cat.name[0]}</span>
                  </div>
                  <p className="text-sm font-medium text-gray-700">{cat.name}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* AI Recommendations */}
      {isAuthenticated && recommendations.length > 0 && (
        <section className="py-16 bg-indigo-50/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-2 mb-8">
              <span className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">✨</span>
              <h2 className="text-2xl font-bold text-gray-900">{t('home.recommended', 'Recommended for You')}</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recommendations.map((event) => <EventCard key={event.id} event={event} />)}
            </div>
          </div>
        </section>
      )}

      {/* Trending Events */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900">{t('home.trending', 'Trending Events')}</h2>
            <Link to="/events" className="text-indigo-600 hover:text-indigo-700 font-medium text-sm">
              {t('home.view_all', 'View All')} &rarr;
            </Link>
          </div>
          {loading ? (
            <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div></div>
          ) : trending.length === 0 ? (
            <p className="text-center text-gray-500 py-8">{t('home.no_trending', 'No trending events yet.')}</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {trending.map((event) => <EventCard key={event.id} event={event} />)}
            </div>
          )}
        </div>
      </section>

      {/* Featured Events */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900">{t('home.featured', 'Featured Events')}</h2>
            <Link to="/events" className="text-indigo-600 hover:text-indigo-700 font-medium text-sm">
              {t('home.view_all', 'View All')} &rarr;
            </Link>
          </div>
          {loading ? (
            <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div></div>
          ) : featured.length === 0 ? (
            <p className="text-center text-gray-500 py-8">{t('home.no_featured', 'No featured events yet. Admins can feature events from the dashboard.')}</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featured.map((event) => <EventCard key={event.id} event={event} />)}
            </div>
          )}
        </div>
      </section>

      {/* All Events */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900">{t('home.latest', 'Latest Events')}</h2>
            <Link to="/events" className="text-indigo-600 hover:text-indigo-700 font-medium text-sm">
              {t('home.view_all', 'View All')} &rarr;
            </Link>
          </div>
          {loading ? (
            <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div></div>
          ) : events.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p className="text-lg">{t('home.no_events', 'No events yet. Be the first to create one!')}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map((event) => <EventCard key={event.id} event={event} />)}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default HomePage;
