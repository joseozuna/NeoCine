// SearchScreen.tsx actualizado con fondo, Merriweather y estilo Letterboxd

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  Image,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  ImageBackground,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getPopularMovies, searchMovies } from '../services/tmdbService';
import { useNavigation } from '@react-navigation/native';
import {
  useFonts,
  Merriweather_700Bold,
  Merriweather_400Regular,
} from '@expo-google-fonts/merriweather';

export default function SearchScreen() {
  const navigation = useNavigation();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [allMovies, setAllMovies] = useState([]);
  const [filteredMovies, setFilteredMovies] = useState([]);

  const [fontsLoaded] = useFonts({
    Merriweather_700Bold,
    Merriweather_400Regular,
  });

  useEffect(() => {
    fetchPopularMovies();
  }, []);

  const fetchPopularMovies = async () => {
    setIsSearching(true);
    try {
      const res = await getPopularMovies();
      const movies = res.data.results.map((movie: any) => ({
        id: movie.id,
        title: movie.title,
        year: movie.release_date?.substring(0, 4) || 'N/A',
        rating: movie.vote_average ?? 0,
        poster: `https://image.tmdb.org/t/p/w500${movie.poster_path}`,
        genre: 'Popular',
      }));
      setAllMovies(movies);
      setFilteredMovies(movies);
    } catch (error) {
      console.error('Error fetching popular movies:', error);
    }
    setIsSearching(false);
  };

  const handleSearch = async (text: string) => {
    setSearchQuery(text);
    setIsSearching(true);

    if (text.trim() === '') {
      setFilteredMovies(allMovies);
      setIsSearching(false);
      return;
    }

    try {
      const res = await searchMovies(text);
      const results = res.data.results.map((movie: any) => ({
        id: movie.id,
        title: movie.title,
        year: movie.release_date?.substring(0, 4) || 'N/A',
        rating: movie.vote_average ?? 0,
        poster: `https://image.tmdb.org/t/p/w500${movie.poster_path}`,
        genre: 'Búsqueda',
      }));
      setFilteredMovies(results);
    } catch (error) {
      console.error('Error searching movies:', error);
      setFilteredMovies([]);
    }

    setIsSearching(false);
  };

  const MovieItem = ({ movie }: { movie: any }) => (
    <TouchableOpacity
      style={styles.movieItem}
      onPress={() =>
        navigation.navigate('MovieDetailScreen', { movieId: movie.id })
      }
    >
      <Image source={{ uri: movie.poster }} style={styles.poster} resizeMode="cover" />
      <View style={styles.movieInfo}>
        <Text style={styles.movieTitle}>{movie.title}</Text>
        <Text style={styles.movieYear}>{movie.year}</Text>
        <View style={styles.ratingContainer}>
          <Ionicons name="star" size={16} color="#f9c74f" />
          <Text style={styles.movieRating}>{movie.rating.toFixed(1)}</Text>
        </View>
        <Text style={styles.movieGenre}>{movie.genre}</Text>
      </View>
      <TouchableOpacity style={styles.favoriteButton}>
        <Ionicons name="heart-outline" size={24} color="#FF6B6B" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  if (!fontsLoaded) return null;

  return (
    <ImageBackground
      source={require('../../assets/images/4.jpg')}
      style={styles.background}
    >
      <View style={styles.overlay}>
        <StatusBar barStyle="light-content" />

        <View style={styles.header}>
          <Text style={styles.headerTitle}>Descubre Películas</Text>
        </View>

        <View style={styles.searchBarContainer}>
          <Ionicons name="search" size={20} color="#888" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar películas..."
            placeholderTextColor="#888"
            value={searchQuery}
            onChangeText={handleSearch}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => handleSearch('')}
              style={styles.clearButton}
            >
              <Ionicons name="close-circle" size={20} color="#888" />
            </TouchableOpacity>
          )}
        </View>

        {isSearching ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#1db954" />
            <Text style={styles.loadingText}>Buscando películas...</Text>
          </View>
        ) : (
          <>
            <Text style={styles.resultsText}>
              {filteredMovies.length} resultados{' '}
              {searchQuery ? `para "${searchQuery}"` : ''}
            </Text>
            <FlatList
              data={filteredMovies}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => <MovieItem movie={item} />}
              contentContainerStyle={styles.moviesList}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Ionicons name="film-outline" size={70} color="#555" />
                  <Text style={styles.emptyText}>No se encontraron películas</Text>
                  <Text style={styles.emptySubtext}>Intenta con otra búsqueda</Text>
                </View>
              }
            />
          </>
        )}
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
  container: {
    flex: 1,
    paddingTop: 10,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 28,
    fontFamily: 'Merriweather_700Bold',
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    margin: 16,
    paddingHorizontal: 12,
    height: 50,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    height: '100%',
    fontFamily: 'Merriweather_400Regular',
  },
  clearButton: {
    padding: 4,
  },
  resultsText: {
    color: '#ccc',
    fontSize: 14,
    marginHorizontal: 16,
    marginBottom: 8,
    fontFamily: 'Merriweather_400Regular',
  },
  moviesList: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  movieItem: {
    flexDirection: 'row',
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  poster: {
    width: 100,
    height: 150,
  },
  movieInfo: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  movieTitle: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Merriweather_700Bold',
    marginBottom: 4,
  },
  movieYear: {
    color: '#888',
    fontSize: 14,
    fontFamily: 'Merriweather_400Regular',
    marginBottom: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  movieRating: {
    color: '#fff',
    marginLeft: 4,
    fontSize: 14,
  },
  movieGenre: {
    color: '#aaa',
    fontSize: 13,
    fontFamily: 'Merriweather_400Regular',
  },
  favoriteButton: {
    padding: 12,
    justifyContent: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#888',
    marginTop: 10,
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyText: {
    color: '#fff',
    fontSize: 18,
    marginTop: 16,
  },
  emptySubtext: {
    color: '#888',
    fontSize: 14,
    marginTop: 8,
  },
});
