import { useState, useEffect, useRef } from 'react';

export default function NotificationBell({ token }) {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const API_URL = import.meta.env.VITE_API_BASE_URL || 'https://openfloat.onrender.com';

  const fetchUnreadNotifications = async () => {
    if (!token) return;
    try {
      const response = await fetch(`${API_URL}/api/v1/notifications/unread`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setNotifications(data);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  };

  // Fetch immediately, then poll every 30 seconds
  useEffect(() => {
    fetchUnreadNotifications();
    const interval = setInterval(fetchUnreadNotifications, 30000);
    return () => clearInterval(interval);
  }, [token]);

  // Close dropdown if clicking outside of it
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAsRead = async (id) => {
    try {
      await fetch(`${API_URL}/api/v1/notifications/${id}/read`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await fetch(`${API_URL}/api/v1/notifications/read-all`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setNotifications([]);
      setIsOpen(false);
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const getEventColor = (eventType) => {
    if (eventType === 'FAILED_CALLBACK') return 'text-red-500 bg-red-50 border-red-100';
    if (eventType === 'UNKNOWN_REFERENCE') return 'text-orange-500 bg-orange-50 border-orange-100';
    if (eventType === 'NEW_CLIENT') return 'text-green-500 bg-green-50 border-green-100';
    return 'text-blue-500 bg-blue-50 border-blue-100';
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-slate-400 hover:text-slate-600 transition-colors focus:outline-none rounded-full hover:bg-slate-100"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path>
        </svg>
        
        {notifications.length > 0 && (
          <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-white">
            {notifications.length > 99 ? '99+' : notifications.length}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden z-50">
          <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex justify-between items-center">
            <h3 className="text-sm font-bold text-slate-800">System Alerts</h3>
            {notifications.length > 0 && (
              <button 
                onClick={markAllAsRead}
                className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors"
              >
                Mark all as read
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-slate-500 flex flex-col items-center">
                <svg className="w-10 h-10 text-slate-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                <p className="text-sm font-medium">You are all caught up!</p>
                <p className="text-xs mt-1">No new system alerts.</p>
              </div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {notifications.map((alert) => (
                  <li key={alert.id} className="p-4 hover:bg-slate-50 transition-colors flex gap-3 group">
                    <div className={`mt-0.5 shrink-0 w-8 h-8 rounded-full border flex items-center justify-center ${getEventColor(alert.eventType)}`}>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-800 mb-0.5 tracking-wide">{alert.eventType.replace('_', ' ')}</p>
                      <p className="text-sm text-slate-600 leading-snug">{alert.message}</p>
                      <p className="text-[10px] text-slate-400 mt-2 font-mono">{alert.createdAt}</p>
                    </div>
                    <button 
                      onClick={() => markAsRead(alert.id)}
                      className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 text-slate-400 hover:text-slate-700 rounded-md hover:bg-slate-200 h-fit"
                      title="Dismiss"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                      </svg>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}