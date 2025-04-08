import React, { useState, useContext } from 'react';
import { 
  View, 
  FlatList, 
  StyleSheet, 
  Alert, 
  Keyboard, 
  LayoutAnimation 
} from 'react-native';
import { Text, TextInput, Button, Card, Menu } from 'react-native-paper';
import { AppContext } from '../context/AppContext';

export default function InventoryScreen() {
  const { inventory, updateProduct } = useContext(AppContext);

  // Estado para el producto seleccionado para edición inline de variantes
  const [selectedProduct, setSelectedProduct] = useState(null);
  // Copia local de las variantes para editar
  const [editedVariants, setEditedVariants] = useState([]);
  // Estado para mostrar el formulario inline de agregar variante
  const [newVariantFormVisible, setNewVariantFormVisible] = useState(false);
  // Estados para la nueva variante
  const [newVariantStock, setNewVariantStock] = useState("");
  const [newVariantSize, setNewVariantSize] = useState("M");
  const [newVariantColor, setNewVariantColor] = useState("Negro");
  // Estados para los Menús de selección
  const [newSizeMenuVisible, setNewSizeMenuVisible] = useState(false);
  const [newColorMenuVisible, setNewColorMenuVisible] = useState(false);

  // Opciones predefinidas para talla y color
  const sizeOptions = ["XS", "S", "M", "L", "XL"];
  const colorOptions = ["Rojo", "Verde", "Azul", "Negro", "Blanco"];

  // Abre el editor inline para un producto y carga sus variantes
  const openInlineEditor = (product) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setSelectedProduct(product);
    setEditedVariants(
      product.variants
        ? product.variants.map(v => ({ ...v, stock: v.stock.toString() }))
        : []
    );
    setNewVariantFormVisible(false);
  };

  // Cierra el editor inline y resetea estados
  const closeInlineEditor = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setSelectedProduct(null);
    setEditedVariants([]);
    setNewVariantFormVisible(false);
    setNewVariantStock("");
    setNewVariantSize("M");
    setNewVariantColor("Negro");
  };

  // Guarda las modificaciones de las variantes y actualiza el stock total
  const handleSaveVariants = async () => {
    if (!selectedProduct) return;
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
      closeInlineEditor();
    } catch (error) {
      Alert.alert("Error", error.message);
    }
  };

  // Agrega una nueva variante al producto seleccionado
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
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      // Actualiza la copia local para edición
      setEditedVariants(updatedVariants.map(v => ({ ...v, stock: v.stock.toString() })));
      // Reinicia los campos de la nueva variante
      setNewVariantStock("");
      setNewVariantSize("M");
      setNewVariantColor("Negro");
      setNewVariantFormVisible(false);
    } catch (error) {
      Alert.alert("Error", error.message);
    }
  };

  // Renderiza cada producto en un Card, mostrando un editor inline si el producto está seleccionado
  const renderProduct = ({ item }) => (
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
        
        {/* Editor inline para el producto seleccionado */}
        {selectedProduct && selectedProduct.id === item.id && (
          <View style={styles.inlineEditor}>
            <Text style={styles.sectionTitle}>Editar Variantes</Text>
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
                  returnKeyType="done"
                  blurOnSubmit={true}
                  onSubmitEditing={Keyboard.dismiss}
                  onChangeText={(value) => {
                    const newVariants = [...editedVariants];
                    newVariants[index].stock = value;
                    setEditedVariants(newVariants);
                  }}
                />
              </View>
            ))}
            <Button onPress={handleSaveVariants}>Guardar cambios</Button>
            <Button onPress={closeInlineEditor}>Cerrar edición</Button>

            {/* Formulario inline para agregar nueva variante */}
            <Button onPress={() => setNewVariantFormVisible(!newVariantFormVisible)}>
              {newVariantFormVisible ? "Cancelar agregar variante" : "Agregar Variante"}
            </Button>
            {newVariantFormVisible && (
              <View style={styles.newVariantContainer}>
                <Text style={styles.sectionTitle}>Nueva Variante</Text>
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
                  returnKeyType="done"
                  blurOnSubmit={true}
                  onSubmitEditing={Keyboard.dismiss}
                  style={styles.input}
                />
                <Button onPress={handleAddVariant}>Agregar</Button>
              </View>
            )}
          </View>
        )}
      </Card.Content>
      <Card.Actions>
        {(!selectedProduct || selectedProduct.id !== item.id) && (
          <>
            <Button onPress={() => openInlineEditor(item)}>
              Editar Variantes
            </Button>
            <Button
              onPress={() => {
                openInlineEditor(item);
                setNewVariantFormVisible(true);
              }}
            >
              Agregar Variante
            </Button>
          </>
        )}
      </Card.Actions>
    </Card>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={inventory}
        keyExtractor={(item) => item.id}
        renderItem={renderProduct}
        ListEmptyComponent={<Text style={styles.empty}>No hay productos en el inventario.</Text>}
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
  inlineEditor: {
    marginTop: 15,
    paddingTop: 10,
    borderTopWidth: 1,
    borderColor: '#ccc'
  },
  sectionTitle: {
    fontWeight: 'bold',
    marginBottom: 10
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
  },
  newVariantContainer: {
    marginTop: 15,
    paddingTop: 10,
    borderTopWidth: 1,
    borderColor: '#ccc'
  }
});
