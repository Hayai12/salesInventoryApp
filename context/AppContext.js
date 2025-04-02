// File: /context/AppContext.js
import React, { createContext, useState, useEffect } from 'react';
import { auth, db } from '../firebase/firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from 'firebase/auth';
import {
  collection,
  addDoc,
  query,
  onSnapshot,
  doc,
  updateDoc,
  increment
} from 'firebase/firestore';

export const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [inventory, setInventory] = useState([]);
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);

  // Observa cambios en la autenticación
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (usr) => {
      setUser(usr);
      setLoading(false);
    });
    return unsubscribeAuth;
  }, []);

  // Observa el inventario y las ventas cuando haya usuario autenticado
  useEffect(() => {
    if (user) {
      const invRef = collection(db, "users", user.uid, "inventory");
      const salesRef = collection(db, "users", user.uid, "sales");

      const unsubscribeInv = onSnapshot(query(invRef), (snapshot) => {
        const inv = [];
        snapshot.forEach(doc => inv.push({ id: doc.id, ...doc.data() }));
        setInventory(inv);
      });
      const unsubscribeSales = onSnapshot(query(salesRef), (snapshot) => {
        const sals = [];
        snapshot.forEach(doc => sals.push({ id: doc.id, ...doc.data() }));
        setSales(sals);
      });
      return () => {
        unsubscribeInv();
        unsubscribeSales();
      };
    }
  }, [user]);

  // Autenticación
  const register = async (email, password) => {
    return createUserWithEmailAndPassword(auth, email, password);
  };

  const login = async (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  const logout = async () => {
    return signOut(auth);
  };

  // Funciones de Inventario
  const addProduct = async (product) => {
    if (!user) return;
    const invRef = collection(db, "users", user.uid, "inventory");

    // Para un negocio de ropa, se considera producto duplicado si nombre, talla y color coinciden
    const existing = inventory.find(
      p =>
        p.name.toLowerCase() === product.name.toLowerCase() &&
        p.size.toLowerCase() === product.size.toLowerCase() &&
        p.color.toLowerCase() === product.color.toLowerCase()
    );
    if (existing) {
      throw new Error("El producto ya existe (mismo nombre, talla y color)");
    } else {
      await addDoc(invRef, { 
        ...product,
        category: product.category || "Ropa",
        dateIncorporation: new Date().toISOString()
      });
    }
  };

  const updateProduct = async (productId, newData) => {
    if (!user) return;
    const prodRef = doc(db, "users", user.uid, "inventory", productId);
    await updateDoc(prodRef, newData);
  };

  // Funciones de Ventas
  // "products" es un arreglo de objetos: { productId, name, quantity, price, paymentMethod, channel, override }
  const addSale = async (saleData) => {
    if (!user) return;
    const salesRef = collection(db, "users", user.uid, "sales");
    // Descontar stock para cada producto vendido
    for (const item of saleData.products) {
      const prodRef = doc(db, "users", user.uid, "inventory", item.productId);
      await updateDoc(prodRef, {
        stock: increment(-item.quantity)
      });
    }
    await addDoc(salesRef, {
      ...saleData,
      date: new Date().toISOString()
    });
  };

  // Función para editar venta (revertir stock anterior y aplicar nuevos cambios)
  const editSale = async (saleId, updatedSale, originalSale) => {
    if (!user) return;
    const saleRef = doc(db, "users", user.uid, "sales", saleId);
    // Reintegra stock de la venta original
    for (const orig of originalSale.products) {
      const prodRef = doc(db, "users", user.uid, "inventory", orig.productId);
      await updateDoc(prodRef, {
        stock: increment(orig.quantity)
      });
    }
    // Descuenta stock según la venta actualizada
    for (const item of updatedSale.products) {
      const prodRef = doc(db, "users", user.uid, "inventory", item.productId);
      await updateDoc(prodRef, {
        stock: increment(-item.quantity)
      });
    }
    await updateDoc(saleRef, {
      ...updatedSale,
      date: new Date().toISOString()
    });
  };

  return (
    <AppContext.Provider value={{
      user,
      inventory,
      sales,
      loading,
      register,
      login,
      logout,
      addProduct,
      updateProduct,
      addSale,
      editSale
    }}>
      {children}
    </AppContext.Provider>
  );
};
