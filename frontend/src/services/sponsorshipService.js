import api from './api';

const sponsorshipService = {
  // Sponsors
  createSponsor: async (sponsorData) => {
    const response = await api.post('/sponsorships/sponsors', sponsorData);
    return response.data;
  },
  getSponsors: async () => {
    const response = await api.get('/sponsorships/sponsors');
    return response.data;
  },
  getMySponsors: async () => {
    const response = await api.get('/sponsorships/sponsors/me');
    return response.data;
  },
  getSponsorById: async (id) => {
    const response = await api.get(`/sponsorships/sponsors/${id}`);
    return response.data;
  },
  updateSponsor: async (id, sponsorData) => {
    const response = await api.put(`/sponsorships/sponsors/${id}`, sponsorData);
    return response.data;
  },

  // Packages
  createPackage: async (packageData) => {
    const response = await api.post('/sponsorships/packages', packageData);
    return response.data;
  },
  getPackagesForEvent: async (eventId) => {
    const response = await api.get(`/sponsorships/packages/event/${eventId}`);
    return response.data;
  },
  updatePackage: async (id, packageData) => {
    const response = await api.put(`/sponsorships/packages/${id}`, packageData);
    return response.data;
  },
  deletePackage: async (id) => {
    const response = await api.delete(`/sponsorships/packages/${id}`);
    return response.data;
  },

  // Sponsorships
  trackSponsorship: async (sponsorshipData) => {
    const response = await api.post('/sponsorships/track', sponsorshipData);
    return response.data;
  },
  getSponsorshipsForEvent: async (eventId) => {
    const response = await api.get(`/sponsorships/track/event/${eventId}`);
    return response.data;
  },
  getSponsorshipsForSponsor: async (sponsorId) => {
    const response = await api.get(`/sponsorships/track/sponsor/${sponsorId}`);
    return response.data;
  },
  updateSponsorshipStatus: async (id, updateData) => {
    const response = await api.put(`/sponsorships/track/${id}`, updateData);
    return response.data;
  },
  getIncomingSponsorships: async () => {
    const response = await api.get('/sponsorships/track/organizer/incoming');
    return response.data;
  }
};

export default sponsorshipService;
