// src/screens/WorldCinemaScreen.tsx
import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Dimensions,
  Platform,
  Image,
  Text,
} from 'react-native';
import MapView, { Marker, Region, Callout } from 'react-native-maps';
import CountryTopMoviesModal from './CountryTopMoviesModal';
import { LEGENDARY_DIRECTORS } from '../services/tmdbService';
import TMDBService, { Movie } from '../services/tmdbService';

const { width, height } = Dimensions.get('window');

const countryMarkers = [
  { name: 'México', code: 'MX', lat: 23.6345, lng: -102.5528 },
  { name: 'Brasil', code: 'BR', lat: -14.235, lng: -51.9253 },
  { name: 'Italia', code: 'IT', lat: 41.8719, lng: 12.5674 },
  { name: 'Francia', code: 'FR', lat: 46.6034, lng: 1.8883 },
  { name: 'Japón', code: 'JP', lat: 36.2048, lng: 138.2529 },
  { name: 'India', code: 'IN', lat: 20.5937, lng: 78.9629 },
  { name: 'EE.UU.', code: 'US', lat: 37.0902, lng: -95.7129 },
  { name: 'Reino Unido', code: 'GB', lat: 55.3781, lng: -3.4360 },
  { name: 'Suecia', code: 'SE', lat: 60.1282, lng: 18.6435 },
  { name: 'Corea del Sur', code: 'KR', lat: 35.9078, lng: 127.7669 },
  { name: 'Irán', code: 'IR', lat: 32.4279, lng: 53.6880 },
  { name: 'Hong Kong', code: 'HK', lat: 22.3193, lng: 114.1694 },
  { name: 'Canadá', code: 'CA', lat: 56.1304, lng: -106.3468 },
  { name: 'Australia', code: 'AU', lat: -25.2744, lng: 133.7751 },
  { name: 'Rusia', code: 'RU', lat: 61.5240, lng: 105.3188 },
  { name: 'Argentina', code: 'AR', lat: -38.4161, lng: -63.6167 },
  { name: 'España', code: 'ES', lat: 40.4637, lng: -3.7492 },
];

const getDirectorByCountryCode = (code: string) => {
  return LEGENDARY_DIRECTORS.find((d) => d.country === code);
};

export default function WorldCinemaScreen() {
  const [selectedCountryCode, setSelectedCountryCode] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [movies, setMovies] = useState<Movie[]>([]);

  const handleMarkerPress = async (code: string) => {
    const director = getDirectorByCountryCode(code);
    if (director) {
      const topMovies = await TMDBService.getTopMoviesByDirector(director.id);
      setSelectedCountryCode(code);
      setMovies(topMovies.slice(0, 10));
      setModalVisible(true);
    }
  };

  const selectedDirector = selectedCountryCode
    ? getDirectorByCountryCode(selectedCountryCode)
    : null;

  const initialRegion: Region = {
    latitude: 20,
    longitude: 0,
    latitudeDelta: 90,
    longitudeDelta: 180,
  };

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={initialRegion}
        customMapStyle={darkMapStyle}
      >
        {countryMarkers.map((country) => (
          <Marker
            key={country.code}
            coordinate={{ latitude: country.lat, longitude: country.lng }}
            onPress={() => handleMarkerPress(country.code)}
          >
            <Image
              source={{
                uri: `https://flagcdn.com/w40/${country.code.toLowerCase()}.png`,
              }}
              style={{ width: 32, height: 24, borderRadius: 4 }}
              resizeMode="contain"
            />
            <Callout>
              <Text>{country.name}</Text>
              <Text style={{ fontSize: 12 }}>
                {getDirectorByCountryCode(country.code)?.name}
              </Text>
            </Callout>
          </Marker>
        ))}
      </MapView>

      {selectedDirector && (
        <CountryTopMoviesModal
          visible={modalVisible}
          directorId={selectedDirector.id}
          directorName={selectedDirector.name}
          movies={movies}
          onClose={() => setModalVisible(false)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  map: {
    width,
    height,
  },
});

const darkMapStyle = [
  {
    elementType: 'geometry',
    stylers: [{ color: '#1d2c4d' }],
  },
  {
    elementType: 'labels.text.fill',
    stylers: [{ color: '#8ec3b9' }],
  },
  {
    elementType: 'labels.text.stroke',
    stylers: [{ color: '#1a3646' }],
  },
  {
    featureType: 'administrative.country',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#4b6878' }],
  },
  {
    featureType: 'landscape',
    elementType: 'geometry',
    stylers: [{ color: '#2e3b4e' }],
  },
  {
    featureType: 'poi',
    elementType: 'geometry',
    stylers: [{ color: '#406d80' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry',
    stylers: [{ color: '#304a7d' }],
  },
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#0e1626' }],
  },
];
