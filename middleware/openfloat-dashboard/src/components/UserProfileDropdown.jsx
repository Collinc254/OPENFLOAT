import React, { useState } from 'react';

export default function UserProfileDropdown({ user, onNavigate, onLogout }) {
  const [isOpen, setIsOpen] = useState(false);

  const username = user?.username || 'User';
  // Extract permissions, defaulting to an empty array
  const permissions = user?.permissions || [];

  return (
    <div className="relative">
      {/* Profile Avatar Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 focus:outline-none"
      >
        <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center font-bold text-slate-700 border-2 border-slate-300 shadow-inner hover:border-slate-400 transition-colors">
          {username.charAt(0).toUpperCase()}
        </div>
        <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-12 right-0 w-72 bg-white rounded-xl shadow-lg border border-slate-200 p-2 z-50 animate-in fade-in slide-in-from-top-1 duration-200">
          <div className="px-4 py-3 border-b border-slate-100">
            <p className="text-sm font-semibold text-slate-900">{username}</p>
            <p className="text-xs font-bold text-green-600 mt-0.5">{user?.role} ACCOUNT</p>
            
            {/* NEW: Display Granular Permissions so the user knows their limits */}
            {user?.role !== 'ADMIN' && permissions.length > 0 && (
              <div className="mt-2 pt-2 border-t border-slate-50 flex flex-wrap gap-1">
                {permissions.map((perm, idx) => (
                  <span key={idx} className="text-[9px] font-mono bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200">
                    {perm.replace(/_/g, ' ')}
                  </span>
                ))}
              </div>
            )}
            {user?.role === 'ADMIN' && (
              <div className="mt-2 pt-2 border-t border-slate-50">
                <span className="text-[9px] font-mono bg-green-50 text-green-700 border-green-200 px-1.5 py-0.5 rounded border">
                  FULL SYSTEM ACCESS
                </span>
              </div>
            )}
          </div>
          
          <div className="py-2">
            
            {/*  All users need access to set up their MFA. */}
            <button
              onClick={() => {
                onNavigate();
                setIsOpen(false);
              }}
              className="w-full text-left flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
              Profile & Security
            </button>

            <button
              onClick={onLogout}
              className="w-full text-left flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
            >
              <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}