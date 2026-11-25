import { apiClient } from './client';

const logApiError = (operation, error) => {
  console.error(
    `[SupportAPI] ${operation} failed (${error?.response?.status}):`,
    JSON.stringify(error?.response?.data || error?.message, null, 2)
  );
};

// ============================================================================
// TICKET LIFECYCLE (USER, LANDLORD & ADMIN)
// ============================================================================

export const createSupportTicketApi = async (ticketData) => {
  try {
    const response = await apiClient.post('/support/tickets', ticketData);
    return response.data;
  } catch (error) {
    logApiError('createSupportTicketApi', error);
    throw error;
  }
};

export const getSupportTicketsApi = async (params = {}) => {
  try {
    const response = await apiClient.get('/support/tickets', { params });
    return response.data;
  } catch (error) {
    logApiError('getSupportTicketsApi', error);
    throw error;
  }
};

export const getSupportTicketDetailsApi = async (ticketId) => {
  try {
    const response = await apiClient.get(`/support/tickets/${ticketId}`);
    return response.data;
  } catch (error) {
    logApiError('getSupportTicketDetailsApi', error);
    throw error;
  }
};

// ============================================================================
// MESSAGES & READ RECEIPTS
// ============================================================================

export const getSupportTicketMessagesApi = async (ticketId, params = {}) => {
  try {
    const response = await apiClient.get(`/support/tickets/${ticketId}/messages`, { params });
    return response.data;
  } catch (error) {
    logApiError('getSupportTicketMessagesApi', error);
    throw error;
  }
};

export const sendSupportMessageApi = async (ticketId, messageData) => {
  try {
    const response = await apiClient.post(`/support/tickets/${ticketId}/messages`, messageData);
    return response.data;
  } catch (error) {
    logApiError('sendSupportMessageApi', error);
    throw error;
  }
};

export const markSupportTicketReadApi = async (ticketId) => {
  try {
    const response = await apiClient.patch(`/support/tickets/${ticketId}/read`);
    return response.data;
  } catch (error) {
    logApiError('markSupportTicketReadApi', error);
    throw error;
  }
};

// ============================================================================
// STATUS & ADMIN OPERATIONS
// ============================================================================

export const updateSupportTicketStatusApi = async (ticketId, status) => {
  try {
    const response = await apiClient.patch(`/support/tickets/${ticketId}/status`, { status });
    return response.data;
  } catch (error) {
    logApiError('updateSupportTicketStatusApi', error);
    throw error;
  }
};

export const assignSupportTicketApi = async (ticketId, agentId) => {
  try {
    const response = await apiClient.patch(`/support/tickets/${ticketId}/assign`, { agentId });
    return response.data;
  } catch (error) {
    logApiError('assignSupportTicketApi', error);
    throw error;
  }
};

export const updateSupportTicketTagsApi = async (ticketId, tags) => {
  try {
    const response = await apiClient.patch(`/support/tickets/${ticketId}/tags`, { tags });
    return response.data;
  } catch (error) {
    logApiError('updateSupportTicketTagsApi', error);
    throw error;
  }
};