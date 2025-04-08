// File: /screens/ReportScreen.js
import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Card, Text, Button } from 'react-native-paper';

export default function ReportScreen() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Card style={styles.card}>
        <Card.Title title="Reporte de Ventas" />
        <Card.Content>
          <Text>Resumen de ventas diarias, semanales y mensuales.</Text>
        </Card.Content>
      </Card>
      <Button mode="contained" style={styles.button}>
        Ver más detalles
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { 
    padding: 20, 
    backgroundColor: '#fff',
    flexGrow: 1
  },
  card: {
    marginVertical: 10
  },
  button: {
    marginTop: 10
  },
});
