import { useState, useEffect, useMemo, useRef } from 'react';

export default function FinanceDashboard({ token }) {
  // View state
  const [activeTab, setActiveTab] = useState('transactions'); 
  const [showFilters, setShowFilters] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);

  // Resolution Modal State (Feature 7)
  const [resolvingTx, setResolvingTx] = useState(null);
  const [resolveNote, setResolveNote] = useState('');
  const [resolveSystem, setResolveSystem] = useState('');

  // 3-Way Audit State (Feature 8)
  const [auditFile, setAuditFile] = useState(null);
  const [auditResults, setAuditResults] = useState(null);
  const [auditLoading, setAuditLoading] = useState(false);
  const fileInputRef = useRef(null);

  // Data state
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filter state
  const [filters, setFilters] = useState({
    date: '', clientSystem: '', amount: '', phone: '', status: '', provider: '', reference: ''
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
        Object.keys(activeFilters).forEach(key => {
          if (activeFilters[key]) params.append(key, activeFilters[key]);
        });
      }

      const queryString = params.toString();
      const endpoint = queryString 
        ? `${API_URL}/api/v1/transactions/filter?${queryString}` 
        : `${API_URL}/api/v1/payments`;
      
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
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
        clientSystem: tx.clientSystem || tx.clientSystemName || 'API Gateway',
        reconciliationStatus: tx.reconciliationStatus || ((tx.clientSystem === 'UNKNOWN' || !tx.clientSystem) ? 'UNMATCHED' : 'MATCHED')
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


  // --- FEATURE 7: MANUAL RESOLUTION API ---
  const handleSubmitResolution = async () => {
    if (!resolveSystem || !resolveNote) {
      alert("Please select a target system and provide a reconciliation note.");
      return;
    }

    try {
      const API_URL = import.meta.env.VITE_API_BASE_URL || 'https://openfloat.onrender.com';
      const response = await fetch(`${API_URL}/api/v1/payments/resolve`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          id: resolvingTx.id,
          system: resolveSystem,
          note: resolveNote
        })
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(errText || "Failed to resolve transaction.");
      }
      
      // Close modal, clear state, and refresh grid
      setResolvingTx(null);
      setResolveSystem('');
      setResolveNote('');
      fetchTransactions(filters); 
      
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  // --- FEATURE 8: 3-WAY AUDIT API ---
  const handleRunAudit = async () => {
    if (!auditFile) {
      alert("Please upload a Safaricom Provider CSV first.");
      return;
    }

    setAuditLoading(true);
    setAuditResults(null);

    try {
      const API_URL = import.meta.env.VITE_API_BASE_URL || 'https://openfloat.onrender.com';
      
      const formData = new FormData();
      formData.append('providerFile', auditFile);

      const response = await fetch(`${API_URL}/api/v1/reconciliation/audit`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
          // Fetch automatically sets the correct multipart boundary
        },
        body: formData
      });

      if (!response.ok) throw new Error("Audit Engine failed to process the file.");
      
      const reportData = await response.json();
      setAuditResults(reportData);
      
    } catch (err) {
      alert(`Audit Error: ${err.message}`);
    } finally {
      setAuditLoading(false);
    }
  };


  // --- CSV EXPORT ENGINE ---
  const downloadCSV = (exportType) => {
    let dataToExport = transactions;
    if (exportType === 'FAILED') dataToExport = transactions.filter(tx => tx.status === 'FAILED');
    if (exportType === 'PENDING') dataToExport = transactions.filter(tx => tx.status === 'PENDING');
    if (exportType === 'SUCCESS') dataToExport = transactions.filter(tx => ['SUCCESS', 'PAID', 'COMPLETED'].includes(tx.status));
    if (exportType === 'UNMATCHED') dataToExport = transactions.filter(tx => tx.reconciliationStatus === 'UNMATCHED');

    if (dataToExport.length === 0) {
      alert(`No records found for export type: ${exportType}`);
      return;
    }

    const headers = ['Date', 'System ID', 'M-Pesa Ref', 'Phone', 'Amount', 'Status', 'Reconciliation Status'];
    const csvRows = [headers.join(',')];

    dataToExport.forEach(tx => {
      const row = [tx.date, tx.id, tx.mpesaRef, tx.phone, tx.amount, tx.status, tx.reconciliationStatus];
      csvRows.push(row.join(','));
    });

    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', `openfloat_${exportType.toLowerCase()}_report.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setShowExportMenu(false);
  };

  // --- ANALYTICS ENGINE ---
  const report = useMemo(() => {
    let totalRevenue = 0; let successCount = 0; let failedCount = 0;
    const systems = {};

    transactions.forEach(tx => {
      const isSuccess = ['SUCCESS', 'PAID', 'COMPLETED'].includes(tx.status);
      const sys = tx.clientSystem;

      if (!systems[sys]) systems[sys] = { name: sys, total: 0, revenue: 0, success: 0, failed: 0 };
      systems[sys].total++;

      if (isSuccess) {
        successCount++; totalRevenue += Number(tx.amount);
        systems[sys].success++; systems[sys].revenue += Number(tx.amount);
      } else if (tx.status === 'FAILED') {
        failedCount++; systems[sys].failed++;
      }
    });

    return {
      totalRevenue, successCount, failedCount, totalCount: transactions.length,
      successRate: transactions.length > 0 ? ((successCount / transactions.length) * 100).toFixed(1) : 0,
      systemBreakdown: Object.values(systems).sort((a, b) => b.revenue - a.revenue)
    };
  }, [transactions]);

  const unmatchedTransactions = transactions.filter(tx => tx.reconciliationStatus === 'UNMATCHED');

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full">
      
      {/* Header Section */}
      <div className="bg-slate-900 px-6 py-5 flex justify-between items-center relative flex-shrink-0">
        <div>
          <h2 className="text-xl font-bold text-white tracking-wide">Reconciliation Engine</h2>
          <p className="text-slate-400 text-sm mt-1">Live Logs, Exceptions & 3-Way Audit</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setShowFilters(!showFilters)} className={`px-4 py-2 rounded border text-sm font-medium transition-colors ${showFilters ? 'bg-green-600 text-white border-green-600' : 'bg-slate-800 text-white border-slate-700'}`}>
            {showFilters ? 'Hide Filters' : 'Filter Records'}
          </button>
          
          <div className="relative">
            <button onClick={() => setShowExportMenu(!showExportMenu)} className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded border border-slate-700 text-sm font-medium transition-colors flex items-center gap-2">
              Export CSV ▼
            </button>
            {showExportMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-slate-200 z-50 py-1">
                <button onClick={() => downloadCSV('ALL')} className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100">Export All Records</button>
                <button onClick={() => downloadCSV('SUCCESS')} className="w-full text-left px-4 py-2 text-sm text-green-700 hover:bg-slate-100">Export Successful</button>
                <button onClick={() => downloadCSV('FAILED')} className="w-full text-left px-4 py-2 text-sm text-red-700 hover:bg-slate-100">Export Failed</button>
                <button onClick={() => downloadCSV('PENDING')} className="w-full text-left px-4 py-2 text-sm text-yellow-700 hover:bg-slate-100">Export Pending</button>
                <button onClick={() => downloadCSV('UNMATCHED')} className="w-full text-left px-4 py-2 text-sm text-purple-700 hover:bg-slate-100">Export Exceptions</button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Filter Drawer */}
      {showFilters && (
         <div className="bg-slate-50 p-5 border-b border-slate-200 flex-shrink-0">
           <form onSubmit={handleApplyFilters}>
             <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
               <div><label className="block text-xs font-semibold text-slate-700 mb-1">Date</label><input type="date" name="date" value={filters.date} onChange={handleFilterChange} className="w-full px-3 py-2 bg-white border border-slate-200 rounded text-sm focus:ring-2 focus:ring-green-500 outline-none" /></div>
               <div><label className="block text-xs font-semibold text-slate-700 mb-1">Account Reference</label><input type="text" name="reference" value={filters.reference} onChange={handleFilterChange} className="w-full px-3 py-2 bg-white border border-slate-200 rounded text-sm focus:ring-2 focus:ring-green-500 outline-none" /></div>
               <div><label className="block text-xs font-semibold text-slate-700 mb-1">Phone</label><input type="text" name="phone" value={filters.phone} onChange={handleFilterChange} className="w-full px-3 py-2 bg-white border border-slate-200 rounded text-sm focus:ring-2 focus:ring-green-500 outline-none" /></div>
               <div><label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
                 <select name="status" value={filters.status} onChange={handleFilterChange} className="w-full px-3 py-2 bg-white border border-slate-200 rounded text-sm focus:ring-2 focus:ring-green-500 outline-none">
                   <option value="">All Statuses</option><option value="SUCCESS">Success / Paid</option><option value="PENDING">Pending</option><option value="FAILED">Failed</option>
                 </select>
               </div>
             </div>
             <div className="mt-5 flex justify-end gap-3">
               <button type="button" onClick={clearFilters} className="px-4 py-2 text-sm font-bold text-slate-600 bg-white border border-slate-300 rounded hover:bg-slate-100">Clear All</button>
               <button type="submit" disabled={loading} className="px-5 py-2 text-sm font-bold text-white bg-green-600 rounded hover:bg-green-700 disabled:opacity-70">Apply Filters</button>
             </div>
           </form>
         </div>
      )}

      {/* Main Navigation Tabs */}
      <div className="flex border-b border-slate-200 px-6 bg-slate-50 flex-shrink-0">
        <button onClick={() => setActiveTab('transactions')} className={`py-3 px-4 text-sm font-bold border-b-2 transition-colors ${activeTab === 'transactions' ? 'border-green-600 text-green-700' : 'border-transparent text-slate-500'}`}>Transaction Grid</button>
        <button onClick={() => setActiveTab('reports')} className={`py-3 px-4 text-sm font-bold border-b-2 transition-colors ${activeTab === 'reports' ? 'border-green-600 text-green-700' : 'border-transparent text-slate-500'}`}>Payment Summary</button>
        <button onClick={() => setActiveTab('exceptions')} className={`py-3 px-4 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'exceptions' ? 'border-red-600 text-red-700' : 'border-transparent text-slate-500'}`}>
          Unknown References {unmatchedTransactions.length > 0 && <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full">{unmatchedTransactions.length}</span>}
        </button>
        <button onClick={() => setActiveTab('audit')} className={`py-3 px-4 text-sm font-bold border-b-2 transition-colors ${activeTab === 'audit' ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-500'}`}>3-Way Audit</button>
      </div>

      {error && <div className="bg-red-50 text-red-700 p-4 text-sm font-medium flex-shrink-0">Error: {error}</div>}

      <div className="flex-1 overflow-y-auto">
        
        {/* TAB 1: TRANSACTION GRID */}
        {activeTab === 'transactions' && (
           <table className="w-full text-left border-collapse">
             <thead>
               <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase tracking-wider sticky top-0">
                 <th className="px-6 py-4 font-semibold">Date</th>
                 <th className="px-6 py-4 font-semibold">System / Ref</th>
                 <th className="px-6 py-4 font-semibold">M-Pesa Receipt</th>
                 <th className="px-6 py-4 font-semibold">Amount</th>
                 <th className="px-6 py-4 font-semibold">Status</th>
               </tr>
             </thead>
             <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
               {transactions.map((tx, idx) => (
                 <tr key={idx} className="hover:bg-slate-50">
                   <td className="px-6 py-4 whitespace-nowrap">{tx.date}</td>
                   <td className="px-6 py-4 font-mono text-xs">{tx.clientSystem}<br/><span className="text-slate-400">{tx.id}</span></td>
                   <td className="px-6 py-4 font-mono font-medium">{tx.mpesaRef}</td>
                   <td className="px-6 py-4 font-semibold">KES {tx.amount}</td>
                   <td className="px-6 py-4"><span className="px-2 py-1 rounded text-xs font-bold bg-slate-100">{tx.status}</span></td>
                 </tr>
               ))}
             </tbody>
           </table>
        )}

        {/* TAB 2: SYSTEM SUMMARY */}
        {activeTab === 'reports' && (
          <div className="p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Total Revenue: KES {report.totalRevenue.toLocaleString()}</h3>
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
                {report.systemBreakdown.map((sys, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="px-6 py-4 font-bold text-slate-800">{sys.name}</td>
                      <td className="px-6 py-4 font-semibold text-green-700">KES {sys.revenue.toLocaleString()}</td>
                      <td className="px-6 py-4 font-medium text-slate-600 text-center">{sys.total}</td>
                      <td className="px-6 py-4 font-medium text-green-600 text-center">{sys.success}</td>
                      <td className="px-6 py-4 font-medium text-red-500 text-center">{sys.failed}</td>
                    </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 3: UNMATCHED EXCEPTIONS */}
        {activeTab === 'exceptions' && (
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-slate-800">Suspense Account / Unknown References</h3>
              <p className="text-sm text-slate-500">Payments received but not tied to a valid client system.</p>
            </div>
            
            <table className="w-full text-left border-collapse border border-slate-200 rounded-lg overflow-hidden shadow-sm">
              <thead className="bg-slate-100 text-slate-600 text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3 font-semibold">Date</th>
                  <th className="px-6 py-3 font-semibold">Receipt</th>
                  <th className="px-6 py-3 font-semibold">Phone</th>
                  <th className="px-6 py-3 font-semibold">Amount</th>
                  <th className="px-6 py-3 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-sm">
                {unmatchedTransactions.length === 0 ? (
                  <tr><td colSpan="5" className="px-6 py-8 text-center text-slate-500">No unmatched transactions found.</td></tr>
                ) : (
                  unmatchedTransactions.map((tx, idx) => (
                    <tr key={idx} className="bg-red-50 hover:bg-red-100 transition-colors">
                      <td className="px-6 py-4">{tx.date}</td>
                      <td className="px-6 py-4 font-mono font-bold text-slate-800">{tx.mpesaRef}</td>
                      <td className="px-6 py-4">{tx.phone}</td>
                      <td className="px-6 py-4 font-bold text-red-700">KES {tx.amount}</td>
                      <td className="px-6 py-4 text-right">
                        <button onClick={() => setResolvingTx(tx)} className="px-3 py-1 bg-white border border-slate-300 rounded text-xs font-bold text-slate-700 hover:bg-slate-50">
                          Resolve Manual
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {/* Resolution Modal */}
            {resolvingTx && (
              <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50">
                <div className="bg-white p-6 rounded-xl shadow-xl w-full max-w-md">
                  <h3 className="text-lg font-bold text-slate-800 mb-1">Resolve Transaction</h3>
                  <p className="text-sm text-slate-500 mb-4 font-mono">Receipt: {resolvingTx.mpesaRef}</p>
                  
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Assign to Client System</label>
                  <select value={resolveSystem} onChange={(e) => setResolveSystem(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded mb-4 text-sm">
                    <option value="">Select Target System...</option>
                    <option value="ERP_CORE">ERP Core System</option>
                    <option value="POS_TERMINAL_1">POS Terminal 1</option>
                  </select>

                  <label className="block text-sm font-semibold text-slate-700 mb-1">Reconciliation Notes</label>
                  <textarea value={resolveNote} onChange={(e) => setResolveNote(e.target.value)} placeholder="Audit justification..." className="w-full px-3 py-2 border border-slate-300 rounded mb-4 text-sm h-24"></textarea>

                  <div className="flex justify-end gap-2">
                    <button onClick={() => setResolvingTx(null)} className="px-4 py-2 text-sm font-bold text-slate-600 bg-slate-100 rounded hover:bg-slate-200">Cancel</button>
                    <button onClick={handleSubmitResolution} className="px-4 py-2 text-sm font-bold text-white bg-green-600 rounded hover:bg-green-700">Submit Resolution</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: 3-WAY AUDIT ENGINE */}
        {activeTab === 'audit' && (
          <div className="p-6">
            <div className="max-w-3xl mx-auto bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-bold text-slate-800 mb-2">Initialize 3-Way Reconciliation</h3>
              <p className="text-sm text-slate-500 mb-6">Compare Provider Statements (Safaricom) against the OpenFloat Database and Client System confirmations to detect missing, duplicate, or mismatched amounts.</p>
              
              <div className="space-y-4">
                <div 
                  className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${auditFile ? 'border-green-400 bg-green-50' : 'border-slate-300 hover:bg-slate-50'}`}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <p className="text-sm font-bold text-slate-700">
                    {auditFile ? `Selected: ${auditFile.name}` : '1. Upload Provider CSV (Safaricom)'}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">Select the raw statement from the provider portal.</p>
                  <input type="file" className="hidden" ref={fileInputRef} accept=".csv" onChange={(e) => setAuditFile(e.target.files[0])} />
                </div>
              </div>

              <button 
                onClick={handleRunAudit} 
                disabled={auditLoading || !auditFile}
                className="w-full mt-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-bold rounded-lg transition-colors flex justify-center items-center gap-2"
              >
                {auditLoading ? 'Processing Statement...' : 'Run Audit Engine'}
              </button>

              {/* AUDIT RESULTS RENDER */}
              {auditResults && (
                <div className="mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="flex gap-4 mb-6">
                    <div className="flex-1 bg-slate-50 border border-slate-200 rounded-lg p-4 text-center">
                       <p className="text-xs font-bold text-slate-500 uppercase">Records Checked</p>
                       <p className="text-2xl font-black text-slate-800">{auditResults.totalProcessed}</p>
                    </div>
                    <div className="flex-1 bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                       <p className="text-xs font-bold text-green-700 uppercase">Perfect Matches</p>
                       <p className="text-2xl font-black text-green-800">{auditResults.successfulMatches}</p>
                    </div>
                  </div>

                  {auditResults.missingInDatabase.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-sm font-bold text-red-700 mb-2">Missing in OpenFloat ({auditResults.missingInDatabase.length})</h4>
                      <ul className="text-xs font-mono text-slate-600 bg-slate-50 p-3 rounded border border-slate-200 max-h-40 overflow-y-auto">
                        {auditResults.missingInDatabase.map((err, i) => <li key={i} className="py-1 border-b border-slate-100 last:border-0">{err}</li>)}
                      </ul>
                    </div>
                  )}

                  {auditResults.mismatchedAmounts.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-sm font-bold text-orange-700 mb-2">Amount Mismatches ({auditResults.mismatchedAmounts.length})</h4>
                      <ul className="text-xs font-mono text-slate-600 bg-slate-50 p-3 rounded border border-slate-200 max-h-40 overflow-y-auto">
                        {auditResults.mismatchedAmounts.map((err, i) => <li key={i} className="py-1 border-b border-slate-100 last:border-0">{err}</li>)}
                      </ul>
                    </div>
                  )}

                  {auditResults.missingInDatabase.length === 0 && auditResults.mismatchedAmounts.length === 0 && (
                     <div className="bg-green-100 text-green-800 p-4 rounded-lg text-center font-bold text-sm">
                       ✅ Audit Passed: 100% Reconciliation Accuracy.
                     </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}