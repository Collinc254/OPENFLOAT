import { useState } from 'react';

export default function Login({ onSuccessfulLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState('idle'); // 'idle' | 'loading' | 'error'
  const [errorMsg, setErrorMsg] = useState('');

  // NEW: UI Toggle States
  const [showPassword, setShowPassword] = useState(false);
  
  // NEW: 2FA States
  const [requiresMfa, setRequiresMfa] = useState(false);
  const [mfaCode, setMfaCode] = useState('');

  const handleAuth = async (e) => {
    e.preventDefault();
    setStatus('loading');
    setErrorMsg('');

    try {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://openfloat.onrender.com';
      
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        // Pass the MFA code along with credentials (it will be empty on the first try)
        body: JSON.stringify({ username, password, code: mfaCode }),
      });

      // Safely parse the response (handles both Spring Boot JSON and raw String errors)
      let data;
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        data = { message: await response.text() };
      }

      if (response.ok) {
        // Successful login
        localStorage.setItem('token', data.token);
        localStorage.setItem('role', data.role);
        localStorage.setItem('openfloat_user', username);

        onSuccessfulLogin({
          username: username,
          role: data.role, 
          token: data.token
        });

      } else if (response.status === 401 && data?.error === 'MFA_REQUIRED') {
        // Backend demands a 2FA code
        setRequiresMfa(true);
        setStatus('idle');
        
        // If they already tried a code and it failed, show an error
        if (mfaCode) {
          setErrorMsg('Invalid 2FA code. Please try again.');
          setMfaCode(''); // Reset the input
        }

      } else {
        // Standard incorrect password or disabled account
        setStatus('error');
        setErrorMsg(data?.message || 'Authentication failed. Incorrect credentials.');
      }

    } catch (error) {
      console.error('Login Error:', error);
      setStatus('error'); 
      setErrorMsg('Network error. Could not reach authentication server.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-slate-900 tracking-tight">
          OpenFloat
        </h2>
        <p className="mt-2 text-center text-sm text-slate-600">
          Enterprise Middleware Portal
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl sm:rounded-lg sm:px-10 border border-slate-200">
          
          <div className="mb-6">
            <h3 className="text-lg font-medium text-slate-900">
              {requiresMfa ? 'Two-Factor Authentication' : 'Staff Authentication'}
            </h3>
            <p className="text-sm text-slate-500">
              {requiresMfa ? 'Enter the 6-digit code from your authenticator app.' : 'Sign in with your secure credentials.'}
            </p>
          </div>

          <form className="space-y-6" onSubmit={handleAuth}>
            
            {/* Show Username & Password ONLY if 2FA is not yet required */}
            {!requiresMfa ? (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div>
                  <label className="block text-sm font-medium text-slate-700">
                    Admin Username
                  </label>
                  <div className="mt-1">
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={(e) => { setUsername(e.target.value); setStatus('idle'); setErrorMsg(''); }}
                      className="appearance-none block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-slate-900 focus:border-slate-900 sm:text-sm"
                      placeholder="Admin account"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700">
                    Password
                  </label>
                  <div className="mt-1 relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => { setPassword(e.target.value); setStatus('idle'); setErrorMsg(''); }}
                      className="appearance-none block w-full px-3 py-2 pr-10 border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-slate-900 focus:border-slate-900 sm:text-sm"
                    />
                    {/* SHOW/HIDE PASSWORD TOGGLE BUTTON */}
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
                    >
                      {showPassword ? (
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.29 3.29m0 0a10.05 10.05 0 015.71-1.583c4.478 0 8.268 2.943 9.542 7a10.025 10.025 0 01-4.132 5.411m0 0l-3.29-3.29" />
                        </svg>
                      ) : (
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* Show 2FA Input if required */
              <div className="animate-in slide-in-from-right-4 duration-300">
                <label className="block text-sm font-medium text-slate-700">
                  Authentication Code
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    required
                    maxLength="6"
                    value={mfaCode}
                    onChange={(e) => { 
                      setMfaCode(e.target.value.replace(/\D/g, '')); // Force numbers only
                      setStatus('idle'); 
                      setErrorMsg('');
                    }}
                    className="appearance-none block w-full px-3 py-3 border border-slate-300 rounded-md shadow-sm placeholder-slate-300 focus:outline-none focus:ring-slate-900 focus:border-slate-900 text-center text-2xl font-mono tracking-[0.5em]"
                    placeholder="000000"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => { setRequiresMfa(false); setMfaCode(''); }}
                  className="mt-3 text-sm text-blue-600 hover:text-blue-500 font-medium"
                >
                  &larr; Back to password
                </button>
              </div>
            )}

            {status === 'error' && (
              <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md border border-red-100">
                {errorMsg}
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={status === 'loading' || (requiresMfa && mfaCode.length !== 6)}
                className={`w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white transition-colors
                  ${(status === 'loading' || (requiresMfa && mfaCode.length !== 6))
                    ? 'bg-slate-400 cursor-not-allowed' 
                    : 'bg-slate-900 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-900'
                  }`}
              >
                {status === 'loading' ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    Verifying...
                  </span>
                ) : (
                  requiresMfa ? 'Verify & Login' : 'Sign In'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}