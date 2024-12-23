import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const getAuthHeaders = () => ({
  'Authorization': `Bearer ${localStorage.getItem('token')}`,
  'Content-Type': 'application/json'
});

const handleApiError = (error) => {
  console.error('API Error:', error);
  if (error.response) {
    throw new Error(error.response.data.message || 'An error occurred');
  }
  throw new Error(error.message || 'Network error occurred');
};

const handleResponse = async (response) => {
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Something went wrong');
  }
  return response.json();
};

// Add this for debugging
const logApiError = (error, endpoint) => {
  console.error(`API Error (${endpoint}):`, error);
  console.log('Request URL:', `${API_URL}${endpoint}`);
};

export const api = {
  // Auth endpoints
  signup: async (userData) => {
    try {
      const response = await fetch(`${API_URL}/users/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
        credentials: 'include'
      });
      return handleResponse(response);
    } catch (error) {
      throw new Error(error.message || 'Failed to sign up');
    }
  },

  login: async (credentials) => {
    try {
      const response = await fetch(`${API_URL}/users/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
        credentials: 'include'
      });
      return handleResponse(response);
    } catch (error) {
      throw new Error(error.message || 'Failed to log in');
    }
  },

  // Helper function to update last_active
  updateLastActive: async () => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        await fetch(`${API_URL}/users/update-activity`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
      } catch (error) {
        console.error('Error updating last active:', error);
      }
    }
  },

  // Booking endpoints
  createBooking: async (formData) => {
    try {
      const response = await fetch(`${API_URL}/bookings`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: formData,
      });
      return handleResponse(response);
    } catch (error) {
      throw new Error(error.message || 'Failed to create booking');
    }
  },

  getBookings: async (page = 1, limit = 10) => {
    try {
      const response = await fetch(`${API_URL}/bookings?page=${page}&limit=${limit}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      return handleResponse(response);
    } catch (error) {
      logApiError(error, '/bookings');
      throw error;
    }
  },

  updateBooking: async (id, formData) => {
    try {
      const response = await fetch(`${API_URL}/bookings/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: formData,
      });
      return handleResponse(response);
    } catch (error) {
      throw new Error(error.message || 'Failed to update booking');
    }
  },

  deleteBooking: async (id) => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/bookings/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    return handleResponse(response);
  },

  createBackup: async (period) => {
    const response = await fetch(`${API_URL}/backups/${period}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    return handleResponse(response);
  },

  getBackups: async () => {
    const response = await fetch(`${API_URL}/backups`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    return handleResponse(response);
  },

  getUsers: async (page = 1, limit = 10) => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/users?page=${page}&limit=${limit}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    return handleResponse(response);
  },

  updateUser: async (id, userData) => {
    try {
      const response = await fetch(`${API_URL}/users/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(userData)
      });
      return handleResponse(response);
    } catch (error) {
      throw new Error(error.message || 'Failed to update user');
    }
  },

  deleteUser: async (id) => {
    try {
      const response = await fetch(`${API_URL}/users/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      return handleResponse(response);
    } catch (error) {
      throw new Error(error.message || 'Failed to delete user');
    }
  },

  resetUserPassword: async (id) => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/users/${id}/reset-password`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    return handleResponse(response);
  },

  generateReport: async (period) => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/reports/${period}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    return handleResponse(response);
  },

  getAnalytics: async () => {
    try {
      const response = await fetch(`${API_URL}/analytics`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch analytics');
      }

      return await response.json();
    } catch (error) {
      throw new Error(error.message || 'Failed to fetch analytics');
    }
  },

  generateCertificate: async (bookingId) => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/certificates/${bookingId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    return handleResponse(response);
  },

  getCertificates: async () => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/certificates`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    return handleResponse(response);
  },

  getAllBookings: async (page = 1) => {
    try {
      const response = await axios.get(`${API_URL}/bookings/all?page=${page}`, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  downloadBackup: async (fileName) => {
    try {
      const response = await fetch(`${API_URL}/backups/download/${fileName}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to download backup');
      }
      
      return response.blob();
    } catch (error) {
      throw new Error(error.message || 'Failed to download backup');
    }
  },

  getTasks: async () => {
    try {
      const response = await fetch(`${API_URL}/tasks`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      return handleResponse(response);
    } catch (error) {
      throw new Error(error.message || 'Failed to fetch tasks');
    }
  },

  createTask: async (taskData) => {
    try {
      const response = await fetch(`${API_URL}/tasks`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(taskData)
      });
      return handleResponse(response);
    } catch (error) {
      throw new Error(error.message || 'Failed to create task');
    }
  },

  updateTask: async (taskId, taskData) => {
    try {
      const response = await fetch(`${API_URL}/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(taskData)
      });
      return handleResponse(response);
    } catch (error) {
      throw new Error(error.message || 'Failed to update task');
    }
  },

  deleteTask: async (taskId) => {
    try {
      const response = await fetch(`${API_URL}/tasks/${taskId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      return handleResponse(response);
    } catch (error) {
      throw new Error(error.message || 'Failed to delete task');
    }
  },

  getNotifications: async () => {
    try {
      const response = await fetch(`${API_URL}/notifications`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      return handleResponse(response);
    } catch (error) {
      throw new Error(error.message || 'Failed to fetch notifications');
    }
  },

  markNotificationAsRead: async (notificationId) => {
    try {
      const response = await fetch(`${API_URL}/notifications/${notificationId}/read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      return handleResponse(response);
    } catch (error) {
      throw new Error(error.message || 'Failed to update notification');
    }
  },

  clearNotifications: async () => {
    try {
      const response = await fetch(`${API_URL}/notifications/clear`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      return handleResponse(response);
    } catch (error) {
      throw new Error(error.message || 'Failed to clear notifications');
    }
  }
};

export default api; 