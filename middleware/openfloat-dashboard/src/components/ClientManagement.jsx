import { useState, useEffect } from 'react';

export default function ClientManagement() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [systemName, setSystemName] = useState('');
  const [webhookUrl, setWebhookUrl] = useState('');
  const [rateLimit, setRateLimit] = useState(60);
  const [statusMessage, setStatusMessage] = useState({ type: '', text: '' });

  // Secure Credentials State (Only shown once)
  const [newCredentials, setNewCredentials] = useState(null);

  const fetchClients = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://openfloat.onrender.com';

      const response = await fetch(`${API_BASE_URL}/api/v1/clients`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setClients(data);
      }
    } catch (error) {
      console.error('Error fetching clients:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const handleRegisterClient = async (e) => {
    e.preventDefault();
    setStatusMessage({ type: 'loading', text: 'Registering system...' });
    setNewCredentials(null);

    try {
      const token = localStorage.getItem('token');
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://openfloat.onrender.com';

      const response = await fetch(`${API_BASE_URL}/api/v1/clients/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          systemName,
          webhookUrl,
          rateLimitPerMinute: rateLimit
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to register client');
      }

      setStatusMessage({ type: 'success', text: 'System registered successfully.' });
      
      // Store the exact-once credentials to show the user
      setNewCredentials({
        systemName: data.systemName,
        apiKey: data.apiKey,
        clientSecret: data.clientSecret
      });

      // Clear form
      setSystemName('');
      setWebhookUrl('');
      setRateLimit(60);

      // Refresh the table
      fetchClients();

    } catch (error) {
      setStatusMessage({ type: 'error', text: error.message });
    }
  };

  const handleToggleStatus = async (clientId) => {
    try {
      const token = localStorage.getItem('token');
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://openfloat.onrender.com';

      const response = await fetch(`${API_BASE_URL}/api/v1/clients/${clientId}/toggle-status`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        fetchClients();
      } else {
        alert('Failed to update system status.');
      }
    } catch (error) {
      console.error('Error toggling status:', error);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  return (
    <div className="space-y-6">
      
      {/* Registration Card */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-slate-900 px-6 py-5">
          <h2 className="text-xl font-bold text-white tracking-wide">API Gateway Registration</h2>
          <p className="text-slate-400 text-sm mt-1">Provision access for external client systems</p>
        </div>
        
        <div className="p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Form */}
          <div>
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-5 border-b pb-2">New System Details</h3>
            <form onSubmit={handleRegisterClient} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">System Name</label>
                <input 
                  type="text" 
                  value={systemName} 
                  onChange={(e) => setSystemName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-slate-700"
                  placeholder="e.g. ERP Accounting Module"
                  required 
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Webhook URL</label>
                <input 
                  type="url" 
                  value={webhookUrl} 
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-slate-700"
                  placeholder="https://their-system.com/api/callback"
                  required 
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Rate Limit (Req/Min)</label>
                <input 
                  type="number" 
                  min="10"
                  max="1000"
                  value={rateLimit} 
                  onChange={(e) => setRateLimit(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-slate-700"
                  required 
                />
              </div>

              <button 
                type="submit" 
                className="w-full bg-blue-600 text-white font-bold py-3.5 rounded-lg hover:bg-blue-700 transition-colors shadow-sm mt-2"
              >
                Generate API Credentials
              </button>

              {statusMessage.text && (
                <div className={`p-3 rounded-lg text-sm font-medium text-center ${
                  statusMessage.type === 'error' ? 'bg-red-50 text-red-700' : 
                  statusMessage.type === 'success' ? 'bg-green-50 text-green-700' : 
                  'bg-blue-50 text-blue-700'
                }`}>
                  {statusMessage.text}
                </div>
              )}
            </form>
          </div>

          {/* Secure Credentials Display */}
          <div className="bg-slate-50 rounded-lg border border-slate-200 p-6 flex flex-col justify-center">
            {newCredentials ? (
              <div className="space-y-4 animate-in fade-in zoom-in duration-300">
                <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                  <h4 className="text-yellow-800 font-bold text-sm mb-1">CRITICAL SECURITY NOTICE</h4>
                  <p className="text-yellow-700 text-xs">This Client Secret will only be displayed once. Copy and store it securely immediately. OpenFloat cannot recover this secret if lost.</p>
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">API Key (Public)</label>
                  <div className="flex bg-white border border-slate-200 rounded p-2 items-center justify-between">
                    <code className="text-sm text-slate-800 font-mono break-all">{newCredentials.apiKey}</code>
                    <button onClick={() => copyToClipboard(newCredentials.apiKey)} className="text-blue-600 hover:text-blue-800 text-xs font-bold px-2 py-1 bg-blue-50 rounded ml-2 shrink-0">COPY</button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Client Secret (Private)</label>
                  <div className="flex bg-slate-900 border border-slate-700 rounded p-2 items-center justify-between">
                    <code className="text-sm text-green-400 font-mono break-all">{newCredentials.clientSecret}</code>
                    <button onClick={() => copyToClipboard(newCredentials.clientSecret)} className="text-slate-900 bg-green-400 hover:bg-green-300 text-xs font-bold px-2 py-1 rounded ml-2 shrink-0">COPY</button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center text-slate-400">
                <svg className="w-12 h-12 mx-auto mb-3 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                <p className="text-sm">Generated API credentials will appear here.</p>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Connected Systems Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden p-6 sm:p-8">
        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-5 border-b pb-2">Registered Client Systems</h3>
        
        <div className="overflow-x-auto">
          {loading ? (
            <p className="text-sm text-slate-500 py-4">Loading systems...</p>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr>
                  <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider bg-slate-50 rounded-tl-lg">System Name</th>
                  <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider bg-slate-50">API Key</th>
                  <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider bg-slate-50">Webhook URL</th>
                  <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider bg-slate-50">Status</th>
                  <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider bg-slate-50 rounded-tr-lg text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {clients.map((client) => (
                  <tr key={client.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 text-sm font-bold text-slate-900">{client.systemName}</td>
                    <td className="py-3 px-4 text-xs text-slate-500 font-mono">{client.apiKey}</td>
                    <td className="py-3 px-4 text-xs text-blue-600 truncate max-w-xs">{client.webhookUrl}</td>
                    <td className="py-3 px-4 text-sm">
                      <span className={`inline-flex items-center gap-1.5 ${client.enabled ? 'text-green-600' : 'text-red-600'} font-medium`}>
                        <span className={`w-2 h-2 rounded-full ${client.enabled ? 'bg-green-500' : 'bg-red-500'}`}></span>
                        {client.enabled ? 'Active' : 'Suspended'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-right">
                      <button
                        onClick={() => handleToggleStatus(client.id)}
                        className={`px-3 py-1.5 rounded text-xs font-bold transition-colors border ${
                          client.enabled 
                          ? 'border-red-200 text-red-600 hover:bg-red-50' 
                          : 'border-green-200 text-green-600 hover:bg-green-50'
                        }`}
                      >
                        {client.enabled ? 'Suspend' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
                {clients.length === 0 && (
                  <tr>
                    <td colSpan="5" className="py-8 text-center text-sm text-slate-500">No external client systems registered yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

    </div>
  );
}