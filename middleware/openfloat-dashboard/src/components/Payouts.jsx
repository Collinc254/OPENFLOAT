import React, { useState } from 'react';

// SECURED: Added the 'user' prop to receive permissions from App.jsx
const Payouts = ({ user }) => {
    // === GRANULAR PERMISSION CHECKS ===
    const isAdmin = user?.role === 'ADMIN';
    const canCreate = isAdmin || user?.permissions?.includes('CREATE_PAYOUT');
    const canApprove = isAdmin || user?.permissions?.includes('APPROVE_PAYOUT');

    // Defaulting to Safaricom's universal sandbox test number
    const [phoneNumber, setPhoneNumber] = useState('254708374149'); 
    const [amount, setAmount] = useState('10');
    const [statusMessage, setStatusMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Mock state for pending approvals to demonstrate the Checker role
    const [pendingApprovals, setPendingApprovals] = useState([
        { id: 'PAY-8829', amount: 50000, recipient: '254700112233', draftedBy: 'CALEB' },
        { id: 'PAY-8830', amount: 15500, recipient: '254799887766', draftedBy: 'CALEB' }
    ]);

    const handlePayment = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setStatusMessage('Initiating transaction with Safaricom Daraja...');

        try {
            const url = `https://openfloat.onrender.com/api/v1/b2c/simulate?phoneNumber=${phoneNumber}&amount=${amount}`;
            
            // Extract token from the user prop or fallback to localStorage
            const token = user?.token || localStorage.getItem('token');

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    // SECURED: Added Authorization header for the protected backend endpoint
                    'Authorization': `Bearer ${token}` 
                }
            });

            const data = await response.json();

            if (data.ResponseCode === "0") {
                setStatusMessage(`Success! Payment queued. Tracking ID: ${data.ConversationID}`);
            } else {
                setStatusMessage('Payment failed');
            }
        } catch (error) {
            console.error("Payment Error:", error);
            setStatusMessage('Network error. Ensure your backend is running and CORS is configured.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleApprove = (id) => {
        // In a real scenario, this would hit your /api/v1/b2c/{id}/approve endpoint
        setPendingApprovals(prev => prev.filter(tx => tx.id !== id));
        setStatusMessage(`Transaction ${id} approved and released to Safaricom successfully.`);
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
                            disabled={isLoading}
                            className={`w-full py-2.5 rounded-lg font-medium text-white transition-colors ${
                                isLoading ? 'bg-slate-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700 shadow-sm'
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
                        {pendingApprovals.length === 0 ? (
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