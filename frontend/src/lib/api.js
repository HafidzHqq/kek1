const lsBase = typeof window !== 'undefined' ? (localStorage.getItem('API_BASE') || '') : '';
export const API_BASE = (process.env.REACT_APP_API_BASE || lsBase || 'https://kek1-v9h6.vercel.app').replace(/\/$/, '');
export const apiUrl = (path) => `${API_BASE}${path}`;
export const setApiBase = (url) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('API_BASE', url.replace(/\/$/, ''));
  }
};