import React from 'react';
import MapView from './components/MapView';
import { AuthProvider } from './contexts/AuthContext';
import ErrorBoundary from './components/ErrorBoundary';

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <div style={{height: '100vh', width: '100%'}}>
          <MapView />
        </div>
      </AuthProvider>
    </ErrorBoundary>
  );
};

export default App;
