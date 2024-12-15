import { createContext, useState, useEffect, useContext } from 'react';
import { axiosInstance, endpoints } from '../services/apiConfig';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')));

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      getUserData(token);
    }
  }, []);

  const login = async (formData) => {
    try {
      const response = await axiosInstance.post(endpoints.LOGIN, formData);
      localStorage.setItem('accessToken', response.data.access);
      getUserData(response.data.access);

      if (response.status === 200) {
        window.location.replace('/');
      }
    } catch (error) {
      alert(error.response.data.detail);
      console.error('Login failed:', error);
    }
  };

  const logout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user'); 
    setUser(null);
    window.location.reload();
    window.location.replace('/login');
  };

  const getUserData = async (token) => {
    if (token) {
      try {
        const response = await axiosInstance.get(endpoints.GET_USER, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setUser(response.data);
        
        localStorage.setItem('user', JSON.stringify(response.data));
      } catch (error) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
        setUser(null);
        console.error('Failed to fetch user data:', error);
      }
    }
  };

  const authValues = {
    user,
    login,
    logout,
  };

  return <AuthContext.Provider value={authValues}>{children}</AuthContext.Provider>;
};

export default AuthContext;
