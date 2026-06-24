import api from './api';

const reportService = {
  getDashboardReports: async (eventId = null) => {
    const params = eventId ? { event_id: eventId } : {};
    const response = await api.get('/reports/dashboard', { params });
    return response.data;
  },

  exportReportsCSV: async (eventId = null) => {
    const params = eventId ? { event_id: eventId } : {};
    const response = await api.get('/reports/export/csv', {
      params,
      responseType: 'blob', // Important for downloading files
    });
    
    // Create a Blob from the response data
    const blob = new Blob([response.data], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    
    // Create a link element, hide it, direct it towards the blob, and then 'click' it programatically
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = 'reports.csv';
    document.body.appendChild(a);
    a.click();
    
    // Clean up
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }
};

export default reportService;
