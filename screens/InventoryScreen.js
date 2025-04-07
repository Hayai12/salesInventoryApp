import React, { useState, useContext } from 'react';
import { View, FlatList, StyleSheet, Alert } from 'react-native';
import { Text, TextInput, Button, Card, Portal, Dialog, Menu } from 'react-native-paper';
import { AppContext } from '../context/AppContext';

export default function InventoryScreen() {
  const { inventory, updateProduct } = useContext(AppContext);

  // Estado para el producto seleccionado al editar/agregar variantes
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Estados para el diálogo de edición de variantes
  const [editVariantsDialogVisible, setEditVariantsDialogVisible] = useState(false);
  const [editedVariants, setEditedVariants] = useState([]);

  // Estados para el diálogo de agregar variante
  const [addVariantDialogVisible, setAddVariantDialogVisible] = useState(false);
  const [newVariantStock, setNewVariantStock] = useState("");
  const [newVariantSize, setNewVariantSize] = useState("M");
  const [newVariantColor, setNewVariantColor] = useState("Negro");
  const [newSizeMenuVisible, setNewSizeMenuVisible] = useState(false);
  const [newColorMenuVisible, setNewColorMenuVisible] = useState(false);

  // Opciones predefinidas para talla y color
  const sizeOptions = ["XS", "S", "M", "L", "XL"];
  const colorOptions = ["Rojo", "Verde", "Azul", "Negro", "Blanco"];

  // Abrir diálogo para editar variantes (se hace una copia local de las variantes existentes)
  const openEditVariantsDialog = (product) => {
    setSelectedProduct(product);
    setEditedVariants(
      product.variants
        ? product.variants.map(v => ({ ...v, stock: v.stock.toString() }))
        : []
    );
    setEditVariantsDialogVisible(true);
  };

  const closeEditVariantsDialog = () => {
    setEditVariantsDialogVisible(false);
    setSelectedProduct(null);
    setEditedVariants([]);
  };

  // Guarda las modificaciones en las variantes y actualiza el stock total
  const handleSaveVariants = async () => {
    if (!selectedProduct) return;
    // Se valida y se convierte el stock de cada variante a número
    const updatedVariants = editedVariants.map(v => ({
      size: v.size,
      color: v.color,
      stock: parseInt(v.stock) || 0
    }));
    const overallStock = updatedVariants.reduce((sum, v) => sum + v.stock, 0);
    try {
      await updateProduct(selectedProduct.id, {
        variants: updatedVariants,
        stock: overallStock
      });
      closeEditVariantsDialog();
    } catch (error) {
      Alert.alert("Error", error.message);
    }
  };

  // Abrir diálogo para agregar una nueva variante
  const openAddVariantDialog = (product) => {
    setSelectedProduct(product);
    setNewVariantSize("M");
    setNewVariantColor("Negro");
    setNewVariantStock("");
    setAddVariantDialogVisible(true);
  };

  const closeAddVariantDialog = () => {
    setAddVariantDialogVisible(false);
    setSelectedProduct(null);
  };

  // Valida que no exista una variante duplicada y actualiza el producto con la nueva variante
  const handleAddVariant = async () => {
    if (!selectedProduct) return;
    if (newVariantStock.trim() === '' || isNaN(newVariantStock)) {
      Alert.alert("Error", "El stock debe ser un número válido");
      return;
    }
    // Verifica que no exista una variante con la misma talla y color
    const exists = (selectedProduct.variants || []).some(v =>
      v.size === newVariantSize && v.color === newVariantColor
    );
    if (exists) {
      Alert.alert("Error", "La variante ya existe (mismo tamaño y color)");
      return;
    }
    const variantToAdd = {
      size: newVariantSize,
      color: newVariantColor,
      stock: parseInt(newVariantStock)
    };
    const updatedVariants = selectedProduct.variants
      ? [...selectedProduct.variants, variantToAdd]
      : [variantToAdd];
    const overallStock = updatedVariants.reduce((sum, v) => sum + v.stock, 0);
    try {
      await updateProduct(selectedProduct.id, {
        variants: updatedVariants,
        stock: overallStock
      });
      closeAddVariantDialog();
    } catch (error) {
      Alert.alert("Error", error.message);
    }
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={inventory}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Card style={styles.card}>
            <Card.Title title={item.name} subtitle={`Stock total: ${item.stock || 0}`} />
            <Card.Content>
              <Text>Costo: ${(item.costPrice !== undefined ? item.costPrice : 0).toFixed(2)}</Text>
              <Text>Venta: ${(item.salePrice !== undefined ? item.salePrice : 0).toFixed(2)}</Text>
              <Text>Marca: {item.brand}</Text>
              {item.variants && item.variants.length > 0 ? (
                <View style={styles.variantsContainer}>
                  <Text>Variantes ({item.variants.length}):</Text>
                  {item.variants.map((variant, index) => (
                    <Text key={index}>
                      Talla: {variant.size}, Color: {variant.color}, Stock: {variant.stock}
                    </Text>
                  ))}
                </View>
              ) : (
                <Text>Sin variantes</Text>
              )}
            </Card.Content>
            <Card.Actions>
              <Button onPress={() => openEditVariantsDialog(item)}>Editar Variantes</Button>
              <Button onPress={() => openAddVariantDialog(item)}>Agregar Variante</Button>
            </Card.Actions>
          </Card>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No hay productos en el inventario.</Text>}
        contentContainerStyle={styles.listContainer}
      />

      {/* Diálogo para editar variantes */}
      <Portal>
        <Dialog visible={editVariantsDialogVisible} onDismiss={closeEditVariantsDialog}>
          <Dialog.Title>Editar Variantes</Dialog.Title>
          <Dialog.Content>
            {editedVariants.map((variant, index) => (
              <View key={index} style={styles.variantRow}>
                <Text style={styles.variantText}>
                  Talla: {variant.size}, Color: {variant.color}
                </Text>
                <TextInput
                  style={[styles.input, styles.variantInput]}
                  label="Stock"
                  value={variant.stock}
                  keyboardType="numeric"
                  onChangeText={(value) => {
                    const newVariants = [...editedVariants];
                    newVariants[index].stock = value;
                    setEditedVariants(newVariants);
                  }}
                />
              </View>
            ))}
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={closeEditVariantsDialog}>Cancelar</Button>
            <Button onPress={handleSaveVariants}>Guardar</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Diálogo para agregar una nueva variante */}
      <Portal>
        <Dialog visible={addVariantDialogVisible} onDismiss={closeAddVariantDialog}>
          <Dialog.Title>Agregar Variante</Dialog.Title>
          <Dialog.Content>
            {/* Selector de Talla */}
            <Menu
              visible={newSizeMenuVisible}
              onDismiss={() => setNewSizeMenuVisible(false)}
              anchor={
                <Button
                  mode="outlined"
                  onPress={() => setNewSizeMenuVisible(true)}
                  style={styles.menuButton}
                >
                  {newVariantSize}
                </Button>
              }
            >
              {sizeOptions.map((size) => (
                <Menu.Item
                  key={size}
                  onPress={() => {
                    setNewVariantSize(size);
                    setNewSizeMenuVisible(false);
                  }}
                  title={size}
                />
              ))}
            </Menu>

            {/* Selector de Color */}
            <Menu
              visible={newColorMenuVisible}
              onDismiss={() => setNewColorMenuVisible(false)}
              anchor={
                <Button
                  mode="outlined"
                  onPress={() => setNewColorMenuVisible(true)}
                  style={styles.menuButton}
                >
                  {newVariantColor}
                </Button>
              }
            >
              {colorOptions.map((color) => (
                <Menu.Item
                  key={color}
                  onPress={() => {
                    setNewVariantColor(color);
                    setNewColorMenuVisible(false);
                  }}
                  title={color}
                />
              ))}
            </Menu>

            <TextInput
              label="Stock"
              value={newVariantStock}
              onChangeText={setNewVariantStock}
              keyboardType="numeric"
              style={styles.input}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={closeAddVariantDialog}>Cancelar</Button>
            <Button onPress={handleAddVariant}>Agregar</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    padding: 20, 
    backgroundColor: '#fff' 
  },
  card: { 
    marginVertical: 10 
  },
  listContainer: { 
    paddingBottom: 100 
  },
  empty: { 
    textAlign: 'center', 
    marginTop: 20 
  },
  variantsContainer: { 
    marginTop: 10 
  },
  variantRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 10 
  },
  variantText: { 
    flex: 1 
  },
  input: { 
    marginBottom: 10, 
    flex: 1 
  },
  variantInput: { 
    width: 80 
  },
  menuButton: { 
    marginBottom: 10 
  }
});

