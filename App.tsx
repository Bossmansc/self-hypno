import React from 'react';
import { TranceProvider, useTrance } from './context/TranceContext';
import { ToastProvider } from './context/ToastContext';
import Dashboard from './screens/Dashboard';
import Player from './screens/Player';
import Editor from './screens/Editor';
import Profile from './screens/Profile';
import Discovery from './screens/Discovery';

// Content wrapper to use the context safely
function AppContent() {
  const { currentScreen } = useTrance();

  return (
    <div className="h-screen w-full bg-[#1a1a2e] text-white overflow-hidden font-sans selection:bg-indigo-500/30">
      {currentScreen === 'DASHBOARD' && <Dashboard />}
      {currentScreen === 'PLAYER' && <Player />}
      {currentScreen === 'EDITOR' && <Editor />}
      {currentScreen === 'PROFILE' && <Profile />}
      {currentScreen === 'DISCOVERY' && <Discovery />}
    </div>
  );
}

export default function App() {
  return (
    <TranceProvider>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </TranceProvider>
  );
}
