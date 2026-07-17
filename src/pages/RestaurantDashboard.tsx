import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { Tables } from './Tables';
import { Menus } from './Menus';
import { Staffs } from './Staffs';
import { Notifications } from './Notifications';

export const RestaurantDashboard: React.FC = () => {
  const { user, restaurantId, authLoading } = useAuth();

  if (authLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-gray-50 text-gray-500 font-medium">
        Validating Multi-Tenant Isolation Signature...
      </div>
    );
  }

  // Zero-Trust Boundary Interceptor
  if (!user || !restaurantId || restaurantId.trim() === '') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-red-50 border border-red-200 rounded-xl p-6 text-red-800 shadow-sm">
          <h2 className="text-lg font-bold mb-2">Security Enforcement Rejection</h2>
          <p className="text-sm leading-relaxed">
            Operational workspace initialization terminated. Your user identity context is missing a valid restaurant tenant reference scope binding. Execution halted.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 flex flex-col">
      {/* Structural Header Context */}
      <header className="bg-white border-b border-gray-200 py-4 px-8 flex justify-between items-center shadow-sm">
        <div>
          <h1 className="text-lg font-black tracking-tight text-indigo-600 uppercase">Dastarkhwan Engine</h1>
          <p className="text-xs font-mono text-gray-400">Scope Reference: {restaurantId}</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-semibold text-gray-800">{user.email}</p>
          <span className="inline-block text-[10px] bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded font-bold uppercase tracking-wider">
            Verified Owner
          </span>
        </div>
      </header>

      {/* Grid Execution Space */}
      <main className="p-8 grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-7xl w-full mx-auto self-center">
        <Notifications />
        <Tables />
        <Menu />
        <Staff />
      </main>
    </div>
  );
};