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
  increment,
  deleteDoc
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

  const addProduct = async (product) => {
    if (!user) return;
    const invRef = collection(db, "users", user.uid, "inventory");

    // Verificar duplicados basado en nombre, marca y variantes
    const duplicate = inventory.some(existingProduct => {
      const sameName = (existingProduct.name || '').toLowerCase() === (product.name || '').toLowerCase();
      const sameBrand = (existingProduct.brand || '').toLowerCase() === (product.brand || '').toLowerCase();

      if (sameName && sameBrand) {
        const existingVariants = existingProduct.variants || [];
        const newVariants = product.variants || [];

        // Si ambos tienen variantes vacías, se considera duplicado
        if (existingVariants.length === 0 && newVariants.length === 0) {
          return true;
        }

        // Si ambos tienen variantes, se verifica si existe al menos una coincidencia en talla y color
        if (existingVariants.length > 0 && newVariants.length > 0) {
          return newVariants.some(newVariant =>
            existingVariants.some(existingVariant =>
              (existingVariant.size || '').toLowerCase() === (newVariant.size || '').toLowerCase() &&
              (existingVariant.color || '').toLowerCase() === (newVariant.color || '').toLowerCase()
            )
          );
        }
      }
      return false;
    });

    if (duplicate) {
      throw new Error("El producto ya existe (mismo nombre, talla y color)");
    } else {
      await addDoc(invRef, { 
        ...product,
        category: product.category || "Ropa",
        dateIncorporation: new Date().toISOString()
      });
    }
  };

  const deleteProduct = async (productId) => {
    if (!user) return;
    const prodRef = doc(db, "users", user.uid, "inventory", productId);
    await deleteDoc(prodRef);
  };

  const updateProduct = async (productId, newData) => {
    if (!user) return;
    const prodRef = doc(db, "users", user.uid, "inventory", productId);
    await updateDoc(prodRef, newData);
  };

  // Funciones de Ventas
  const addSale = async (saleData) => {
    if (!user) return;
    const salesRef = collection(db, "users", user.uid, "sales");

    // Agrupar las ventas por productId para procesarlas acumuladamente.
    const groupedSales = {};
    for (const item of saleData.products) {
      if (!groupedSales[item.productId]) {
        groupedSales[item.productId] = [];
      }
      groupedSales[item.productId].push(item);
    }

    // Para cada producto, actualizar las variantes restando la cantidad vendida
    for (const productId in groupedSales) {
      const saleItems = groupedSales[productId];
      const prodRef = doc(db, "users", user.uid, "inventory", productId);
      const product = inventory.find(p => p.id === productId);
      if (product) {
        let updatedVariants = product.variants.map(v => ({ ...v }));
        for (const saleItem of saleItems) {
          updatedVariants = updatedVariants.map(variant => {
            if (
              variant.size.toLowerCase() === saleItem.variant.size.toLowerCase() &&
              variant.color.toLowerCase() === saleItem.variant.color.toLowerCase()
            ) {
              return { ...variant, stock: variant.stock - saleItem.quantity };
            }
            return variant;
          });
        }
        const overallStock = updatedVariants.reduce((sum, v) => sum + v.stock, 0);
        await updateDoc(prodRef, {
          variants: updatedVariants,
          stock: overallStock
        });
      }
    }
    await addDoc(salesRef, {
      ...saleData,
      date: new Date().toISOString()
    });
  };

  const editSale = async (saleId, updatedSale, originalSale) => {
    if (!user) return;
    const saleRef = doc(db, "users", user.uid, "sales", saleId);
    // Reintegra stock de la venta original
    for (const orig of originalSale.products) {
      const prodRef = doc(db, "users", user.uid, "inventory", orig.productId);
      const product = inventory.find(p => p.id === orig.productId);
      if (product) {
        let updatedVariants = product.variants.map(v => ({ ...v }));
        updatedVariants = updatedVariants.map(variant => {
          if (
            variant.size.toLowerCase() === orig.variant.size.toLowerCase() &&
            variant.color.toLowerCase() === orig.variant.color.toLowerCase()
          ) {
            return { ...variant, stock: variant.stock + orig.quantity };
          }
          return variant;
        });
        const overallStock = updatedVariants.reduce((sum, v) => sum + v.stock, 0);
        await updateDoc(prodRef, { variants: updatedVariants, stock: overallStock });
      }
    }
    // Descuenta stock según la venta actualizada
    for (const item of updatedSale.products) {
      const prodRef = doc(db, "users", user.uid, "inventory", item.productId);
      const product = inventory.find(p => p.id === item.productId);
      if (product) {
        let updatedVariants = product.variants.map(v => ({ ...v }));
        updatedVariants = updatedVariants.map(variant => {
          if (
            variant.size.toLowerCase() === item.variant.size.toLowerCase() &&
            variant.color.toLowerCase() === item.variant.color.toLowerCase()
          ) {
            return { ...variant, stock: variant.stock - item.quantity };
          }
          return variant;
        });
        const overallStock = updatedVariants.reduce((sum, v) => sum + v.stock, 0);
        await updateDoc(prodRef, { variants: updatedVariants, stock: overallStock });
      }
    }
    await updateDoc(saleRef, {
      ...updatedSale,
      date: new Date().toISOString()
    });
  };

  // Función para eliminar venta con reintegro a las variantes específicas
  const deleteSale = async (saleId, saleData) => {
    if (!user) return;
    // Agrupar los ítems de la venta por productId
    const groupedSales = {};
    for (const item of saleData.products) {
      if (!groupedSales[item.productId]) {
        groupedSales[item.productId] = [];
      }
      groupedSales[item.productId].push(item);
    }
    // Para cada producto, actualizar las variantes aumentando el stock de la variante vendida
    for (const productId in groupedSales) {
      const saleItems = groupedSales[productId];
      const prodRef = doc(db, "users", user.uid, "inventory", productId);
      const product = inventory.find(p => p.id === productId);
      if (product) {
        let updatedVariants = product.variants.map(v => ({ ...v }));
        for (const saleItem of saleItems) {
          updatedVariants = updatedVariants.map(variant => {
            if (
              variant.size.toLowerCase() === saleItem.variant.size.toLowerCase() &&
              variant.color.toLowerCase() === saleItem.variant.color.toLowerCase()
            ) {
              return { ...variant, stock: variant.stock + saleItem.quantity };
            }
            return variant;
          });
        }
        const overallStock = updatedVariants.reduce((sum, v) => sum + v.stock, 0);
        await updateDoc(prodRef, {
          variants: updatedVariants,
          stock: overallStock
        });
      }
    }
    // Finalmente, elimina la venta
    const saleRef = doc(db, "users", user.uid, "sales", saleId);
    await deleteDoc(saleRef);
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
      editSale,
      deleteProduct,
      deleteSale
    }}>
      {children}
    </AppContext.Provider>
  );
};
