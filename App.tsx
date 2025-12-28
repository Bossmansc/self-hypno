import React from 'react';
import { TranceProvider, useTrance } from './context/TranceContext';
import { ToastProvider } from './context/ToastContext';
import Dashboard from './screens/Dashboard';
import Player from './screens/Player';
import Editor from './screens/Editor';
import Profile from './screens/Profile';
import Discovery from './screens/Discovery';

const AppContent = () => {
  const { currentScreen } = useTrance();

  switch (currentScreen) {
    case 'PLAYER':
      return <Player />;
    case 'EDITOR':
      return <Editor />;
    case 'PROFILE':
      return <Profile />;
    case 'DISCOVERY':
      return <Discovery />;
    case 'DASHBOARD':
    default:
      return <Dashboard />;
  }
};

export default function App() {
  return (
    <ToastProvider>
      <TranceProvider>
        <AppContent />
      </TranceProvider>
    </ToastProvider>
  );
}
