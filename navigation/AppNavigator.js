// File: /navigation/AppNavigator.js
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import HomeScreen from '../screens/HomeScreen';
import SalesScreen from '../screens/SalesScreen';
import InventoryScreen from '../screens/InventoryScreen';

const Tab = createBottomTabNavigator();

export default function AppNavigator() {
  return (
    <Tab.Navigator initialRouteName="Inicio">
      <Tab.Screen name="Inicio" component={HomeScreen} />
      <Tab.Screen name="Ventas" component={SalesScreen} />
      <Tab.Screen name="Inventario" component={InventoryScreen} />
    </Tab.Navigator>
  );
}
