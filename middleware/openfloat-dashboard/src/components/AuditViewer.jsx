import { useState, useEffect } from 'react';

export default function AuditViewer({ token }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchAuditLogs = async () => {
    setLoading(true);
    setError('');
    try {
      const API_URL = import.meta.env.VITE_API_BASE_URL || 'https://openfloat.onrender.com';
      
      const response = await fetch(`${API_URL}/api/v1/audit-logs`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch live audit logs.');
      }

      const data = await response.json();

      // Map backend Spring Boot entity fields to frontend table columns
      const formattedData = data.map(log => ({
        id: log.eventId || log.id || 'N/A',
        timestamp: log.timestamp || 'Just now',
        actor: log.actor || 'SYSTEM',
        action: log.action || 'Unknown Action',
        target: log.targetComponent || log.target || 'N/A',
        status: log.status || 'UNKNOWN'
      }));

      setLogs(formattedData);
    } catch (err) {
      console.error('Audit Log connection error:', err.message);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchAuditLogs();
    }
  }, [token]);

  // Filter logs based on search term
  const filteredLogs = logs.filter(log => {
    const term = searchTerm.toLowerCase();
    return (
      (log.actor && log.actor.toLowerCase().includes(term)) ||
      (log.action && log.action.toLowerCase().includes(term)) ||
      (log.target && log.target.toLowerCase().includes(term)) ||
      (log.id && log.id.toLowerCase().includes(term))
    );
  });

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full">
      <div className="bg-slate-900 px-6 py-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 flex-shrink-0">
        <div>
          <h2 className="text-xl font-bold text-white tracking-wide">System Audit Logs</h2>
          <p className="text-slate-400 text-sm mt-1">Immutable SIEM Event Trail</p>
        </div>
        
        <div className="flex items-center gap-4 w-full md:w-auto">
          <input 
            type="text" 
            placeholder="Search events, users, IDs..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full md:w-64 px-4 py-2 bg-slate-800 border border-slate-700 text-white rounded text-sm outline-none focus:border-green-500 placeholder-slate-400 font-sans"
          />
          <div className="hidden md:block px-3 py-1.5 bg-slate-800 text-xs font-mono text-green-400 rounded border border-slate-700 whitespace-nowrap">
            SECURE MODE: READ-ONLY
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-4 border-b border-red-100 text-sm font-medium flex-shrink-0">
          Error: {error} - Please verify the backend endpoint is running.
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase tracking-wider sticky top-0">
              <th className="px-6 py-4 font-semibold">Timestamp</th>
              <th className="px-6 py-4 font-semibold">Event ID</th>
              <th className="px-6 py-4 font-semibold">Actor / Role</th>
              <th className="px-6 py-4 font-semibold">Action</th>
              <th className="px-6 py-4 font-semibold">Target Component</th>
              <th className="px-6 py-4 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm text-slate-700 font-mono">
            {loading ? (
              <tr>
                <td colSpan="6" className="px-6 py-12 text-center text-slate-500 font-sans">
                  <svg className="animate-spin h-6 w-6 text-slate-400 mx-auto mb-3" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  Retrieving secure logs...
                </td>
              </tr>
            ) : filteredLogs.length === 0 && !error ? (
              <tr>
                <td colSpan="6" className="px-6 py-12 text-center text-slate-500 font-sans">
                  {searchTerm ? 'No matching audit logs found for your search.' : 'No audit logs found in the database.'}
                </td>
              </tr>
            ) : (
              filteredLogs.map((log, index) => (
                <tr key={log.id || index} className="hover:bg-slate-50 transition-colors text-xs">
                  <td className="px-6 py-3 whitespace-nowrap text-slate-500">{log.timestamp}</td>
                  <td className="px-6 py-3">{log.id}</td>
                  <td className="px-6 py-3 font-semibold text-slate-900">{log.actor}</td>
                  <td className="px-6 py-3">{log.action}</td>
                  <td className="px-6 py-3 text-slate-500">{log.target}</td>
                  <td className="px-6 py-3">
                    <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase font-sans
                      ${log.status === 'SUCCESS' ? 'bg-green-100 text-green-800' : ''}
                      ${log.status === 'DENIED' || log.status === 'FAILED' ? 'bg-red-100 text-red-800' : ''}
                      ${log.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' : ''}
                    `}>
                      {log.status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}