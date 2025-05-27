import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  FlatList,
  Image,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFonts, Merriweather_700Bold } from '@expo-google-fonts/merriweather';
import { useNavigation } from '@react-navigation/native';

const { width, height } = Dimensions.get('window');

interface Movie {
  id: number;
  title: string;
  poster_path: string;
  vote_average: number;
  release_date: string;
}

interface Props {
  visible: boolean;
  directorId: string;
  directorName: string;
  movies: Movie[];
  onClose: () => void;
}

export default function CountryTopMoviesModal({
  visible,
  directorName,
  movies,
  onClose,
}: Props) {
  const [directorImage, setDirectorImage] = useState<string | null>(null);
  const [fontsLoaded] = useFonts({ Merriweather_700Bold });
  const navigation = useNavigation();

  useEffect(() => {
    const fetchDirectorImage = async () => {
      try {
        const formattedName = directorName.replace(/ /g, '_');
        const res = await fetch(`https://es.wikipedia.org/api/rest_v1/page/summary/${formattedName}`);
        const data = await res.json();
        setDirectorImage(data?.thumbnail?.source || null);
      } catch (error) {
        console.warn('No se pudo obtener imagen del director');
      }
    };

    if (visible) fetchDirectorImage();
  }, [directorName, visible]);

  if (!fontsLoaded || !visible) return null;

  return (
    <Modal animationType="fade" transparent visible={visible}>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <Text style={styles.title}>🎬 TOP Películas de {directorName}</Text>

            {directorImage && (
              <TouchableOpacity
                onPress={() => {
                  onClose();
                  navigation.navigate('DirectorBio', { directorName });
                }}
              >
                <Image source={{ uri: directorImage }} style={styles.directorImage} />
              </TouchableOpacity>
            )}
          </View>

          {movies.length === 0 ? (
            <Text style={styles.noMovies}>No se encontraron películas destacadas.</Text>
          ) : (
            <FlatList
              data={movies}
              keyExtractor={(item) => item.id.toString()}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.listContent}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => {
                    onClose();
                    navigation.navigate('MovieDetail', { movieId: item.id });
                  }}
                  style={styles.movieItem}
                >
                  <Image
                    source={{ uri: `https://image.tmdb.org/t/p/w500${item.poster_path}` }}
                    style={styles.poster}
                  />
                  <View style={styles.info}>
                    <Text style={styles.movieTitle}>{item.title}</Text>
                    <View style={styles.meta}>
                      <Ionicons name="star" size={16} color="#f5c518" style={{ marginRight: 4 }} />
                      <Text style={styles.metaText}>
                        {item.vote_average.toFixed(1)} · {item.release_date?.slice(0, 4)}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              )}
            />
          )}

          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Text style={styles.closeText}>Cerrar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: '#000000cc',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modal: {
    backgroundColor: '#181818',
    width: width * 0.88,
    maxHeight: height * 0.75,
    borderRadius: 20,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontFamily: 'Merriweather_700Bold',
    fontSize: 18,
    color: '#fff',
    flex: 1,
    flexWrap: 'wrap',
  },
  directorImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginLeft: 8,
    backgroundColor: '#333',
  },
  noMovies: {
    textAlign: 'center',
    fontStyle: 'italic',
    color: '#aaa',
    marginTop: 16,
  },
  listContent: {
    paddingBottom: 16,
  },
  movieItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: '#222',
    borderRadius: 12,
    padding: 10,
  },
  poster: {
    width: 70,
    height: 105,
    borderRadius: 8,
    backgroundColor: '#333',
  },
  info: {
    flex: 1,
    marginLeft: 12,
  },
  movieTitle: {
    fontFamily: 'Merriweather_700Bold',
    fontSize: 16,
    color: '#fff',
    marginBottom: 4,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    fontSize: 14,
    color: '#ccc',
  },
  closeBtn: {
    marginTop: 12,
    alignSelf: 'center',
    paddingVertical: 10,
    paddingHorizontal: 28,
    borderRadius: 8,
    backgroundColor: '#1db954',
  },
  closeText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
});
