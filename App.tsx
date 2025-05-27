// App.tsx
import React from 'react';
import {
  LogBox,
  Platform,
  UIManager,
} from 'react-native';
import {
  NavigationContainer,
  DefaultTheme,
  Theme,
} from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  useFonts,
  Merriweather_700Bold,
} from '@expo-google-fonts/merriweather';

// Pantallas
import LoginScreen        from './src/screens/LoginScreen';
import RegisterScreen     from './src/screens/RegisterScreen';
import MovieDetailScreen  from './src/screens/MovieDetailScreen';
import DirectorBioScreen  from './src/screens/DirectorBioScreen';
import TabNavigator       from './src/navigation/TabNavigator'; // ← TabNavigator definitivo

// Silenciar warning de LayoutAnimation en la nueva arquitectura
LogBox.ignoreLogs([
  "'setLayoutAnimationEnabledExperimental' is not available in the new React Native architecture",
]);

// Intentar habilitar LayoutAnimation en Android
if (Platform.OS === 'android') {
  UIManager.setLayoutAnimationEnabledExperimental?.(true);
}

const Stack = createNativeStackNavigator();

// Tema estilo Letterboxd
const customTheme: Theme = {
  ...DefaultTheme,
  dark: true,
  colors: {
    ...DefaultTheme.colors,
    background:  '#121212',
    card:        '#181818',
    text:        '#ffffff',
    border:      '#2a2a2a',
    primary:     '#1db954',
    notification:'#1db954',
  },
};

export default function App() {
  const [fontsLoaded] = useFonts({ Merriweather_700Bold });
  if (!fontsLoaded) return null;

  return (
    <SafeAreaProvider>
      <NavigationContainer theme={customTheme}>
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
            animation: 'fade',
          }}
          initialRouteName="Login"
        >
          {/* Auth */}
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />

          {/* Main Tabs */}
          <Stack.Screen name="Home" component={TabNavigator} />

          {/* Detalles */}
          <Stack.Screen name="MovieDetailScreen" component={MovieDetailScreen} />
          <Stack.Screen name="DirectorBio" component={DirectorBioScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
