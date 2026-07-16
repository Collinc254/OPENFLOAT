import { useState } from 'react';

export default function AdminConsole() {
  const [rotating, setRotating] = useState(false);
  const [message, setMessage] = useState('');

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

      {/* LDAP Users Placeholder */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 border-b pb-2">LDAP Role Assignments</h3>
        <p className="text-sm text-slate-500 text-center py-8">Active Directory integration panel will render here.</p>
      </div>
    </div>
  );
}