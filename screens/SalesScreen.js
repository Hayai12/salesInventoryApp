// File: /screens/SalesScreen.js
import React, { useState, useContext } from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { Text, TextInput, Button, Card } from 'react-native-paper';
import { AppContext } from '../context/AppContext';

export default function SalesScreen() {
  const { sales, addSale } = useContext(AppContext);
  const [saleAmount, setSaleAmount] = useState('');
  const [saleDescription, setSaleDescription] = useState('');

  const handleAddSale = () => {
    if (saleAmount && saleDescription) {
      const newSale = {
        id: Date.now().toString(),
        amount: saleAmount,
        description: saleDescription,
        date: new Date().toLocaleString(),
      };
      addSale(newSale);
      setSaleAmount('');
      setSaleDescription('');
    }
  };

  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <Card.Title title="Agregar Venta" />
        <Card.Content>
          <TextInput
            label="Monto"
            value={saleAmount}
            onChangeText={setSaleAmount}
            keyboardType="numeric"
            style={styles.input}
          />
          <TextInput
            label="Descripción"
            value={saleDescription}
            onChangeText={setSaleDescription}
            style={styles.input}
          />
          <Button mode="contained" onPress={handleAddSale}>
            Agregar Venta
          </Button>
        </Card.Content>
      </Card>
      <FlatList
        data={sales}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Card style={styles.card}>
            <Card.Title title={`Venta: $${item.amount}`} subtitle={item.date} />
            <Card.Content>
              <Text>{item.description}</Text>
            </Card.Content>
          </Card>
        )}
        ListEmptyComponent={<Text>No hay ventas registradas.</Text>}
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
