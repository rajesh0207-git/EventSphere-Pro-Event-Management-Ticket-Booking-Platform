import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { resetPassword } from '../services/authService';

const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await resetPassword({ token: searchParams.get('token'), new_password: password });
      setMessage(res.data.message);
    } catch (err) {
      setError(err.response?.data?.detail || 'Reset failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Reset Password</h1>
          <p className="text-gray-600 mt-2">Enter your new password</p>
        </div>
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg p-8 space-y-6">
          {message && (
            <>
              <div className="bg-green-50 text-green-600 px-4 py-3 rounded-lg text-sm">{message}</div>
              <Link to="/login" className="block text-center text-indigo-600 hover:text-indigo-700 font-medium">Go to Login</Link>
            </>
          )}
          {error && <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm">{error}</div>}
          {!message && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
                  minLength={6}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                  placeholder="Min 6 characters" />
              </div>
              <button type="submit" disabled={loading}
                className="w-full py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition disabled:opacity-50">
                {loading ? 'Resetting...' : 'Reset Password'}
              </button>
            </>
          )}
        </form>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
