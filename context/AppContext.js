// File: /context/AppContext.js
import React, { createContext, useState } from 'react';

export const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [inventory, setInventory] = useState([]);
  const [sales, setSales] = useState([]);

  const addProduct = (product) => {
    setInventory(prev => [...prev, product]);
  };

  const addSale = (sale) => {
    setSales(prev => [...prev, sale]);
  };

  return (
    <AppContext.Provider value={{ inventory, sales, addProduct, addSale }}>
      {children}
    </AppContext.Provider>
  );
};
