// File: /screens/HomeScreen.js
import React, { useContext, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Card, Button, Portal, Dialog, List } from 'react-native-paper';
import { AppContext } from '../context/AppContext';

export default function HomeScreen() {
  const { inventory, sales, logout } = useContext(AppContext);
  const today = new Date();

  // Estado del filtro y selección de mes/año
  const [filter, setFilter] = useState("today"); // Opciones: "today", "month", "year", "all"
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth());
  const [selectedYear, setSelectedYear] = useState(today.getFullYear());
  const [monthDialogVisible, setMonthDialogVisible] = useState(false);
  const [yearDialogVisible, setYearDialogVisible] = useState(false);

  // Función para comparar días (sin hora)
  const isSameDay = (d1, d2) =>
    d1.toISOString().slice(0, 10) === d2.toISOString().slice(0, 10);

  // Etiqueta del filtro según selección
  let filterLabel = "";
  if (filter === "today") {
    filterLabel = `Hoy (${today.toLocaleDateString()})`;
  } else if (filter === "month") {
    const monthName = new Date(2020, selectedMonth).toLocaleString('default', { month: 'long' });
    filterLabel = `Mes (${monthName} ${selectedYear})`;
  } else if (filter === "year") {
    filterLabel = `Año (${selectedYear})`;
  } else {
    filterLabel = "Todos";
  }

  // Filtrar ventas según el filtro seleccionado
  const filteredSales = sales.filter(sale => {
    const saleDate = new Date(sale.date);
    if (isNaN(saleDate.getTime())) {
      console.warn("Fecha inválida en venta:", sale.date);
      return false;
    }
    if (filter === "today") {
      return isSameDay(saleDate, today);
    } else if (filter === "month") {
      return (
        saleDate.getMonth() === selectedMonth &&
        saleDate.getFullYear() === selectedYear
      );
    } else if (filter === "year") {
      return saleDate.getFullYear() === selectedYear;
    } else {
      return true;
    }
  });

  const totalUnitsSold = filteredSales.reduce(
    (acc, sale) => acc + sale.products.reduce((sum, item) => sum + item.quantity, 0),
    0
  );

  const totalSalesAmount = filteredSales.reduce((acc, sale) => acc + sale.total, 0);

  // Resumen por método de pago
  const paymentSummary = {
    Efectivo: 0,
    Transferencia: 0,
    DEUNA: 0
  };

  // Resumen por canal
  const channelSummary = {
    Local: 0,
    Online: 0
  };

  // Recorremos cada venta filtrada para acumular subtotales según método de pago y canal
  filteredSales.forEach(sale => {
    sale.products.forEach(product => {
      const subtotal = product.quantity * product.price;
      // Método de pago
      if (paymentSummary.hasOwnProperty(product.paymentMethod)) {
        paymentSummary[product.paymentMethod] += subtotal;
      } else {
        paymentSummary["Otro"] = (paymentSummary["Otro"] || 0) + subtotal;
      }
      // Canal
      if (channelSummary.hasOwnProperty(product.channel)) {
        channelSummary[product.channel] += subtotal;
      } else {
        channelSummary["Otro"] = (channelSummary["Otro"] || 0) + subtotal;
      }
    });
  });

  // Opciones para meses
  const months = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ];

  // Opciones para años (por ejemplo, de 2020 al año actual + 1)
  const yearOptions = [];
  for (let y = 2020; y <= today.getFullYear() + 1; y++) {
    yearOptions.push(y);
  }

  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <Card.Title title={`Resumen (${filterLabel})`} />
        <Card.Content>
          <Text>Total de Productos: {inventory.length}</Text>
          <Text>Total de Ventas: {filteredSales.length}</Text>
          <Text>Unidades Vendidas: {totalUnitsSold}</Text>
          <Text>Total Recaudado: ${totalSalesAmount.toFixed(2)}</Text>
          <Text style={styles.summaryHeader}>Por Método de Pago:</Text>
          <Text>Efectivo: ${paymentSummary.Efectivo.toFixed(2)}</Text>
          <Text>Transferencia: ${paymentSummary.Transferencia.toFixed(2)}</Text>
          <Text>DEUNA: ${paymentSummary.DEUNA.toFixed(2)}</Text>
          {paymentSummary["Otro"] !== undefined && (
            <Text>Otro: ${paymentSummary["Otro"].toFixed(2)}</Text>
          )}
          <Text style={styles.summaryHeader}>Por Canal:</Text>
          <Text>Local: ${channelSummary.Local.toFixed(2)}</Text>
          <Text>Online: ${channelSummary.Online.toFixed(2)}</Text>
          {channelSummary["Otro"] !== undefined && (
            <Text>Otro: ${channelSummary["Otro"].toFixed(2)}</Text>
          )}
        </Card.Content>
      </Card>

      <View style={styles.filterButtons}>
        <Button mode="contained" onPress={() => setFilter("today")}>Hoy</Button>
        <Button mode="contained" onPress={() => { setFilter("month"); setMonthDialogVisible(true); }}>Mes</Button>
        <Button mode="contained" onPress={() => { setFilter("year"); setYearDialogVisible(true); }}>Año</Button>
        <Button mode="contained" onPress={() => setFilter("all")}>Todos</Button>
      </View>

      <Button mode="outlined" onPress={logout} style={styles.button}>
        Cerrar Sesión
      </Button>

      {/* Dialog para seleccionar mes */}
      <Portal>
        <Dialog visible={monthDialogVisible} onDismiss={() => setMonthDialogVisible(false)}>
          <Dialog.Title>Selecciona el mes</Dialog.Title>
          <Dialog.Content>
            {months.map((monthName, index) => (
              <List.Item
                key={index}
                title={monthName}
                onPress={() => {
                  setSelectedMonth(index);
                  setMonthDialogVisible(false);
                }}
              />
            ))}
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setMonthDialogVisible(false)}>Cancelar</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Dialog para seleccionar año */}
      <Portal>
        <Dialog visible={yearDialogVisible} onDismiss={() => setYearDialogVisible(false)}>
          <Dialog.Title>Selecciona el año</Dialog.Title>
          <Dialog.Content>
            {yearOptions.map((year) => (
              <List.Item
                key={year}
                title={year.toString()}
                onPress={() => {
                  setSelectedYear(year);
                  setYearDialogVisible(false);
                }}
              />
            ))}
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setYearDialogVisible(false)}>Cancelar</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  card: { marginVertical: 10 },
  button: { marginTop: 20 },
  filterButtons: { flexDirection: 'row', justifyContent: 'space-around', marginVertical: 10 },
  summaryHeader: { marginTop: 10, fontWeight: 'bold' }
});
