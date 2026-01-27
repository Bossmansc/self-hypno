import React from 'react';
import { TranceProvider, useTrance } from './context/TranceContext';
import { ToastProvider } from './context/ToastContext';
import Dashboard from './screens/Dashboard';
import Player from './screens/Player';
import Editor from './screens/Editor';
import Profile from './screens/Profile';
import Upgrade from './screens/Upgrade';
import { AnimatePresence } from 'framer-motion';

const ScreenRouter = () => {
  const { currentScreen } = useTrance();

  return (
    <div className="h-screen w-screen bg-[#1a1a2e] text-white overflow-hidden relative font-sans selection:bg-indigo-500/30">
      <AnimatePresence mode="wait">
        {currentScreen === 'DASHBOARD' && <Dashboard key="dashboard" />}
        {currentScreen === 'PLAYER' && <Player key="player" />}
        {currentScreen === 'EDITOR' && <Editor key="editor" />}
        {currentScreen === 'PROFILE' && <Profile key="profile" />}
        {currentScreen === 'UPGRADE' && <Upgrade key="upgrade" />}
      </AnimatePresence>
    </div>
  );
};

export default function App() {
  return (
    <TranceProvider>
      <ToastProvider>
        <ScreenRouter />
      </ToastProvider>
    </TranceProvider>
  );
}
