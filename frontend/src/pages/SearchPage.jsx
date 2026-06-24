import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { searchEvents } from '../services/searchService';
import { getCategories } from '../services/categoryService';
import { formatDateTime } from '../utils/helpers';

const SearchPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [results, setResults] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    q: searchParams.get('q') || '',
    category_id: searchParams.get('category_id') || '',
    event_type: searchParams.get('event_type') || '',
    location: searchParams.get('location') || '',
    start_date: searchParams.get('start_date') || '',
    end_date: searchParams.get('end_date') || '',
  });

  useEffect(() => {
    getCategories().then(res => setCategories(res.data || [])).catch(() => {});
  }, []);

  useEffect(() => {
    const params = Object.fromEntries(searchParams);
    if (Object.keys(params).length > 0) {
      setFilters(prev => ({ ...prev, ...params }));
      handleSearch(params);
    }
  }, []);

  const handleSearch = async (params) => {
    setLoading(true);
    try {
      const searchParams = params || filters;
      const cleanParams = Object.fromEntries(
        Object.entries(searchParams).filter(([_, v]) => v && v !== '')
      );
      const res = await searchEvents(cleanParams);
      setResults(res.data || []);
    } catch (err) {
      console.error('Search failed', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const cleanParams = Object.fromEntries(
      Object.entries(filters).filter(([_, v]) => v && v !== '')
    );
    setSearchParams(cleanParams);
    handleSearch(cleanParams);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Search Events</h1>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <input
            value={filters.q}
            onChange={(e) => setFilters({ ...filters, q: e.target.value })}
            placeholder="Search by keyword..."
            className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
          />
          <select
            value={filters.category_id}
            onChange={(e) => setFilters({ ...filters, category_id: e.target.value })}
            className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
          >
            <option value="">All Categories</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select
            value={filters.event_type}
            onChange={(e) => setFilters({ ...filters, event_type: e.target.value })}
            className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
          >
            <option value="">All Types</option>
            <option value="ONLINE">Online</option>
            <option value="OFFLINE">Offline</option>
            <option value="HYBRID">Hybrid</option>
          </select>
          <input
            value={filters.location}
            onChange={(e) => setFilters({ ...filters, location: e.target.value })}
            placeholder="Location..."
            className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">From Date</label>
            <input
              type="date"
              value={filters.start_date}
              onChange={(e) => setFilters({ ...filters, start_date: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">To Date</label>
            <input
              type="date"
              value={filters.end_date}
              onChange={(e) => setFilters({ ...filters, end_date: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
            />
          </div>
        </div>
        <button type="submit" className="px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition">
          Search
        </button>
      </form>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      ) : (
        <>
          <p className="text-gray-500 mb-6">{results.length} results found</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {results.map((event) => (
              <Link
                key={event.id}
                to={`/events/${event.id}`}
                className="bg-white rounded-xl shadow-sm hover:shadow-lg transition overflow-hidden group"
              >
                <div className="h-48 bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center">
                  <span className="text-white text-4xl font-bold opacity-50">{event.title[0]}</span>
                </div>
                <div className="p-5">
                  <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${
                    event.event_type === 'ONLINE' ? 'bg-green-100 text-green-700' :
                    event.event_type === 'HYBRID' ? 'bg-blue-100 text-blue-700' :
                    'bg-orange-100 text-orange-700'
                  }`}>{event.event_type}</span>
                  <h3 className="font-semibold text-gray-900 mt-2 group-hover:text-indigo-600 transition">{event.title}</h3>
                  <p className="text-sm text-gray-500 mt-1">{formatDateTime(event.start_time)}</p>
                  {event.location && <p className="text-sm text-gray-400 mt-1">{event.location}</p>}
                </div>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default SearchPage;
