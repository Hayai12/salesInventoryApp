// File: /navigation/AppNavigator.js
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import HomeScreen from '../screens/HomeScreen';
import SalesScreen from '../screens/SalesScreen';
import InventoryScreen from '../screens/InventoryScreen';
import ProductsScreen from '../screens/ProductsScreen';

const Tab = createBottomTabNavigator();

export default function AppNavigator() {
  return (
    <Tab.Navigator initialRouteName="Home">
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Sales" component={SalesScreen} />
      <Tab.Screen name="Inventory" component={InventoryScreen} />
      <Tab.Screen name="Products" component={ProductsScreen} />
    </Tab.Navigator>
  );
}
