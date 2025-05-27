// src/navigation/TabNavigator.tsx
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/Ionicons';

/* Pantallas */
import HomeScreen from '../screens/HomeScreen';
import SearchScreen from '../screens/SearchScreen';
import MyListScreen from '../screens/MyListScreen';
import WorldMapScreen from '../screens/WorldMapScreen';
import ProfileScreen from '../screens/ProfileScreen';
import TopMoviesScreen from '../screens/TopMoviesScreen'; // 🔥 Nuevo

const Tab = createBottomTabNavigator();

export default function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#121212',
          borderTopColor: '#1db954',
        },
        tabBarActiveTintColor: '#1db954',
        tabBarInactiveTintColor: '#aaa',
        tabBarIcon: ({ color, size }) => {
          let iconName: string;

          switch (route.name) {
            case 'Inicio':
              iconName = 'home-outline';
              break;
            case 'Buscar':
              iconName = 'search-outline';
              break;
            case 'MiLista':
              iconName = 'bookmark-outline';
              break;
            case 'Mapa':
              iconName = 'map-outline';
              break;
            case 'Estrenos':
              iconName = 'calendar-outline'; // 🗓️ nuevo icono para estrenos
              break;
            case 'Perfil':
              iconName = 'person-outline';
              break;
            default:
              iconName = 'ellipse-outline';
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Inicio" component={HomeScreen} />
      <Tab.Screen name="Buscar" component={SearchScreen} />
      <Tab.Screen name="MiLista" component={MyListScreen} />
      <Tab.Screen name="Mapa" component={WorldMapScreen} />
      <Tab.Screen name="Top 100" component={TopMoviesScreen} />
      <Tab.Screen name="Perfil" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
