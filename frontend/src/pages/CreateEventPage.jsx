import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createEvent, uploadBanner } from '../services/eventService';
import { getCategories } from '../services/categoryService';
import { Upload, Image as ImageIcon, X } from 'lucide-react';

const CreateEventPage = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({
    title: '', description: '', category_id: '', event_type: 'OFFLINE',
    location: '', virtual_link: '', stream_url: '', stream_platform: '', start_time: '', end_time: '', capacity: '', status: 'DRAFT',
  });
  const [bannerFile, setBannerFile] = useState(null);
  const [bannerPreview, setBannerPreview] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getCategories().then(res => setCategories(res.data || [])).catch(() => {});
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleBannerChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setBannerFile(file);
      setBannerPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const payload = {
        ...form,
        category_id: form.category_id ? parseInt(form.category_id) : null,
        capacity: form.capacity ? parseInt(form.capacity) : null,
      };
      const res = await createEvent(payload);
      if (bannerFile) {
        const formData = new FormData();
        formData.append('file', bannerFile);
        await uploadBanner(res.data.id, formData);
      }
      navigate(`/events/${res.data.id}`);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create event');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-12 px-4">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Create Event</h1>
      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg p-8 space-y-5">
        {error && <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm">{error}</div>}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Event Title</label>
          <input name="title" value={form.title} onChange={handleChange} required
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea name="description" value={form.description} onChange={handleChange} rows={4}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition resize-none" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select name="category_id" value={form.category_id} onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition">
              <option value="">Select category</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Event Type</label>
            <select name="event_type" value={form.event_type} onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition">
              <option value="OFFLINE">Offline</option>
              <option value="ONLINE">Online</option>
              <option value="HYBRID">Hybrid</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
          <input name="location" value={form.location} onChange={handleChange} placeholder="Event venue address"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Virtual Link (optional)</label>
          <input name="virtual_link" value={form.virtual_link} onChange={handleChange} placeholder="https://..."
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition" />
        </div>

        {(form.event_type === 'ONLINE' || form.event_type === 'HYBRID') && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Live Stream URL (optional)</label>
              <input name="stream_url" value={form.stream_url} onChange={handleChange} placeholder="https://youtube.com/..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Stream Platform (optional)</label>
              <select name="stream_platform" value={form.stream_platform} onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition">
                <option value="">Select Platform</option>
                <option value="YouTube">YouTube</option>
                <option value="Zoom">Zoom</option>
                <option value="Twitch">Twitch</option>
                <option value="Custom">Custom WebRTC</option>
              </select>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
            <input type="datetime-local" name="start_time" value={form.start_time} onChange={handleChange} required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
            <input type="datetime-local" name="end_time" value={form.end_time} onChange={handleChange} required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Capacity (optional)</label>
            <input type="number" name="capacity" value={form.capacity} onChange={handleChange} min={1}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select name="status" value={form.status} onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition">
              <option value="DRAFT">Draft</option>
              <option value="PUBLISHED">Published</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Event Banner Photo (optional)</label>

          {/* Preview area */}
          <div className="relative w-full h-52 rounded-xl overflow-hidden border-2 border-dashed border-gray-200 bg-gray-50 mb-3">
            {bannerPreview ? (
              <>
                <img src={bannerPreview} alt="Banner preview" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => { setBannerPreview(null); setBannerFile(null); }}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 shadow-md"
                >
                  <X size={14} />
                </button>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <ImageIcon size={36} className="mb-2" />
                <p className="text-sm">No photo selected yet</p>
                <p className="text-xs mt-1">PNG, JPG or WebP recommended</p>
              </div>
            )}
          </div>

          <label className="cursor-pointer flex items-center justify-center gap-2 w-full px-4 py-3 border-2 border-dashed border-indigo-300 rounded-xl text-indigo-600 font-medium hover:bg-indigo-50 hover:border-indigo-500 transition-all">
            <Upload size={18} />
            {bannerPreview ? 'Change Photo' : 'Upload Event Banner'}
            <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleBannerChange} className="hidden" />
          </label>
          {bannerFile && <p className="text-xs text-gray-500 mt-1.5">Selected: {bannerFile.name}</p>}
        </div>

        <button type="submit" disabled={loading}
          className="w-full py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition disabled:opacity-50">
          {loading ? 'Creating...' : 'Create Event'}
        </button>
      </form>
    </div>
  );
};

export default CreateEventPage;
