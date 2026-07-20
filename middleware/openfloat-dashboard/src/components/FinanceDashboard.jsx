import { useState, useEffect } from 'react';

// Accept the JWT token as a prop to bypass Spring Security
export default function FinanceDashboard({ token }) {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const API_URL = import.meta.env.VITE_API_BASE_URL || 'https://openfloat.onrender.com';
        
        // Include the Authorization Bearer token in the headers
        const response = await fetch(`${API_URL}/api/v1/transactions`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch live database transactions.');
        }
        
        const data = await response.json();
        
        // Map backend Spring Boot entity fields to frontend table columns
        const formattedData = data.map(tx => ({
          id: tx.invoiceRef || tx.id || 'N/A',
          mpesaRef: tx.receiptNumber || 'PENDING',
          phone: tx.msisdn || 'N/A',
          amount: tx.amount || 0,
          type: tx.type || 'STK Push',
          status: tx.status || 'PENDING',
          // Ensure the date is formatted nicely
          date: tx.createdAt ? new Date(tx.createdAt).toLocaleString() : 'Just now'
        }));

        // Sort by newest transactions first
        formattedData.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        setTransactions(formattedData);
      } catch (err) {
        console.error('Database connection error:', err.message);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchTransactions();
    }
  }, [token]);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      
      {/* Header Section */}
      <div className="bg-slate-900 px-6 py-5 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-white tracking-wide">Reconciliation Engine</h2>
          <p className="text-slate-400 text-sm mt-1">Live M-Pesa Callback Logs</p>
        </div>
        <button className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded border border-slate-700 text-sm font-medium transition-colors">
          Export CSV
        </button>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-red-50 text-red-700 p-4 border-b border-red-100 text-sm font-medium">
          Error: {error} - Please verify the backend endpoint is running.
        </div>
      )}

      {/* Data Grid Section */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase tracking-wider">
              <th className="px-6 py-4 font-semibold">Date / Time</th>
              <th className="px-6 py-4 font-semibold">System ID</th>
              <th className="px-6 py-4 font-semibold">M-Pesa Ref</th>
              <th className="px-6 py-4 font-semibold">MSISDN</th>
              <th className="px-6 py-4 font-semibold">Type</th>
              <th className="px-6 py-4 font-semibold">Amount</th>
              <th className="px-6 py-4 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
            {loading ? (
              <tr>
                <td colSpan="7" className="px-6 py-12 text-center text-slate-500">
                  <svg className="animate-spin h-6 w-6 text-slate-400 mx-auto mb-3" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  Syncing with database...
                </td>
              </tr>
            ) : transactions.length === 0 && !error ? (
              <tr>
                <td colSpan="7" className="px-6 py-12 text-center text-slate-500">
                  No live transactions found in the database.
                </td>
              </tr>
            ) : (
              transactions.map((tx, index) => (
                <tr key={tx.id || index} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">{tx.date}</td>
                  <td className="px-6 py-4 font-mono text-xs text-slate-500">{tx.id}</td>
                  <td className="px-6 py-4 font-mono font-medium text-slate-900">{tx.mpesaRef}</td>
                  <td className="px-6 py-4">{tx.phone}</td>
                  <td className="px-6 py-4">{tx.type}</td>
                  <td className="px-6 py-4 font-semibold">KES {tx.amount.toLocaleString()}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold
                      ${tx.status === 'PAID' || tx.status === 'SUCCESS' ? 'bg-green-100 text-green-800' : ''}
                      ${tx.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' : ''}
                      ${tx.status === 'FAILED' ? 'bg-red-100 text-red-800' : ''}
                    `}>
                      {tx.status}
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