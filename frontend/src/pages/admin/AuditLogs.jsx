import React, { useState, useEffect } from 'react';
import auditLogService from '../../services/auditLogService';
import { Shield, User, MapPin, Search } from 'lucide-react';

const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchLogs(page);
  }, [page]);

  const fetchLogs = async (currentPage) => {
    try {
      setLoading(true);
      const data = await auditLogService.getAuditLogs(currentPage, 15);
      setLogs(data.items);
      setTotalPages(Math.ceil(data.total / data.per_page));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getActionColor = (action) => {
    if (action.includes('LOGIN_FAILED')) return 'bg-red-100 text-red-700';
    if (action.includes('LOGIN')) return 'bg-green-100 text-green-700';
    if (action.includes('CREATE')) return 'bg-blue-100 text-blue-700';
    if (action.includes('DELETE')) return 'bg-red-100 text-red-700';
    return 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
            <Shield className="text-indigo-600" />
            Audit Logs
          </h1>
          <p className="text-gray-500 mt-1">Monitor platform activity and security events</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading && logs.length === 0 ? (
          <div className="p-8 text-center text-gray-500">Loading audit logs...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4 font-semibold text-gray-600">Timestamp</th>
                  <th className="px-6 py-4 font-semibold text-gray-600">User</th>
                  <th className="px-6 py-4 font-semibold text-gray-600">Action</th>
                  <th className="px-6 py-4 font-semibold text-gray-600">Resource</th>
                  <th className="px-6 py-4 font-semibold text-gray-600">IP Address</th>
                  <th className="px-6 py-4 font-semibold text-gray-600">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50/50 transition">
                    <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <User size={16} className="text-gray-400" />
                        <span className="font-medium text-gray-700">{log.user_email}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${getActionColor(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {log.resource_type ? `${log.resource_type} #${log.resource_id}` : '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 font-mono">
                      {log.ip_address || 'Unknown'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate" title={log.details}>
                      {log.details || '-'}
                    </td>
                  </tr>
                ))}
                {logs.length === 0 && (
                  <tr>
                    <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                      No audit logs found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
            <button
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
              className="px-4 py-2 text-sm font-semibold text-indigo-600 bg-indigo-50 rounded-lg disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-sm text-gray-500">
              Page {page} of {totalPages}
            </span>
            <button
              disabled={page === totalPages}
              onClick={() => setPage(page + 1)}
              className="px-4 py-2 text-sm font-semibold text-indigo-600 bg-indigo-50 rounded-lg disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuditLogs;
