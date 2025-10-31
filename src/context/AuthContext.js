import React, { createContext, useContext, useState, useEffect } from 'react';
import Cookies from 'js-cookie';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = Cookies.get('authToken');
    const userData = Cookies.get('currentUser');
    if (token && userData) {
      try {
        setCurrentUser(JSON.parse(userData));
        setIsAuthenticated(true);
      } catch (error) {
        // Invalid user data, clear cookies
        Cookies.remove('authToken');
        Cookies.remove('currentUser');
      }
    }
    setLoading(false);
  }, []);

  const signup = (email, password, name) => {
    // Get existing users from localStorage
    const existingUsers = JSON.parse(localStorage.getItem('users') || '[]');
    
    // Check if email already exists
    if (existingUsers.some(user => user.email === email)) {
      return { success: false, error: 'Email already exists' };
    }

    // Create new user
    const newUser = {
      id: Date.now().toString(),
      email,
      password, // In real app, this would be hashed
      name,
      createdAt: new Date().toISOString()
    };

    // Save to localStorage
    const updatedUsers = [...existingUsers, newUser];
    localStorage.setItem('users', JSON.stringify(updatedUsers));

    return { success: true, message: 'Account created successfully! Please login.' };
  };

  const login = (email, password) => {
    // Get users from localStorage
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    
    // Find user with matching email and password
    const user = users.find(u => u.email === email && u.password === password);
    
    if (user) {
      // Create user object without password for storage
      const userForStorage = {
        id: user.id,
        email: user.email,
        name: user.name,
        createdAt: user.createdAt
      };
      
      Cookies.set('authToken', 'authenticated', { expires: 7 });
      Cookies.set('currentUser', JSON.stringify(userForStorage), { expires: 7 });
      setCurrentUser(userForStorage);
      setIsAuthenticated(true);
      return { success: true };
    }
    
    return { success: false, error: 'Invalid email or password' };
  };

  const logout = () => {
    Cookies.remove('authToken');
    Cookies.remove('currentUser');
    setCurrentUser(null);
    setIsAuthenticated(false);
  };

  const value = {
    isAuthenticated,
    currentUser,
    login,
    logout,
    signup,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
