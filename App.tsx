import React, { useState, useEffect } from 'react';
import { TranceProvider, useTrance } from './context/TranceContext';
import { ToastProvider } from './context/ToastContext';

// Screens
import Dashboard from './screens/Dashboard';
import Player from './screens/Player';
import Editor from './screens/Editor';
import Profile from './screens/Profile';
import Upgrade from './screens/Upgrade';

// Marketing
import BDSMLanding from './marketing/BDSMLanding';

const AppNavigation = () => {
  const { currentScreen } = useTrance();

  // Main App Routing
  switch (currentScreen) {
    case 'PLAYER': return <Player />;
    case 'EDITOR': return <Editor />;
    case 'PROFILE': return <Profile />;
    case 'UPGRADE': return <Upgrade />;
    case 'DASHBOARD':
    default: return <Dashboard />;
  }
};

const App = () => {
  const [landingPage, setLandingPage] = useState<string | null>(null);

  // Check for marketing ref params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref');
    if (ref === 'bdsm') {
      setLandingPage('BDSM');
    }
  }, []);

  if (landingPage === 'BDSM') {
    return <BDSMLanding />;
  }

  return (
    <ToastProvider>
      <TranceProvider>
        <AppNavigation />
      </TranceProvider>
    </ToastProvider>
  );
};

export default App;
