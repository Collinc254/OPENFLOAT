import { useState } from 'react';
import Login from './components/Login';
import OperatorDashboard from './components/OperatorDashboard';
import FinanceDashboard from './components/FinanceDashboard';
import AdminConsole from './components/AdminConsole';
import AuditViewer from './components/AuditViewer';

export default function App() {
  const [user, setUser] = useState(null);
  
  // State variable to control which module is currently visible
  const [activeTab, setActiveTab] = useState('operator'); 

  const handleLoginSuccess = (userData) => {
    setUser(userData);
  };

  if (!user) {
    return <Login onSuccessfulLogin={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      
      {/* 1. Left Sidebar Navigation */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col shadow-xl z-10">
        
        {/* Portal Branding */}
        <div className="p-6 border-b border-slate-800">
          <h1 className="text-2xl font-bold tracking-wide">OpenFloat</h1>
          <p className="text-xs text-slate-400 mt-1 uppercase tracking-wider">Enterprise Portal</p>
        </div>
        
        {/* Navigation Links */}
        <nav className="flex-1 py-6">
          <ul className="space-y-2 px-4">
            <li>
              <button 
                onClick={() => setActiveTab('operator')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${activeTab === 'operator' ? 'bg-green-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
              >
                Operator Dashboard
              </button>
            </li>
            <li>
              <button 
                onClick={() => setActiveTab('finance')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${activeTab === 'finance' ? 'bg-green-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
              >
                Finance & Recon
              </button>
            </li>
            <li>
              <button 
                onClick={() => setActiveTab('admin')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${activeTab === 'admin' ? 'bg-green-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
              >
                Admin Console
              </button>
            </li>
            <li>
              <button 
                onClick={() => setActiveTab('viewer')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${activeTab === 'viewer' ? 'bg-green-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
              >
                Audit Viewer
              </button>
            </li>
          </ul>
        </nav>

        {/* User Profile & Logout at the bottom */}
        <div className="p-5 border-t border-slate-800 bg-slate-950">
          <div className="mb-4">
            <p className="text-xs text-slate-500 uppercase tracking-wider">Logged in as</p>
            <p className="font-bold text-slate-200 mt-1">{user.username}</p>
            <p className="text-xs text-green-400 mt-0.5">{user.role} Access</p>
          </div>
          <button 
            onClick={() => setUser(null)}
            className="w-full py-2.5 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 hover:text-red-300 transition-colors text-sm font-semibold border border-red-500/20"
          >
            Sign Out
          </button>
        </div>
      </aside>

      {/* 2. Right Main Content Area */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        
        {/* Dynamic Header */}
        <header className="bg-white border-b border-slate-200 px-8 py-5 flex justify-between items-center shadow-sm z-0">
          <h2 className="text-2xl font-bold text-slate-800 capitalize">
            {activeTab === 'finance' ? 'Finance & Reconciliation' : `${activeTab} Dashboard`}
          </h2>
        </header>
        
        {/* Scrollable Workspace */}
        <div className="flex-1 p-8 overflow-y-auto">
          <div className="max-w-6xl mx-auto">
            
            {/* The Switchboard: Render component based on state */}
            {activeTab === 'operator' && <OperatorDashboard />}
            {activeTab === 'finance' && <FinanceDashboard />}
            {activeTab === 'admin' && <AdminConsole />}
            {activeTab === 'viewer' && <AuditViewer />}

          </div>
        </div>
      </main>
    </div>
  );
}