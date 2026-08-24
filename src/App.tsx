/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router';
import { useState, useEffect } from 'react';
import Portal from './components/Portal';
import Login from './components/Login';
import AdminDashboard from './components/AdminDashboard';
import DriverDashboard from './components/DriverDashboard';
import PhoneContainer from './components/PhoneContainer';
import AndroidGate from './components/AndroidGate';
import { User } from './types';

export default function App() {
  const [dispatchUser, setDispatchUser] = useState<User | null>(null);
  const [driverUser, setDriverUser] = useState<User | null>(null);

  useEffect(() => {
    const checkAuth = () => {
      const storedDispatch = localStorage.getItem('rq_user_dispatch');
      const storedDriver = localStorage.getItem('rq_user_driver');

      if (storedDispatch) {
        setDispatchUser(JSON.parse(storedDispatch));
      } else {
        setDispatchUser(null);
      }

      if (storedDriver) {
        setDriverUser(JSON.parse(storedDriver));
      } else {
        setDriverUser(null);
      }
    };

    checkAuth();
  }, []);

  const handleDispatchLogin = (user: User) => {
    setDispatchUser(user);
    localStorage.setItem('rq_user_dispatch', JSON.stringify(user));
  };

  const handleDriverLogin = (user: User) => {
    setDriverUser(user);
    localStorage.setItem('rq_user_driver', JSON.stringify(user));
  };

  const handleDispatchLogout = () => {
    localStorage.removeItem('rq_user_dispatch');
    setDispatchUser(null);
  };

  const handleDriverLogout = () => {
    localStorage.removeItem('rq_user_driver');
    if (driverUser) {
      localStorage.removeItem(`rq_vehicle_${driverUser.id}`);
    }
    setDriverUser(null);
  };

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
        <Routes>
          <Route path="/" element={<Portal />} />
          
          {/* Dispatch System - Optimized for Google Chrome Workstations */}
          <Route
            path="/admin/*"
            element={
              !dispatchUser ? (
                <div className="min-h-screen flex items-center justify-center p-4 md:p-8 bg-slate-900/5">
                  <div className="w-full max-w-xl">
                    <Login onLogin={handleDispatchLogin} forcedMode="admin" />
                  </div>
                </div>
              ) : (
                <div className="w-full min-h-screen bg-slate-100/70">
                  <AdminDashboard 
                    user={dispatchUser} 
                    onLogout={handleDispatchLogout} 
                    viewMode="computer"
                  />
                </div>
              )
            }
          />

          {/* Driver System - Restricted to Android Mobile / MDT Devices */}
          <Route
            path="/driver/*"
            element={
              <AndroidGate>
                <PhoneContainer title="RQ Driver Terminal">
                  {!driverUser ? (
                    <div className="p-4 bg-white h-full flex flex-col justify-center">
                      <Login onLogin={handleDriverLogin} forcedMode="driver" />
                    </div>
                  ) : (
                    <div className="p-0 h-full flex flex-col">
                      <DriverDashboard user={driverUser} onLogout={handleDriverLogout} />
                    </div>
                  )}
                </PhoneContainer>
              </AndroidGate>
            }
          />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}


