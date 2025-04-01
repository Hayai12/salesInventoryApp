// File: /screens/HomeScreen.js
import React, { useContext } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Card } from 'react-native-paper';
import { AppContext } from '../context/AppContext';

export default function HomeScreen() {
  const { inventory, sales } = useContext(AppContext);

  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <Card.Title title="Resumen" />
        <Card.Content>
          <Text>Total de Productos: {inventory.length}</Text>
          <Text>Total de Ventas: {sales.length}</Text>
        </Card.Content>
      </Card>
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
});
