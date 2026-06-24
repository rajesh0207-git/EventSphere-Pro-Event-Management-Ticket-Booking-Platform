import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getEvent, updateEvent, uploadBanner } from '../services/eventService';
import { getCategories } from '../services/categoryService';
import { Upload, Image as ImageIcon, X } from 'lucide-react';

const EditEventPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState({
    title: '', description: '', category_id: '', event_type: 'OFFLINE',
    location: '', virtual_link: '', stream_url: '', stream_platform: '', start_time: '', end_time: '', capacity: '', status: 'DRAFT',
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [bannerFile, setBannerFile] = useState(null);
  const [bannerPreview, setBannerPreview] = useState(null);
  const [currentBannerUrl, setCurrentBannerUrl] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [eventRes, catRes] = await Promise.all([getEvent(id), getCategories()]);
        const e = eventRes.data;
        setFormData({
          title: e.title || '', description: e.description || '', category_id: e.category_id || '',
          event_type: e.event_type || 'OFFLINE', location: e.location || '', virtual_link: e.virtual_link || '',
          stream_url: e.stream_url || '', stream_platform: e.stream_platform || '',
          start_time: e.start_time?.slice(0, 16) || '', end_time: e.end_time?.slice(0, 16) || '',
          capacity: e.capacity || '', status: e.status || 'DRAFT',
        });
        setCurrentBannerUrl(e.banner_url || null);
        setCategories(catRes.data);
      } catch (err) {
        setError('Failed to load event');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

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
    setSaving(true);
    try {
      const payload = { ...formData };
      if (!payload.category_id) delete payload.category_id;
      if (!payload.location) delete payload.location;
      if (!payload.virtual_link) delete payload.virtual_link;
      if (!payload.stream_url) delete payload.stream_url;
      if (!payload.stream_platform) delete payload.stream_platform;
      if (!payload.capacity) delete payload.capacity;
      await updateEvent(id, payload);
      if (bannerFile) {
        const formData = new FormData();
        formData.append('file', bannerFile);
        await uploadBanner(id, formData);
      }
      navigate('/my-events');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update event');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div></div>;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Edit Event</h1>
      {error && <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-6">{error}</div>}
      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm p-8 space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Event Title *</label>
          <input type="text" name="title" value={formData.title} onChange={handleChange} required className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea name="description" value={formData.description} onChange={handleChange} rows={4} className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select name="category_id" value={formData.category_id} onChange={handleChange} className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500">
              <option value="">Select Category</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Event Type</label>
            <select name="event_type" value={formData.event_type} onChange={handleChange} className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500">
              <option value="OFFLINE">Offline</option>
              <option value="ONLINE">Online</option>
              <option value="HYBRID">Hybrid</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
            <input type="text" name="location" value={formData.location} onChange={handleChange} className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Virtual Link</label>
            <input type="text" name="virtual_link" value={formData.virtual_link} onChange={handleChange} className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500" />
          </div>
        </div>
        {(formData.event_type === 'ONLINE' || formData.event_type === 'HYBRID') && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Live Stream URL</label>
              <input type="text" name="stream_url" value={formData.stream_url} onChange={handleChange} className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Stream Platform</label>
              <select name="stream_platform" value={formData.stream_platform} onChange={handleChange} className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500">
                <option value="">Select Platform</option>
                <option value="YouTube">YouTube</option>
                <option value="Zoom">Zoom</option>
                <option value="Twitch">Twitch</option>
                <option value="Custom">Custom WebRTC</option>
              </select>
            </div>
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Time *</label>
            <input type="datetime-local" name="start_time" value={formData.start_time} onChange={handleChange} required className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Time *</label>
            <input type="datetime-local" name="end_time" value={formData.end_time} onChange={handleChange} required className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Capacity</label>
            <input type="number" name="capacity" value={formData.capacity} onChange={handleChange} min="1" className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select name="status" value={formData.status} onChange={handleChange} className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500">
              <option value="DRAFT">Draft</option>
              <option value="PUBLISHED">Published</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
        </div>
        {/* Banner Image Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Event Banner Photo</label>
          
          {/* Preview area */}
          <div className="relative w-full h-52 rounded-xl overflow-hidden border-2 border-dashed border-gray-200 bg-gray-50 mb-3">
            {bannerPreview || currentBannerUrl ? (
              <>
                <img
                  src={bannerPreview || currentBannerUrl}
                  alt="Event banner"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                  <span className="text-white text-sm font-semibold">Click below to change photo</span>
                </div>
                {bannerPreview && (
                  <button
                    type="button"
                    onClick={() => { setBannerPreview(null); setBannerFile(null); }}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 shadow-md"
                  >
                    <X size={14} />
                  </button>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <ImageIcon size={36} className="mb-2" />
                <p className="text-sm">No banner photo uploaded yet</p>
              </div>
            )}
          </div>

          <label className="cursor-pointer flex items-center justify-center gap-2 w-full px-4 py-3 border-2 border-dashed border-indigo-300 rounded-xl text-indigo-600 font-medium hover:bg-indigo-50 hover:border-indigo-500 transition-all">
            <Upload size={18} />
            {bannerPreview ? 'Change Photo' : currentBannerUrl ? 'Replace Photo' : 'Upload Event Banner'}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleBannerChange}
              className="hidden"
            />
          </label>
          {bannerFile && <p className="text-xs text-gray-500 mt-1.5">Selected: {bannerFile.name}</p>}
        </div>

        <div className="flex gap-4">
          <button type="submit" disabled={saving} className="flex-1 bg-indigo-600 text-white py-3 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50">
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
          <button type="button" onClick={() => navigate('/my-events')} className="px-6 py-3 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50">Cancel</button>
        </div>
      </form>
    </div>
  );
};

export default EditEventPage;
