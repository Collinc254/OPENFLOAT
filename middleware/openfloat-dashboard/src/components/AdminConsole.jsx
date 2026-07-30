import { useState } from 'react';

export default function AdminConsole() {
  // Existing API Key State
  const [rotating, setRotating] = useState(false);
  const [message, setMessage] = useState('');

  // New User Creation State
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState('STAFF'); 
  const [creationStatus, setCreationStatus] = useState('');

  const handleKeyRotation = (e) => {
    e.preventDefault();
    setRotating(true);
    setMessage('');

    // Simulate API call to Secrets Manager
    setTimeout(() => {
      setRotating(false);
      setMessage('Consumer Key & Secret successfully rotated and synced with Safaricom.');
    }, 1500);
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setCreationStatus('Creating...');

    try {
      const token = localStorage.getItem('token');
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://openfloat.onrender.com';

      const response = await fetch(`${API_BASE_URL}/api/v1/users/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({
          username: newUsername,
          password: newPassword,
          role: selectedRole
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create user');
      }
      
      setCreationStatus('User created successfully!');
      setNewUsername('');
      setNewPassword('');
      
    } catch (error) {
      console.error(error);
      setCreationStatus('Error creating user. Verify backend connection.');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* API Configuration Card */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-slate-900 px-6 py-5">
          <h2 className="text-xl font-bold text-white tracking-wide">API Credentials Management</h2>
          <p className="text-slate-400 text-sm mt-1">Safaricom Daraja Configuration</p>
        </div>
        
        <div className="p-6 sm:p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Paybill Settings */}
            <div>
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 border-b pb-2">Active Paybill</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Shortcode</label>
                  <input type="text" disabled value="4320161" className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded text-slate-700 font-mono" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Environment</label>
                  <span className="inline-block px-3 py-1 bg-green-100 text-green-800 text-xs font-bold rounded-full">PRODUCTION</span>
                </div>
              </div>
            </div>

            {/* Key Rotation */}
            <div>
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 border-b pb-2">Secrets Manager</h3>
              <p className="text-sm text-slate-600 mb-4">
                Force an immediate rotation of the Daraja OAuth Consumer Key and Secret. This will momentarily pause incoming requests.
              </p>
              <button 
                onClick={handleKeyRotation}
                disabled={rotating}
                className={`w-full py-2.5 rounded font-bold text-white transition-all ${rotating ? 'bg-slate-400 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700'}`}
              >
                {rotating ? 'Rotating Keys...' : 'Force Key Rotation'}
              </button>
              {message && <p className="mt-3 text-sm text-green-700 font-medium">{message}</p>}
            </div>

          </div>
        </div>
      </div>

      {/* NEW: User Management Card */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-slate-900 px-6 py-5">
          <h2 className="text-xl font-bold text-white tracking-wide">User Management</h2>
          <p className="text-slate-400 text-sm mt-1">Provision new operational accounts and manage access</p>
        </div>
        
        <div className="p-6 sm:p-8">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-5 border-b pb-2">Create New Account</h3>
          
          <form onSubmit={handleCreateUser} className="space-y-5 max-w-lg">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Username</label>
              <input 
                type="text" 
                value={newUsername} 
                onChange={(e) => setNewUsername(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-green-500 outline-none text-slate-700"
                placeholder="e.g. collins.staff"
                required 
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Temporary Password</label>
              <input 
                type="password" 
                value={newPassword} 
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-green-500 outline-none text-slate-700"
                placeholder="Min. 8 characters"
                required 
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">System Role</label>
              <div className="relative">
                <select 
                  value={selectedRole} 
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-green-500 outline-none text-slate-700 font-medium appearance-none"
                >
                  <option value="STAFF">Staff (Single STK Operations Only)</option>
                  <option value="MANAGER">Manager (Includes Payouts & Finance Reports)</option>
                  <option value="ADMIN">Administrator (Full System Access)</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </div>
              </div>
            </div>

            <button 
              type="submit" 
              className="w-full bg-green-600 text-white font-bold py-3.5 rounded-lg hover:bg-green-700 transition-colors shadow-sm mt-4"
            >
              Provision Account
            </button>
            
            {creationStatus && (
              <div className={`mt-4 p-3 rounded-lg text-sm font-medium text-center ${creationStatus.includes('Error') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                {creationStatus}
              </div>
            )}
          </form>
        </div>
      </div>

      {/* LDAP Users Placeholder */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 border-b pb-2">LDAP Role Assignments</h3>
        <p className="text-sm text-slate-500 text-center py-8">Active Directory integration panel will render here.</p>
      </div>

    </div>
  );
}