import { useState, useEffect } from 'react';
import fetchWithAuth from './api'; // ADDED: Standardized API wrapper

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

  // User Creation State
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState('STAFF'); 
  const [creationStatus, setCreationStatus] = useState('');

  // User List State
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);

  // Permissions Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [checkedPermissions, setCheckedPermissions] = useState([]);
  const [updatingPermissions, setUpdatingPermissions] = useState(false);

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const token = localStorage.getItem('token');
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://openfloat.onrender.com';

      // SWAPPED: fetch -> fetchWithAuth
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

  useEffect(() => {
    fetchUsers();
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

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setCreationStatus('Creating...');

    try {
      const token = localStorage.getItem('token');
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://openfloat.onrender.com';

      // SWAPPED: fetch -> fetchWithAuth
      const response = await fetchWithAuth(`${API_BASE_URL}/api/v1/users/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({
          username: newUsername,
          password: newPassword,
          role: selectedRole
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create user');
      }
      
      setCreationStatus('User created successfully!');
      setNewUsername('');
      setNewPassword('');
      
      fetchUsers();
      
    } catch (error) {
      console.error(error);
      setCreationStatus('Error creating user. Verify backend connection.');
    }
  };

  const handleToggleStatus = async (userId) => {
    try {
      const token = localStorage.getItem('token');
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://openfloat.onrender.com';

      // SWAPPED: fetch -> fetchWithAuth
      const response = await fetchWithAuth(`${API_BASE_URL}/api/v1/users/${userId}/toggle-status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}` 
        }
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
    // Initialize checkboxes with the user's existing permissions from the backend
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
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://openfloat.onrender.com';

      // SWAPPED: fetch -> fetchWithAuth
      const response = await fetchWithAuth(`${API_BASE_URL}/api/v1/users/${editingUser.id}/permissions`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({
          permissions: checkedPermissions
        }),
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
        <div className="bg-slate-900 px-6 py-5">
          <h2 className="text-xl font-bold text-white tracking-wide">API Credentials Management</h2>
          <p className="text-slate-400 text-sm mt-1">Safaricom Daraja Configuration</p>
        </div>
        
        <div className="p-6 sm:p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Paybill Settings */}
            <div>
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 border-b pb-2">Active Paybill</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Shortcode</label>
                  <input type="text" disabled value="4320161" className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded text-slate-700 font-mono" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Environment</label>
                  <span className="inline-block px-3 py-1 bg-green-100 text-green-800 text-xs font-bold rounded-full">PRODUCTION</span>
                </div>
              </div>
            </div>

            {/* Key Rotation */}
            <div>
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 border-b pb-2">Secrets Manager</h3>
              <p className="text-sm text-slate-600 mb-4">
                Force an immediate rotation of the Daraja OAuth Consumer Key and Secret. This will momentarily pause incoming requests.
              </p>
              <button 
                onClick={handleKeyRotation}
                disabled={rotating}
                className={`w-full py-2.5 rounded font-bold text-white transition-all ${rotating ? 'bg-slate-400 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700'}`}
              >
                {rotating ? 'Rotating Keys...' : 'Force Key Rotation'}
              </button>
              {message && <p className="mt-3 text-sm text-green-700 font-medium">{message}</p>}
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
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Temporary Password</label>
              <input 
                type="password" 
                value={newPassword} 
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-green-500 outline-none text-slate-700"
                placeholder="Min. 8 characters"
                required 
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">System Role</label>
              <div className="relative">
                <select 
                  value={selectedRole} 
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-green-500 outline-none text-slate-700 font-medium appearance-none"
                >
                  <option value="STAFF">Staff (Single STK Operations Only)</option>
                  <option value="MANAGER">Manager (Includes Payouts & Finance Reports)</option>
                  <option value="ADMIN">Administrator (Full System Access)</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </div>
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