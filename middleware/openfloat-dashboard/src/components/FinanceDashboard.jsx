import { useState, useEffect } from 'react';

export default function FinanceDashboard() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // useEffect runs the moment this component is rendered on the screen
  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const API_URL = import.meta.env.VITE_API_BASE_URL || 'https://openfloat.onrender.com';
        
        // Attempt to fetch live data from your Spring Boot backend
        const response = await fetch(`${API_URL}/api/v1/transactions`);
        
        if (response.ok) {
          const data = await response.json();
          setTransactions(data);
        } else {
          throw new Error('Backend not returning data yet');
        }
      } catch (err) {
        console.warn('Using mock data until backend endpoint is live:', err.message);
        
        // Fallback mock data to visualize the reconciliation grid
        setTransactions([
          { id: 'TRX-9982', mpesaRef: 'QWE89ASDF', phone: '254705425117', amount: 5000, type: 'C2B Paybill', status: 'PAID', date: '2026-07-16 08:14' },
          { id: 'TRX-9981', mpesaRef: 'QWE89ASDG', phone: '254722000000', amount: 1500, type: 'STK Push', status: 'PENDING', date: '2026-07-16 08:10' },
          { id: 'TRX-9980', mpesaRef: 'QWE89ASDH', phone: '254711111111', amount: 250, type: 'B2C Salary', status: 'FAILED', date: '2026-07-16 07:45' },
          { id: 'TRX-9979', mpesaRef: 'QWE89ASDJ', phone: '254733333333', amount: 10000, type: 'C2B Paybill', status: 'PAID', date: '2026-07-15 16:30' },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, []); // The empty array ensures this only runs once when the tab is clicked

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
                  Loading transactions...
                </td>
              </tr>
            ) : transactions.length === 0 ? (
              <tr>
                <td colSpan="7" className="px-6 py-12 text-center text-slate-500">
                  No transactions found in the database.
                </td>
              </tr>
            ) : (
              transactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">{tx.date}</td>
                  <td className="px-6 py-4 font-mono text-xs text-slate-500">{tx.id}</td>
                  <td className="px-6 py-4 font-mono font-medium text-slate-900">{tx.mpesaRef}</td>
                  <td className="px-6 py-4">{tx.phone}</td>
                  <td className="px-6 py-4">{tx.type}</td>
                  <td className="px-6 py-4 font-semibold">KES {tx.amount.toLocaleString()}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold
                      ${tx.status === 'PAID' ? 'bg-green-100 text-green-800' : ''}
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