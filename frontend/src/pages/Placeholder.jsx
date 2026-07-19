import React from 'react';
import Navbar from '../components/layout/Navbar';
import Sidebar from '../components/layout/Sidebar';
import { PackageOpen } from 'lucide-react';

const Placeholder = ({ title, description }) => {
  return (
    <div className="flex flex-col min-h-screen bg-gray-950 text-white">
      <Navbar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 p-6 overflow-y-auto w-full text-left flex flex-col items-center justify-center">
          <div className="max-w-md w-full text-center space-y-6">
            <div className="mx-auto w-16 h-16 bg-gray-900 rounded-2xl border border-gray-800 flex items-center justify-center shadow-lg">
              <PackageOpen size={32} className="text-indigo-500" />
            </div>
            
            <div className="space-y-2">
              <h1 className="text-2xl font-bold tracking-tight text-white">{title}</h1>
              <p className="text-sm text-gray-400">{description}</p>
            </div>

            <div className="rounded-xl border border-gray-850 bg-gray-900/50 p-6 space-y-4 shadow-sm">
              <div className="inline-block px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold uppercase tracking-wider">
                Module Ready
              </div>
              <p className="text-sm text-gray-300">
                This module is ready for integration. The UI layout and routing structure are fully prepared to connect with backend services.
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Placeholder;
