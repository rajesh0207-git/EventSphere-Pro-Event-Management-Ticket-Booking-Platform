import { formatDateTime } from '../../utils/helpers';

const AttendanceList = ({ attendance = [] }) => {
  return (
    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-6 border-b border-gray-100 flex justify-between items-center">
        <h4 className="font-bold text-gray-900 text-lg">Attendee Registry</h4>
        <span className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-xs font-semibold">
          {attendance.length} Total Registered
        </span>
      </div>

      <div className="overflow-x-auto">
        {attendance.length === 0 ? (
          <div className="p-12 text-center text-gray-400 text-sm">
            No attendees have booked tickets for this event yet.
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/70 border-b border-gray-100 text-gray-400 text-xs font-bold uppercase tracking-wider">
                <th className="px-6 py-4">Attendee</th>
                <th className="px-6 py-4">Ticket Type</th>
                <th className="px-6 py-4">Quantity</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Check-In Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-sm">
              {attendance.map((attendee) => (
                <tr key={attendee.booking_id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-semibold text-gray-900">{attendee.attendee_name}</div>
                    <div className="text-gray-400 text-xs mt-0.5">{attendee.email}</div>
                  </td>
                  <td className="px-6 py-4 text-gray-600 font-medium">{attendee.ticket_name}</td>
                  <td className="px-6 py-4 text-gray-500 font-mono">{attendee.quantity}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold inline-flex items-center gap-1.5 ${
                      attendee.status === 'ATTENDED' ? 'bg-emerald-100 text-emerald-700' :
                      attendee.status === 'CONFIRMED' ? 'bg-indigo-100 text-indigo-700' :
                      'bg-rose-100 text-rose-700'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        attendee.status === 'ATTENDED' ? 'bg-emerald-500' :
                        attendee.status === 'CONFIRMED' ? 'bg-indigo-500' :
                        'bg-rose-500'
                      }`}></span>
                      {attendee.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-mono text-xs text-gray-500">
                    {attendee.checked_in_at ? formatDateTime(attendee.checked_in_at) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default AttendanceList;
