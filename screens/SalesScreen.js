import React, { useState, useContext, useEffect } from 'react';
import { FlatList, StyleSheet, View, ScrollView, TouchableWithoutFeedback, Keyboard } from 'react-native';
import {
  Text,
  TextInput,
  Button,
  Card,
  Modal,
  Portal,
  Provider as PaperProvider,
  RadioButton
} from 'react-native-paper';
import { AppContext } from '../context/AppContext';

export default function SalesScreen({ navigation }) {
  const { inventory, sales, addSale, editSale } = useContext(AppContext);

  // Estado para manejar los productos incluidos en la venta
  // Cada elemento incluirá: { productId, name, variant: { size, color }, quantity, price, override, paymentMethod, channel }
  const [saleProducts, setSaleProducts] = useState([]);
  const [editingSale, setEditingSale] = useState(null);

  // Estado para modal de búsqueda de productos
  const [modalVisible, setModalVisible] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Estado para modal de selección de variante
  const [variantSelectionModalVisible, setVariantSelectionModalVisible] = useState(false);
  const [selectedProductForSale, setSelectedProductForSale] = useState(null);

  // Valores por defecto para método de pago y canal
  const [defaultPaymentMethod, setDefaultPaymentMethod] = useState("Efectivo");
  const [defaultChannel, setDefaultChannel] = useState("Local");

  useEffect(() => {
    if (editingSale) {
      setSaleProducts(editingSale.products);
    } else {
      setSaleProducts([]);
    }
  }, [editingSale]);

  const filteredInventory = inventory.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Al seleccionar un producto, si tiene variantes, se abre el modal para elegir una
  const selectProduct = (product) => {
    if (product.variants && product.variants.length > 0) {
      setSelectedProductForSale(product);
      setVariantSelectionModalVisible(true);
    } else {
      // Si el producto no tuviera variantes (lo ideal es que siempre tenga variantes)
      const exists = saleProducts.find(item => item.productId === product.id);
      if (!exists) {
        setSaleProducts([...saleProducts, { 
          productId: product.id, 
          name: product.name, 
          quantity: 1, 
          price: 0,
          override: false,
          paymentMethod: defaultPaymentMethod,
          channel: defaultChannel
        }]);
      }
      setModalVisible(false);
      setSearchTerm('');
    }
  };

  // Al seleccionar una variante, se añade el producto con la variante elegida
  const handleVariantSelection = (variant) => {
    const exists = saleProducts.find(item => 
      item.productId === selectedProductForSale.id &&
      item.variant &&
      item.variant.size.toLowerCase() === variant.size.toLowerCase() &&
      item.variant.color.toLowerCase() === variant.color.toLowerCase()
    );
    if (!exists) {
      setSaleProducts([...saleProducts, { 
        productId: selectedProductForSale.id, 
        name: selectedProductForSale.name,
        variant: variant,
        quantity: 1, 
        price: 0,
        override: false,
        paymentMethod: defaultPaymentMethod,
        channel: defaultChannel
      }]);
    }
    setVariantSelectionModalVisible(false);
    setModalVisible(false);
    setSearchTerm('');
    setSelectedProductForSale(null);
  };

  // Actualiza un campo de un ítem de venta basado en productId y la variante
  const updateSaleItem = (productId, variant, field, value) => {
    setSaleProducts(
      saleProducts.map(item =>
        (item.productId === productId &&
         item.variant &&
         item.variant.size.toLowerCase() === variant.size.toLowerCase() &&
         item.variant.color.toLowerCase() === variant.color.toLowerCase())
          ? { ...item, [field]: value }
          : item
      )
    );
  };

  const toggleProductOverride = (productId, variant) => {
    setSaleProducts(
      saleProducts.map(item =>
        (item.productId === productId &&
         item.variant &&
         item.variant.size.toLowerCase() === variant.size.toLowerCase() &&
         item.variant.color.toLowerCase() === variant.color.toLowerCase())
          ? { 
              ...item, 
              override: !item.override, 
              paymentMethod: defaultPaymentMethod, 
              channel: defaultChannel 
            }
          : item
      )
    );
  };

  const calculateTotal = () => {
    return saleProducts.reduce((acc, item) => acc + (item.quantity * item.price), 0);
  };

  const validateStock = () => {
    for (const item of saleProducts) {
      const prod = inventory.find(p => p.id === item.productId);
      if (!prod || !prod.variants || prod.variants.length === 0) return false;
      const variant = prod.variants.find(v =>
        (v.size || '').toLowerCase() === (item.variant.size || '').toLowerCase() &&
        (v.color || '').toLowerCase() === (item.variant.color || '').toLowerCase()
      );
      if (!variant || variant.stock < item.quantity) {
        return false;
      }
    }
    return true;
  };

  const handleConfirmSale = async () => {
    if (saleProducts.length === 0) {
      alert("Agrega al menos un producto a la venta");
      return;
    }
    for (const item of saleProducts) {
      const prod = inventory.find(p => p.id === item.productId);
      if (!prod || !prod.variants || prod.variants.length === 0) {
        alert(`No se encontró variantes para ${item.name}`);
        return;
      }
      const variant = prod.variants.find(v =>
        (v.size || '').toLowerCase() === (item.variant.size || '').toLowerCase() &&
        (v.color || '').toLowerCase() === (item.variant.color || '').toLowerCase()
      );
      if (!variant || variant.stock < item.quantity) {
        alert(`No hay suficiente stock para ${item.name} (${item.variant.size} - ${item.variant.color})`);
        return;
      }
    }
    const finalSaleProducts = saleProducts.map(item => {
      if (!item.override) {
        return { ...item, paymentMethod: defaultPaymentMethod, channel: defaultChannel };
      }
      return item;
    });
    const saleData = {
      products: finalSaleProducts,
      total: calculateTotal()
    };
    try {
      if (editingSale) {
        await editSale(editingSale.id, saleData, editingSale);
        setEditingSale(null);
      } else {
        await addSale(saleData);
      }
      setSaleProducts([]);
    } catch (error) {
      alert(error.message);
    }
  };

  const handleEditSale = (sale) => {
    setEditingSale(sale);
  };

  const cancelEditing = () => {
    setEditingSale(null);
    setSaleProducts([]);
  };

  const renderHeader = () => (
    <View>
      <Card style={styles.card}>
        <Card.Title title={editingSale ? "Editar Venta" : "Agregar Venta"} />
        <Card.Content>
          <Text style={styles.label}>Método de Pago (por defecto):</Text>
          <RadioButton.Group onValueChange={setDefaultPaymentMethod} value={defaultPaymentMethod}>
            <RadioButton.Item label="Efectivo" value="Efectivo" />
            <RadioButton.Item label="Transferencia" value="Transferencia" />
            <RadioButton.Item label="DEUNA" value="DEUNA" />
          </RadioButton.Group>
          <Text style={styles.label}>Canal (por defecto):</Text>
          <RadioButton.Group onValueChange={setDefaultChannel} value={defaultChannel}>
            <RadioButton.Item label="Local" value="Local" />
            <RadioButton.Item label="Online" value="Online" />
          </RadioButton.Group>
          <Button mode="outlined" onPress={() => setModalVisible(true)} style={styles.button}>
            Seleccionar Producto
          </Button>
          {saleProducts.map((item, index) => (
            <Card key={index} style={styles.saleItemCard}>
              <Card.Content>
                <Text>
                  {item.name} {item.variant ? `- Talla: ${item.variant.size} - Color: ${item.variant.color}` : ""}
                </Text>
                <TextInput
                  label="Cantidad"
                  value={item.quantity.toString()}
                  onChangeText={(val) =>
                    updateSaleItem(item.productId, item.variant, 'quantity', parseInt(val) || 0)
                  }
                  keyboardType="numeric"
                  style={styles.input}
                />
                <TextInput
                  label="Precio"
                  value={item.price.toString()}
                  onChangeText={(val) =>
                    updateSaleItem(item.productId, item.variant, 'price', parseFloat(val) || 0)
                  }
                  keyboardType="numeric"
                  style={styles.input}
                />
                <Text>Subtotal: ${item.quantity * item.price}</Text>
                <Button 
                  mode="outlined" 
                  onPress={() => toggleProductOverride(item.productId, item.variant)}
                  style={styles.button}
                >
                  {item.override ? "Usar valores por defecto" : "Modificar individualmente"}
                </Button>
                {item.override && (
                  <>
                    <Text style={styles.label}>Método de Pago:</Text>
                    <RadioButton.Group
                      onValueChange={(value) => updateSaleItem(item.productId, item.variant, 'paymentMethod', value)}
                      value={item.paymentMethod}
                    >
                      <RadioButton.Item label="Efectivo" value="Efectivo" />
                      <RadioButton.Item label="Transferencia" value="Transferencia" />
                      <RadioButton.Item label="DEUNA" value="DEUNA" />
                    </RadioButton.Group>
                    <Text style={styles.label}>Canal:</Text>
                    <RadioButton.Group
                      onValueChange={(value) => updateSaleItem(item.productId, item.variant, 'channel', value)}
                      value={item.channel}
                    >
                      <RadioButton.Item label="Local" value="Local" />
                      <RadioButton.Item label="Online" value="Online" />
                    </RadioButton.Group>
                  </>
                )}
              </Card.Content>
            </Card>
          ))}
          <Text style={styles.totalText}>Total: ${calculateTotal()}</Text>
          <Button mode="contained" onPress={handleConfirmSale} style={styles.button}>
            {editingSale ? "Guardar Cambios" : "Confirmar Venta"}
          </Button>
          {editingSale && (
            <Button mode="text" onPress={cancelEditing} style={styles.button}>
              Cancelar Edición
            </Button>
          )}
        </Card.Content>
      </Card>
      <Text style={styles.listTitle}>Historial de Ventas</Text>
    </View>
  );

  return (
    <PaperProvider>
      <Portal>
        {/* Modal para búsqueda de productos */}
        <Modal visible={modalVisible} onDismiss={() => setModalVisible(false)} contentContainerStyle={styles.modalContainer}>
          <TextInput
            label="Buscar producto"
            value={searchTerm}
            onChangeText={setSearchTerm}
            style={styles.input}
          />
          <FlatList
            data={filteredInventory}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <Card style={styles.card}>
                <Card.Title
                  title={item.name}
                  subtitle={item.variants && item.variants.length > 0 ? `Variantes disponibles: ${item.variants.length}` : "Sin variantes"}
                />
                <Card.Actions>
                  <Button onPress={() => selectProduct(item)}>Seleccionar</Button>
                </Card.Actions>
              </Card>
            )}
            ListEmptyComponent={<Text>No se encontraron productos.</Text>}
          />
        </Modal>

        {/* Modal para selección de variante */}
        <Modal visible={variantSelectionModalVisible} onDismiss={() => { setVariantSelectionModalVisible(false); setSelectedProductForSale(null); }} contentContainerStyle={styles.modalContainer}>
          <ScrollView>
            <Text style={styles.modalTitle}>
              Selecciona la variante para {selectedProductForSale ? selectedProductForSale.name : ''}
            </Text>
            {selectedProductForSale && selectedProductForSale.variants.map((variant, index) => (
              <Card key={index} style={styles.card}>
                <Card.Title title={`Talla: ${variant.size} - Color: ${variant.color}`} subtitle={`Stock: ${variant.stock}`} />
                <Card.Actions>
                  <Button onPress={() => handleVariantSelection(variant)}>Seleccionar</Button>
                </Card.Actions>
              </Card>
            ))}
          </ScrollView>
        </Modal>
      </Portal>
      <FlatList
        data={sales}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        renderItem={({ item }) => (
          <Card style={styles.card}>
            <Card.Title title={`Venta: $${item.total}`} subtitle={item.date} />
            <Card.Content>
              {item.products.map(prod => (
                <Text key={prod.productId}>
                  {prod.name} {prod.variant ? `- Talla: ${prod.variant.size} - Color: ${prod.variant.color}` : ''} - Cant: {prod.quantity} - Precio: ${prod.price} - Pago: {prod.paymentMethod} - Canal: {prod.channel}
                </Text>
              ))}
              <Button mode="text" onPress={() => handleEditSale(item)}>
                Editar
              </Button>
            </Card.Content>
          </Card>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No hay ventas registradas.</Text>}
        contentContainerStyle={styles.container}
      />
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#fff'
  },
  card: {
    marginVertical: 10
  },
  input: {
    marginVertical: 5
  },
  button: {
    marginTop: 10
  },
  saleItemCard: {
    marginVertical: 5
  },
  totalText: {
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 10
  },
  listTitle: {
    marginTop: 20,
    textAlign: 'center'
  },
  empty: {
    textAlign: 'center',
    marginTop: 20
  },
  modalContainer: {
    backgroundColor: 'white',
    padding: 20,
    margin: 20,
    maxHeight: '80%'
  },
  label: {
    fontWeight: 'bold',
    marginTop: 10
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center'
  }
});
