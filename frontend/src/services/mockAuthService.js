// Simulate backend authentication API

const MOCK_DELAY = 800;

// Mock user database
let users = [
  {
    id: 'u1',
    name: 'Demo User',
    email: 'demo@example.com',
    password: 'password123', // In a real app, this would be hashed
    role: 'voter'
  }
];

export const mockAuthService = {
  login: async (email, password) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const user = users.find(u => u.email === email && u.password === password);
        
        if (user) {
          // Return user info and a fake token
          const { password, ...userWithoutPassword } = user;
          resolve({
            user: userWithoutPassword,
            token: 'mock-jwt-token-' + Math.random().toString(36).substr(2)
          });
        } else {
          reject(new Error('Invalid email or password'));
        }
      }, MOCK_DELAY);
    });
  },

  signup: async (userData) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const existingUser = users.find(u => u.email === userData.email);
        
        if (existingUser) {
          reject(new Error('Email already exists'));
          return;
        }

        const newUser = {
          id: 'u' + (users.length + 1),
          name: userData.name,
          email: userData.email,
          password: userData.password,
          role: 'voter'
        };

        users.push(newUser);

        const { password, ...userWithoutPassword } = newUser;
        resolve({
          user: userWithoutPassword,
          token: 'mock-jwt-token-' + Math.random().toString(36).substr(2)
        });
      }, MOCK_DELAY);
    });
  },

  logout: async () => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve();
      }, 500);
    });
  },

  // Helper to check if token is valid (mock implementation)
  validateToken: async (token) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        if (token && token.startsWith('mock-jwt-token-')) {
          resolve(true);
        } else {
          resolve(false);
        }
      }, 200);
    });
  }
};
