const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api/auth';

export const authService = {
  login: async (username, password) => {
    const response = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Login failed');
    }

    return data;
  },

  signup: async (userData) => {
    const response = await fetch(`${API_URL}/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: userData.username,
        password: userData.password,
        role: userData.role
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Signup failed');
    }

    return data;
  },

  logout: async () => {
    // No backend call needed for simple JWT implementation
    return Promise.resolve();
  },

  submitVerification: async (userId, verificationData) => {
    // TODO: Implement backend endpoint for verification
    console.warn('Backend verification endpoint not implemented. Auto-verifying for demo.');
    
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          user: {
            id: userId,
            kycStatus: 'verified'
          }
        });
      }, 800);
    });
  }
};
