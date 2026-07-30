import { useState, useRef, useEffect } from 'react';

export default function OperatorDashboard() {
  // Mode toggles
  const [processingMode, setProcessingMode] = useState('single');
  const [transactionType, setTransactionType] = useState('STK Push');
  
  // Single transaction state 
  const [phone, setPhone] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [amount, setAmount] = useState('');
  
  // Batch transaction state
  const [batchFile, setBatchFile] = useState(null);
  const [batchData, setBatchData] = useState([]);
  const [batchTotal, setBatchTotal] = useState(0);
  const fileInputRef = useRef(null);

  // Global submission & polling state
  const [status, setStatus] = useState('idle'); 
  const [message, setMessage] = useState('');
  const [activeTxRef, setActiveTxRef] = useState(null);

  // THE FIX: Explicit processing lock state
  const [isProcessing, setIsProcessing] = useState(false);

  // --- 1. INPUT VALIDATION & AUTO-FORMATTING ---
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

 // --- 2. ASYNCHRONOUS POLLING ENGINE ---
  useEffect(() => {
    let pollInterval;
    let timeout;

    if (status === 'polling' && activeTxRef) {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://openfloat.onrender.com';
      
      pollInterval = setInterval(() => {
        const token = localStorage.getItem('token');

        fetch(`${API_BASE_URL}/api/v1/payments/status/${activeTxRef}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
          .then((res) => {
            if (!res.ok) throw new Error('Transaction not found yet');
            return res.json();
          })
          .then((data) => {
            if (data.status === 'SUCCESS') {
              clearInterval(pollInterval);
              clearTimeout(timeout);
              setStatus('success');
              setMessage(`Success ${data.receiptNumber}`); 
              setActiveTxRef(null);
              setIsProcessing(false); // RELEASE LOCK
            } else if (data.status === 'FAILED') {
              clearInterval(pollInterval);
              clearTimeout(timeout);
              setStatus('error');
              setMessage('Failed');
              setActiveTxRef(null);
              setIsProcessing(false); // RELEASE LOCK
            }
          })
          .catch((err) => console.log('Waiting for callback to write to database...'));
      }, 3000);

      timeout = setTimeout(() => {
        clearInterval(pollInterval);
        setStatus('error');
        setMessage('Transaction Timed Out: The customer did not enter their PIN within the expected window.');
        setActiveTxRef(null);
        setIsProcessing(false); // RELEASE LOCK
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

    // 1. HARD LOCK TO PREVENT DOUBLE CLICKS
    if (isProcessing) return;
    
    if (processingMode === 'single') {
      const cleanPhone = phone.replace(/\D/g, '');
      if (cleanPhone.length !== 12) {
        setPhoneError('Number must be exactly 12 digits');
        return;
      }
    }

    if (phoneError) return; 

    // 2. ENGAGE LOCK & SET UI STATE
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
        const token = localStorage.getItem('token'); 

        const response = await fetch(`${API_BASE_URL}/api/v1/payments/stk-push`, {
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

        // Transition to polling, keep isProcessing TRUE
        setStatus('polling');
        setActiveTxRef(checkoutId); 
        setMessage('Awaiting customer PIN entry...'); 
      } else {
        await new Promise(resolve => setTimeout(resolve, 1000));
        setStatus('success');
        setMessage(`Batch ${transactionType} queued successfully. Processing ${batchData.length} records.`);
        setIsProcessing(false); // Release for batch immediately
      }
      
    } catch (error) {
      console.error('Payment Error:', error);
      setStatus('error');
      setMessage('Network error. Unable to reach the OpenFloat servers.');
      setIsProcessing(false); // Release lock on network crash
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-slate-50">
      
      {/* 1. FLUSH HEADER: Sits tight against sidebar and top nav (no borders, full width) */}
      <div className="bg-slate-900 border-b border-slate-800 flex-shrink-0">
        <div className="px-6 py-4 flex flex-col justify-center text-center">
          <h2 className="text-xl font-bold text-white tracking-wide">Manual B2C / STK Trigger</h2>
          <p className="text-slate-400 text-xs mt-1">Initiate a single payment or process a mass disbursement</p>
        </div>
        
        <div className="flex justify-center px-6 gap-8">
          <button 
            onClick={() => { setProcessingMode('single'); setStatus('idle'); setMessage(''); }}
            className={`pb-2.5 text-sm font-bold border-b-2 transition-colors px-2 ${processingMode === 'single' ? 'text-green-400 border-green-400' : 'text-slate-400 border-transparent hover:text-slate-200'}`}
          >
            Single Transaction
          </button>
          <button 
            onClick={() => { setProcessingMode('batch'); setStatus('idle'); setMessage(''); setTransactionType('B2C Salary'); }}
            className={`pb-2.5 text-sm font-bold border-b-2 transition-colors px-2 ${processingMode === 'batch' ? 'text-green-400 border-green-400' : 'text-slate-400 border-transparent hover:text-slate-200'}`}
          >
            Batch Upload (CSV)
          </button>
        </div>
      </div>

      {/* 2. COMPACT FORM CONTAINER: Takes up remaining height and centers the white card */}
      <div className="flex-1 flex flex-col justify-center p-4 sm:p-6 overflow-y-auto">
        <div className="max-w-lg mx-auto w-full bg-white p-5 sm:p-6 rounded-xl shadow-sm border border-slate-200">
          <form onSubmit={handleExecute} className="space-y-3">
            
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Transaction Type</label>
              <div className="relative">
                <select
                  value={transactionType}
                  onChange={(e) => setTransactionType(e.target.value)}
                  disabled={isProcessing}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors outline-none text-slate-700 text-sm font-medium appearance-none disabled:opacity-50"
                >
                  {processingMode === 'single' && <option value="STK Push">C2B STK Push (Collection)</option>}
                  <option value="B2C Salary">B2C Salary (Disbursement)</option>
                  <option value="B2C Refund">B2C Refund (Disbursement)</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </div>
              </div>
            </div>

            <hr className="border-slate-100 my-2" />

            {processingMode === 'single' && (
              <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Target M-Pesa Number</label>
                  <input 
                    type="text" 
                    value={phone}
                    onChange={handlePhoneChange}
                    disabled={isProcessing}
                    className={`w-full px-3 py-2 bg-slate-50 border rounded-lg focus:ring-2 focus:outline-none text-slate-700 font-mono tracking-wide disabled:opacity-50 transition-colors
                      ${phoneError ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-slate-200 focus:ring-green-500 focus:border-green-500'}`}
                    required
                  />
                  {phoneError && (
                    <p className="text-red-500 text-xs font-bold mt-1 flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                      {phoneError}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Amount (KES)</label>
                  <input 
                    type="number" 
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    disabled={isProcessing}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none text-slate-700 font-medium text-sm disabled:opacity-50"
                    min="1"
                    required
                  />
                </div>
              </div>
            )}

            {processingMode === 'batch' && (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                {!batchFile ? (
                  <div 
                    className="w-full border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer group"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <div className="px-6 py-6 text-center">
                      <svg className="mx-auto h-8 w-8 text-slate-400 group-hover:text-green-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
                      <div className="mt-2 flex text-sm text-slate-600 justify-center">
                        <span className="relative font-bold text-green-600 focus-within:outline-none focus-within:ring-2 focus-within:ring-green-500 focus-within:ring-offset-2 hover:text-green-500">
                          Upload a CSV file
                        </span>
                        <p className="pl-1">or drag and drop</p>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">Format: Phone, Amount (e.g. 254700111222, 1500)</p>
                    </div>
                    <input type="file" className="hidden" ref={fileInputRef} accept=".csv" onChange={handleFileUpload} />
                  </div>
                ) : (
                  <div className="w-full bg-slate-50 rounded-lg border border-slate-200 p-4">
                    <div className="flex justify-between items-start mb-3 border-b border-slate-200 pb-2">
                      <div>
                        <h3 className="font-bold text-sm text-slate-800">{batchFile.name}</h3>
                        <p className="text-xs text-slate-500 mt-0.5">{batchData.length} records parsed</p>
                      </div>
                      <div className="text-right">
                        <h3 className="font-bold text-sm text-slate-800">KES {batchTotal.toLocaleString()}</h3>
                        <button type="button" onClick={clearBatch} disabled={isProcessing} className="text-[10px] text-red-500 hover:text-red-700 font-semibold mt-0.5 disabled:opacity-50">Remove File</button>
                      </div>
                    </div>
                    
                    <div className="space-y-1">
                      {batchData.slice(0, 3).map((row, idx) => (
                        <div key={idx} className="flex justify-between text-xs bg-white p-2 rounded border border-slate-100 shadow-sm">
                          <span className="font-mono text-slate-600">{row.phone}</span>
                          <span className="font-semibold text-slate-800">KES {row.amount}</span>
                        </div>
                      ))}
                      {batchData.length > 3 && (
                        <div className="text-center text-xs text-slate-400 font-medium pt-1">
                          + {batchData.length - 3} more records
                        </div>
                      )}
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
                  ? 'bg-slate-300 cursor-not-allowed' 
                  : 'bg-green-600 hover:bg-green-700 shadow-sm hover:shadow'}`}
            >
               {status === 'loading' && 'Initiating...'}
               {status === 'polling' && (
                 <>
                   <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                   Awaiting PIN...
                 </>
               )}
               {!isProcessing && `Execute ${processingMode === 'batch' ? 'Batch ' : ''}${transactionType.split(' ')[0]}`}
            </button>
          </form>

          {message && (
            <div className={`mt-4 p-2.5 rounded-lg flex items-start gap-2 text-xs font-medium w-full animate-in fade-in
              ${status === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : ''}
              ${status === 'error' ? 'bg-red-50 text-red-800 border border-red-200' : ''}
              ${status === 'polling' ? 'bg-blue-50 text-blue-800 border border-blue-200' : ''}
            `}>
              <p>{message}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}