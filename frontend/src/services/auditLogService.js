import api from './api';

const auditLogService = {
  getAuditLogs: async (page = 1, perPage = 20) => {
    const response = await api.get(`/audit-logs?page=${page}&per_page=${perPage}`);
    return response.data;
  }
};

export default auditLogService;
