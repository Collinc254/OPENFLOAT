import { useState, useEffect } from 'react';

export default function AuditViewer() {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    // Mocking immutable audit logs fetched from SIEM/Database
    setLogs([
      { id: 'EVT-001', timestamp: '2026-07-16 08:30:12', actor: 'SYSTEM', action: 'OAuth Token Generated', target: 'Gateway', status: 'SUCCESS' },
      { id: 'EVT-002', timestamp: '2026-07-16 08:15:05', actor: 'collins (Admin)', action: 'Viewed Reversals', target: 'Finance Module', status: 'SUCCESS' },
      { id: 'EVT-003', timestamp: '2026-07-16 08:14:22', actor: 'SYSTEM', action: 'C2B Callback Received', target: 'Webhook Handler', status: 'SUCCESS' },
      { id: 'EVT-004', timestamp: '2026-07-16 07:55:10', actor: 'jdoe (Operator)', action: 'Initiated STK Push', target: 'M-Pesa API', status: 'SUCCESS' },
      { id: 'EVT-005', timestamp: '2026-07-16 07:10:01', actor: 'UNKNOWN', action: 'Failed Login Attempt', target: 'Auth Service', status: 'DENIED' },
    ]);
  }, []);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="bg-slate-900 px-6 py-5 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-white tracking-wide">System Audit Logs</h2>
          <p className="text-slate-400 text-sm mt-1">Immutable SIEM Event Trail</p>
        </div>
        <div className="px-3 py-1 bg-slate-800 text-xs font-mono text-green-400 rounded border border-slate-700">
          SECURE MODE: READ-ONLY
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase tracking-wider">
              <th className="px-6 py-4 font-semibold">Timestamp</th>
              <th className="px-6 py-4 font-semibold">Event ID</th>
              <th className="px-6 py-4 font-semibold">Actor / Role</th>
              <th className="px-6 py-4 font-semibold">Action</th>
              <th className="px-6 py-4 font-semibold">Target Component</th>
              <th className="px-6 py-4 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm text-slate-700 font-mono">
            {logs.map((log) => (
              <tr key={log.id} className="hover:bg-slate-50 transition-colors text-xs">
                <td className="px-6 py-3 whitespace-nowrap text-slate-500">{log.timestamp}</td>
                <td className="px-6 py-3">{log.id}</td>
                <td className="px-6 py-3 font-semibold text-slate-900">{log.actor}</td>
                <td className="px-6 py-3">{log.action}</td>
                <td className="px-6 py-3 text-slate-500">{log.target}</td>
                <td className="px-6 py-3">
                  <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase
                    ${log.status === 'SUCCESS' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}
                  `}>
                    {log.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}