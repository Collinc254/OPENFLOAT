import React, { useState, useEffect } from 'react';

// SECURED: Added the 'user' prop to receive permissions from App.jsx
const Payouts = ({ user }) => {
    // === GRANULAR PERMISSION CHECKS ===
    const isAdmin = user?.role === 'ADMIN';
    const canCreate = isAdmin || user?.permissions?.includes('CREATE_PAYOUT');
    const canApprove = isAdmin || user?.permissions?.includes('APPROVE_PAYOUT');

    // Defaulting to Safaricom's universal sandbox test number
    const [phoneNumber, setPhoneNumber] = useState('254708374149'); 
    const [amount, setAmount] = useState('10');
    
    // NEW: Paybill selection state
    const [paybills, setPaybills] = useState([]);
    const [selectedShortcode, setSelectedShortcode] = useState('');
    
    const [statusMessage, setStatusMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // 1. Initialize with an empty array to remove fake data
    const [pendingApprovals, setPendingApprovals] = useState([]);
    const [isFetchingApprovals, setIsFetchingApprovals] = useState(true);

    // 2. Fetch real data from the backend when the component mounts
    useEffect(() => {
        const fetchPendingApprovals = async () => {
            if (!canApprove) {
                setIsFetchingApprovals(false);
                return;
            }

            try {
                const token = user?.token || localStorage.getItem('token');
                
                const response = await fetch('https://openfloat.onrender.com/api/v1/b2c/pending', {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    setPendingApprovals(data);
                } else {
                    console.error("Failed to fetch pending approvals");
                }
            } catch (error) {
                console.error("Network error while fetching approvals:", error);
            } finally {
                setIsFetchingApprovals(false);
            }
        };

        const fetchActivePaybills = async () => {
            if (!canCreate) return;
            
            try {
                const token = user?.token || localStorage.getItem('token');
                const response = await fetch('https://openfloat.onrender.com/api/v1/paybills', {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    // Filter to only show active paybills in the dropdown
                    const activePaybills = data.filter(pb => pb.active);
                    setPaybills(activePaybills);
                    
                    // Auto-select the first available paybill
                    if (activePaybills.length > 0) {
                        setSelectedShortcode(activePaybills[0].shortcode);
                    }
                }
            } catch (error) {
                console.error("Network error while fetching paybills:", error);
            }
        };

        fetchPendingApprovals();
        fetchActivePaybills();
    }, [canApprove, canCreate, user]);

    const handlePayment = async (e) => {
        e.preventDefault();
        
        if (!selectedShortcode) {
            setStatusMessage('Please select a source paybill first.');
            return;
        }

        setIsLoading(true);
        setStatusMessage('Initiating transaction draft...');

        try {
            // UPDATED: Now passing the selected shortcode to the backend
            const url = `https://openfloat.onrender.com/api/v1/b2c/simulate?phoneNumber=${phoneNumber}&amount=${amount}&shortcode=${selectedShortcode}`;
            
            const token = user?.token || localStorage.getItem('token');

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` 
                }
            });

            const data = await response.json();

            if (data.ResponseCode === "0") {
                setStatusMessage(`Success! Payment drafted. Tracking ID: ${data.ConversationID}`);
                
                // If the user has checker rights, reload the pending list to show their new draft
                if (canApprove) {
                    const pendingResponse = await fetch('https://openfloat.onrender.com/api/v1/b2c/pending', {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if (pendingResponse.ok) {
                        setPendingApprovals(await pendingResponse.json());
                    }
                }
            } else {
                setStatusMessage('Payment draft failed.');
            }
        } catch (error) {
            console.error("Payment Error:", error);
            setStatusMessage('Network error. Ensure your backend is running and CORS is configured.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleApprove = async (id) => {
        setStatusMessage(`Approving transaction ${id}...`);
        
        try {
            const token = user?.token || localStorage.getItem('token');
            
            // ACTIVATE: Real fetch call to the backend approve endpoint
            const response = await fetch(`https://openfloat.onrender.com/api/v1/b2c/${id}/approve`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                setPendingApprovals(prev => prev.filter(tx => tx.id !== id));
                setStatusMessage(`Transaction ${id} approved and released to Safaricom successfully.`);
            } else {
                const errorData = await response.json();
                setStatusMessage(`Approval failed: ${errorData.error || 'Unknown error'}`);
            }
        } catch (error) {
            console.error("Approval error:", error);
            setStatusMessage('Network error during approval execution.');
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full max-w-6xl mx-auto">
            
            {/* ========================================== */}
            {/* MAKER SECTION: DRAFTING PAYOUTS            */}
            {/* ========================================== */}
            {canCreate && (
                <div className="flex flex-col">
                    <h3 className="text-lg font-semibold text-slate-800 mb-6">Initiate Payout (Maker)</h3>
                    
                    <form onSubmit={handlePayment} className="space-y-6 bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex-1">
                        
                        {/* NEW: Paybill Selection Dropdown */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Source Paybill</label>
                            <select 
                                value={selectedShortcode} 
                                onChange={(e) => setSelectedShortcode(e.target.value)}
                                required
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none transition-colors"
                            >
                                {paybills.length === 0 ? (
                                    <option value="" disabled>Loading active paybills...</option>
                                ) : (
                                    paybills.map(pb => (
                                        <option key={pb.id} value={pb.shortcode}>
                                            {pb.shortcode} ({pb.environment})
                                        </option>
                                    ))
                                )}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number (Start with 254)</label>
                            <input 
                                type="text" 
                                value={phoneNumber} 
                                onChange={(e) => setPhoneNumber(e.target.value)} 
                                required 
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-colors"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Amount (KES)</label>
                            <input 
                                type="number" 
                                value={amount} 
                                onChange={(e) => setAmount(e.target.value)} 
                                required 
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-colors"
                            />
                        </div>

                        <button 
                            type="submit" 
                            disabled={isLoading || paybills.length === 0}
                            className={`w-full py-2.5 rounded-lg font-medium text-white transition-colors ${
                                isLoading || paybills.length === 0 ? 'bg-slate-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700 shadow-sm'
                            }`}
                        >
                            {isLoading ? 'Processing Draft...' : 'Draft Payment'}
                        </button>
                    </form>
                </div>
            )}

            {/* ========================================== */}
            {/* CHECKER SECTION: APPROVING PAYOUTS         */}
            {/* ========================================== */}
            {canApprove && (
                <div className="flex flex-col">
                    <h3 className="text-lg font-semibold text-slate-800 mb-6">Pending Approvals (Checker)</h3>
                    
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex-1">
                        {isFetchingApprovals ? (
                            <div className="p-8 text-center text-slate-500 flex flex-col items-center justify-center h-full">
                                <p>Loading pending payouts...</p>
                            </div>
                        ) : pendingApprovals.length === 0 ? (
                            <div className="p-8 text-center text-slate-500 flex flex-col items-center justify-center h-full">
                                <svg className="w-10 h-10 text-slate-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                <p>No pending payouts require approval.</p>
                            </div>
                        ) : (
                            <ul className="divide-y divide-slate-100">
                                {pendingApprovals.map((tx) => (
                                    <li key={tx.id} className="p-4 hover:bg-slate-50 transition-colors flex justify-between items-center">
                                        <div>
                                            <p className="font-bold text-slate-800 text-sm">{tx.id}</p>
                                            <p className="text-xs text-slate-500 mt-1">To: <span className="font-mono">{tx.recipient}</span></p>
                                            <p className="text-xs text-slate-400 mt-0.5">Drafted by {tx.draftedBy}</p>
                                            {/* Optional: Show source paybill here if you return it from the backend API */}
                                            {tx.shortcode && <p className="text-xs text-slate-400 mt-0.5">Source: {tx.shortcode}</p>}
                                        </div>
                                        <div className="text-right">
                                            <p className="font-black text-slate-800 mb-2">KES {tx.amount.toLocaleString()}</p>
                                            <button 
                                                onClick={() => handleApprove(tx.id)}
                                                className="text-xs font-bold bg-blue-50 text-blue-600 hover:bg-blue-100 px-3 py-1.5 rounded border border-blue-200 transition-colors"
                                            >
                                                Approve Release
                                            </button>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            )}

            {/* SHARED STATUS MESSAGE */}
            {statusMessage && (
                <div className={`col-span-1 lg:col-span-2 p-4 rounded-lg border ${
                    statusMessage.includes('Success') || statusMessage.includes('approved')
                        ? 'bg-green-50 border-green-200 text-green-800' 
                        : 'bg-slate-100 border-slate-200 text-slate-800'
                }`}>
                    <p className="text-sm font-medium">{statusMessage}</p>
                </div>
            )}
            
        </div>
    );
};

export default Payouts;