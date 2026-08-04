import React, { useState, useEffect } from 'react';
import fetchWithAuth from './api'; // Adjust this path if necessary based on your folder structure

export default function ClientManagement() {
  // --- TAB STATE ---
  const [activeTab, setActiveTab] = useState('systems');

  // --- CLIENT MANAGEMENT STATE ---
  const [clients, setClients] = useState([]);
  const [loadingClients, setLoadingClients] = useState(true);
  const [systemName, setSystemName] = useState('');
  const [webhookUrl, setWebhookUrl] = useState('');
  const [rateLimit, setRateLimit] = useState(60);
  const [statusMessage, setStatusMessage] = useState({ type: '', text: '' });
  const [newCredentials, setNewCredentials] = useState(null);

  // --- WEBHOOK LOGS STATE ---
  const [webhookLogs, setWebhookLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(true);
  const [expandedLogId, setExpandedLogId] = useState(null);
  const [resendingId, setResendingId] = useState(null);

  // --- FETCH CLIENTS ---
  const fetchClients = async () => {
    setLoadingClients(true);
    try {
      const token = localStorage.getItem('token');
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://openfloat.onrender.com';

      // SWAPPED: fetch -> fetchWithAuth
      const response = await fetchWithAuth(`${API_BASE_URL}/api/v1/clients`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setClients(data);
      }
    } catch (error) {
      console.error('Error fetching clients:', error);
    } finally {
      setLoadingClients(false);
    }
  };

  // --- FETCH WEBHOOK LOGS ---
  const fetchWebhookLogs = async () => {
    setLoadingLogs(true);
    try {
      const token = localStorage.getItem('token');
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://openfloat.onrender.com';
      
      // SWAPPED: fetch -> fetchWithAuth
      const response = await fetchWithAuth(`${API_BASE_URL}/api/v1/webhooks/logs`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setWebhookLogs(data);
      }
    } catch (error) {
      console.error("Failed to fetch webhook logs", error);
    } finally {
      setLoadingLogs(false);
    }
  };

  // Fetch data based on active tab
  useEffect(() => {
    if (activeTab === 'systems') {
      fetchClients();
    } else if (activeTab === 'logs') {
      fetchWebhookLogs();
    }
  }, [activeTab]);

  // --- CLIENT REGISTRATION LOGIC ---
  const handleRegisterClient = async (e) => {
    e.preventDefault();
    setStatusMessage({ type: 'loading', text: 'Registering system...' });
    setNewCredentials(null);

    try {
      const token = localStorage.getItem('token');
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://openfloat.onrender.com';

      // SWAPPED: fetch -> fetchWithAuth
      const response = await fetchWithAuth(`${API_BASE_URL}/api/v1/clients/register`, {
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
      
      setNewCredentials({
        systemName: data.systemName,
        apiKey: data.apiKey,
        clientSecret: data.clientSecret
      });

      setSystemName('');
      setWebhookUrl('');
      setRateLimit(60);
      fetchClients();

    } catch (error) {
      setStatusMessage({ type: 'error', text: error.message });
    }
  };

  const handleToggleStatus = async (clientId) => {
    try {
      const token = localStorage.getItem('token');
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://openfloat.onrender.com';

      // SWAPPED: fetch -> fetchWithAuth
      const response = await fetchWithAuth(`${API_BASE_URL}/api/v1/clients/${clientId}/toggle-status`, {
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

  // --- WEBHOOK RESEND LOGIC ---
  const handleResendWebhook = async (logId) => {
    setResendingId(logId);
    try {
      const token = localStorage.getItem('token');
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://openfloat.onrender.com';
      
      // SWAPPED: fetch -> fetchWithAuth
      const response = await fetchWithAuth(`${API_BASE_URL}/api/v1/webhooks/${logId}/resend`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const result = await response.json();
      alert(`Resend executed. Status: ${result.status}`);
      fetchWebhookLogs(); 
    } catch (error) {
      alert("Failed to trigger resend.");
    } finally {
      setResendingId(null);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard.');
  };

  return (
    <div className="flex flex-col h-full space-y-6">
      
      {/* GLOBAL HEADER & TABS */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden shrink-0">
        <div className="bg-slate-900 px-6 py-5">
          <h2 className="text-xl font-bold text-white tracking-wide">API Gateway</h2>
          <p className="text-slate-400 text-sm mt-1">Manage client credentials and monitor integration health</p>
        </div>
        <div className="flex border-b border-slate-200 px-6 bg-slate-50">
          <button 
            onClick={() => setActiveTab('systems')} 
            className={`py-3 px-4 text-sm font-bold border-b-2 transition-colors ${activeTab === 'systems' ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
            Client Systems
          </button>
          <button 
            onClick={() => setActiveTab('logs')} 
            className={`py-3 px-4 text-sm font-bold border-b-2 transition-colors ${activeTab === 'logs' ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
            Webhook Delivery Logs
          </button>
        </div>
      </div>

      {/* TAB 1: CLIENT SYSTEMS */}
      {activeTab === 'systems' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          
          {/* Registration Card */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
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
              {loadingClients ? (
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
      )}

      {/* TAB 2: WEBHOOK LOGS */}
      {activeTab === 'logs' && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full animate-in fade-in duration-300 p-6 sm:p-8">
          <div className="flex justify-between items-center mb-5 border-b pb-2">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Callback Transmissions</h3>
            <button 
              onClick={fetchWebhookLogs} 
              className="bg-slate-100 text-slate-700 px-3 py-1.5 rounded text-xs font-bold border border-slate-200 hover:bg-slate-200 transition-colors"
            >
              Refresh Logs
            </button>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            {loadingLogs ? (
              <p className="text-sm text-slate-500 p-6 text-center">Loading webhook logs...</p>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-200 text-slate-600 text-xs uppercase tracking-wider">
                    <th className="px-6 py-4 font-semibold">Attempted At</th>
                    <th className="px-6 py-4 font-semibold">Client System</th>
                    <th className="px-6 py-4 font-semibold">Target URL</th>
                    <th className="px-6 py-4 font-semibold text-center">HTTP Code</th>
                    <th className="px-6 py-4 font-semibold text-center">Retries</th>
                    <th className="px-6 py-4 font-semibold text-center">Status</th>
                    <th className="px-6 py-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {webhookLogs.map((log) => (
                    <React.Fragment key={log.id}>
                      <tr className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-slate-600">
                          {new Date(log.attemptedAt).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 font-bold text-slate-800">
                          {log.clientSystemName}
                          <div className="text-xs text-slate-400 font-normal font-mono mt-0.5">{log.referenceCode}</div>
                        </td>
                        <td className="px-6 py-4 font-mono text-xs text-slate-800 max-w-[200px] truncate" title={log.targetUrl}>
                          {log.targetUrl}
                        </td>
                        <td className="px-6 py-4 text-center font-mono font-bold">
                          <span className={log.httpResponseCode >= 200 && log.httpResponseCode < 300 ? 'text-green-600' : 'text-red-500'}>
                            {log.httpResponseCode || 'N/A'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center font-semibold text-slate-700">
                          {log.retryCount}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`px-2 py-1 rounded text-xs font-bold ${
                            log.successful ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {log.successful ? 'SUCCESS' : 'FAILED'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right space-x-2 whitespace-nowrap">
                          <button 
                            onClick={() => setExpandedLogId(expandedLogId === log.id ? null : log.id)}
                            className="px-3 py-1 bg-white border border-slate-300 rounded text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                          >
                            {expandedLogId === log.id ? 'Close' : 'View Data'}
                          </button>
                          {!log.successful && (
                            <button 
                              onClick={() => handleResendWebhook(log.id)}
                              disabled={resendingId === log.id}
                              className="px-3 py-1 bg-blue-50 border border-blue-200 text-blue-700 rounded text-xs font-bold hover:bg-blue-100 disabled:opacity-50 transition-colors"
                            >
                              {resendingId === log.id ? 'Sending...' : 'Resend'}
                            </button>
                          )}
                        </td>
                      </tr>

                      {expandedLogId === log.id && (
                        <tr className="bg-slate-50 border-b border-slate-200">
                          <td colSpan="7" className="px-6 py-4">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                              <div>
                                <p className="text-xs font-bold text-slate-500 uppercase mb-2">Request Payload Sent</p>
                                <pre className="bg-slate-900 text-green-400 p-4 rounded-lg text-xs overflow-x-auto max-h-60 shadow-inner">
                                  {log.payloadSent ? JSON.stringify(JSON.parse(log.payloadSent), null, 2) : 'No payload recorded'}
                                </pre>
                              </div>
                              <div>
                                <div className="flex justify-between items-center mb-2">
                                  <p className="text-xs font-bold text-slate-500 uppercase">Response Message</p>
                                  {log.responseTimeMs && (
                                    <span className="text-xs font-mono text-slate-400 border border-slate-200 px-2 py-0.5 rounded bg-white">
                                      {log.responseTimeMs}ms
                                    </span>
                                  )}
                                </div>
                                <pre className="bg-slate-900 text-blue-400 p-4 rounded-lg text-xs overflow-x-auto max-h-60 shadow-inner">
                                  {log.responseMessage || 'No response recorded'}
                                </pre>
                                {log.lastRetryTime && (
                                  <p className="text-xs text-slate-500 mt-3 flex items-center gap-1">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                    <strong>Last Retried:</strong> {new Date(log.lastRetryTime).toLocaleString()}
                                  </p>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                  {webhookLogs.length === 0 && (
                    <tr>
                      <td colSpan="7" className="px-6 py-12 text-center text-slate-500">
                        <div className="flex flex-col items-center">
                          <svg className="w-12 h-12 mb-3 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                          <p>No webhook delivery logs found.</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

    </div>
  );
}