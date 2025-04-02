// File: App.js
import React, { useContext } from 'react';
import { Provider as PaperProvider } from 'react-native-paper';
import { NavigationContainer } from '@react-navigation/native';
import { AppProvider, AppContext } from './context/AppContext';
import AuthNavigator from './navigation/AuthNavigator';
import AppNavigator from './navigation/AppNavigator';

function Routes() {
  const { user, loading } = useContext(AppContext);

  if (loading) {
    // Puedes poner un spinner o mensaje de carga
    return null;
  }

  return user ? <AppNavigator /> : <AuthNavigator />;
}

export default function App() {
  return (
    <AppProvider>
      <PaperProvider>
        <NavigationContainer>
          <Routes />
        </NavigationContainer>
      </PaperProvider>
    </AppProvider>
  );
}
