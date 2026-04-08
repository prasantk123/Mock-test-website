import { createContext, useContext, useState, useEffect } from 'react';

const UserContext = createContext();

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check localStorage for session
    const storedUser = localStorage.getItem('mockTestUser');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = (userData) => {
    setUser(userData);
    localStorage.setItem('mockTestUser', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('mockTestUser');
  };

  return (
    <UserContext.Provider value={{ user, login, logout, loading }}>
      {!loading && children}
    </UserContext.Provider>
  );
}

export const useUser = () => useContext(UserContext);
