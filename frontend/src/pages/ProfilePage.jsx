import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { updateProfile, uploadProfilePicture } from '../services/userService';

const ProfilePage = () => {
  const { user, refreshUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ full_name: '', phone: '', bio: '' });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setForm({ full_name: user.full_name || '', phone: user.phone || '', bio: user.bio || '' });
    }
  }, [user]);

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');
    try {
      await updateProfile(form);
      await refreshUser();
      setMessage('Profile updated successfully');
      setEditing(false);
    } catch (err) {
      setError(err.response?.data?.detail || 'Update failed');
    } finally {
      setLoading(false);
    }
  };

  const handlePictureUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      await uploadProfilePicture(file);
      await refreshUser();
      setMessage('Profile picture updated');
    } catch (err) {
      setError(err.response?.data?.detail || 'Upload failed');
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-12 px-4">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">My Profile</h1>

      {message && <div className="bg-green-50 text-green-600 px-4 py-3 rounded-lg mb-4 text-sm">{message}</div>}
      {error && <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg mb-4 text-sm">{error}</div>}

      <div className="bg-white rounded-xl shadow-lg p-8">
        {/* Profile Picture */}
        <div className="flex items-center gap-6 mb-8 pb-8 border-b">
          <div className="w-24 h-24 bg-indigo-100 rounded-full flex items-center justify-center overflow-hidden">
            {user?.profile_picture_url ? (
              <img src={user.profile_picture_url} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <span className="text-indigo-600 text-2xl font-bold">
                {user?.full_name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
              </span>
            )}
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{user?.full_name}</h2>
            <p className="text-gray-500">{user?.email}</p>
            <span className="inline-block mt-1 px-3 py-0.5 bg-indigo-100 text-indigo-700 text-xs rounded-full font-medium">
              {user?.role}
            </span>
          </div>
          <label className="ml-auto cursor-pointer px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200 transition">
            Change Photo
            <input type="file" accept="image/*" className="hidden" onChange={handlePictureUpload} />
          </label>
        </div>

        {/* Profile Form */}
        <form onSubmit={handleSave} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <input
              value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              disabled={!editing}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none disabled:bg-gray-50 transition"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <input
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              disabled={!editing}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none disabled:bg-gray-50 transition"
              placeholder="Enter phone number"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
            <textarea
              value={form.bio}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
              disabled={!editing}
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none disabled:bg-gray-50 transition resize-none"
              placeholder="Tell us about yourself"
            />
          </div>

          <div className="flex gap-3">
            {editing ? (
              <>
                <button type="submit" disabled={loading}
                  className="px-6 py-2.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition disabled:opacity-50">
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
                <button type="button" onClick={() => { setEditing(false); setForm({ full_name: user?.full_name || '', phone: user?.phone || '', bio: user?.bio || '' }); }}
                  className="px-6 py-2.5 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition">
                  Cancel
                </button>
              </>
            ) : (
              <button type="button" onClick={() => setEditing(true)}
                className="px-6 py-2.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition">
                Edit Profile
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfilePage;
