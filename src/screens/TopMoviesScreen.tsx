import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  Dimensions,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  RefreshControl,
  StatusBar,
  Platform,
  ScrollView,

} from 'react-native';
import { getTopRatedMovies, getMovieDetails } from '../services/tmdbService';
import { addToFavoritesRealtime } from '../services/movieActions';
import { getDatabase, onValue, ref } from 'firebase/database';
import { auth } from '../services/firebaseConfig';
import { Ionicons } from '@expo/vector-icons'; // Asumiendo que usas Expo

const { width } = Dimensions.get('window');

// Tipos
interface Movie {
  id: number;
  title: string;
  poster_path: string;
  vote_average: number;
  release_date: string;
  overview?: string;
}

interface DecadeSection {
  title: string;
  data: Movie[];
}

export default function TopMoviesScreen({ navigation }: any) {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [decades, setDecades] = useState<DecadeSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [favorites, setFavorites] = useState<Record<string, boolean>>({});
  const [selectedDecade, setSelectedDecade] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMorePages, setHasMorePages] = useState(true);

  // Cargar favoritos del usuario
  useEffect(() => {
    const userId = auth.currentUser?.uid;
    if (!userId) return;

    const db = getDatabase();
    const favRef = ref(db, `favorites/${userId}`);
    
    const unsubscribe = onValue(favRef, snapshot => {
      const data = snapshot.val() || {};
      const favMap: Record<string, boolean> = {};
      
      Object.keys(data).forEach(id => {
        favMap[id] = true;
      });
      
      setFavorites(favMap);
    });

    return () => unsubscribe();
  }, []);

  // Cargar películas
  const fetchMovies = useCallback(async (pageNum = 1, reset = false) => {
    if (!hasMorePages && !reset) return;
    
    try {
      setLoading(pageNum === 1);
      
      const result = await getTopRatedMovies(pageNum);
      
      // Verificar si hay más páginas
      if (result.length === 0) {
        setHasMorePages(false);
        return;
      }
      
      if (reset) {
        setMovies(result);
      } else {
        setMovies(prev => [...prev, ...result]);
      }
      
      // Actualizar las décadas
      const allMovies = reset ? result : [...movies, ...result];
      const groupedDecades = groupByDecade(allMovies);
      setDecades(groupedDecades);
      
      // Si es una actualización, mostrar la década más reciente
      if (reset && groupedDecades.length > 0) {
        setSelectedDecade(groupedDecades[0].title);
      }
      
    } catch (error) {
      console.error('Error fetching top movies:', error);
      Alert.alert('Error', 'No se pudieron cargar las películas. Intenta de nuevo más tarde.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [movies, hasMorePages]);

  // Cargar más películas cuando se llega al final
  const handleLoadMore = () => {
    if (loading || !hasMorePages) return;
    
    const nextPage = page + 1;
    setPage(nextPage);
    fetchMovies(nextPage);
  };

  // Actualizar al tirar hacia abajo
  const handleRefresh = () => {
    setRefreshing(true);
    setPage(1);
    setHasMorePages(true);
    fetchMovies(1, true);
  };

  // Inicializar datos
  useEffect(() => {
    fetchMovies();
  }, []);

  // Ir a detalles de película
  const handleMoviePress = async (movie: Movie) => {
    try {
      // Mostrar indicador de carga
      navigation.navigate('MovieDetails', { movieId: movie.id });
    } catch (error) {
      console.error('Error navigating to movie details:', error);
      Alert.alert('Error', 'No se pudieron cargar los detalles de la película.');
    }
  };

  // Añadir a favoritos
  const handleAddToList = async (movie: Movie) => {
    const userId = auth.currentUser?.uid;
    if (!userId) {
      Alert.alert(
        'Iniciar sesión',
        'Necesitas iniciar sesión para guardar películas',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Iniciar sesión', onPress: () => navigation.navigate('Login') }
        ]
      );
      return;
    }

    try {
      await addToFavoritesRealtime(userId, movie);
      Alert.alert('Añadido', `"${movie.title}" se agregó a tu lista.`);
    } catch (err) {
      console.error('Error adding to favorites:', err);
      Alert.alert('Error', 'No se pudo añadir a tu lista. Intenta de nuevo más tarde.');
    }
  };

  // Filtrar películas por década
  const getFilteredMovies = () => {
    if (!selectedDecade) {
      return movies;
    }
    
    return movies.filter(movie => {
      const year = parseInt(movie.release_date?.slice(0, 4) || '0');
      const decade = `${Math.floor(year / 10) * 10}s`;
      return decade === selectedDecade;
    });
  };

  // Componente de película
  const renderMovie = ({ item }: { item: Movie }) => {
    const isFavorite = favorites[item.id];
    
    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.9}
        onPress={() => handleMoviePress(item)}
      >
        <Image
          source={{ 
            uri: item.poster_path 
              ? `https://image.tmdb.org/t/p/w500${item.poster_path}`
              : 'https://via.placeholder.com/500x750?text=No+Image'
          }}
          style={styles.poster}
          resizeMode="cover"
        />
        
        <View style={styles.info}>
          <Text style={styles.movieTitle} numberOfLines={2}>
            {item.title} 
            <Text style={styles.year}>
              {item.release_date ? ` (${item.release_date.slice(0, 4)})` : ''}
            </Text>
          </Text>
          
          <View style={styles.ratingContainer}>
            <Ionicons name="star" size={16} color="#f9c74f" />
            <Text style={styles.rating}>{item.vote_average?.toFixed(1)}</Text>
          </View>
          
          {item.overview && (
            <Text style={styles.overview} numberOfLines={2}>
              {item.overview}
            </Text>
          )}

          <View style={styles.buttonRow}>
            {isFavorite ? (
              <TouchableOpacity style={styles.addedButton}>
                <Ionicons name="checkmark-circle" size={16} color="#1db954" />
                <Text style={styles.addedButtonText}>En tu lista</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity 
                onPress={(e) => {
                  e.stopPropagation();
                  handleAddToList(item);
                }}
                style={styles.addButton}
              >
                <Ionicons name="add-circle-outline" size={16} color="#fff" />
                <Text style={styles.addButtonText}>Añadir</Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity 
              style={styles.detailsButton}
              onPress={() => handleMoviePress(item)}
            >
              <Text style={styles.detailsButtonText}>Detalles</Text>
              <Ionicons name="chevron-forward" size={16} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // Selector de década
  const renderDecadeSelector = () => (
    <View style={styles.decadeContainer}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.decadeSelector}>
        <TouchableOpacity
          style={[
            styles.decadeButton,
            !selectedDecade && styles.decadeButtonActive
          ]}
          onPress={() => setSelectedDecade(null)}
        >
          <Text style={[
            styles.decadeButtonText,
            !selectedDecade && styles.decadeButtonTextActive
          ]}>
            Todas
          </Text>
        </TouchableOpacity>
        
        {decades.map(decade => (
          <TouchableOpacity
            key={decade.title}
            style={[
              styles.decadeButton,
              selectedDecade === decade.title && styles.decadeButtonActive
            ]}
            onPress={() => setSelectedDecade(decade.title)}
          >
            <Text style={[
              styles.decadeButtonText,
              selectedDecade === decade.title && styles.decadeButtonTextActive
            ]}>
              {decade.title}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <StatusBar barStyle="light-content" />
        <ActivityIndicator color="#1db954" size="large" />
        <Text style={styles.loadingText}>Cargando mejores películas...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <View style={styles.header}>
        <Text style={styles.title}>Mejores Películas</Text>
        <TouchableOpacity style={styles.filterButton}>
          <Ionicons name="filter" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
      
      {renderDecadeSelector()}
      
      <FlatList
        data={getFilteredMovies()}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderMovie}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.3}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#1db954"
            colors={["#1db954"]}
          />
        }
        ListFooterComponent={() => (
          hasMorePages && (
            <View style={styles.footerLoader}>
              <ActivityIndicator color="#1db954" size="small" />
              <Text style={styles.loadingMore}>Cargando más películas...</Text>
            </View>
          )
        )}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Ionicons name="film-outline" size={60} color="#555" />
            <Text style={styles.emptyText}>No se encontraron películas</Text>
            <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
              <Text style={styles.retryButtonText}>Intentar de nuevo</Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

// Agrupar por décadas
function groupByDecade(movies: Movie[]): DecadeSection[] {
  const grouped: Record<string, Movie[]> = {};

  movies.forEach(movie => {
    if (!movie.release_date) return;
    
    const year = parseInt(movie.release_date.slice(0, 4));
    const decade = `${Math.floor(year / 10) * 10}s`;
    
    if (!grouped[decade]) grouped[decade] = [];
    grouped[decade].push(movie);
  });

  return Object.entries(grouped)
    .sort(([a], [b]) => parseInt(b) - parseInt(a))
    .map(([title, data]) => ({ title, data }));
}

// Estilos
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  title: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
  },
  filterButton: {
    padding: 8,
  },
  decadeContainer: {
    backgroundColor: '#1a1a1a',
    paddingVertical: 10,
  },
  decadeSelector: {
    paddingHorizontal: 10,
  },
  decadeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginHorizontal: 5,
    backgroundColor: '#333',
  },
  decadeButtonActive: {
    backgroundColor: '#1db954',
  },
  decadeButtonText: {
    color: '#ccc',
    fontWeight: '600',
  },
  decadeButtonTextActive: {
    color: '#fff',
  },
  listContent: {
    padding: 12,
    paddingBottom: 20,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#222',
    marginVertical: 8,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  poster: {
    width: 100,
    height: 150,
    backgroundColor: '#333',
  },
  info: {
    padding: 12,
    flex: 1,
    justifyContent: 'space-between',
  },
  movieTitle: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
    marginBottom: 4,
  },
  year: {
    color: '#aaa',
    fontWeight: 'normal',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  rating: {
    marginLeft: 4,
    color: '#f9c74f',
    fontWeight: '600',
  },
  overview: {
    color: '#bbb',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 10,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 'auto',
  },
  addButton: {
    backgroundColor: '#1db954',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 12,
    marginLeft: 4,
  },
  addedButton: {
    backgroundColor: 'transparent',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderColor: '#1db954',
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  addedButtonText: {
    color: '#1db954',
    fontWeight: '600',
    fontSize: 12,
    marginLeft: 4,
  },
  detailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 6,
  },
  detailsButtonText: {
    color: '#ddd',
    fontSize: 12,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#111',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#aaa',
    marginTop: 10,
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  loadingMore: {
    color: '#aaa',
    marginLeft: 10,
    fontSize: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
  },
  emptyText: {
    color: '#888',
    marginTop: 10,
    fontSize: 16,
  },
  retryButton: {
    marginTop: 20,
    backgroundColor: '#1db954',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 6,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});