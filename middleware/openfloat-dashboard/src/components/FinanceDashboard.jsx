import { useState, useEffect, useMemo } from 'react';

export default function FinanceDashboard({ token }) {
  // View state
  const [activeTab, setActiveTab] = useState('transactions'); // 'transactions' or 'reports'
  const [showFilters, setShowFilters] = useState(false);

  // Data state
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filter state
  const [filters, setFilters] = useState({
    date: '',
    clientSystem: '',
    amount: '',
    phone: '',
    status: '',
    provider: '',
    reference: ''
  });

  // --- TIME PRESET HELPERS ---
  const applyTimePreset = (days) => {
    const d = new Date();
    if (days > 0) d.setDate(d.getDate() - days);
    const dateString = d.toISOString().split('T')[0];
    
    const newFilters = { ...filters, date: dateString };
    setFilters(newFilters);
    fetchTransactions(newFilters);
  };

  const clearFilters = () => {
    const emptyFilters = { date: '', clientSystem: '', amount: '', phone: '', status: '', provider: '', reference: '' };
    setFilters(emptyFilters);
    fetchTransactions(emptyFilters);
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleApplyFilters = (e) => {
    e.preventDefault();
    fetchTransactions(filters);
  };

  // --- DATA FETCHING ---
  const fetchTransactions = async (activeFilters = null) => {
    setLoading(true);
    setError('');
    
    try {
      const API_URL = import.meta.env.VITE_API_BASE_URL || 'https://openfloat.onrender.com';
      const params = new URLSearchParams();

      if (activeFilters) {
        if (activeFilters.date) params.append('date', activeFilters.date);
        if (activeFilters.clientSystem) params.append('clientSystem', activeFilters.clientSystem);
        if (activeFilters.amount) params.append('amount', activeFilters.amount);
        if (activeFilters.phone) params.append('phone', activeFilters.phone);
        if (activeFilters.status) params.append('status', activeFilters.status);
        if (activeFilters.provider) params.append('provider', activeFilters.provider);
        if (activeFilters.reference) params.append('reference', activeFilters.reference);
      }

      const queryString = params.toString();
      const endpoint = queryString 
        ? `${API_URL}/api/v1/transactions/filter?${queryString}` 
        : `${API_URL}/api/v1/payments`;
      
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) throw new Error(`Server returned ${response.status}. Failed to fetch data.`);
      
      const data = await response.json();
      
      const formattedData = data.map(tx => ({
        id: tx.id || tx.transactionId || 'N/A',
        mpesaRef: tx.mpesaRef || tx.receiptNumber || tx.receipt || 'PENDING',
        phone: tx.phone || tx.msisdn || tx.phoneNumber || 'N/A',
        amount: tx.amount || tx.totalAmount || 0,
        type: tx.type || tx.transactionType || 'STK Push',
        status: tx.status || 'PENDING',
        date: tx.date || tx.createdAt || tx.timestamp || 'Just now',
        clientSystem: tx.clientSystem || tx.clientSystemName || 'API Gateway'
      }));
      
      formattedData.sort((a, b) => new Date(b.date) - new Date(a.date));
      setTransactions(formattedData);
    } catch (err) {
      console.error('Database connection error:', err.message);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchTransactions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);


  // --- ANALYTICS ENGINE (Calculates automatically when transactions change) ---
  const report = useMemo(() => {
    let totalRevenue = 0;
    let successCount = 0;
    let failedCount = 0;
    const systems = {};

    transactions.forEach(tx => {
      const isSuccess = ['SUCCESS', 'PAID', 'COMPLETED'].includes(tx.status);
      const isFail = tx.status === 'FAILED';
      const sys = tx.clientSystem;

      // Initialize system in the map if it doesn't exist
      if (!systems[sys]) {
        systems[sys] = { name: sys, total: 0, revenue: 0, success: 0, failed: 0 };
      }

      systems[sys].total++;

      if (isSuccess) {
        successCount++;
        totalRevenue += Number(tx.amount);
        systems[sys].success++;
        systems[sys].revenue += Number(tx.amount);
      } else if (isFail) {
        failedCount++;
        systems[sys].failed++;
      }
    });

    const totalCount = transactions.length;
    const successRate = totalCount > 0 ? ((successCount / totalCount) * 100).toFixed(1) : 0;

    return {
      totalRevenue,
      successCount,
      failedCount,
      totalCount,
      successRate,
      systemBreakdown: Object.values(systems).sort((a, b) => b.revenue - a.revenue) // Sort systems by revenue
    };
  }, [transactions]);


  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      
      {/* Header Section */}
      <div className="bg-slate-900 px-6 py-5 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-white tracking-wide">Reconciliation Engine</h2>
          <p className="text-slate-400 text-sm mt-1">Live M-Pesa Callback Logs & Analytics</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-2 rounded border text-sm font-medium transition-colors ${showFilters ? 'bg-green-600 text-white border-green-600 hover:bg-green-700' : 'bg-slate-800 text-white border-slate-700 hover:bg-slate-700'}`}
          >
            {showFilters ? 'Hide Filters' : 'Filter Records'}
          </button>
          <button className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded border border-slate-700 text-sm font-medium transition-colors">
            Export CSV
          </button>
        </div>
      </div>

      {/* Filter Drawer Section */}
      {showFilters && (
        <div className="bg-slate-50 p-5 border-b border-slate-200 animate-in fade-in slide-in-from-top-2 duration-200">
          
          {/* Quick Time Presets */}
          <div className="mb-4 flex gap-2">
            <span className="text-xs font-bold text-slate-500 uppercase flex items-center mr-2">Quick Summaries:</span>
            <button onClick={() => applyTimePreset(0)} className="px-3 py-1 bg-white border border-slate-300 rounded text-xs font-semibold text-slate-700 hover:border-green-500 hover:text-green-600 transition-colors">Daily (Today)</button>
            <button onClick={() => applyTimePreset(7)} className="px-3 py-1 bg-white border border-slate-300 rounded text-xs font-semibold text-slate-700 hover:border-green-500 hover:text-green-600 transition-colors">Weekly</button>
            <button onClick={() => applyTimePreset(30)} className="px-3 py-1 bg-white border border-slate-300 rounded text-xs font-semibold text-slate-700 hover:border-green-500 hover:text-green-600 transition-colors">Monthly</button>
          </div>

          <form onSubmit={handleApplyFilters}>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Specific Date</label>
                <input type="date" name="date" value={filters.date} onChange={handleFilterChange} className="w-full px-3 py-2 bg-white border border-slate-200 rounded text-sm focus:ring-2 focus:ring-green-500 outline-none transition-colors" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Account Reference</label>
                <input type="text" name="reference" placeholder="e.g. INV-1234" value={filters.reference} onChange={handleFilterChange} className="w-full px-3 py-2 bg-white border border-slate-200 rounded text-sm focus:ring-2 focus:ring-green-500 outline-none transition-colors" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
                <input type="text" name="phone" placeholder="2547..." value={filters.phone} onChange={handleFilterChange} className="w-full px-3 py-2 bg-white border border-slate-200 rounded text-sm focus:ring-2 focus:ring-green-500 outline-none transition-colors" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
                <select name="status" value={filters.status} onChange={handleFilterChange} className="w-full px-3 py-2 bg-white border border-slate-200 rounded text-sm focus:ring-2 focus:ring-green-500 outline-none transition-colors">
                  <option value="">All Statuses</option>
                  <option value="SUCCESS">Success / Paid</option>
                  <option value="PENDING">Pending</option>
                  <option value="FAILED">Failed</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Client System</label>
                <input type="text" name="clientSystem" placeholder="e.g. ERP, POS" value={filters.clientSystem} onChange={handleFilterChange} className="w-full px-3 py-2 bg-white border border-slate-200 rounded text-sm focus:ring-2 focus:ring-green-500 outline-none transition-colors" />
              </div>
            </div>
            
            <div className="mt-5 flex justify-end gap-3">
              <button type="button" onClick={clearFilters} className="px-4 py-2 text-sm font-bold text-slate-600 bg-white border border-slate-300 rounded hover:bg-slate-100 transition-colors">Clear All</button>
              <button type="submit" disabled={loading} className="px-5 py-2 text-sm font-bold text-white bg-green-600 rounded hover:bg-green-700 transition-colors disabled:opacity-70 flex items-center gap-2">
                {loading ? 'Searching...' : 'Apply Filters'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-slate-200 px-6">
        <button 
          onClick={() => setActiveTab('transactions')}
          className={`py-3 px-4 text-sm font-bold border-b-2 transition-colors ${activeTab === 'transactions' ? 'border-green-600 text-green-700' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
        >
          Transaction Grid
        </button>
        <button 
          onClick={() => setActiveTab('reports')}
          className={`py-3 px-4 text-sm font-bold border-b-2 transition-colors ${activeTab === 'reports' ? 'border-green-600 text-green-700' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
        >
          System Payment Summary
        </button>
      </div>

      {error && <div className="bg-red-50 text-red-700 p-4 border-b border-red-100 text-sm font-medium">Error: {error}</div>}

      {/* TAB CONTENT: System Payment Summary */}
      {activeTab === 'reports' && (
        <div className="p-6 bg-slate-50 min-h-[400px]">
          
          {/* Top Level KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm border-l-4 border-l-green-500">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Total Revenue</p>
              <h3 className="text-2xl font-black text-slate-800">KES {report.totalRevenue.toLocaleString()}</h3>
            </div>
            <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm border-l-4 border-l-blue-500">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Callback Success Rate</p>
              <h3 className="text-2xl font-black text-slate-800">{report.successRate}%</h3>
            </div>
            <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm border-l-4 border-l-emerald-500">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Successful Payments</p>
              <h3 className="text-2xl font-black text-slate-800">{report.successCount} <span className="text-sm font-medium text-slate-400">/ {report.totalCount}</span></h3>
            </div>
            <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm border-l-4 border-l-red-500">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Failed Payments</p>
              <h3 className="text-2xl font-black text-slate-800">{report.failedCount}</h3>
            </div>
          </div>

          {/* Client System Breakdown Table */}
          <h3 className="text-lg font-bold text-slate-800 mb-4">Revenue by Client System</h3>
          <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-600 text-xs uppercase tracking-wider border-b border-slate-200">
                  <th className="px-6 py-3 font-semibold">Client System</th>
                  <th className="px-6 py-3 font-semibold">Total Revenue</th>
                  <th className="px-6 py-3 font-semibold text-center">Total Txns</th>
                  <th className="px-6 py-3 font-semibold text-center text-green-600">Success</th>
                  <th className="px-6 py-3 font-semibold text-center text-red-500">Failed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {report.systemBreakdown.length === 0 ? (
                  <tr><td colSpan="5" className="px-6 py-8 text-center text-slate-500">No system data available for these filters.</td></tr>
                ) : (
                  report.systemBreakdown.map((sys, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="px-6 py-4 font-bold text-slate-800">{sys.name}</td>
                      <td className="px-6 py-4 font-semibold text-green-700">KES {sys.revenue.toLocaleString()}</td>
                      <td className="px-6 py-4 font-medium text-slate-600 text-center">{sys.total}</td>
                      <td className="px-6 py-4 font-medium text-green-600 text-center">{sys.success}</td>
                      <td className="px-6 py-4 font-medium text-red-500 text-center">{sys.failed}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB CONTENT: Transaction Grid */}
      {activeTab === 'transactions' && (
        <div className="overflow-x-auto min-h-[400px]">
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
                    Fetching records...
                  </td>
                </tr>
              ) : transactions.length === 0 && !error ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-slate-500">
                    No transactions match the selected filters.
                  </td>
                </tr>
              ) : (
                transactions.map((tx, index) => (
                  <tr key={tx.id || index} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">{tx.date}</td>
                    <td className="px-6 py-4 font-mono text-xs font-bold text-slate-600">{tx.clientSystem} <span className="text-[10px] font-normal text-slate-400 block">{tx.id}</span></td>
                    <td className="px-6 py-4 font-mono font-medium text-slate-900">{tx.mpesaRef}</td>
                    <td className="px-6 py-4">{tx.phone}</td>
                    <td className="px-6 py-4">{tx.type}</td>
                    <td className="px-6 py-4 font-semibold">KES {tx.amount.toLocaleString()}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold
                        ${tx.status === 'PAID' || tx.status === 'SUCCESS' || tx.status === 'COMPLETED' ? 'bg-green-100 text-green-800' : ''}
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
      )}
    </div>
  );
}