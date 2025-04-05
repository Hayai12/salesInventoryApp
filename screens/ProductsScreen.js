import React, { useState, useContext } from 'react';
import { 
  View, 
  StyleSheet, 
  Alert, 
  Modal, 
  TouchableWithoutFeedback, 
  Keyboard, 
  KeyboardAvoidingView, 
  ScrollView, 
  Platform,
  FlatList
} from 'react-native';
import { TextInput, Button, Menu, Card, Text } from 'react-native-paper';
import { AppContext } from '../context/AppContext';

export default function ProductsScreen() {
  const { addProduct, updateProduct, deleteProduct, inventory } = useContext(AppContext);
  
  // Estado para mostrar el modal y para el modo edición
  const [modalVisible, setModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  
  // Campos del formulario
  const [productName, setProductName] = useState('');
  const [costPrice, setCostPrice] = useState('');
  const [salePrice, setSalePrice] = useState('');
  const [brand, setBrand] = useState('');
  
  // Campo categoría (por ahora solo "Ropa")
  const [category, setCategory] = useState('Ropa');
  const [menuVisible, setMenuVisible] = useState(false);
  
  const openMenu = () => setMenuVisible(true);
  const closeMenu = () => setMenuVisible(false);
  
  // Reinicia los campos del formulario y el modo edición
  const resetForm = () => {
    setProductName('');
    setCostPrice('');
    setSalePrice('');
    setBrand('');
    setCategory('Ropa');
    setEditingProduct(null);
  };
  
  // Agrega o actualiza un producto; al editar, preserva las variantes actuales
  const handleAddOrUpdateProduct = async () => {
    if (
      productName.trim() === '' ||
      costPrice.trim() === '' ||
      salePrice.trim() === '' ||
      brand.trim() === ''
    ) {
      Alert.alert("Error", "Debe ingresar todos los datos del producto");
      return;
    }
  
    const newProduct = {
      name: productName.trim(),
      costPrice: parseFloat(costPrice),
      salePrice: parseFloat(salePrice),
      brand: brand.trim(),
      category,
      // Si se está editando, se conservan las variantes; si es nuevo, se inicializa a vacío
      variants: editingProduct ? editingProduct.variants : []
    };
  
    try {
      if (editingProduct) {
        await updateProduct(editingProduct.id, newProduct);
      } else {
        await addProduct(newProduct);
      }
      resetForm();
      setModalVisible(false);
    } catch (error) {
      Alert.alert("Error", error.message);
    }
  };
  
  // Prepara el formulario para edición
  const handleEditProduct = (product) => {
    setProductName(product.name);
    setCostPrice(product.costPrice ? product.costPrice.toString() : '');
    setSalePrice(product.salePrice ? product.salePrice.toString() : '');
    setBrand(product.brand);
    setCategory(product.category || 'Ropa');
    setEditingProduct(product);
    setModalVisible(true);
  };
  
  // Elimina el producto luego de confirmar
  const handleDeleteProduct = (product) => {
    Alert.alert(
      "Confirmar Eliminación",
      "¿Está seguro que desea eliminar este producto?",
      [
        { text: "Cancelar", style: "cancel" },
        { 
          text: "Eliminar", 
          style: "destructive", 
          onPress: async () => {
            try {
              await deleteProduct(product.id);
            } catch (error) {
              Alert.alert("Error", error.message);
            }
          }
        }
      ]
    );
  };
  
  // Renderiza cada producto en un Card básico
  const renderProduct = ({ item }) => (
    <Card style={styles.card}>
      <Card.Title title={item.name} subtitle={`${item.brand} - ${item.category}`} />
      <Card.Content>
        <Text>Costo: ${item.costPrice ? item.costPrice.toFixed(2) : '0.00'}</Text>
        <Text>Venta: ${item.salePrice ? item.salePrice.toFixed(2) : '0.00'}</Text>
      </Card.Content>
      <Card.Actions>
        <Button onPress={() => handleEditProduct(item)}>Editar</Button>
        <Button onPress={() => handleDeleteProduct(item)} color="red">
          Eliminar
        </Button>
      </Card.Actions>
    </Card>
  );
  
  return (
    <View style={styles.container}>
      <Button
        mode="contained"
        onPress={() => { resetForm(); setModalVisible(true); }}
        style={styles.addButton}
      >
        Agregar Producto
      </Button>
  
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => { setModalVisible(false); resetForm(); }}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <ScrollView contentContainerStyle={styles.modalOverlay}>
              {/* Campo de Categoría */}
              <View style={styles.modalContent}>
              <Menu
                visible={menuVisible}
                onDismiss={closeMenu}
                anchor={
                  <TouchableWithoutFeedback onPress={openMenu}>
                    <View pointerEvents="none">
                      <TextInput
                        label="Categoría"
                        value={category}
                        style={styles.input}
                        editable={false}
                        right={<TextInput.Icon name="menu-down" />}
                      />
                    </View>
                  </TouchableWithoutFeedback>
                }
              >
                <Menu.Item onPress={() => { setCategory('Ropa'); closeMenu(); }} title="Ropa" />
              </Menu>
  
              {/* Campos generales del producto */}
              <TextInput
                label="Nombre del Producto"
                value={productName}
                onChangeText={setProductName}
                style={styles.input}
                returnKeyType="done"
                blurOnSubmit
                onSubmitEditing={Keyboard.dismiss}
              />
              <TextInput
                label="Costo Unitario"
                value={costPrice}
                onChangeText={setCostPrice}
                keyboardType="numeric"
                style={styles.input}
                returnKeyType="done"
                blurOnSubmit
                onSubmitEditing={Keyboard.dismiss}
              />
              <TextInput
                label="Precio de Venta"
                value={salePrice}
                onChangeText={setSalePrice}
                keyboardType="numeric"
                style={styles.input}
                returnKeyType="done"
                blurOnSubmit
                onSubmitEditing={Keyboard.dismiss}
              />
              <TextInput
                label="Marca"
                value={brand}
                onChangeText={setBrand}
                style={styles.input}
                returnKeyType="done"
                blurOnSubmit
                onSubmitEditing={Keyboard.dismiss}
              />
  
              <View style={styles.buttonContainer}>
                <Button onPress={() => { setModalVisible(false); resetForm(); }}>
                  Cancelar
                </Button>
                <Button onPress={handleAddOrUpdateProduct}>
                  {editingProduct ? "Actualizar" : "Agregar"}
                </Button>
              </View>
              </View>
            </ScrollView>
        </TouchableWithoutFeedback>
      </Modal>
  
      <FlatList
        data={inventory}
        keyExtractor={(item) => item.id}
        renderItem={renderProduct}
        ListEmptyComponent={<Text style={styles.empty}>No hay productos registrados.</Text>}
        contentContainerStyle={styles.listContainer}
      />
    </View>
  );
}
  
const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    padding: 20, 
    backgroundColor: '#fff'
  },
  addButton: { 
    marginBottom: 10 
  },
  input: { 
    marginBottom: 10 
  },
  modalOverlay: { 
    flex: 1, 
    backgroundColor: 'rgba(0,0,0,0.3)', 
    justifyContent: 'center', 
    paddingHorizontal: 20
  },
  modalContent: { 
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#fff', 
    padding: 20, 
    borderRadius: 8
  },
  buttonContainer: { 
    flexDirection: 'row', 
    justifyContent: 'flex-end', 
    marginTop: 10 
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
  }
});
