// src/screens/HomeScreen.tsx

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ScrollView,
  RefreshControl,
  ImageBackground,
  Image,
  SafeAreaView,
} from 'react-native';
import { auth } from '../services/firebaseConfig';
import tmdbService from '../services/tmdbService';
import Icon from 'react-native-vector-icons/Ionicons';
import {
  useFonts,
  Merriweather_700Bold,
  Merriweather_400Regular,
} from '@expo-google-fonts/merriweather';

interface Movie {
  id: number;
  title: string;
  poster_path: string;
  overview: string;
  vote_average: number;
  release_date: string;
}

interface Genre {
  id: number;
  name: string;
}

const EmptyResults = ({ message }: { message: string }) => (
  <View style={styles.emptyContainer}>
    <Icon name="alert-circle-outline" size={50} color="#888" />
    <Text style={styles.emptyText}>{message}</Text>
  </View>
);

export default function HomeScreen({ navigation }: { navigation: any }) {
  // Estados
  const [popular, setPopular] = useState<Movie[]>([]);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [byGenre, setByGenre] = useState<Record<number, Movie[]>>({});
  const [selectedGenre, setSelectedGenre] = useState<number | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Hook de carga de datos
  const fetchAll = useCallback(async () => {
    setRefreshing(true);
    try {
      const popRes = await tmdbService.getPopularMovies();
      setPopular(popRes.data.results);

      const fixed = [
        { id: 28, name: 'Acción' },
        { id: 12, name: 'Aventura' },
        { id: 16, name: 'Animación' },
        { id: 18, name: 'Drama' },
        { id: 14, name: 'Fantasía' },
        { id: 10749, name: 'Romance' },
        { id: 53, name: 'Suspenso' },
        { id: 10752, name: 'Bélica' },
      ];
      setGenres(fixed);

      const obj: Record<number, Movie[]> = {};
      await Promise.all(
        fixed.map(async g => {
          const res = await tmdbService.getMoviesByGenre(g.id);
          obj[g.id] = res.data.results;
        })
      );
      setByGenre(obj);
    } catch (e) {
      console.error(e);
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // Fuentes (si no cargan, mostramos vacío)
  const [fontsLoaded] = useFonts({ Merriweather_700Bold, Merriweather_400Regular });
  if (!fontsLoaded) return null;

  // Usuario
  const user = auth.currentUser;
  const name = user?.displayName?.split(' ')[0] || 'Usuario';
  const avatar = user?.photoURL;

  // Tarjeta de película
  const MovieCard = ({ movie }: { movie: Movie }) => (
    <View style={styles.card}>
      <TouchableOpacity
        onPress={() => navigation.navigate('MovieDetailScreen', { movieId: movie.id })}
      >
        <Image
          source={{
            uri: movie.poster_path
              ? `https://image.tmdb.org/t/p/w342${movie.poster_path}`
              : 'https://via.placeholder.com/150x225',
          }}
          style={styles.poster}
        />
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{movie.vote_average.toFixed(1)}</Text>
        </View>
        <Text style={styles.title} numberOfLines={1}>
          {movie.title}
        </Text>
        <Text style={styles.overview} numberOfLines={2}>
          {movie.overview || 'Sin descripción'}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.addBtn}>
        <Text style={styles.addText}>+ Mi Lista</Text>
      </TouchableOpacity>
    </View>
  );

  // Sección horizontal
  const Section = ({ title, data }: { title: string; data: Movie[] }) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {data.length ? (
        <FlatList
          data={data}
          horizontal
          keyExtractor={m => m.id.toString()}
          renderItem={({ item }) => <MovieCard movie={item} />}
          showsHorizontalScrollIndicator={false}
        />
      ) : (
        <EmptyResults message="No hay películas disponibles" />
      )}
    </View>
  );

  // Datos según género
  const current = selectedGenre ? byGenre[selectedGenre] || [] : popular;

  return (
    <ImageBackground
      source={require('../../assets/images/3.jpg')}
      style={styles.bg}
      blurRadius={3}
    >
      <View style={styles.overlay}>
        <SafeAreaView style={styles.safe}>
          <ScrollView
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={fetchAll} tintColor="#FFF" />
            }
          >
            {/* Header */}
            <View style={styles.header}>
              <View>
                <Text style={styles.greeting}>Hola, {name}</Text>
                <Text style={styles.sub}>¿Qué deseas ver hoy?</Text>
              </View>
              <TouchableOpacity onPress={() => navigation.navigate('Perfil')}>
                {avatar ? (
                  <Image source={{ uri: avatar }} style={styles.avatar} />
                ) : (
                  <View style={styles.placeholder}>
                    <Text style={styles.letter}>{name.charAt(0)}</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>

            {/* Search */}
            <View style={styles.searchContainer}>
              <Icon name="search" size={20} color="#888" style={styles.searchIcon} />
              <TextInput
                placeholder="Buscar películas..."
                placeholderTextColor="#888"
                style={styles.searchInput}
              />
            </View>

            {/* Chips */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.chips}
            >
              <TouchableOpacity
                onPress={() => setSelectedGenre(null)}
                style={[styles.chip, !selectedGenre && styles.activeChip]}
              >
                <Text style={[styles.chipText, !selectedGenre && styles.activeText]}>Populares</Text>
              </TouchableOpacity>
              {genres.map(g => (
                <TouchableOpacity
                  key={g.id}
                  onPress={() => setSelectedGenre(g.id)}
                  style={[styles.chip, selectedGenre === g.id && styles.activeChip]}
                >
                  <Text
                    style={[
                      styles.chipText,
                      selectedGenre === g.id && styles.activeText,
                    ]}
                  >
                    {g.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Películas */}
            <Section
              title={
                selectedGenre
                  ? genres.find(g => g.id === selectedGenre)?.name || ''
                  : 'Populares'
              }
              data={current}
            />

            <View style={{ height: 32 }} />
          </ScrollView>
        </SafeAreaView>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)' },
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  greeting: {
    fontFamily: 'Merriweather_700Bold',
    fontSize: 28,
    color: '#FFF',
  },
  sub: {
    fontFamily: 'Merriweather_400Regular',
    fontSize: 16,
    color: '#DDD',
    marginTop: 4,
  },
  avatar: { width: 40, height: 40, borderRadius: 20 },
  placeholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  letter: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },

  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    marginHorizontal: 16,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  searchIcon: { marginRight: 8 },
  searchInput: {
    flex: 1,
    height: 40,
    color: '#FFF',
    fontSize: 14,
    fontFamily: 'Merriweather_400Regular',
  },

  chips: { paddingHorizontal: 16, marginBottom: 12 },
  chip: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginRight: 8,
  },
  activeChip: { backgroundColor: '#FFF' },
  chipText: {
    fontFamily: 'Merriweather_400Regular',
    fontSize: 14,
    color: '#FFF',
  },
  activeText: { color: '#000' },

  section: { marginBottom: 24 },
  sectionTitle: {
    fontFamily: 'Merriweather_700Bold',
    fontSize: 20,
    color: '#FFF',
    marginLeft: 16,
    marginBottom: 12,
  },

  card: {
    width: 140,
    marginLeft: 16,
    backgroundColor: '#111',
    borderRadius: 8,
    overflow: 'hidden',
  },
  poster: { width: '100%', height: 200 },
  badge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#1db954',
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  badgeText: { color: '#000', fontSize: 12, fontWeight: 'bold' },
  title: {
    fontFamily: 'Merriweather_400Regular',
    fontSize: 14,
    color: '#FFF',
    margin: 8,
  },
  overview: {
    fontFamily: 'Merriweather_400Regular',
    fontSize: 12,
    color: '#CCC',
    marginHorizontal: 8,
  },
  addBtn: {
    margin: 8,
    paddingVertical: 6,
    borderRadius: 4,
    backgroundColor: '#1db954',
    alignItems: 'center',
  },
  addText: { color: '#000', fontWeight: '600', fontSize: 12 },

  emptyContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#888',
    marginTop: 8,
    textAlign: 'center',
  },
});
