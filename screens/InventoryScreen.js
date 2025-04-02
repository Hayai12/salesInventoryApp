// File: /screens/InventoryScreen.js
import React, { useState, useContext } from 'react';
import { View, FlatList, StyleSheet, Alert, ScrollView } from 'react-native';
import { Text, TextInput, Button, Card, Portal, Dialog } from 'react-native-paper';
import { AppContext } from '../context/AppContext';

export default function InventoryScreen() {
  const { inventory, addProduct } = useContext(AppContext);
  const [modalVisible, setModalVisible] = useState(false);

  // Estados para los datos del producto
  const [productName, setProductName] = useState('');
  const [productStock, setProductStock] = useState('');
  const [costPrice, setCostPrice] = useState('');
  const [salePrice, setSalePrice] = useState('');
  const [size, setSize] = useState('');
  const [color, setColor] = useState('');
  const [brand, setBrand] = useState('');

  const resetForm = () => {
    setProductName('');
    setProductStock('');
    setCostPrice('');
    setSalePrice('');
    setSize('');
    setColor('');
    setBrand('');
  };

  const handleAddProduct = async () => {
    if (
      productName.trim() === '' ||
      productStock.trim() === '' ||
      costPrice.trim() === '' ||
      salePrice.trim() === '' ||
      size.trim() === '' ||
      color.trim() === '' ||
      brand.trim() === ''
    ) {
      Alert.alert("Error", "Debe ingresar todos los datos del producto");
      return;
    }
    const newProduct = {
      name: productName.trim(),
      stock: parseInt(productStock),
      costPrice: parseFloat(costPrice),
      salePrice: parseFloat(salePrice),
      size: size.trim(),
      color: color.trim(),
      brand: brand.trim()
    };
    try {
      await addProduct(newProduct);
      resetForm();
      setModalVisible(false);
    } catch (error) {
      Alert.alert("Error", error.message);
    }
  };

  return (
    <View style={styles.container}>
      <Button
        mode="contained"
        onPress={() => setModalVisible(true)}
        style={styles.addButton}
      >
        Agregar Producto
      </Button>

      <Portal>
        <Dialog
          visible={modalVisible}
          onDismiss={() => setModalVisible(false)}
          style={styles.dialog}
        >
          <Dialog.Title>Agregar Producto</Dialog.Title>
          <Dialog.Content>
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
            <TextInput
              label="Costo Unitario"
              value={costPrice}
              onChangeText={setCostPrice}
              keyboardType="numeric"
              style={styles.input}
            />
            <TextInput
              label="Precio de Venta"
              value={salePrice}
              onChangeText={setSalePrice}
              keyboardType="numeric"
              style={styles.input}
            />
            <TextInput
              label="Talla"
              value={size}
              onChangeText={setSize}
              style={styles.input}
            />
            <TextInput
              label="Color"
              value={color}
              onChangeText={setColor}
              style={styles.input}
            />
            <TextInput
              label="Marca"
              value={brand}
              onChangeText={setBrand}
              style={styles.input}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => { setModalVisible(false); resetForm(); }}>
              Cancelar
            </Button>
            <Button onPress={handleAddProduct}>Agregar</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <FlatList
        data={inventory}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Card style={styles.card}>
            <Card.Title title={item.name} subtitle={`Stock: ${item.stock}`} />
            <Card.Content>
              <Text>Costo: ${ (item.costPrice !== undefined ? item.costPrice : 0).toFixed(2) }</Text>
              <Text>Venta: ${ (item.salePrice !== undefined ? item.salePrice : 0).toFixed(2) }</Text>
              <Text>Talla: {item.size} - Color: {item.color}</Text>
              <Text>Marca: {item.brand}</Text>
            </Card.Content>
          </Card>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No hay productos en el inventario.</Text>}
        contentContainerStyle={styles.listContainer}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  addButton: { marginBottom: 10 },
  dialog: { marginHorizontal: 20 },
  input: { marginBottom: 10 },
  card: { marginVertical: 10 },
  listContainer: { paddingBottom: 100 },
  empty: { textAlign: 'center', marginTop: 20 }
});
