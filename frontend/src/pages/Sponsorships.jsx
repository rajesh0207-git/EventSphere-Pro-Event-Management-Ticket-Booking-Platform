import React, { useState, useEffect, useContext } from 'react';
import sponsorshipService from '../services/sponsorshipService';
import { AuthContext } from '../context/AuthContext';
import { getEvents } from '../services/eventService';
import { CheckCircle, XCircle } from 'lucide-react';

const Sponsorships = () => {
  const { isOrganizer } = useContext(AuthContext);

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Sponsorship Management</h1>
      {isOrganizer ? <OrganizerView /> : <AttendeeView />}
    </div>
  );
};

const OrganizerView = () => {
  const [events, setEvents] = useState([]);
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [packages, setPackages] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  
  // Package Form
  const [pkgName, setPkgName] = useState('');
  const [pkgDesc, setPkgDesc] = useState('');
  const [pkgPrice, setPkgPrice] = useState('');
  const [pkgMax, setPkgMax] = useState('');

  useEffect(() => {
    fetchMyEvents();
    fetchIncomingRequests();
  }, []);

  useEffect(() => {
    if (selectedEventId) {
      fetchPackagesForEvent(selectedEventId);
    } else {
      setPackages([]);
    }
  }, [selectedEventId]);

  const fetchMyEvents = async () => {
    try {
      const { getMyEvents } = await import('../services/eventService');
      const response = await getMyEvents();
      const data = response?.data || response || [];
      setEvents(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchIncomingRequests = async () => {
    try {
      const data = await sponsorshipService.getIncomingSponsorships();
      setIncomingRequests(data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchPackagesForEvent = async (eventId) => {
    try {
      const data = await sponsorshipService.getPackagesForEvent(eventId);
      setPackages(data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreatePackage = async (e) => {
    e.preventDefault();
    if (!selectedEventId) return alert('Please select an event first');
    try {
      const newPkg = await sponsorshipService.createPackage({
        event_id: parseInt(selectedEventId),
        name: pkgName,
        description: pkgDesc,
        price: parseFloat(pkgPrice),
        max_sponsors: parseInt(pkgMax) || 10
      });
      setPackages([...packages, newPkg]);
      setPkgName(''); setPkgDesc(''); setPkgPrice(''); setPkgMax('');
      alert('Package created successfully!');
    } catch (err) {
      console.error(err);
      alert('Failed to create package');
    }
  };

  const handleStatusUpdate = async (id, status) => {
    try {
      await sponsorshipService.updateSponsorshipStatus(id, { status });
      alert(`Request marked as ${status}`);
      fetchIncomingRequests();
    } catch (err) {
      console.error(err);
      alert('Failed to update status');
    }
  };

  return (
    <div className="space-y-8">
      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Create Sponsor Package</h2>
        <div className="mb-4">
          <label className="block text-gray-700 font-medium mb-1">Select Event</label>
          <select 
            className="w-full md:w-1/2 border border-gray-300 rounded px-3 py-2"
            value={selectedEventId}
            onChange={(e) => setSelectedEventId(e.target.value)}
          >
            <option value="">-- Select Your Event --</option>
            {events.map(ev => (
              <option key={ev.id} value={ev.id}>{ev.title}</option>
            ))}
          </select>
        </div>

        {selectedEventId && (
          <form onSubmit={handleCreatePackage} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 font-medium mb-1">Package Name</label>
              <input type="text" className="w-full border border-gray-300 rounded px-3 py-2" value={pkgName} onChange={e => setPkgName(e.target.value)} required />
            </div>
            <div>
              <label className="block text-gray-700 font-medium mb-1">Price ($)</label>
              <input type="number" className="w-full border border-gray-300 rounded px-3 py-2" value={pkgPrice} onChange={e => setPkgPrice(e.target.value)} required />
            </div>
            <div className="md:col-span-2">
              <label className="block text-gray-700 font-medium mb-1">Description</label>
              <textarea className="w-full border border-gray-300 rounded px-3 py-2" rows="2" value={pkgDesc} onChange={e => setPkgDesc(e.target.value)} />
            </div>
            <div className="md:col-span-2">
              <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 transition">
                Create Package
              </button>
            </div>
          </form>
        )}
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Incoming Sponsorship Requests</h2>
        {incomingRequests.length === 0 ? (
          <p className="text-gray-500">No incoming requests right now.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="px-4 py-3">ID</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {incomingRequests.map(req => (
                  <tr key={req.id}>
                    <td className="px-4 py-3">#{req.id}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${req.status === 'APPROVED' ? 'bg-green-100 text-green-700' : req.status === 'REJECTED' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                        {req.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">{new Date(req.created_at).toLocaleDateString()}</td>
                    <td className="px-4 py-3 space-x-2">
                      {req.status === 'PENDING' && (
                        <>
                          <button onClick={() => handleStatusUpdate(req.id, 'APPROVED')} className="text-green-600 hover:text-green-800" title="Approve"><CheckCircle size={20}/></button>
                          <button onClick={() => handleStatusUpdate(req.id, 'REJECTED')} className="text-red-600 hover:text-red-800" title="Reject"><XCircle size={20}/></button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

const AttendeeView = () => {
  const [sponsors, setSponsors] = useState([]);
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [companyName, setCompanyName] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    fetchSponsors();
    fetchEvents();
  }, []);

  useEffect(() => {
    if (selectedEventId) {
      fetchPackagesForEvent(selectedEventId);
    } else {
      setPackages([]);
    }
  }, [selectedEventId]);

  const fetchSponsors = async () => {
    try {
      const data = await sponsorshipService.getMySponsors();
      setSponsors(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchEvents = async () => {
    try {
      const response = await getEvents();
      const data = response?.data?.items || response?.data || [];
      setEvents(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchPackagesForEvent = async (eventId) => {
    try {
      setLoading(true);
      const data = await sponsorshipService.getPackagesForEvent(eventId);
      setPackages(data);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch packages');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSponsor = async (e) => {
    e.preventDefault();
    try {
      const newSponsor = await sponsorshipService.createSponsor({
        company_name: companyName,
        description: description
      });
      setSponsors([...sponsors, newSponsor]);
      setCompanyName('');
      setDescription('');
      alert('Sponsor profile created successfully!');
    } catch (err) {
      console.error(err);
      alert('Failed to create sponsor');
    }
  };

  const handleTrackSponsorship = async (packageId) => {
    if (!sponsors.length) {
      alert('Please create a sponsor profile first.');
      return;
    }
    try {
      const sponsorId = sponsors[0].id;
      await sponsorshipService.trackSponsorship({
        package_id: packageId,
        sponsor_id: sponsorId,
        event_id: parseInt(selectedEventId)
      });
      alert('Sponsorship requested successfully!');
    } catch (err) {
      console.error(err);
      alert('Failed to request sponsorship');
    }
  };

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Create Sponsor Profile</h2>
          <form onSubmit={handleCreateSponsor} className="space-y-4">
            <div>
              <label className="block text-gray-700 font-medium mb-1">Company Name</label>
              <input type="text" className="w-full border border-gray-300 rounded px-3 py-2" value={companyName} onChange={(e) => setCompanyName(e.target.value)} required />
            </div>
            <div>
              <label className="block text-gray-700 font-medium mb-1">Description</label>
              <textarea className="w-full border border-gray-300 rounded px-3 py-2" rows="3" value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition">Create Profile</button>
          </form>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Your Sponsor Profiles</h2>
          {sponsors.length === 0 ? (
            <p className="text-gray-500">You haven't created any sponsor profiles yet.</p>
          ) : (
            <ul className="space-y-3">
              {sponsors.map(sponsor => (
                <li key={sponsor.id} className="p-4 border border-gray-100 rounded bg-gray-50">
                  <h3 className="font-bold text-gray-800">{sponsor.company_name}</h3>
                  <p className="text-sm text-gray-600">{sponsor.description}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Available Packages</h2>
        <div className="mb-6">
          <label className="block text-gray-700 font-medium mb-1">Select Event to Browse Packages</label>
          <select className="w-full md:w-1/2 border border-gray-300 rounded px-3 py-2" value={selectedEventId} onChange={(e) => setSelectedEventId(e.target.value)}>
            <option value="">-- Select Event --</option>
            {events.map(ev => (
              <option key={ev.id} value={ev.id}>{ev.title}</option>
            ))}
          </select>
        </div>

        {loading ? (
          <p className="text-gray-500">Loading packages...</p>
        ) : error ? (
          <p className="text-red-500">{error}</p>
        ) : packages.length === 0 && selectedEventId ? (
          <p className="text-gray-500">No packages available for this event yet.</p>
        ) : packages.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {packages.map(pkg => (
              <div key={pkg.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-lg transition flex flex-col">
                <h3 className="text-2xl font-bold text-gray-800 mb-2">{pkg.name}</h3>
                <p className="text-3xl font-bold text-blue-600 mb-4">${pkg.price}</p>
                <p className="text-gray-600 flex-grow mb-6">{pkg.description}</p>
                <button onClick={() => handleTrackSponsorship(pkg.id)} className="w-full bg-blue-50 text-blue-600 border border-blue-200 font-semibold py-2 rounded hover:bg-blue-600 hover:text-white transition">
                  Apply for Sponsorship
                </button>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default Sponsorships;
