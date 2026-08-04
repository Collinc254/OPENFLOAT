const fetchWithAuth = async (url, options = {}) => {
  // 1. Ensure we always send credentials so the browser includes the HttpOnly cookie
  const fetchOptions = {
    ...options,
    credentials: options.credentials || 'include',
  };

  // 2. Make the initial request
  let response = await fetch(url, fetchOptions);

  // 3. Catch the exact moment the access token expires (handles both 401 and 403)
  if (response.status === 401 || response.status === 403) {
    try {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://openfloat.onrender.com';
      
      // Secretly ask the backend for a new access token
      const refreshResponse = await fetch(`${API_BASE_URL}/api/v1/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // CRITICAL: This sends the secure HttpOnly cookie
      });

      if (refreshResponse.ok) {
        const data = await refreshResponse.json();
        
        // Save the brand new access token
        localStorage.setItem('token', data.token);

        // Update the Authorization header for the original request that failed
        if (fetchOptions.headers) {
          fetchOptions.headers['Authorization'] = `Bearer ${data.token}`;
        }

        // 4. Re-run the original request seamlessly
        response = await fetch(url, fetchOptions);
      } else {
        // If the refresh token itself is expired (e.g., after 7 days of inactivity), 
        // the session is truly dead. Clear out the storage and force a fresh login.
        console.error("Refresh token expired. Forcing logout.");
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        localStorage.removeItem('openfloat_user');
        window.location.href = '/'; 
      }
    } catch (error) {
      console.error("Network error during token refresh:", error);
    }
  }

  return response;
};

export default fetchWithAuth;