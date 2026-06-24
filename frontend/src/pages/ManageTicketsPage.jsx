import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getTickets, createTicket, deleteTicket } from '../services/ticketService';
import { getEvent } from '../services/eventService';

const ManageTicketsPage = () => {
  const { id } = useParams();
  const [event, setEvent] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({ name: '', type: 'FREE', price: 0, quantity: 100 });

  const fetchData = async () => {
    try {
      const [eventRes, ticketsRes] = await Promise.all([getEvent(id), getTickets(id)]);
      setEvent(eventRes.data);
      setTickets(ticketsRes.data);
    } catch (err) {
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [id]);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await createTicket(id, { ...formData, price: parseFloat(formData.price), quantity: parseInt(formData.quantity) });
      setShowForm(false);
      setFormData({ name: '', type: 'FREE', price: 0, quantity: 100 });
      fetchData();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create ticket');
    }
  };

  const handleDelete = async (ticketId) => {
    if (!window.confirm('Delete this ticket type?')) return;
    try {
      await deleteTicket(ticketId);
      fetchData();
    } catch (err) {
      setError('Failed to delete ticket');
    }
  };

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div></div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Manage Tickets</h1>
          {event && <p className="text-gray-500 mt-1">For: {event.title}</p>}
        </div>
        <div className="flex gap-3">
          <button onClick={() => setShowForm(!showForm)} className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-indigo-700">
            {showForm ? 'Cancel' : '+ Add Ticket Type'}
          </button>
          <Link to="/my-events" className="px-6 py-3 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50">Back to Events</Link>
        </div>
      </div>

      {error && <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-6">{error}</div>}

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm p-6 mb-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ticket Name *</label>
              <input type="text" name="name" value={formData.name} onChange={handleChange} required placeholder="e.g. General Admission" className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select name="type" value={formData.type} onChange={handleChange} className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500">
                <option value="FREE">Free</option>
                <option value="PAID">Paid</option>
                <option value="VIP">VIP</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Price ($)</label>
              <input type="number" name="price" value={formData.price} onChange={handleChange} min="0" step="0.01" className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
              <input type="number" name="quantity" value={formData.quantity} onChange={handleChange} min="1" className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500" />
            </div>
          </div>
          <button type="submit" className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-indigo-700">Create Ticket</button>
        </form>
      )}

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Available</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sold</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {tickets.length > 0 ? tickets.map((t) => (
              <tr key={t.id}>
                <td className="px-6 py-4 font-medium">{t.name}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 text-xs rounded-full ${t.type === 'FREE' ? 'bg-green-100 text-green-700' : t.type === 'VIP' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                    {t.type}
                  </span>
                </td>
                <td className="px-6 py-4">{t.type === 'FREE' ? 'Free' : `$${parseFloat(t.price).toFixed(2)}`}</td>
                <td className="px-6 py-4">{t.quantity - t.sold_count} / {t.quantity}</td>
                <td className="px-6 py-4">{t.sold_count}</td>
                <td className="px-6 py-4">
                  <button onClick={() => handleDelete(t.id)} className="text-red-600 hover:text-red-800 text-sm font-medium">Delete</button>
                </td>
              </tr>
            )) : (
              <tr><td colSpan="6" className="px-6 py-8 text-center text-gray-500">No ticket types yet. Add one above.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ManageTicketsPage;
