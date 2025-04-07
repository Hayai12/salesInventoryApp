import React, { useState, useContext, useEffect } from 'react';
import { FlatList, StyleSheet, View, ScrollView, Alert, Modal as RNModal } from 'react-native';
import {
  Text,
  TextInput,
  Button,
  Card,
  RadioButton,
  Provider as PaperProvider
} from 'react-native-paper';
import { AppContext } from '../context/AppContext';

// Función para generar un ID único para cada ítem de venta
const generateSaleId = (productId, variant) => {
  if (variant) {
    return `${productId}-${variant.size}-${variant.color}-${Date.now()}-${Math.random()}`;
  }
  return `${productId}-noVariant-${Date.now()}-${Math.random()}`;
};

const SaleItem = React.memo(({ item, updateSaleItem, toggleProductOverride }) => {
  const [localQuantity, setLocalQuantity] = useState(item.quantity.toString());
  const [localPrice, setLocalPrice] = useState(item.price.toString());

  useEffect(() => {
    setLocalQuantity(item.quantity.toString());
  }, [item.quantity]);

  useEffect(() => {
    setLocalPrice(item.price.toString());
  }, [item.price]);

  const handleQuantityChange = (text) => {
    setLocalQuantity(text);
  };

  const handlePriceChange = (text) => {
    setLocalPrice(text);
  };

  const handleQuantityBlur = () => {
    const newQuantity = parseInt(localQuantity) || 0;
    if (newQuantity !== item.quantity) {
      updateSaleItem(item.productId, item.variant, 'quantity', newQuantity);
    }
  };

  const handlePriceBlur = () => {
    const newPrice = parseFloat(localPrice) || 0;
    if (newPrice !== item.price) {
      updateSaleItem(item.productId, item.variant, 'price', newPrice);
    }
  };

  return (
    <Card style={styles.saleItemCard}>
      <Card.Content>
        <Text style={styles.saleItemText}>
          {item.name} {item.variant ? `- Talla: ${item.variant.size} - Color: ${item.variant.color}` : ""}
        </Text>
        <View style={styles.inputRow}>
          <TextInput
            label="Cantidad"
            value={localQuantity}
            onChangeText={handleQuantityChange}
            onBlur={handleQuantityBlur}
            keyboardType="numeric"
            style={[styles.input, styles.inputSmall]}
          />
          <TextInput
            label="Precio"
            value={localPrice}
            onChangeText={handlePriceChange}
            onBlur={handlePriceBlur}
            keyboardType="numeric"
            style={[styles.input, styles.inputSmall]}
          />
        </View>
        <Text style={styles.subtotalText}>
          Subtotal: ${item.quantity * item.price}
        </Text>
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
              onValueChange={(value) =>
                updateSaleItem(item.productId, item.variant, 'paymentMethod', value)
              }
              value={item.paymentMethod}
            >
              <RadioButton.Item label="Efectivo" value="Efectivo" />
              <RadioButton.Item label="Transferencia" value="Transferencia" />
              <RadioButton.Item label="DEUNA" value="DEUNA" />
            </RadioButton.Group>
            <Text style={styles.label}>Canal:</Text>
            <RadioButton.Group
              onValueChange={(value) =>
                updateSaleItem(item.productId, item.variant, 'channel', value)
              }
              value={item.channel}
            >
              <RadioButton.Item label="Local" value="Local" />
              <RadioButton.Item label="Online" value="Online" />
            </RadioButton.Group>
          </>
        )}
      </Card.Content>
    </Card>
  );
});

export default function SalesScreen({ navigation }) {
  const { inventory, sales, addSale, editSale, deleteSale } = useContext(AppContext);

  // Estados y lógica de la pantalla (modales, edición, etc.)
  const [saleProducts, setSaleProducts] = useState([]);
  const [editingSale, setEditingSale] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [variantSelectionModalVisible, setVariantSelectionModalVisible] = useState(false);
  const [selectedProductForSale, setSelectedProductForSale] = useState(null);
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

  const selectProduct = (product) => {
    if (product.variants && product.variants.length > 0) {
      setSelectedProductForSale(product);
      setVariantSelectionModalVisible(true);
    } else {
      const exists = saleProducts.find(item => item.productId === product.id);
      if (!exists) {
        setSaleProducts([
          ...saleProducts,
          { 
            id: generateSaleId(product.id),
            productId: product.id, 
            name: product.name, 
            quantity: 1, 
            price: 0,
            override: false,
            paymentMethod: defaultPaymentMethod,
            channel: defaultChannel
          }
        ]);
      }
      setModalVisible(false);
      setSearchTerm('');
    }
  };

  const handleVariantSelection = (variant) => {
    const exists = saleProducts.find(item => 
      item.productId === selectedProductForSale.id &&
      item.variant &&
      item.variant.size.toLowerCase() === variant.size.toLowerCase() &&
      item.variant.color.toLowerCase() === variant.color.toLowerCase()
    );
    if (!exists) {
      setSaleProducts([
        ...saleProducts,
        { 
          id: generateSaleId(selectedProductForSale.id, variant),
          productId: selectedProductForSale.id, 
          name: selectedProductForSale.name,
          variant: variant,
          quantity: 1, 
          price: 0,
          override: false,
          paymentMethod: defaultPaymentMethod,
          channel: defaultChannel
        }
      ]);
    }
    setVariantSelectionModalVisible(false);
    setModalVisible(false);
    setSearchTerm('');
    setSelectedProductForSale(null);
  };

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

  const handleConfirmSale = async () => {
    if (saleProducts.length === 0) {
      Alert.alert("Atención", "Agrega al menos un producto a la venta");
      return;
    }
    for (const item of saleProducts) {
      const prod = inventory.find(p => p.id === item.productId);
      if (!prod || !prod.variants || prod.variants.length === 0) {
        Alert.alert("Error", `No se encontró variantes para ${item.name}`);
        return;
      }
      const variant = prod.variants.find(v =>
        (v.size || '').toLowerCase() === (item.variant.size || '').toLowerCase() &&
        (v.color || '').toLowerCase() === (item.variant.color || '').toLowerCase()
      );
      if (!variant || variant.stock < item.quantity) {
        Alert.alert("Error", `No hay suficiente stock para ${item.name} (${item.variant.size} - ${item.variant.color})`);
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
      Alert.alert("Error", error.message);
    }
  };

  const handleEditSale = (sale) => {
    setEditingSale(sale);
  };

  const handleDeleteSale = (sale) => {
    Alert.alert(
      "Eliminar Venta",
      "¿Está seguro de eliminar esta venta? Se reintegrará el stock de los productos.",
      [
        { text: "Cancelar", style: "cancel" },
        { 
          text: "Eliminar", 
          style: "destructive",
          onPress: async () => {
            try {
              await deleteSale(sale.id, sale);
            } catch (error) {
              Alert.alert("Error", error.message);
            }
          }
        }
      ]
    );
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
          {saleProducts.map((item) => (
            <SaleItem
              key={item.id}
              item={item}
              updateSaleItem={updateSaleItem}
              toggleProductOverride={toggleProductOverride}
            />
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
      {/* Modal para búsqueda de productos */}
      <RNModal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
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
                    subtitle={item.variants && item.variants.length > 0 ? `Variantes: ${item.variants.length}` : "Sin variantes"}
                  />
                  <Card.Actions>
                    <Button onPress={() => selectProduct(item)}>Seleccionar</Button>
                  </Card.Actions>
                </Card>
              )}
              ListEmptyComponent={<Text>No se encontraron productos.</Text>}
            />
            <Button
              mode="outlined"
              onPress={() => { setModalVisible(false); setSearchTerm(''); }}
              style={styles.cancelButton}
            >
              Cancelar
            </Button>
          </View>
        </View>
      </RNModal>

      {/* Modal para selección de variante */}
      <RNModal
        visible={variantSelectionModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => { 
          setVariantSelectionModalVisible(false); 
          setSelectedProductForSale(null);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <ScrollView>
              <Text style={styles.modalTitle}>
                Selecciona la variante para {selectedProductForSale ? selectedProductForSale.name : ''}
              </Text>
              {selectedProductForSale && selectedProductForSale.variants.map((variant, index) => (
                <Card key={index} style={styles.card}>
                  <Card.Title
                    title={`Talla: ${variant.size} - Color: ${variant.color}`}
                    subtitle={`Stock: ${variant.stock}`}
                  />
                  <Card.Actions>
                    <Button onPress={() => handleVariantSelection(variant)}>Seleccionar</Button>
                  </Card.Actions>
                </Card>
              ))}
            </ScrollView>
            <Button
              mode="outlined"
              onPress={() => { setVariantSelectionModalVisible(false); setSelectedProductForSale(null); }}
              style={styles.cancelButton}
            >
              Cancelar
            </Button>
          </View>
        </View>
      </RNModal>

      <FlatList
        data={sales}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        renderItem={({ item }) => (
          <Card style={styles.saleCard}>
            <Card.Title title={`Venta: $${item.total}`} subtitle={`Fecha: ${item.date}`} />
            <Card.Content>
              {item.products.map(prod => (
                <Text key={prod.productId + (prod.variant ? `-${prod.variant.size}-${prod.variant.color}` : '')} style={styles.saleItemText}>
                  {prod.name} {prod.variant ? `- Talla: ${prod.variant.size} - Color: ${prod.variant.color}` : ''} - Cant: {prod.quantity} - Precio: ${prod.price} - Pago: {prod.paymentMethod} - Canal: {prod.channel}
                </Text>
              ))}
              <View style={styles.saleButtonsContainer}>
                <Button mode="text" onPress={() => handleEditSale(item)}>
                  Editar
                </Button>
                <Button mode="text" onPress={() => handleDeleteSale(item)} color="red">
                  Eliminar
                </Button>
              </View>
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
  saleCard: {
    marginVertical: 10,
    backgroundColor: '#f9f9f9'
  },
  input: {
    marginVertical: 5
  },
  inputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  inputSmall: {
    flex: 0.48
  },
  button: {
    marginTop: 10
  },
  cancelButton: {
    marginTop: 10,
    alignSelf: 'center'
  },
  saleItemCard: {
    marginVertical: 5
  },
  saleItemText: {
    marginVertical: 2,
    fontSize: 14
  },
  subtotalText: {
    fontWeight: 'bold',
    marginVertical: 5
  },
  totalText: {
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 10,
    fontSize: 16
  },
  listTitle: {
    marginTop: 20,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: 'bold'
  },
  empty: {
    textAlign: 'center',
    marginTop: 20
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center'
  },
  modalContainer: {
    backgroundColor: 'white',
    padding: 20,
    marginHorizontal: 20,
    maxHeight: '80%',
    borderRadius: 8
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
  },
  saleButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10
  }
});
