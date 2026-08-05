import React from 'react';
import MfaSetup from './MfaSetup'; 

export default function UserProfilePage() {
  // Safely parse the user object from local storage
  let username = 'Admin';
  try {
    const savedUser = JSON.parse(localStorage.getItem('openfloat_user'));
    username = savedUser?.username || 'Admin';
  } catch (e) {
    username = localStorage.getItem('openfloat_user') || 'Admin';
  }

  return (
    <div className="p-6 md:p-10 space-y-10 bg-slate-50 min-h-screen">
      {/* 1. Page Header */}
      <div className="bg-white px-6 py-5 rounded-xl border border-slate-200 shadow-sm">
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Profile & Security Settings</h1>
        <p className="text-slate-500 text-sm mt-1">Manage your administrator account security and preferences.</p>
      </div>

      {/* 2. Main Content Area */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* A. Account Details Card */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4 h-fit">
          <h2 className="text-lg font-bold text-slate-900 tracking-wide">Account Details</h2>
          <div className="space-y-1.5">
            <p className="text-sm font-medium text-slate-700">Username:</p>
            <p className="text-sm font-mono bg-slate-100 p-2 rounded-md">{username}</p>
          </div>
        </div>

        {/* B. MFA SETUP COMPONENT CARD */}
        <div className="md:col-span-2">
          <MfaSetup /> 
        </div>

      </div>
    </div>
  );
}