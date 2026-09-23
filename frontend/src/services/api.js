const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const request = async (options = {}) => {
  const response = await fetch(`${API_URL}/state`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options
  });

  if (!response.ok) {
    throw new Error(`State request failed with status ${response.status}`);
  }

  return response.json();
};

export const getState = () => request();

export const saveState = (state) =>
  request({
    method: 'PUT',
    body: JSON.stringify(state)
  });
