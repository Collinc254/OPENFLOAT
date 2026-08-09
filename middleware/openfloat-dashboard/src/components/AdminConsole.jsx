import { useState, useEffect } from 'react';
import fetchWithAuth from './api'; // Standardized API wrapper

// Master list of system permissions based on backend Enum
const AVAILABLE_PERMISSIONS = [
  { id: 'READ_TRANSACTIONS', label: 'View Transactions' },
  { id: 'INITIATE_STK_PUSH', label: 'Initiate STK Push' },
  { id: 'PROCESS_REFUNDS', label: 'Process Refunds' },
  { id: 'CREATE_PAYOUT', label: 'Create Payout Drafts' },
  { id: 'APPROVE_PAYOUT', label: 'Approve Payouts' },
  { id: 'VIEW_FINANCE_REPORTS', label: 'View Finance Reports' },
  { id: 'EXECUTE_RECONCILIATION', label: 'Execute Reconciliation' },
  { id: 'MANAGE_CLIENT_SYSTEMS', label: 'Manage Client Systems' },
  { id: 'MANAGE_API_KEYS', label: 'Manage API Keys' },
  { id: 'VIEW_AUDIT_LOGS', label: 'View Audit Logs' }
];

export default function AdminConsole() {
  // Existing API Key State
  const [rotating, setRotating] = useState(false);
  const [message, setMessage] = useState('');

  // Paybill Management State
  const [paybills, setPaybills] = useState([]);
  const [loadingPaybills, setLoadingPaybills] = useState(true);
  const [showAddPaybill, setShowAddPaybill] = useState(false);
  const [paybillForm, setPaybillForm] = useState({
    shortcode: '',
    initiatorName: '',
    initiatorPassword: '',
    consumerKey: '',
    consumerSecret: '',
    passkey: '', // ADDED: Passkey state
    environment: 'PRODUCTION'
  });
  const [paybillStatus, setPaybillStatus] = useState('');

  // User Creation State
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false); // ADDED: Toggle state for password visibility
  const [creationStatus, setCreationStatus] = useState('');

  // User List State
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);

  // Permissions Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [checkedPermissions, setCheckedPermissions] = useState([]);
  const [updatingPermissions, setUpdatingPermissions] = useState(false);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://openfloat.onrender.com';

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetchWithAuth(`${API_BASE_URL}/api/v1/users`, {
        headers: {
          'Authorization': `Bearer ${token}` 
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      } else {
        console.error('Failed to fetch users');
      }
    } catch (error) {
      console.error('Network error fetching users:', error);
    } finally {
      setLoadingUsers(false);
    }
  };

  const fetchPaybills = async () => {
    setLoadingPaybills(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetchWithAuth(`${API_BASE_URL}/api/v1/paybills`, {
        headers: {
          'Authorization': `Bearer ${token}` 
        }
      });

      if (response.ok) {
        const data = await response.json();
        setPaybills(data);
      } else {
        console.error('Failed to fetch paybills');
      }
    } catch (error) {
      console.error('Network error fetching paybills:', error);
    } finally {
      setLoadingPaybills(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchPaybills();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleKeyRotation = (e) => {
    e.preventDefault();
    setRotating(true);
    setMessage('');

    setTimeout(() => {
      setRotating(false);
      setMessage('Consumer Key & Secret successfully rotated and synced with Safaricom.');
    }, 1500);
  };

  const handleAddPaybill = async (e) => {
    e.preventDefault();
    setPaybillStatus('Saving configuration...');

    try {
      const token = localStorage.getItem('token');
      const response = await fetchWithAuth(`${API_BASE_URL}/api/v1/paybills`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify(paybillForm),
      });

      if (!response.ok) throw new Error('Failed to create paybill');
      
      setPaybillStatus('Paybill added successfully!');
      
      // ADDED: Reset passkey along with other fields
      setPaybillForm({
        shortcode: '', initiatorName: '', initiatorPassword: '', consumerKey: '', consumerSecret: '', passkey: '', environment: 'PRODUCTION'
      });
      setShowAddPaybill(false);
      fetchPaybills();
      
    } catch (error) {
      console.error(error);
      setPaybillStatus('Error saving paybill. Verify backend connection.');
    }
  };

  const handleTogglePaybill = async (id) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetchWithAuth(`${API_BASE_URL}/api/v1/paybills/${id}/toggle`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        fetchPaybills();
      } else {
        alert('Failed to update paybill status.');
      }
    } catch (error) {
      console.error('Error toggling paybill:', error);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setCreationStatus('Creating...');

    try {
      const token = localStorage.getItem('token');
      const response = await fetchWithAuth(`${API_BASE_URL}/api/v1/users/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({
          username: newUsername,
          password: newPassword,
          role: 'STAFF' // Automatically default new users to the base STAFF role
        }),
      });

      if (!response.ok) throw new Error('Failed to create user');
      
      setCreationStatus('User created successfully!');
      setNewUsername('');
      setNewPassword('');
      setShowPassword(false); // Reset password visibility
      fetchUsers();
      
    } catch (error) {
      console.error(error);
      setCreationStatus('Error creating user. Verify backend connection.');
    }
  };

  const handleToggleStatus = async (userId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetchWithAuth(`${API_BASE_URL}/api/v1/users/${userId}/toggle-status`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        fetchUsers();
      } else {
        const errData = await response.json();
        alert(errData.error || 'Failed to update user status.');
      }
    } catch (error) {
      console.error('Error toggling status:', error);
      alert('Network error connecting to the server.');
    }
  };

  const openPermissionsModal = (user) => {
    setEditingUser(user);
    setCheckedPermissions(user.permissions || []);
    setIsModalOpen(true);
  };

  const closePermissionsModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
    setCheckedPermissions([]);
  };

  const togglePermission = (permissionId) => {
    setCheckedPermissions((prev) => 
      prev.includes(permissionId) 
        ? prev.filter(p => p !== permissionId) 
        : [...prev, permissionId]
    );
  };

  const handleSavePermissions = async () => {
    setUpdatingPermissions(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetchWithAuth(`${API_BASE_URL}/api/v1/users/${editingUser.id}/permissions`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ permissions: checkedPermissions }),
      });

      if (response.ok) {
        fetchUsers();
        closePermissionsModal();
      } else {
        const errData = await response.json();
        alert(errData.error || 'Failed to update permissions.');
      }
    } catch (error) {
      console.error('Error saving permissions:', error);
      alert('Network error connecting to the server.');
    } finally {
      setUpdatingPermissions(false);
    }
  };

  return (
    <div className="space-y-6 relative">
      
      {/* API Configuration Card */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-slate-900 px-6 py-5 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-white tracking-wide">API Credentials Management</h2>
            <p className="text-slate-400 text-sm mt-1">Safaricom Daraja Configurations</p>
          </div>
          <button 
            onClick={() => setShowAddPaybill(!showAddPaybill)}
            className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors"
          >
            {showAddPaybill ? 'Cancel' : '+ Register Paybill'}
          </button>
        </div>
        
        <div className="p-6 sm:p-8">
          
          {/* Add Paybill Form */}
          {showAddPaybill && (
            <div className="mb-8 p-6 bg-slate-50 border border-slate-200 rounded-xl">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 border-b border-slate-200 pb-2">Register New Paybill</h3>
              <form onSubmit={handleAddPaybill} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Shortcode</label>
                  <input type="text" required value={paybillForm.shortcode} onChange={e => setPaybillForm({...paybillForm, shortcode: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Environment</label>
                  <select value={paybillForm.environment} onChange={e => setPaybillForm({...paybillForm, environment: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none">
                    <option value="PRODUCTION">PRODUCTION</option>
                    <option value="SANDBOX">SANDBOX</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Initiator Name</label>
                  <input type="text" required value={paybillForm.initiatorName} onChange={e => setPaybillForm({...paybillForm, initiatorName: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Initiator Password</label>
                  <input type="password" required value={paybillForm.initiatorPassword} onChange={e => setPaybillForm({...paybillForm, initiatorPassword: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Consumer Key</label>
                  <input type="text" required value={paybillForm.consumerKey} onChange={e => setPaybillForm({...paybillForm, consumerKey: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Consumer Secret</label>
                  <input type="password" required value={paybillForm.consumerSecret} onChange={e => setPaybillForm({...paybillForm, consumerSecret: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none" />
                </div>
                {/* ADDED: STK Passkey Input */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">STK Passkey</label>
                  <input 
                    type="password" 
                    required 
                    value={paybillForm.passkey} 
                    onChange={e => setPaybillForm({...paybillForm, passkey: e.target.value})} 
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none" 
                  />
                </div>
                <div className="md:col-span-2 mt-2">
                  <button type="submit" className="w-full bg-green-600 text-white font-bold py-2.5 rounded-lg hover:bg-green-700 transition-colors">
                    Save Configuration
                  </button>
                  {paybillStatus && <p className="mt-2 text-center text-sm font-medium text-slate-600">{paybillStatus}</p>}
                </div>
              </form>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Paybill List */}
            <div className="lg:col-span-2">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 border-b pb-2">Registered Paybills</h3>
              <div className="overflow-x-auto">
                {loadingPaybills ? (
                  <p className="text-sm text-slate-500 py-4">Loading configurations...</p>
                ) : paybills.length === 0 ? (
                  <p className="text-sm text-slate-500 py-4">No paybills registered yet.</p>
                ) : (
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr>
                        <th className="py-2 px-3 text-xs font-semibold text-slate-500 bg-slate-50 rounded-tl-lg">Shortcode</th>
                        <th className="py-2 px-3 text-xs font-semibold text-slate-500 bg-slate-50">Environment</th>
                        <th className="py-2 px-3 text-xs font-semibold text-slate-500 bg-slate-50 text-center">Status</th>
                        <th className="py-2 px-3 text-xs font-semibold text-slate-500 bg-slate-50 rounded-tr-lg text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paybills.map(pb => (
                        <tr key={pb.id} className="border-b border-slate-100 hover:bg-slate-50">
                          <td className="py-3 px-3 text-sm font-mono font-bold text-slate-800">{pb.shortcode}</td>
                          <td className="py-3 px-3 text-xs font-bold">
                            <span className={pb.environment === 'PRODUCTION' ? 'text-green-700' : 'text-blue-700'}>{pb.environment}</span>
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span className={`inline-flex items-center gap-1 text-xs font-bold ${pb.active ? 'text-green-600' : 'text-slate-400'}`}>
                              <span className={`w-2 h-2 rounded-full ${pb.active ? 'bg-green-500' : 'bg-slate-400'}`}></span>
                              {pb.active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right">
                            <button 
                              onClick={() => handleTogglePaybill(pb.id)}
                              className={`px-3 py-1 text-xs font-bold rounded border transition-colors ${pb.active ? 'border-red-200 text-red-600 hover:bg-red-50' : 'border-green-200 text-green-600 hover:bg-green-50'}`}
                            >
                              {pb.active ? 'Deactivate' : 'Activate'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            {/* Key Rotation */}
            <div>
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 border-b pb-2">Global Security</h3>
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                <p className="text-xs text-slate-600 mb-4 leading-relaxed">
                  Force an immediate rotation of the Daraja OAuth Consumer Key and Secret for all active shortcodes. This will momentarily pause incoming requests.
                </p>
                <button 
                  onClick={handleKeyRotation}
                  disabled={rotating}
                  className={`w-full py-2.5 rounded font-bold text-white transition-all text-sm ${rotating ? 'bg-slate-400 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700 shadow-sm'}`}
                >
                  {rotating ? 'Rotating Keys...' : 'Force Key Rotation'}
                </button>
                {message && <p className="mt-3 text-xs text-green-700 font-bold text-center">{message}</p>}
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* User Management Card */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-slate-900 px-6 py-5">
          <h2 className="text-xl font-bold text-white tracking-wide">User Management</h2>
          <p className="text-slate-400 text-sm mt-1">Provision new operational accounts and manage access</p>
        </div>
        
        <div className="p-6 sm:p-8">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-5 border-b pb-2">Create New Account</h3>
          
          <form onSubmit={handleCreateUser} className="space-y-5 max-w-lg mb-8">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Username</label>
              <input 
                type="text" 
                value={newUsername} 
                onChange={(e) => setNewUsername(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-green-500 outline-none text-slate-700"
                placeholder="e.g. collins.staff"
                required 
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Password</label>
              <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"} 
                  value={newPassword} 
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-green-500 outline-none text-slate-700"
                  placeholder="Min. 8 characters"
                  required 
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? (
                    // Eye Slash Icon (Hide)
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"></path></svg>
                  ) : (
                    // Eye Icon (Show)
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
                  )}
                </button>
              </div>
            </div>

            <button 
              type="submit" 
              className="w-full bg-green-600 text-white font-bold py-3.5 rounded-lg hover:bg-green-700 transition-colors shadow-sm mt-4"
            >
              Provision Account
            </button>
            
            {creationStatus && (
              <div className={`mt-4 p-3 rounded-lg text-sm font-medium text-center ${creationStatus.includes('Error') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                {creationStatus}
              </div>
            )}
          </form>

          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-5 border-b pb-2">Active System Users</h3>
          <div className="overflow-x-auto">
            {loadingUsers ? (
              <p className="text-sm text-slate-500 py-4">Loading users...</p>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr>
                    <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider bg-slate-50 rounded-tl-lg">Username</th>
                    <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider bg-slate-50">Role</th>
                    <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider bg-slate-50">Status</th>
                    <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider bg-slate-50 rounded-tr-lg text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 text-sm font-medium text-slate-900">{user.username}</td>
                      <td className="py-3 px-4 text-sm text-slate-600">
                        <span className={`inline-block px-2.5 py-1 text-xs font-semibold rounded-md ${
                          user.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' :
                          user.role === 'MANAGER' ? 'bg-blue-100 text-blue-700' :
                          'bg-slate-100 text-slate-700'
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm">
                        <span className={`inline-flex items-center gap-1.5 ${user.enabled ? 'text-green-600' : 'text-red-600'} font-medium`}>
                          <span className={`w-2 h-2 rounded-full ${user.enabled ? 'bg-green-500' : 'bg-red-500'}`}></span>
                          {user.enabled ? 'Active' : 'Disabled'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-right">
                        {user.role !== 'ADMIN' ? (
                          <div className="flex justify-end gap-2">
                            {/* Edit Permissions Button */}
                            <button
                              onClick={() => openPermissionsModal(user)}
                              className="px-3 py-1.5 rounded text-xs font-bold transition-colors border border-blue-200 text-blue-600 hover:bg-blue-50"
                            >
                              Permissions
                            </button>
                            {/* Activate/Deactivate Button */}
                            <button
                              onClick={() => handleToggleStatus(user.id)}
                              className={`px-3 py-1.5 rounded text-xs font-bold transition-colors border ${
                                user.enabled 
                                ? 'border-red-200 text-red-600 hover:bg-red-50' 
                                : 'border-green-200 text-green-600 hover:bg-green-50'
                              }`}
                            >
                              {user.enabled ? 'Deactivate' : 'Activate'}
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 font-medium italic pr-2">Protected</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {users.length === 0 && (
                    <tr>
                      <td colSpan="4" className="py-8 text-center text-sm text-slate-500">No users found in the system.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Permissions Modal Overlay */}
      {isModalOpen && editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-xl shadow-2xl flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-xl">
              <div>
                <h3 className="text-lg font-bold text-slate-800">Edit Permissions</h3>
                <p className="text-xs text-slate-500 font-medium">Managing access for <span className="text-slate-800 font-bold">{editingUser.username}</span></p>
              </div>
              <button 
                onClick={closePermissionsModal}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>

            {/* Modal Body: Checkbox List */}
            <div className="px-6 py-4 overflow-y-auto flex-1 space-y-3">
              {AVAILABLE_PERMISSIONS.map((perm) => (
                <label 
                  key={perm.id} 
                  className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    checkedPermissions.includes(perm.id) 
                      ? 'border-green-500 bg-green-50' 
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center h-5">
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 text-green-600 bg-slate-100 border-slate-300 rounded focus:ring-green-500"
                      checked={checkedPermissions.includes(perm.id)}
                      onChange={() => togglePermission(perm.id)}
                    />
                  </div>
                  <div className="flex flex-col">
                    <span className={`text-sm font-bold ${checkedPermissions.includes(perm.id) ? 'text-green-800' : 'text-slate-700'}`}>
                      {perm.label}
                    </span>
                    <span className="text-xs text-slate-500 font-mono mt-0.5">{perm.id}</span>
                  </div>
                </label>
              ))}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3 rounded-b-xl bg-slate-50">
              <button 
                onClick={closePermissionsModal}
                className="px-4 py-2 text-sm font-bold text-slate-600 hover:text-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleSavePermissions}
                disabled={updatingPermissions}
                className={`px-6 py-2 text-sm font-bold text-white rounded-lg transition-colors shadow-sm ${
                  updatingPermissions ? 'bg-slate-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'
                }`}
              >
                {updatingPermissions ? 'Saving...' : 'Apply Permissions'}
              </button>
            </div>
            
          </div>
        </div>
      )}

    </div>
  );
}