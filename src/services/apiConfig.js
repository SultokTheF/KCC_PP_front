import axios from 'axios';

const API_BASE_URL = 'http://127.0.0.1:8000/';

const endpoints = {
  // Users
  LOGIN: `user/token/login/`,
  USERS: `user/users/`,
  GET_USER: `user/token/get`,

  // Subjects
  SUBJECTS: `api/subjects/`,
  CALCULATE_P2: `/api/subjects/calculate_p2/`,

  // Objects 
  OBJECTS: `api/objects/`,

  // Days
  DAYS: `api/days/`,
  PLANS_CREATE: (day) => `/api/days/${day}/plansCreate/`,
  ACCEPT_PLAN: (day) => `/api/days/${day}/accept/`,

  // Hours
  HOURS: `api/hours/`,

  // Holidays
  HOLIDAYS: `api/holiday/`,
};

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});


axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export { axiosInstance, endpoints };
