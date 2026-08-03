import { useState } from 'react';
import Login from './components/Login';
import OperatorDashboard from './components/OperatorDashboard';
import FinanceDashboard from './components/FinanceDashboard';
import AdminConsole from './components/AdminConsole';
import AuditViewer from './components/AuditViewer';
import Payouts from './components/Payouts'; 
import ClientManagement from './components/ClientManagement';
import NotificationBell from './components/NotificationBell'; // Added Import

export default function App() {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('openfloat_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  
  const [activeTab, setActiveTab] = useState('operator'); 
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 768);

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    localStorage.setItem('openfloat_user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('openfloat_user');
    localStorage.removeItem('token');
    localStorage.removeItem('role'); 
  };

  // === ROLE-BASED ACCESS CONTROL (RBAC) LOGIC ===
  const isManagerOrAdmin = user?.role === 'ADMIN' || user?.role === 'MANAGER';
  const isAdmin = user?.role === 'ADMIN';

  const handleTabChange = (tab) => {
    // 1. STRICT STATE GUARD: Prevent unauthorized state changes (Added 'clients' here)
    if ((tab === 'payouts' || tab === 'finance' || tab === 'clients') && !isManagerOrAdmin) {
      console.warn("Security Alert: Unauthorized access attempt blocked.");
      return;
    }
    if ((tab === 'admin' || tab === 'viewer') && !isAdmin) {
      console.warn("Security Alert: Unauthorized access attempt blocked.");
      return;
    }

    setActiveTab(tab);
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  };

  if (!user) {
    return <Login onSuccessfulLogin={handleLoginSuccess} />;
  }

  // 2. FALLBACK COMPONENT: If a user breaks the state, show this instead of a blank screen
  const UnauthorizedAccess = () => (
    <div className="flex flex-col items-center justify-center h-full text-center px-4">
      <div className="bg-red-50 p-6 rounded-full mb-4 border-8 border-red-100">
        <svg className="w-12 h-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
      </div>
      <h2 className="text-2xl font-bold text-slate-900 mb-2">Access Denied</h2>
      <p className="text-slate-500 max-w-md">Your current role ({user.role}) does not have the required permissions to view this workspace.</p>
    </div>
  );

  return (
    <div className="h-screen w-full bg-slate-50 flex relative overflow-hidden">
      
      {/* MOBILE BACKDROP */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 md:hidden transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* RESPONSIVE SIDEBAR */}
      <aside className={`
        bg-slate-900 text-white flex flex-col shadow-2xl z-50 transition-all duration-300 ease-in-out whitespace-nowrap overflow-hidden
        fixed md:relative h-full
        ${isSidebarOpen ? 'translate-x-0 w-64' : '-translate-x-full md:translate-x-0 md:w-20 w-64'}
      `}>
        
        <div className={`p-6 border-b border-slate-800 flex items-center h-20 shrink-0 ${isSidebarOpen ? 'justify-start' : 'justify-center'}`}>
          {isSidebarOpen ? (
            <div className="animate-in fade-in duration-300">
              <h1 className="text-2xl font-bold tracking-wide">OpenFloat</h1>
              <p className="text-xs text-slate-400 mt-1 uppercase tracking-wider">Enterprise Portal</p>
            </div>
          ) : (
            <h1 className="text-2xl font-bold tracking-wide text-green-500 animate-in fade-in duration-300">OF</h1>
          )}
        </div>
        
        <nav className="flex-1 py-6 overflow-y-auto overflow-x-hidden custom-scrollbar">
          <ul className="space-y-2 px-3">
            
            {/* TIER 1: STAFF */}
            <li>
              <button 
                onClick={() => handleTabChange('operator')}
                title="Operator Dashboard"
                className={`w-full flex items-center p-3 rounded-lg text-sm font-medium transition-all group ${activeTab === 'operator' ? 'bg-green-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800'} ${isSidebarOpen ? 'gap-3 justify-start' : 'justify-center'}`}
              >
                <svg className={`flex-shrink-0 transition-transform ${isSidebarOpen ? 'w-5 h-5' : 'w-6 h-6 group-hover:scale-110'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path></svg>
                <span className={`transition-opacity duration-300 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 hidden'}`}>
                  Operator Dashboard
                </span>
              </button>
            </li>

            {/* TIER 2: MANAGERS & ADMINS */}
            {isManagerOrAdmin && (
              <>
                <li>
                  <button 
                    onClick={() => handleTabChange('payouts')}
                    title="Payouts"
                    className={`w-full flex items-center p-3 rounded-lg text-sm font-medium transition-all group ${activeTab === 'payouts' ? 'bg-green-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800'} ${isSidebarOpen ? 'gap-3 justify-start' : 'justify-center'}`}
                  >
                    <svg className={`flex-shrink-0 transition-transform ${isSidebarOpen ? 'w-5 h-5' : 'w-6 h-6 group-hover:scale-110'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    <span className={`transition-opacity duration-300 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 hidden'}`}>
                      Payouts
                    </span>
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => handleTabChange('finance')}
                    title="Finance & Recon"
                    className={`w-full flex items-center p-3 rounded-lg text-sm font-medium transition-all group ${activeTab === 'finance' ? 'bg-green-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800'} ${isSidebarOpen ? 'gap-3 justify-start' : 'justify-center'}`}
                  >
                    <svg className={`flex-shrink-0 transition-transform ${isSidebarOpen ? 'w-5 h-5' : 'w-6 h-6 group-hover:scale-110'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
                    <span className={`transition-opacity duration-300 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 hidden'}`}>
                      Finance & Recon
                    </span>
                  </button>
                </li>
                
                {/* 2. Added API Gateway Button */}
                <li>
                  <button 
                    onClick={() => handleTabChange('clients')}
                    title="API Gateway"
                    className={`w-full flex items-center p-3 rounded-lg text-sm font-medium transition-all group ${activeTab === 'clients' ? 'bg-green-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800'} ${isSidebarOpen ? 'gap-3 justify-start' : 'justify-center'}`}
                  >
                    <svg className={`flex-shrink-0 transition-transform ${isSidebarOpen ? 'w-5 h-5' : 'w-6 h-6 group-hover:scale-110'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                    <span className={`transition-opacity duration-300 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 hidden'}`}>
                      API Gateway
                    </span>
                  </button>
                </li>
              </>
            )}
            
            {/* TIER 3: ADMINS ONLY */}
            {isAdmin && (
              <>
                <li>
                  <button 
                    onClick={() => handleTabChange('admin')}
                    title="Admin Console"
                    className={`w-full flex items-center p-3 rounded-lg text-sm font-medium transition-all group ${activeTab === 'admin' ? 'bg-green-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800'} ${isSidebarOpen ? 'gap-3 justify-start' : 'justify-center'}`}
                  >
                    <svg className={`flex-shrink-0 transition-transform ${isSidebarOpen ? 'w-5 h-5' : 'w-6 h-6 group-hover:scale-110'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                    <span className={`transition-opacity duration-300 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 hidden'}`}>
                      Admin Console
                    </span>
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => handleTabChange('viewer')}
                    title="Audit Viewer"
                    className={`w-full flex items-center p-3 rounded-lg text-sm font-medium transition-all group ${activeTab === 'viewer' ? 'bg-green-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800'} ${isSidebarOpen ? 'gap-3 justify-start' : 'justify-center'}`}
                  >
                    <svg className={`flex-shrink-0 transition-transform ${isSidebarOpen ? 'w-5 h-5' : 'w-6 h-6 group-hover:scale-110'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path></svg>
                    <span className={`transition-opacity duration-300 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 hidden'}`}>
                      Audit Viewer
                    </span>
                  </button>
                </li>
              </>
            )}
          </ul>
        </nav>

        <div className={`p-4 border-t border-slate-800 bg-slate-950 shrink-0 transition-all ${isSidebarOpen ? '' : 'flex flex-col items-center'}`}>
          {isSidebarOpen ? (
            <div className="mb-4 animate-in fade-in duration-300">
              <p className="text-xs text-slate-500 uppercase tracking-wider">Logged in as</p>
              <p className="font-bold text-slate-200 mt-1">{user.username}</p>
              <p className="text-xs text-green-400 mt-0.5">{user.role} Access</p>
            </div>
          ) : (
            <div className="mb-4 pt-2 hidden md:block">
              <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-200 font-bold border border-slate-700 shadow-inner">
                {user.username.charAt(0).toUpperCase()}
              </div>
            </div>
          )}
          
          <button 
            onClick={handleLogout}
            title="Sign Out"
            className={`flex justify-center items-center py-2.5 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 hover:text-red-300 transition-colors text-sm font-semibold border border-red-500/20 ${isSidebarOpen ? 'w-full gap-2' : 'w-10 h-10 p-0 rounded-full'}`}
          >
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
            {isSidebarOpen && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-screen overflow-x-hidden relative">
        
        {/* UPDATED HEADER: flex-justify-between and added the NotificationBell */}
        <header className="bg-white border-b border-slate-200 px-6 py-5 flex items-center justify-between shadow-sm z-10 h-20 shrink-0">
          <div className="flex items-center">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 mr-4 bg-slate-100 text-slate-500 rounded-lg hover:bg-slate-200 hover:text-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path>
              </svg>
            </button>

            {/* 3. Updated Dynamic Header Title */}
            <h2 className="text-xl md:text-2xl font-bold text-slate-800 capitalize truncate">
              {activeTab === 'finance' ? 'Finance & Reconciliation' : 
               activeTab === 'payouts' ? 'Payouts' : 
               activeTab === 'clients' ? 'API Gateway' :
               `${activeTab} Dashboard`}
            </h2>
          </div>

          {/* ADDED NOTIFICATION BELL HERE */}
          <div className="flex items-center gap-4">
            <NotificationBell token={user.token} />
          </div>
        </header>
        
        <div className="flex-1 overflow-x-hidden bg-slate-50 relative flex flex-col h-full">
          {activeTab === 'operator' ? (
            <OperatorDashboard />
          ) : (
            <div className="p-4 md:p-8 h-full overflow-y-auto">
              <div className="max-w-6xl mx-auto bg-white p-4 md:p-6 rounded-xl shadow-sm border border-slate-100 h-full min-h-[500px]">
                
                {/* 4. Added ClientManagement Route */}
                {activeTab === 'payouts' && (isManagerOrAdmin ? <Payouts /> : <UnauthorizedAccess />)}
                {activeTab === 'finance' && (isManagerOrAdmin ? <FinanceDashboard token={user.token} /> : <UnauthorizedAccess />)}
                {activeTab === 'clients' && (isManagerOrAdmin ? <ClientManagement /> : <UnauthorizedAccess />)}
                {activeTab === 'admin' && (isAdmin ? <AdminConsole /> : <UnauthorizedAccess />)}
                {activeTab === 'viewer' && (isAdmin ? <AuditViewer token={user.token} /> : <UnauthorizedAccess />)}
                
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}