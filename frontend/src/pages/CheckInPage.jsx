import { useState, useEffect } from 'react';
import { getMyEvents } from '../services/eventService';
import { scanQRCheckIn, getEventAttendance, getEventAttendanceStats } from '../services/checkinService';
import CheckInScanner from '../components/CheckIn/CheckInScanner';
import AttendanceList from '../components/CheckIn/AttendanceList';

const CheckInPage = () => {
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [attendance, setAttendance] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Scan result state
  const [scanResult, setScanResult] = useState(null); // { status, message, attendee_name, checked_in_at }

  useEffect(() => {
    const fetchOrganizerEvents = async () => {
      try {
        const res = await getMyEvents();
        setEvents(res.data || []);
        if (res.data && res.data.length > 0) {
          setSelectedEventId(res.data[0].id.toString());
        }
      } catch (err) {
        console.error('Failed to fetch events', err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrganizerEvents();
  }, []);

  const fetchAttendanceAndStats = async (eventId) => {
    if (!eventId) return;
    try {
      const [attendanceRes, statsRes] = await Promise.all([
        getEventAttendance(eventId),
        getEventAttendanceStats(eventId)
      ]);
      setAttendance(attendanceRes.data || []);
      setStats(statsRes.data || null);
    } catch (err) {
      console.error('Failed to load check-in details', err);
    }
  };

  useEffect(() => {
    if (selectedEventId) {
      fetchAttendanceAndStats(parseInt(selectedEventId));
    }
  }, [selectedEventId]);

  const handleScanSuccess = async (qrData) => {
    setScanResult(null);
    try {
      const res = await scanQRCheckIn(qrData);
      setScanResult(res.data);
      // Refresh statistics and list
      if (selectedEventId) {
        fetchAttendanceAndStats(parseInt(selectedEventId));
      }
    } catch (err) {
      setScanResult({
        status: 'ERROR',
        message: err.response?.data?.detail || 'Verification failed. Invalid ticket record.'
      });
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Event Gate Check-In</h1>
          <p className="text-gray-500 text-sm mt-1">Scan visitor digital tickets, track gate flow and verify seating reservations.</p>
        </div>

        {/* Event selector dropdown */}
        <div className="w-full md:w-80">
          <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Select Event</label>
          <select
            value={selectedEventId}
            onChange={(e) => setSelectedEventId(e.target.value)}
            className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-semibold text-gray-800 shadow-sm"
          >
            {events.map((evt) => (
              <option key={evt.id} value={evt.id}>{evt.title}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      ) : !selectedEventId ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-gray-100 shadow-sm">
          <p className="text-gray-500 text-lg">No active events found. Create an event first to enable gate check-ins.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Scanner column */}
          <div className="lg:col-span-1 space-y-6">
            <CheckInScanner onScanSuccess={handleScanSuccess} />

            {/* Scan Feedback Banner */}
            {scanResult && (
              <div className={`p-6 rounded-3xl border transition-all duration-300 ${
                scanResult.status === 'SUCCESS' ? 'bg-emerald-50 border-emerald-200 text-emerald-950' :
                scanResult.status === 'ALREADY_CHECKED_IN' ? 'bg-amber-50 border-amber-200 text-amber-950' :
                'bg-rose-50 border-rose-200 text-rose-950'
              }`}>
                <div className="flex items-start gap-4">
                  <div className={`p-2 rounded-2xl ${
                    scanResult.status === 'SUCCESS' ? 'bg-emerald-500/10 text-emerald-600' :
                    scanResult.status === 'ALREADY_CHECKED_IN' ? 'bg-amber-500/10 text-amber-600' :
                    'bg-rose-500/10 text-rose-600'
                  }`}>
                    {scanResult.status === 'SUCCESS' ? (
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    ) : (
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                    )}
                  </div>
                  <div>
                    <h4 className="font-bold text-base leading-tight">
                      {scanResult.status === 'SUCCESS' ? 'Access Granted' :
                       scanResult.status === 'ALREADY_CHECKED_IN' ? 'Pass Already Scanned' :
                       'Access Denied'}
                    </h4>
                    <p className="text-xs text-gray-500 mt-1">{scanResult.message}</p>
                    
                    {scanResult.attendee_name && (
                      <div className="mt-4 pt-3 border-t border-black/5 text-xs space-y-1">
                        <div><span className="text-gray-400 font-medium">Attendee:</span> <strong className="font-semibold text-gray-800">{scanResult.attendee_name}</strong></div>
                        {scanResult.ticket_type && <div><span className="text-gray-400 font-medium">Ticket:</span> <span className="font-semibold text-gray-800">{scanResult.ticket_type}</span></div>}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Registry / Dashboard columns */}
          <div className="lg:col-span-2 space-y-6">
            {/* Stats row */}
            {stats && (
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex flex-col justify-between">
                  <span className="text-2xs font-bold text-gray-400 uppercase tracking-widest">Total Booked</span>
                  <span className="text-3xl font-black text-gray-900 mt-2">{stats.total_booked}</span>
                </div>
                <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex flex-col justify-between">
                  <span className="text-2xs font-bold text-gray-400 uppercase tracking-widest">Checked In</span>
                  <span className="text-3xl font-black text-emerald-600 mt-2">{stats.checked_in}</span>
                </div>
                <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex flex-col justify-between">
                  <span className="text-2xs font-bold text-gray-400 uppercase tracking-widest">Attendance</span>
                  <span className="text-3xl font-black text-indigo-600 mt-2">{stats.attendance_percentage}%</span>
                </div>
              </div>
            )}

            {/* Registry table component */}
            <AttendanceList attendance={attendance} />
          </div>

        </div>
      )}
    </div>
  );
};

export default CheckInPage;
