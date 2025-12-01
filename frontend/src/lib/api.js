export const API_BASE = process.env.REACT_APP_API_BASE || '';
export const apiUrl = (path) => `${API_BASE}${path}`;
