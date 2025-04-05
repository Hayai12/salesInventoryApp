import React, { useState, useContext } from 'react';
import { 
  View, 
  FlatList, 
  StyleSheet, 
  Alert, 
  Modal, 
  TouchableWithoutFeedback, 
  Keyboard, 
  ScrollView 
} from 'react-native';
import { Text, TextInput, Button, Card } from 'react-native-paper';
import { AppContext } from '../context/AppContext';

export default function InventoryScreen() {
  const { inventory, updateProduct } = useContext(AppContext);

  // Estado para el modal de gestión de variantes
  const [variantModalVisible, setVariantModalVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Estados para la variante que se desea agregar o editar
  const [variantSize, setVariantSize] = useState('');
  const [variantColor, setVariantColor] = useState('');
  const [variantStock, setVariantStock] = useState('');

  // Abre el modal para gestionar variantes del producto seleccionado
  const openVariantModal = (product) => {
    setSelectedProduct(product);
    setVariantModalVisible(true);
  };

  // Cierra el modal y resetea campos
  const closeVariantModal = () => {
    setVariantModalVisible(false);
    setSelectedProduct(null);
    setVariantSize('');
    setVariantColor('');
    setVariantStock('');
  };

  // Función para agregar una nueva variante al producto
  const handleAddVariant = async () => {
    if (!variantSize.trim() || !variantColor.trim() || !variantStock.trim()) {
      Alert.alert("Error", "Complete todos los campos de la variante");
      return;
    }
    if (isNaN(parseInt(variantStock))) {
      Alert.alert("Error", "El stock debe ser un número");
      return;
    }

    // Tomamos las variantes actuales o un arreglo vacío
    const currentVariants = selectedProduct.variants || [];

    // Verificar si ya existe la variante (mismo tamaño y color)
    const duplicate = currentVariants.some(v =>
      (v.size || '').toLowerCase() === variantSize.trim().toLowerCase() &&
      (v.color || '').toLowerCase() === variantColor.trim().toLowerCase()
    );
    if (duplicate) {
      Alert.alert("Error", "La variante ya existe para este producto");
      return;
    }

    const newVariant = {
      size: variantSize.trim(),
      color: variantColor.trim(),
      stock: parseInt(variantStock)
    };

    const updatedVariants = [...currentVariants, newVariant];

    try {
      await updateProduct(selectedProduct.id, { variants: updatedVariants });
      closeVariantModal();
    } catch (error) {
      Alert.alert("Error", error.message);
    }
  };

  // Permite eliminar una variante existente
  const handleDeleteVariant = async (variantIndex) => {
    const updatedVariants = selectedProduct.variants.filter((_, index) => index !== variantIndex);
    try {
      await updateProduct(selectedProduct.id, { variants: updatedVariants });
    } catch (error) {
      Alert.alert("Error", error.message);
    }
  };

  // Función auxiliar para calcular el stock total de un producto a partir de sus variantes
  const getTotalStock = (product) => {
    if (!product.variants || product.variants.length === 0) return 0;
    return product.variants.reduce((total, v) => total + (parseInt(v.stock) || 0), 0);
  };

  // Renderiza cada producto en la lista
  const renderProduct = ({ item }) => (
    <Card style={styles.card}>
      <Card.Title 
        title={item.name} 
        subtitle={`Stock Total: ${getTotalStock(item)}`} 
      />
      <Card.Content>
        <Text>Costo: ${ (item.costPrice !== undefined ? item.costPrice : 0).toFixed(2) }</Text>
        <Text>Venta: ${ (item.salePrice !== undefined ? item.salePrice : 0).toFixed(2) }</Text>
        <Text>Marca: {item.brand}</Text>
        {item.variants && item.variants.length > 0 ? (
          <View style={styles.variantList}>
            {item.variants.map((v, index) => (
              <Text key={index}>
                Talla: {v.size} - Color: {v.color} - Stock: {v.stock}
              </Text>
            ))}
          </View>
        ) : (
          <Text>No hay variantes agregadas</Text>
        )}
      </Card.Content>
      <Card.Actions>
        <Button onPress={() => openVariantModal(item)}>Gestionar Variantes</Button>
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

      {/* Modal para gestión de variantes */}
      <Modal
        visible={variantModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={closeVariantModal}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView contentContainerStyle={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>
                Gestionar Variantes de {selectedProduct ? selectedProduct.name : ''}
              </Text>
              
              {/* Listado de variantes actuales con opción de eliminar */}
              {selectedProduct && selectedProduct.variants && selectedProduct.variants.length > 0 && (
                <View style={styles.existingVariants}>
                  {selectedProduct.variants.map((v, index) => (
                    <View key={index} style={styles.variantRow}>
                      <Text style={styles.variantText}>
                        Talla: {v.size} - Color: {v.color} - Stock: {v.stock}
                      </Text>
                      <Button 
                        mode="text" 
                        onPress={() => handleDeleteVariant(index)}
                        color="red"
                      >
                        Eliminar
                      </Button>
                    </View>
                  ))}
                </View>
              )}

              <Text style={styles.modalSubtitle}>Agregar nueva variante</Text>
              <TextInput
                label="Talla"
                value={variantSize}
                onChangeText={setVariantSize}
                style={styles.input}
              />
              <TextInput
                label="Color"
                value={variantColor}
                onChangeText={setVariantColor}
                style={styles.input}
              />
              <TextInput
                label="Stock"
                value={variantStock}
                onChangeText={setVariantStock}
                keyboardType="numeric"
                style={styles.input}
              />
              <View style={styles.modalButtons}>
                <Button mode="outlined" onPress={closeVariantModal} style={styles.modalButton}>
                  Cancelar
                </Button>
                <Button mode="contained" onPress={handleAddVariant} style={styles.modalButton}>
                  Guardar Cambios
                </Button>
              </View>
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </Modal>
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
  variantList: {
    marginTop: 10
  },
  modalOverlay: { 
    flexGrow: 1,
    backgroundColor: 'rgba(0,0,0,0.3)', 
    justifyContent: 'center', 
    alignItems: 'center', 
    padding: 20
  },
  modalContent: { 
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#fff', 
    padding: 20, 
    borderRadius: 8
  },
  modalTitle: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    marginBottom: 10, 
    textAlign: 'center'
  },
  modalSubtitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginVertical: 10
  },
  input: { 
    marginBottom: 10 
  },
  modalButtons: { 
    flexDirection: 'row', 
    justifyContent: 'flex-end' 
  },
  modalButton: { 
    marginLeft: 10 
  },
  existingVariants: {
    marginBottom: 10
  },
  variantRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 5
  },
  variantText: {
    flex: 1
  }
});
