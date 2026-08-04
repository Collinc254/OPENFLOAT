import { useState, useRef, useEffect } from 'react';
import fetchWithAuth from './api'; // Adjust this path if you save api.js in a different folder (e.g., '../utils/api')

export default function OperatorDashboard() {
  // ==========================================
  // 1. DASHBOARD STATE & FETCHING
  // ==========================================
  const [stats, setStats] = useState(null);
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [dashboardError, setDashboardError] = useState('');

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token') || JSON.parse(localStorage.getItem('openfloat_user'))?.token;
      const API_URL = import.meta.env.VITE_API_BASE_URL || 'https://openfloat.onrender.com';
      
      // SWAPPED: fetch -> fetchWithAuth
      const response = await fetchWithAuth(`${API_URL}/api/v1/dashboard/stats`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!response.ok) throw new Error('Failed to fetch dashboard statistics');
      
      const data = await response.json();
      setStats(data);
    } catch (err) {
      setDashboardError(err.message);
    } finally {
      setDashboardLoading(false);
    }
  };

  // Poll dashboard every 15 seconds
  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 15000);
    return () => clearInterval(interval);
  }, []);


  // ==========================================
  // 2. TRANSACTION TRIGGER STATE (Original Logic)
  // ==========================================
  const [processingMode, setProcessingMode] = useState('single');
  const [transactionType, setTransactionType] = useState('STK Push');
  
  const [phone, setPhone] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [amount, setAmount] = useState('');
  
  const [batchFile, setBatchFile] = useState(null);
  const [batchData, setBatchData] = useState([]);
  const [batchTotal, setBatchTotal] = useState(0);
  const fileInputRef = useRef(null);

  const [status, setStatus] = useState('idle'); 
  const [message, setMessage] = useState('');
  const [activeTxRef, setActiveTxRef] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // --- INPUT VALIDATION ---
  const handlePhoneChange = (e) => {
    const cleaned = e.target.value.replace(/\D/g, '');
    
    let formatted = cleaned;
    if (cleaned.length > 3) formatted = cleaned.slice(0, 3) + ' ' + cleaned.slice(3);
    if (cleaned.length > 6) formatted = formatted.slice(0, 7) + ' ' + formatted.slice(7);
    if (cleaned.length > 9) formatted = formatted.slice(0, 11) + ' ' + formatted.slice(11, 14);

    setPhone(formatted);

    if (cleaned.length > 0) {
      const typedPrefix = cleaned.substring(0, 3);
      if (!'254'.startsWith(typedPrefix)) {
        setPhoneError('Number must start with country code 254');
      } else {
        setPhoneError(''); 
      }
    } else {
      setPhoneError('');
    }
  };

  // --- BATCH PARSING LOGIC ---
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setBatchFile(file);
    setStatus('idle');
    setMessage('');

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target.result;
      const lines = text.split('\n').filter(line => line.trim() !== '');
      
      const parsedData = [];
      let total = 0;

      lines.forEach((line, index) => {
        if (index === 0 && line.toLowerCase().includes('phone')) return; 
        
        const [p, a] = line.split(',');
        if (p && a) {
          const parsedAmount = parseFloat(a.trim());
          if (!isNaN(parsedAmount)) {
            parsedData.push({ phone: p.trim(), amount: parsedAmount });
            total += parsedAmount;
          }
        }
      });

      setBatchData(parsedData);
      setBatchTotal(total);
    };
    reader.readAsText(file);
  };

  const clearBatch = () => {
    setBatchFile(null);
    setBatchData([]);
    setBatchTotal(0);
    setStatus('idle');
    setMessage('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // --- ASYNCHRONOUS POLLING ENGINE ---
  useEffect(() => {
    let pollInterval;
    let timeout;

    if (status === 'polling' && activeTxRef) {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://openfloat.onrender.com';
      
      pollInterval = setInterval(() => {
        const token = localStorage.getItem('token') || JSON.parse(localStorage.getItem('openfloat_user'))?.token;

        // SWAPPED: fetch -> fetchWithAuth
        fetchWithAuth(`${API_BASE_URL}/api/v1/payments/status/${activeTxRef}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
          .then((res) => {
            if (!res.ok) throw new Error('Transaction not found yet');
            return res.json();
          })
          .then((data) => {
            if (data.status === 'SUCCESS' || data.status === 'PAID' || data.status === 'COMPLETED') {
              clearInterval(pollInterval);
              clearTimeout(timeout);
              setStatus('success');
              setMessage(`Payment Successful! Receipt: ${data.receiptNumber}`); 
              setActiveTxRef(null);
              setIsProcessing(false);
              fetchStats(); // Instantly refresh dashboard on success
            } else if (data.status === 'FAILED') {
              clearInterval(pollInterval);
              clearTimeout(timeout);
              setStatus('error');
              setMessage('Payment Failed.');
              setActiveTxRef(null);
              setIsProcessing(false);
              fetchStats(); // Instantly refresh dashboard on failure
            }
          })
          .catch((err) => console.log('Waiting for callback to write to database...'));
      }, 3000);

      timeout = setTimeout(() => {
        clearInterval(pollInterval);
        setStatus('error');
        setMessage('Transaction Timed Out: The customer did not enter their PIN within the expected window.');
        setActiveTxRef(null);
        setIsProcessing(false);
      }, 90000);
    }

    return () => {
      clearInterval(pollInterval);
      clearTimeout(timeout);
    };
  }, [status, activeTxRef]);

  // --- SUBMISSION LOGIC ---
  const handleExecute = async (e) => {
    e.preventDefault();

    if (isProcessing) return;
    
    if (processingMode === 'single') {
      const cleanPhone = phone.replace(/\D/g, '');
      if (cleanPhone.length !== 12) {
        setPhoneError('Number must be exactly 12 digits');
        return;
      }
    }

    if (phoneError) return; 

    setIsProcessing(true);
    setStatus('loading');
    setMessage('');

    try {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://openfloat.onrender.com';
      const cleanPhone = phone.replace(/\s/g, '');
      const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
      const txRef = `INV-${Date.now()}-${randomSuffix}`;
      
      const payload = processingMode === 'single' 
        ? { type: transactionType, amount: parseFloat(amount), msisdn: cleanPhone, invoiceRef: txRef, tenantId: "ORG-001" }
        : { type: transactionType, totalAmount: batchTotal, count: batchData.length, records: batchData, batchRef: txRef, tenantId: "ORG-001" };

      if (processingMode === 'single') {
        const token = localStorage.getItem('token') || JSON.parse(localStorage.getItem('openfloat_user'))?.token;

        // SWAPPED: fetch -> fetchWithAuth
        const response = await fetchWithAuth(`${API_BASE_URL}/api/v1/payments/stk-push`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}` 
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          throw new Error('Server rejected the STK push request');
        }

        const responseData = await response.json();
        const checkoutId = responseData.CheckoutRequestID || responseData.checkoutRequestID || responseData.checkoutRequestId;

        setStatus('polling');
        setActiveTxRef(checkoutId); 
        setMessage('Awaiting customer PIN entry...'); 
      } else {
        await new Promise(resolve => setTimeout(resolve, 1000));
        setStatus('success');
        setMessage(`Batch ${transactionType} queued successfully. Processing ${batchData.length} records.`);
        setIsProcessing(false); 
      }
      
    } catch (error) {
      console.error('Payment Error:', error);
      setStatus('error');
      setMessage('Network error. Unable to reach the OpenFloat servers.');
      setIsProcessing(false);
    }
  };


  // ==========================================
  // RENDER INTERFACE
  // ==========================================
  return (
    <div className="p-4 md:p-6 space-y-6 bg-slate-50 min-h-full flex flex-col max-w-[1400px] mx-auto w-full">
      
      {/* 1. HEADER SECTION */}
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-black text-slate-800">Operator Console</h2>
          <p className="text-slate-500 text-sm mt-1">System overview and manual transaction triggers.</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 bg-green-50 border border-green-200 rounded-full shadow-sm">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
          </span>
          <span className="text-xs font-bold text-green-700 uppercase tracking-wide">Live</span>
        </div>
      </div>

      {/* 2. KPI DASHBOARD GRID */}
      {dashboardError && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-sm font-medium">
          Dashboard Sync Error: {dashboardError}
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 relative">
        {dashboardLoading && !stats && (
          <div className="absolute inset-0 bg-slate-50/80 backdrop-blur-sm z-10 flex items-center justify-center rounded-xl">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
          </div>
        )}

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Total Processed Value</p>
          <h3 className="text-2xl font-black text-slate-800 mb-1">KES {stats?.totalTransactionValue?.toLocaleString() || 0}</h3>
          <div className="flex justify-between text-sm mt-4 pt-4 border-t border-slate-100">
            <span className="text-slate-500">Today: <strong className="text-slate-800">{stats?.paymentsToday || 0}</strong></span>
            <span className="text-slate-500">Month: <strong className="text-slate-800">{stats?.paymentsThisMonth || 0}</strong></span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">API Gateway</p>
          <h3 className="text-2xl font-black text-slate-800 mb-1">{stats?.registeredClients || 0} <span className="text-sm font-medium text-slate-400">Clients</span></h3>
          <div className="flex justify-between text-sm mt-4 pt-4 border-t border-slate-100">
            <span className="text-slate-500">Active Keys: <strong className="text-green-600">{stats?.activeApiKeys || 0}</strong></span>
            <span className="text-slate-500">Active Users: <strong className="text-blue-600">{stats?.activeUsers || 0}</strong></span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Callback Health</p>
          <h3 className="text-2xl font-black text-slate-800 mb-1">{stats?.callbackSuccessPercentage || 0}%</h3>
          <div className="flex justify-between text-sm mt-4 pt-4 border-t border-slate-100">
            <span className="text-slate-500">Failed: <strong className="text-red-500">{stats?.failedCallbacks || 0}</strong></span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm border-l-4 border-l-orange-500">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Reconciliation Pipeline</p>
          <h3 className="text-2xl font-black text-orange-600 mb-1">{stats?.pendingReconciliations || 0} <span className="text-sm font-medium text-slate-400">Pending</span></h3>
          <div className="flex justify-between text-sm mt-4 pt-4 border-t border-slate-100">
            <span className="text-slate-500">Unknown Refs: <strong className="text-orange-600">{stats?.unknownReferences || 0}</strong></span>
          </div>
        </div>
      </div>

      {/* 3. MAIN WORKSPACE GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1">
        
        {/* LEFT COLUMN: TRIGGER FORM */}
        <div className="lg:col-span-1 flex flex-col bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="bg-slate-900 border-b border-slate-800 p-4">
            <h3 className="font-bold text-white text-center mb-3">Manual Transaction Trigger</h3>
            <div className="flex justify-center gap-6">
              <button 
                onClick={() => { setProcessingMode('single'); setStatus('idle'); setMessage(''); }}
                className={`pb-1.5 text-xs font-bold border-b-2 transition-colors px-1 ${processingMode === 'single' ? 'text-green-400 border-green-400' : 'text-slate-400 border-transparent hover:text-slate-200'}`}
              >
                Single Entry
              </button>
              <button 
                onClick={() => { setProcessingMode('batch'); setStatus('idle'); setMessage(''); setTransactionType('B2C Salary'); }}
                className={`pb-1.5 text-xs font-bold border-b-2 transition-colors px-1 ${processingMode === 'batch' ? 'text-green-400 border-green-400' : 'text-slate-400 border-transparent hover:text-slate-200'}`}
              >
                Batch Upload (CSV)
              </button>
            </div>
          </div>
          
          <div className="p-5">
            <form onSubmit={handleExecute} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Transaction Type</label>
                <div className="relative">
                  <select
                    value={transactionType}
                    onChange={(e) => setTransactionType(e.target.value)}
                    disabled={isProcessing}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-green-500 outline-none text-slate-700 text-sm font-medium appearance-none disabled:opacity-50"
                  >
                    {processingMode === 'single' && <option value="STK Push">C2B STK Push (Collection)</option>}
                    <option value="B2C Salary">B2C Salary (Disbursement)</option>
                    <option value="B2C Refund">B2C Refund (Disbursement)</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                  </div>
                </div>
              </div>

              {processingMode === 'single' && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Target M-Pesa Number</label>
                    <input 
                      type="text" value={phone} onChange={handlePhoneChange} disabled={isProcessing} required
                      className={`w-full px-3 py-2 bg-slate-50 border rounded-lg focus:ring-2 outline-none text-slate-700 font-mono tracking-wide disabled:opacity-50
                        ${phoneError ? 'border-red-300 focus:ring-red-500' : 'border-slate-200 focus:ring-green-500'}`}
                    />
                    {phoneError && <p className="text-red-500 text-[10px] font-bold mt-1">{phoneError}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Amount (KES)</label>
                    <input 
                      type="number" value={amount} onChange={(e) => setAmount(e.target.value)} disabled={isProcessing} min="1" required
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-green-500 outline-none text-slate-700 font-medium text-sm disabled:opacity-50"
                    />
                  </div>
                </div>
              )}

              {processingMode === 'batch' && (
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                  {!batchFile ? (
                    <div 
                      className="w-full border-2 border-dashed border-slate-300 rounded-lg bg-slate-50 hover:bg-slate-100 cursor-pointer p-4 text-center"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <svg className="mx-auto h-6 w-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
                      <p className="text-xs font-bold text-green-600 mt-2">Upload a CSV file</p>
                      <p className="text-[10px] text-slate-500 mt-1">Format: Phone, Amount</p>
                      <input type="file" className="hidden" ref={fileInputRef} accept=".csv" onChange={handleFileUpload} />
                    </div>
                  ) : (
                    <div className="bg-slate-50 rounded-lg border border-slate-200 p-3">
                      <div className="flex justify-between items-start mb-2 border-b border-slate-200 pb-2">
                        <div>
                          <h3 className="font-bold text-xs text-slate-800 truncate max-w-[120px]">{batchFile.name}</h3>
                          <p className="text-[10px] text-slate-500">{batchData.length} records</p>
                        </div>
                        <div className="text-right">
                          <h3 className="font-bold text-xs text-slate-800">KES {batchTotal.toLocaleString()}</h3>
                          <button type="button" onClick={clearBatch} disabled={isProcessing} className="text-[10px] text-red-500 hover:text-red-700 font-semibold disabled:opacity-50">Remove</button>
                        </div>
                      </div>
                      <div className="space-y-1">
                        {batchData.slice(0, 3).map((row, idx) => (
                          <div key={idx} className="flex justify-between text-[10px] bg-white p-1.5 rounded border border-slate-100">
                            <span className="font-mono text-slate-600">{row.phone}</span>
                            <span className="font-semibold text-slate-800">KES {row.amount}</span>
                          </div>
                        ))}
                        {batchData.length > 3 && <div className="text-center text-[10px] text-slate-400 pt-1">+{batchData.length - 3} more</div>}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <button 
                type="submit" 
                disabled={isProcessing || !!phoneError || (processingMode === 'batch' && batchData.length === 0)}
                className={`w-full py-2.5 rounded-lg font-bold text-sm text-white transition-all flex justify-center items-center gap-2 mt-2
                  ${isProcessing || !!phoneError || (processingMode === 'batch' && batchData.length === 0) 
                    ? 'bg-slate-300 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700 shadow-sm'}`}
              >
                 {status === 'loading' && 'Initiating...'}
                 {status === 'polling' && (
                   <><svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>Awaiting PIN...</>
                 )}
                 {!isProcessing && `Execute ${processingMode === 'batch' ? 'Batch' : ''}`}
              </button>
            </form>

            {message && (
              <div className={`mt-4 p-2.5 rounded-lg text-xs font-medium animate-in fade-in
                ${status === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : ''}
                ${status === 'error' ? 'bg-red-50 text-red-800 border border-red-200' : ''}
                ${status === 'polling' ? 'bg-blue-50 text-blue-800 border border-blue-200' : ''}
              `}>
                <p>{message}</p>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: LIVE ACTIVITY FEED */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center shrink-0">
            <h3 className="text-sm font-bold text-slate-800">Live Transaction Activity</h3>
            <span className="text-xs text-slate-400 font-medium">Auto-refreshes</span>
          </div>
          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[500px]">
              <thead>
                <tr className="bg-white text-slate-400 text-[10px] uppercase tracking-wider border-b border-slate-100">
                  <th className="px-5 py-3 font-semibold">Time</th>
                  <th className="px-5 py-3 font-semibold">Receipt</th>
                  <th className="px-5 py-3 font-semibold">Client</th>
                  <th className="px-5 py-3 font-semibold">Amount</th>
                  <th className="px-5 py-3 font-semibold text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-sm">
                {stats?.liveActivity?.length === 0 || !stats ? (
                  <tr>
                    <td colSpan="5" className="px-5 py-12 text-center text-slate-500">
                      <div className="flex flex-col items-center">
                        <svg className="w-8 h-8 text-slate-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        Waiting for live activity...
                      </div>
                    </td>
                  </tr>
                ) : (
                  stats.liveActivity?.map((tx, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-3 text-slate-500 font-mono text-[11px]">
                        {new Date(tx.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </td>
                      <td className="px-5 py-3 font-mono font-bold text-slate-800 text-xs">{tx.mpesaRef || tx.id}</td>
                      <td className="px-5 py-3">
                        <span className="font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded text-[10px]">{tx.clientSystem || 'UNKNOWN'}</span>
                      </td>
                      <td className="px-5 py-3 font-black text-slate-800 text-xs">KES {tx.amount}</td>
                      <td className="px-5 py-3 text-right">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border ${
                          ['SUCCESS', 'PAID', 'COMPLETED'].includes(tx.status) ? 'bg-green-50 text-green-700 border-green-200' :
                          tx.status === 'FAILED' ? 'bg-red-50 text-red-700 border-red-200' :
                          'bg-yellow-50 text-yellow-700 border-yellow-200'
                        }`}>
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
      </div>
    </div>
  );
}