// File: /screens/InventoryScreen.js
import React, { useState, useContext } from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { Text, TextInput, Button, Card } from 'react-native-paper';
import { AppContext } from '../context/AppContext';

export default function InventoryScreen() {
  const { inventory, addProduct } = useContext(AppContext);
  const [productName, setProductName] = useState('');
  const [productStock, setProductStock] = useState('');

  const handleAddProduct = () => {
    if (productName && productStock) {
      const newProduct = {
        id: Date.now().toString(),
        name: productName,
        stock: parseInt(productStock),
      };
      addProduct(newProduct);
      setProductName('');
      setProductStock('');
    }
  };

  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <Card.Title title="Agregar Producto" />
        <Card.Content>
          <TextInput
            label="Nombre del Producto"
            value={productName}
            onChangeText={setProductName}
            style={styles.input}
          />
          <TextInput
            label="Stock"
            value={productStock}
            onChangeText={setProductStock}
            keyboardType="numeric"
            style={styles.input}
          />
          <Button mode="contained" onPress={handleAddProduct}>
            Agregar Producto
          </Button>
        </Card.Content>
      </Card>
      <FlatList
        data={inventory}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Card style={styles.card}>
            <Card.Title title={item.name} subtitle={`Stock: ${item.stock}`} />
          </Card>
        )}
        ListEmptyComponent={<Text>No hay productos en el inventario.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  card: {
    marginVertical: 10,
  },
  input: {
    marginBottom: 10,
  },
});
