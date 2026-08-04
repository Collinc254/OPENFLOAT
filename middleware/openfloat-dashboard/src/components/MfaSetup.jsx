import React, { useState } from 'react';
import fetchWithAuth from './api'; // Adjust path if necessary

export default function MfaSetup() {
  const [step, setStep] = useState('idle'); // idle, scanning, success
  const [qrCodeUri, setQrCodeUri] = useState('');
  const [secret, setSecret] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [statusMsg, setStatusMsg] = useState({ type: '', text: '' });

  // Assuming you store the username in localStorage upon login
  const username = localStorage.getItem('openfloat_user') || 'admin'; 

  const handleStartSetup = async () => {
    setStep('scanning');
    setStatusMsg({ type: 'loading', text: 'Generating secure QR code...' });

    try {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://openfloat.onrender.com';
      const response = await fetchWithAuth(`${API_BASE_URL}/api/v1/auth/mfa/setup?username=${username}`, {
        method: 'POST'
      });

      if (response.ok) {
        const data = await response.json();
        setQrCodeUri(data.qrCodeDataUri);
        setSecret(data.secret);
        setStatusMsg({ type: '', text: '' });
      } else {
        throw new Error('Failed to generate QR code');
      }
    } catch (error) {
      setStatusMsg({ type: 'error', text: 'Could not connect to authentication server.' });
      setStep('idle');
    }
  };

  const handleEnableMfa = async (e) => {
    e.preventDefault();
    setStatusMsg({ type: 'loading', text: 'Verifying code...' });

    try {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://openfloat.onrender.com';
      const response = await fetchWithAuth(`${API_BASE_URL}/api/v1/auth/mfa/enable`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username,
          secret: secret,
          code: verificationCode
        })
      });

      if (response.ok) {
        setStep('success');
        setStatusMsg({ type: 'success', text: 'Two-Factor Authentication is now actively protecting your account.' });
      } else {
        setStatusMsg({ type: 'error', text: 'Invalid verification code. Please try again.' });
      }
    } catch (error) {
      setStatusMsg({ type: 'error', text: 'Network error during verification.' });
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden max-w-md">
      <div className="bg-slate-900 px-6 py-5">
        <h2 className="text-lg font-bold text-white tracking-wide">Two-Factor Authentication</h2>
        <p className="text-slate-400 text-xs mt-1">Secure your OpenFloat admin account</p>
      </div>

      <div className="p-6">
        {step === 'idle' && (
          <div className="text-center space-y-4">
            <div className="bg-blue-50 text-blue-700 p-4 rounded-lg text-sm text-left border border-blue-100">
              <strong className="block mb-1">Enhanced Security</strong>
              Enable TOTP (Time-based One-Time Password) to require a 6-digit code from Google Authenticator or Authy whenever you log in.
            </div>
            <button
              onClick={handleStartSetup}
              className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Setup Authenticator App
            </button>
          </div>
        )}

        {step === 'scanning' && (
          <div className="space-y-5 animate-in fade-in zoom-in duration-300">
            <div className="text-center">
              <p className="text-sm font-semibold text-slate-700 mb-2">1. Scan this QR Code with your app</p>
              {qrCodeUri ? (
                <img src={qrCodeUri} alt="2FA QR Code" className="mx-auto border border-slate-200 rounded-lg p-2 bg-white shadow-sm h-48 w-48" />
              ) : (
                <div className="h-48 w-48 bg-slate-100 mx-auto rounded-lg animate-pulse border border-slate-200"></div>
              )}
            </div>

            <form onSubmit={handleEnableMfa} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5 text-center">2. Enter the 6-digit code to verify</label>
                <input
                  type="text"
                  maxLength="6"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 text-center text-xl font-mono tracking-[0.5em]"
                  placeholder="000000"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={verificationCode.length !== 6}
                className="w-full bg-slate-900 text-white font-bold py-3 rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Verify & Activate
              </button>
            </form>
          </div>
        )}

        {step === 'success' && (
          <div className="text-center py-6 animate-in fade-in duration-300">
            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
            </div>
            <h3 className="text-lg font-bold text-slate-900">2FA Activated</h3>
            <p className="text-slate-500 text-sm mt-2">Your account is now protected by Two-Factor Authentication.</p>
          </div>
        )}

        {statusMsg.text && step !== 'success' && (
          <div className={`mt-4 p-3 rounded-lg text-sm font-medium text-center ${
            statusMsg.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-slate-50 text-slate-600'
          }`}>
            {statusMsg.text}
          </div>
        )}
      </div>
    </div>
  );
}