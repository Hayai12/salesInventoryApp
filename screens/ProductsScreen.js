import React, { useState, useContext } from 'react';
import { 
  View, 
  StyleSheet, 
  Alert, 
  Keyboard, 
  FlatList, 
  TouchableWithoutFeedback, 
  LayoutAnimation, 
  UIManager, 
  Platform 
} from 'react-native';
import { TextInput, Button, Menu, Card, Text, IconButton } from 'react-native-paper';
import { AppContext } from '../context/AppContext';

// Habilita animaciones en Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function ProductsScreen() {
  const { addProduct, updateProduct, deleteProduct, inventory } = useContext(AppContext);
  
  // Estado para mostrar/ocultar el formulario inline
  const [formVisible, setFormVisible] = useState(false);
  // Para saber si se está editando un producto o se está agregando uno nuevo
  const [editingProduct, setEditingProduct] = useState(null);
  
  // Campos del formulario
  const [productName, setProductName] = useState('');
  const [costPrice, setCostPrice] = useState('');
  const [salePrice, setSalePrice] = useState('');
  const [brand, setBrand] = useState('');
  const [category, setCategory] = useState('Ropa');
  const [menuVisible, setMenuVisible] = useState(false);
  
  // Estado para prevenir múltiples envíos
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Alterna la visibilidad del formulario con animación
  const toggleFormVisibility = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    if(formVisible){
      resetForm();
      setFormVisible(false);
    } else {
      setFormVisible(true);
    }
  };
  
  // Reinicia los campos del formulario y el modo edición
  const resetForm = () => {
    setProductName('');
    setCostPrice('');
    setSalePrice('');
    setBrand('');
    setCategory('Ropa');
    setEditingProduct(null);
  };
  
  const openMenu = () => setMenuVisible(true);
  const closeMenu = () => setMenuVisible(false);
  
  // Agrega o actualiza un producto; se conservan las variantes al editar
  const handleAddOrUpdateProduct = async () => {
    if (isSubmitting) return; // Evita envíos múltiples
    if (
      productName.trim() === '' ||
      costPrice.trim() === '' ||
      salePrice.trim() === '' ||
      brand.trim() === ''
    ) {
      Alert.alert("Error", "Debe ingresar todos los datos del producto");
      return;
    }
    
    setIsSubmitting(true);
  
    const newProduct = {
      name: productName.trim(),
      costPrice: parseFloat(costPrice),
      salePrice: parseFloat(salePrice),
      brand: brand.trim(),
      category,
      // Conserva variantes si se está editando; si es nuevo, se inicializa a vacío
      variants: editingProduct ? editingProduct.variants : []
    };
  
    try {
      if (editingProduct) {
        await updateProduct(editingProduct.id, newProduct);
      } else {
        await addProduct(newProduct);
      }
      resetForm();
      setFormVisible(false);
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Prepara el formulario para edición y lo muestra inline
  const handleEditProduct = (product) => {
    setProductName(product.name);
    setCostPrice(product.costPrice ? product.costPrice.toString() : '');
    setSalePrice(product.salePrice ? product.salePrice.toString() : '');
    setBrand(product.brand);
    setCategory(product.category || 'Ropa');
    setEditingProduct(product);
    if (!formVisible) {
      setFormVisible(true);
    }
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
  
  // Renderiza cada producto en un Card con íconos de acción
  const renderProduct = ({ item }) => (
    <Card style={styles.card}>
      <Card.Title 
        title={item.name} 
        subtitle={`${item.brand} - ${item.category}`} 
        right={(props) => (
          <>
            <IconButton {...props} icon="pencil" onPress={() => handleEditProduct(item)} />
            <IconButton {...props} icon="delete" onPress={() => handleDeleteProduct(item)} />
          </>
        )}
      />
      <Card.Content>
        <Text>Costo: ${item.costPrice ? item.costPrice.toFixed(2) : '0.00'}</Text>
        <Text>Venta: ${item.salePrice ? item.salePrice.toFixed(2) : '0.00'}</Text>
      </Card.Content>
    </Card>
  );
  
  return (
    <View style={styles.container}>
      {/* Botón para mostrar/ocultar el formulario inline */}
      <Button
        mode="contained"
        onPress={toggleFormVisibility}
        style={styles.addButton}
      >
        {formVisible ? "Cerrar Formulario" : "Agregar Producto"}
      </Button>
  
      {formVisible && (
        <Card style={styles.formCard}>
          <Card.Content>
            {/* Selector de Categoría integrado con Menu */}
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
  
            <TextInput
              label="Nombre del Producto"
              value={productName}
              onChangeText={setProductName}
              style={styles.input}
              returnKeyType="done"
              onSubmitEditing={Keyboard.dismiss}
            />
            <TextInput
              label="Costo Unitario"
              value={costPrice}
              onChangeText={setCostPrice}
              keyboardType="numeric"
              style={styles.input}
              returnKeyType="done"
              onSubmitEditing={Keyboard.dismiss}
            />
            <TextInput
              label="Precio de Venta"
              value={salePrice}
              onChangeText={setSalePrice}
              keyboardType="numeric"
              style={styles.input}
              returnKeyType="done"
              onSubmitEditing={Keyboard.dismiss}
            />
            <TextInput
              label="Marca"
              value={brand}
              onChangeText={setBrand}
              style={styles.input}
              returnKeyType="done"
              onSubmitEditing={Keyboard.dismiss}
            />
  
            <View style={styles.buttonContainer}>
              <Button onPress={toggleFormVisibility}>
                Cancelar
              </Button>
              <Button onPress={handleAddOrUpdateProduct} disabled={isSubmitting}>
                {editingProduct ? "Actualizar" : "Agregar"}
              </Button>
            </View>
          </Card.Content>
        </Card>
      )}
  
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
  formCard: {
    marginBottom: 20,
    borderRadius: 8,
    elevation: 3,
  },
  input: { 
    marginBottom: 10 
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
