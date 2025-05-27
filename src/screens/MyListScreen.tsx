import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Image,
  TouchableOpacity,
  Alert,
  Animated,
  LayoutAnimation,
  UIManager,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getAuth } from 'firebase/auth';
import { getDatabase, ref, onValue, remove } from 'firebase/database';
import { markAsViewed } from '../services/movieActions';
import { useFocusEffect, useNavigation } from '@react-navigation/native';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface Movie {
  id: number;
  title: string;
  poster_path: string;
  release_date: string;
  vote_average: number | null;
}

export default function MyListScreen() {
  const [favorites, setFavorites] = useState<Movie[]>([]);
  const [viewedIds, setViewedIds] = useState<number[]>([]);
  const [myList, setMyList] = useState<Movie[]>([]);
  const [showOnlyViewed, setShowOnlyViewed] = useState(true);
  const [sortBy, setSortBy] = useState<'date' | 'rating'>('date');
  const [showBanner, setShowBanner] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));
  const navigation = useNavigation();

  useFocusEffect(
    React.useCallback(() => {
      const user = getAuth().currentUser;
      if (!user) return;

      const db = getDatabase();
      const favRef = ref(db, `favorites/${user.uid}`);
      const viewRef = ref(db, `userRatings/${user.uid}`);

      const favListener = onValue(favRef, (favSnap) => {
        const favData = favSnap.val() || {};
        const favMovies = Object.values(favData) as Movie[];

        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setFavorites(favMovies);

        // Mostrar banner animado
        setShowBanner(true);
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start(() =>
          setTimeout(() => {
            Animated.timing(fadeAnim, {
              toValue: 0,
              duration: 300,
              useNativeDriver: true,
            }).start(() => setShowBanner(false));
          }, 1800)
        );
      });

      const viewListener = onValue(viewRef, (viewSnap) => {
        const viewData = viewSnap.val() || {};
        const viewedKeys = Object.keys(viewData).map((id) => parseInt(id));
        setViewedIds(viewedKeys);
      });

      return () => {
        favListener();
        viewListener();
      };
    }, [])
  );

  useEffect(() => {
    let filtered = showOnlyViewed
      ? favorites.filter((movie) => viewedIds.includes(movie.id))
      : favorites;

    if (sortBy === 'date') {
      filtered = [...filtered].sort(
        (a, b) =>
          new Date(b.release_date).getTime() - new Date(a.release_date).getTime()
      );
    } else {
      filtered = [...filtered].sort(
        (a, b) => (b.vote_average ?? 0) - (a.vote_average ?? 0)
      );
    }

    setMyList(filtered);
  }, [favorites, viewedIds, showOnlyViewed, sortBy]);

  const handleRemove = async (movieId: number) => {
    const user = getAuth().currentUser;
    if (!user) return;

    try {
      const db = getDatabase();
      await remove(ref(db, `favorites/${user.uid}/${movieId}`));
      Alert.alert('Eliminada', 'Película eliminada de favoritos');
    } catch (error) {
      Alert.alert('Error', 'No se pudo eliminar la película');
    }
  };

  const renderItem = ({ item }: { item: Movie }) => {
    const isViewed = viewedIds.includes(item.id);
    const scaleAnim = new Animated.Value(0);

    const handleMarkViewed = async () => {
      try {
        await markAsViewed(item.id);
        setViewedIds((prev) => [...prev, item.id]);

        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
        }).start();
      } catch (err) {
        Alert.alert('Error', 'No se pudo marcar como vista');
      }
    };

    return (
      <View style={styles.movieCard}>
        <Image
          source={{ uri: `https://image.tmdb.org/t/p/w500${item.poster_path}` }}
          style={styles.poster}
        />
        <View style={styles.info}>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.subtitle}>
            {item.release_date?.substring(0, 4)} •{' '}
            {typeof item.vote_average === 'number'
              ? item.vote_average.toFixed(1) + '★'
              : 'Sin calificación'}
          </Text>

          {isViewed ? (
            <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
              <Ionicons name="checkmark-circle" size={20} color="#1db954" />
            </Animated.View>
          ) : (
            <TouchableOpacity onPress={handleMarkViewed}>
              <Text style={styles.markButton}>Marcar como vista</Text>
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          style={styles.removeButton}
          onPress={() => handleRemove(item.id)}
        >
          <Ionicons name="trash-outline" size={20} color="#aaa" />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Mi Lista</Text>

      {showBanner && (
        <Animated.View style={[styles.banner, { opacity: fadeAnim }]}>
          <Text style={styles.bannerText}>✔ Lista actualizada</Text>
        </Animated.View>
      )}

      <Text style={styles.counter}>
        Mostrando {myList.length} de {favorites.length} películas
      </Text>

      <View style={styles.sortButtons}>
        <TouchableOpacity onPress={() => setShowOnlyViewed((prev) => !prev)}>
          <Text
            style={[
              styles.toggleFilter,
              showOnlyViewed && styles.activeFilter,
            ]}
          >
            {showOnlyViewed ? 'Solo vistas' : 'Todas'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setSortBy('date')}>
          <Text
            style={[styles.toggleFilter, sortBy === 'date' && styles.activeFilter]}
          >
            Fecha
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setSortBy('rating')}>
          <Text
            style={[styles.toggleFilter, sortBy === 'rating' && styles.activeFilter]}
          >
            Calificación
          </Text>
        </TouchableOpacity>
      </View>

      {myList.length === 0 ? (
        <View>
          <Text style={styles.emptyText}>
            {showOnlyViewed
              ? 'No has visto ninguna película de tu lista.'
              : 'Tu lista está vacía.'}
          </Text>
          <TouchableOpacity onPress={() => navigation.navigate('SearchScreen')}>
            <Text style={styles.addMore}>➕ Añadir películas</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={myList}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 32 }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    paddingHorizontal: 16,
    paddingTop: 32,
  },
  header: {
    fontSize: 22,
    fontFamily: 'Merriweather_700Bold',
    color: '#fff',
    marginBottom: 12,
  },
  banner: {
    backgroundColor: '#1db954',
    padding: 10,
    borderRadius: 6,
    marginBottom: 12,
    alignItems: 'center',
  },
  bannerText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  counter: {
    color: '#aaa',
    fontSize: 14,
    marginBottom: 8,
  },
  sortButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  toggleFilter: {
    color: '#1db954',
    fontSize: 14,
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginHorizontal: 4,
  },
  activeFilter: {
    fontWeight: 'bold',
    textDecorationLine: 'underline',
    backgroundColor: '#2a2a2a',
  },
  movieCard: {
    flexDirection: 'row',
    backgroundColor: '#1e1e1e',
    borderRadius: 8,
    marginBottom: 16,
    overflow: 'hidden',
    alignItems: 'center',
  },
  poster: {
    width: 80,
    height: 120,
  },
  info: {
    flex: 1,
    paddingHorizontal: 12,
  },
  title: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Merriweather_700Bold',
  },
  subtitle: {
    color: '#aaa',
    fontSize: 13,
    marginTop: 4,
  },
  markButton: {
    marginTop: 4,
    fontSize: 12,
    color: '#1db954',
    fontWeight: 'bold',
  },
  removeButton: {
    padding: 12,
  },
  emptyText: {
    color: '#aaa',
    textAlign: 'center',
    marginTop: 32,
  },
  addMore: {
    textAlign: 'center',
    color: '#1db954',
    marginTop: 8,
  },
});
