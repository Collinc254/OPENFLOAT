import { useState } from 'react';

export default function Login({ onSuccessfulLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState('idle'); // 'idle' | 'loading' | 'error'

  const handleAuth = async (e) => {
    e.preventDefault();
    setStatus('loading');

    // Simulating the LDAP/AD OAuth2 token exchange delay
    setTimeout(() => {
      if (username && password.length >= 6) {
        // Mock successful login payload
        onSuccessfulLogin({
          username: username,
          role: 'Operator', // In production, this comes from the JWT/LDAP claims
          token: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
        });
      } else {
        setStatus('error');
      }
    }, 1200);
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
            <h3 className="text-lg font-medium text-slate-900">Staff Authentication</h3>
            <p className="text-sm text-slate-500">Sign in with your Active Directory credentials.</p>
          </div>

          <form className="space-y-6" onSubmit={handleAuth}>
            <div>
              <label className="block text-sm font-medium text-slate-700">
                Corporate Username
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-slate-900 focus:border-slate-900 sm:text-sm"
                  placeholder="e.g. jdoe"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">
                Password
              </label>
              <div className="mt-1">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-slate-900 focus:border-slate-900 sm:text-sm"
                />
              </div>
            </div>

            {status === 'error' && (
              <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md border border-red-100">
                Authentication failed. Please verify your Active Directory credentials.
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={status === 'loading'}
                className={`w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white transition-colors
                  ${status === 'loading' 
                    ? 'bg-slate-400 cursor-not-allowed' 
                    : 'bg-slate-900 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-900'
                  }`}
              >
                {status === 'loading' ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    Authenticating via LDAP...
                  </span>
                ) : (
                  'Sign In'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}