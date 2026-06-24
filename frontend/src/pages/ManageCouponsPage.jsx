import React, { useState, useEffect } from 'react';
import { Tag, Plus, Trash2, Calendar, Percent } from 'lucide-react';
import { listCoupons, createCoupon, deleteCoupon } from '../services/couponService';
import { getOrganizerEventsBreakdown } from '../services/dashboardService';

const ManageCouponsPage = () => {
  const [coupons, setCoupons] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    code: '',
    discount_percentage: '',
    max_uses: '',
    valid_until: '',
    event_id: ''
  });
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);

  const fetchAll = async () => {
    try {
      const [cRes, eRes] = await Promise.all([listCoupons(), getOrganizerEventsBreakdown()]);
      setCoupons(cRes.data);
      setEvents(eRes.data);
    } catch {
      setError('Failed to load coupons');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setCreating(true);
    try {
      const payload = {
        code: formData.code.toUpperCase(),
        discount_percentage: parseFloat(formData.discount_percentage),
        max_uses: formData.max_uses ? parseInt(formData.max_uses) : null,
        valid_until: formData.valid_until ? new Date(formData.valid_until).toISOString() : null,
        event_id: formData.event_id ? parseInt(formData.event_id) : null
      };
      await createCoupon(payload);
      setShowModal(false);
      setFormData({ code: '', discount_percentage: '', max_uses: '', valid_until: '', event_id: '' });
      fetchAll();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create coupon');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this coupon?')) return;
    try {
      await deleteCoupon(id);
      fetchAll();
    } catch {
      alert('Failed to delete coupon');
    }
  };

  if (loading) return (
    <div className="flex justify-center items-center min-h-[60vh]">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Manage Coupons</h1>
          <p className="text-gray-500 mt-1">Create and track discount codes for your events.</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-medium hover:bg-indigo-700 transition"
        >
          <Plus size={18} /> New Coupon
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Code</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Discount</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Event</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Usage</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Expires</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {coupons.length > 0 ? coupons.map(c => (
                <tr key={c.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-700 font-mono text-sm font-semibold">
                      <Tag size={14} /> {c.code}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-semibold text-gray-900">{c.discount_percentage}%</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{c.event_title || 'All Events'}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {c.current_uses} {c.max_uses ? `/ ${c.max_uses}` : '(Unlimited)'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {c.valid_until ? new Date(c.valid_until).toLocaleDateString() : 'Never'}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => handleDelete(c.id)} className="text-gray-400 hover:text-red-500 transition p-2">
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan={6} className="px-6 py-10 text-center text-gray-400 text-sm">No coupons created yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Create New Coupon</h2>
            {error && <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg mb-4 text-sm">{error}</div>}
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Coupon Code</label>
                <input
                  type="text" required value={formData.code} onChange={e => setFormData({...formData, code: e.target.value.toUpperCase()})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 uppercase font-mono"
                  placeholder="e.g. SUMMER2026"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Discount %</label>
                  <div className="relative">
                    <input
                      type="number" required min="1" max="100" step="0.1" value={formData.discount_percentage} onChange={e => setFormData({...formData, discount_percentage: e.target.value})}
                      className="w-full pl-3 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    />
                    <Percent size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max Uses (optional)</label>
                  <input
                    type="number" min="1" value={formData.max_uses} onChange={e => setFormData({...formData, max_uses: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    placeholder="Unlimited"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Specific Event (optional)</label>
                <select
                  value={formData.event_id} onChange={e => setFormData({...formData, event_id: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  <option value="">All My Events</option>
                  {events.map(e => <option key={e.event_id} value={e.event_id}>{e.title}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Valid Until (optional)</label>
                <input
                  type="datetime-local" value={formData.valid_until} onChange={e => setFormData({...formData, valid_until: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="flex gap-3 mt-6">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition">Cancel</button>
                <button type="submit" disabled={creating} className="flex-1 py-2 text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg font-medium transition disabled:opacity-50">
                  {creating ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageCouponsPage;
