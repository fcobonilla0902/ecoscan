import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { AppProvider } from './src/store';
import { colors } from './src/theme';
import HomeScreen from './src/screens/HomeScreen';
import MapScreen from './src/screens/MapScreen';
import LearnScreen from './src/screens/LearnScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import ScanScreen from './src/screens/ScanScreen';
import ResultScreen from './src/screens/ResultScreen';
import PickMaterialScreen from './src/screens/PickMaterialScreen';
import ARScreen from './src/screens/ARScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const ICONS = {
  Inicio: 'home',
  Mapa: 'map',
  Aprender: 'bulb',
  Perfil: 'person-circle',
};

function ScanButton({ onPress }) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={styles.fabWrap}>
      <View style={styles.fab}>
        <Ionicons name="cube" size={28} color="#fff" />
        <Text style={styles.fabText}>AR</Text>
      </View>
    </TouchableOpacity>
  );
}

function Tabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.green,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: { height: 64, paddingBottom: 8, paddingTop: 6 },
        tabBarIcon: ({ color, size }) =>
          ICONS[route.name] ? <Ionicons name={ICONS[route.name]} size={size} color={color} /> : null,
      })}
    >
      <Tab.Screen name="Inicio" component={HomeScreen} />
      <Tab.Screen name="Mapa" component={MapScreen} />
      <Tab.Screen
        name="EscanearTab"
        component={View}
        options={({ navigation }) => ({
          tabBarLabel: '',
          tabBarButton: () => <ScanButton onPress={() => navigation.navigate('AR')} />,
        })}
      />
      <Tab.Screen name="Aprender" component={LearnScreen} />
      <Tab.Screen name="Perfil" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AppProvider>
        <NavigationContainer>
          <StatusBar style="dark" />
          <Stack.Navigator
            screenOptions={{
              headerTintColor: colors.greenDark,
              headerTitleStyle: { color: colors.text },
              headerBackTitle: 'Atrás',
            }}
          >
            <Stack.Screen name="Tabs" component={Tabs} options={{ headerShown: false }} />
            <Stack.Screen name="Escanear" component={ScanScreen} options={{ title: 'Escanear' }} />
            <Stack.Screen name="Elegir" component={PickMaterialScreen} options={{ title: 'Elegir material' }} />
            <Stack.Screen name="Resultado" component={ResultScreen} options={{ title: 'Resultado' }} />
            <Stack.Screen name="AR" component={ARScreen} options={{ headerShown: false }} />
          </Stack.Navigator>
        </NavigationContainer>
      </AppProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  fabWrap: { top: -18, flex: 1, alignItems: 'center', justifyContent: 'center' },
  fabText: { color: '#fff', fontWeight: '900', fontSize: 11, marginTop: -2, letterSpacing: 1 },
  fab: {
    width: 66,
    height: 66,
    borderRadius: 33,
    backgroundColor: colors.green,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 6,
  },
});
