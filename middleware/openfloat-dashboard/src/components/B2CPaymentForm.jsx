import React, { useState } from 'react';

const B2CPaymentForm = () => {
    // Defaulting to Safaricom's universal sandbox test number to prevent 2040 errors
    const [phoneNumber, setPhoneNumber] = useState('254708374149'); 
    const [amount, setAmount] = useState('10');
    const [statusMessage, setStatusMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handlePayment = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setStatusMessage('Initiating transaction with Safaricom Daraja...');

        try {
            // Pointing directly to your live Render backend
            const url = `https://openfloat.onrender.com/api/v1/b2c/simulate?phoneNumber=${phoneNumber}&amount=${amount}`;
            
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            const data = await response.json();

            // Check Safaricom's response code within the JSON payload
            if (data.ResponseCode === "0") {
                setStatusMessage(`Success! Payment queued. Tracking ID: ${data.ConversationID}`);
            } else {
                setStatusMessage(`Failed: Safaricom rejected the request. Check Render logs.`);
            }
        } catch (error) {
            console.error("Payment Error:", error);
            setStatusMessage('Network error. Ensure your backend is running and CORS is configured.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-xl">
            <h3 className="text-lg font-semibold text-slate-800 mb-6">Initiate B2C Payout</h3>
            
            <form onSubmit={handlePayment} className="space-y-6 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
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
                    {isLoading ? 'Processing Transfer...' : 'Send Payment'}
                </button>
            </form>

            {statusMessage && (
                <div className={`mt-6 p-4 rounded-lg border ${
                    statusMessage.includes('Success') 
                        ? 'bg-green-50 border-green-200 text-green-800' 
                        : 'bg-slate-100 border-slate-200 text-slate-800'
                }`}>
                    <p className="text-sm font-medium">{statusMessage}</p>
                </div>
            )}
        </div>
    );
};

export default B2CPaymentForm;