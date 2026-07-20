window.__API_BASE_URL__ = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://127.0.0.1:3100'
  : 'http://backend:8000';
