import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  ImageBackground,
  Linking,
  Modal,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { getMovieDetails, getWatchProviders } from '../services/tmdbService';
import {
  addToFavoritesRealtime,
  markAsViewed,
  addRating,
  addReview,
  getReviewsWithReactions,
  toggleReaction,
} from '../services/movieActions';
import { getAuth } from 'firebase/auth';
import { getDatabase, onValue, ref, remove } from 'firebase/database';
import { ReactionType, ExtendedReview } from '../types/ExtendedReview';

const { width, height } = Dimensions.get('window');
type TabName = 'details' | 'reviews';

// Hook: detalles de la película
const useMovieDetail = (movieId: number) => {
  const [movie, setMovie] = useState<any | null>(null);
  const [cast, setCast] = useState<any[]>([]);
  const [director, setDirector] = useState<any | null>(null);
  const [providers, setProviders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDetails = useCallback(async () => {
    try {
      const { data } = await getMovieDetails(movieId);
      setMovie(data);
      setCast(data.credits?.cast?.slice(0, 8) || []);
      setDirector(data.credits?.crew?.find((p: any) => p.job === 'Director'));
      const provRes = await getWatchProviders(movieId);
      setProviders(provRes.data?.results?.ES?.flatrate || []);
    } catch {
      Alert.alert('Error', 'No se pudo cargar la película.');
    } finally {
      setLoading(false);
    }
  }, [movieId]);

  useEffect(() => {
    fetchDetails();
  }, [fetchDetails]);

  return { movie, cast, director, providers, loading };
};

// Hook: estado de favorito y visto
const useUserStatus = (movieId: number) => {
  const [isFavorite, setIsFavorite] = useState(false);
  const [isViewed, setIsViewed] = useState(false);
  const [userRating, setUserRating] = useState(0);

  useEffect(() => {
    const user = getAuth().currentUser;
    if (!user) return;
    const db = getDatabase();
    return onValue(ref(db, `favorites/${user.uid}/${movieId}`), snap => {
      setIsFavorite(snap.exists());
    });
  }, [movieId]);

  useEffect(() => {
    const user = getAuth().currentUser;
    if (!user) return;
    const db = getDatabase();
    return onValue(ref(db, `userRatings/${user.uid}/${movieId}`), snap => {
      const data = snap.val() || {};
      setIsViewed(snap.exists());
      setUserRating(data.rating || 0);
    });
  }, [movieId]);

  return { isFavorite, isViewed, userRating, setIsFavorite, setIsViewed, setUserRating };
};

// Hook: reseñas
const useMovieReviews = (movieId: number) => {
  const [reviews, setReviews] = useState<ExtendedReview[]>([]);
  const refresh = useCallback(async () => {
    try {
      const data = await getReviewsWithReactions(movieId);
      setReviews(data as ExtendedReview[] || []);
    } catch {
      console.warn('Error fetching reviews');
    }
  }, [movieId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { reviews, refresh };
};

// Componente para una reseña individual con reacciones
const ReviewItem = ({ review, onReact }: { review: ExtendedReview, onReact: (reviewId: string, reaction: ReactionType) => void }) => {
  const [showReactions, setShowReactions] = useState(false);
  const currentUser = getAuth().currentUser;
  const myReaction = review.reactions?.[currentUser?.uid || ''];
  
  // Preparamos los conteos de reacciones para mostrar
  const reactionsList: { emoji: ReactionType; count: number }[] = [];
  if (review.reactionCounts) {
    (Object.entries(review.reactionCounts) as [ReactionType, number][]).forEach(([emoji, count]) => {
      if (count > 0) {
        reactionsList.push({ emoji, count });
      }
    });
  }

  return (
    <View style={styles.reviewItem}>
      <View style={styles.reviewHeader}>
        <View style={styles.reviewUser}>
          {review.userAvatar ? (
            <Image source={{ uri: review.userAvatar }} style={styles.avatar} />
          ) : (
            <Ionicons name="person-circle" size={32} color="#888" />
          )}
          <Text style={styles.reviewUsername}>{review.username}</Text>
        </View>
        <View style={styles.ratingBadge}>
          <Text style={styles.ratingText}>{review.rating}/10</Text>
        </View>
      </View>
      
      <Text style={styles.reviewContent}>{review.content}</Text>
      
      {/* Zona de reacciones */}
      <View style={styles.reactionsContainer}>
        {reactionsList.length > 0 && (
          <View style={styles.reactionsSummary}>
            {reactionsList.map((item, index) => (
              <View key={index} style={styles.reactionCount}>
                <Text style={styles.reactionEmoji}>{item.emoji}</Text>
                <Text style={styles.reactionCountText}>{item.count}</Text>
              </View>
            ))}
          </View>
        )}
        
        <TouchableOpacity 
          style={styles.reactButton}
          onPress={() => setShowReactions(!showReactions)}
        >
          <Text style={styles.reactButtonText}>
            {myReaction || 'Reaccionar'} {myReaction ? '✓' : ''}
          </Text>
        </TouchableOpacity>
      </View>
      
      {/* Selector de reacciones */}
      {showReactions && (
        <View style={styles.reactionSelector}>
          {(['👍', '😊', '❤️', '😮', '😾'] as ReactionType[]).map((emoji) => (
            <TouchableOpacity
              key={emoji}
              style={[
                styles.reactionOption,
                myReaction === emoji && styles.selectedReaction
              ]}
              onPress={() => {
                onReact(review.id, emoji);
                setShowReactions(false);
              }}
            >
              <Text style={styles.reactionEmoji}>{emoji}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
};

export default function MovieDetailScreen({ route, navigation }: any) {
  const { movieId } = route.params;
  const authUser = getAuth().currentUser;
  const { movie, cast, director, providers, loading } = useMovieDetail(movieId);
  const { isFavorite, isViewed, userRating, setIsFavorite, setIsViewed, setUserRating } =
    useUserStatus(movieId);
  const { reviews, refresh } = useMovieReviews(movieId);

  const [tab, setTab] = useState<TabName>('details');
  const [ratingModalVisible, setRatingModalVisible] = useState(false);
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [reviewText, setReviewText] = useState('');
  const [reviewStars, setReviewStars] = useState(0);

  // Toggle favorito
  const toggleFavorite = async () => {
    const user = getAuth().currentUser;
    if (!user || !movie) return;
    const db = getDatabase();
    if (isFavorite) {
      await remove(ref(db, `favorites/${user.uid}/${movie.id}`));
      setIsFavorite(false);
    } else {
      await addToFavoritesRealtime(movie);
      setIsFavorite(true);
    }
  };

  // Marcar vista y puntuar
  const markAsViewedAndRate = async (rating: number) => {
    try {
      await markAsViewed(movieId);
      if (rating > 0) await addRating(movieId, rating);
      setIsViewed(true);
      setUserRating(rating);
      setRatingModalVisible(false);
    } catch {
      Alert.alert('Error', 'No se pudo marcar como vista.');
    }
  };

  // Enviar reseña
  const handleSubmitReview = async () => {
    if (!movie || !reviewText.trim() || reviewStars === 0) {
      Alert.alert('Error', 'Escribe una crítica y selecciona una puntuación.');
      return;
    }
    await addReview(movie, reviewText.trim(), reviewStars);
    setReviewModalVisible(false);
    setReviewText('');
    setReviewStars(0);
    refresh();
  };

  // Añadir reacción a una reseña
  const handleReaction = async (reviewId: string, reaction: ReactionType) => {
    if (!authUser) {
      Alert.alert('Error', 'Necesitas iniciar sesión para reaccionar');
      return;
    }
    
    try {
      await toggleReaction(movieId, reviewId, reaction);
      refresh();
    } catch (error) {
      Alert.alert('Error', 'No se pudo registrar tu reacción');
    }
  };

  // Helpers
  const formatRuntime = (m?: number) => (m ? `${Math.floor(m / 60)}h ${m % 60}m` : '');
  const trailerKey = useMemo(
    () => movie?.videos?.results?.find((v: any) => v.type === 'Trailer' && v.site === 'YouTube')?.key,
    [movie]
  );
  const openTrailer = () => {
    if (!trailerKey) return Alert.alert('Lo sentimos', 'No hay trailer disponible.');
    Linking.openURL(`https://www.youtube.com/watch?v=${trailerKey}`);
  };

  if (loading || !movie) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#5E5CE6" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={navigation.goBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Banner */}
      <View style={styles.banner}>
        <ImageBackground
          source={{ uri: `https://image.tmdb.org/t/p/w780${movie.backdrop_path || movie.poster_path}` }}
          style={styles.bannerImage}
        />
        <View style={styles.posterWrapper}>
          <Image
            source={{ uri: `https://image.tmdb.org/t/p/w342${movie.poster_path}` }}
            style={styles.posterImage}
          />
        </View>
      </View>

      {/* Información */}
      <View style={styles.titleContainer}>
        <Text style={styles.title}>{movie.title}</Text>
        <Text style={styles.yearDuration}>{movie.release_date?.slice(0, 4)} • {formatRuntime(movie.runtime)}</Text>
        <View style={styles.ratingContainer}>
          <Text style={styles.ratingText}>{movie.vote_average.toFixed(1)}</Text>
          <Ionicons name="star" size={18} color="#FFD700" />
        </View>
        <View style={styles.genreContainer}>
          {movie.genres?.slice(0, 2).map((g: any) => (
            <View key={g.id} style={styles.genrePill}>
              <Text style={styles.genreText}>{g.name}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Pestañas */}
      <View style={styles.tabContainer}>
        {(['details', 'reviews'] as TabName[]).map(t => (
          <TouchableOpacity
            key={t}
            style={[styles.tab, tab === t && styles.activeTab]}
            onPress={() => setTab(t)}
          >
            <Text style={[styles.tabText, tab === t && styles.activeTabText]}>
              {t === 'details' ? 'Sinopsis' : 'Críticas'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Contenido */}
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {tab === 'details' ? (
          <>
            {/* Sinopsis */}
            <Text style={styles.sectionHeader}>Sinopsis</Text>
            <Text style={styles.synopsisText}>{movie.overview}</Text>

            {/* Director */}
            {director && (
              <> 
                <Text style={styles.sectionHeader}>Director</Text>
                <Text style={styles.directorName}>{director.name}</Text>
              </>
            )}

            {/* Reparto */}
            {cast.length > 0 && (
              <> 
                <Text style={styles.sectionHeader}>Reparto</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.castScroll}>
                  {cast.map(actor => (
                    <View key={actor.id} style={styles.castMember}>
                      <Image
                        source={{ uri: actor.profile_path
                          ? `https://image.tmdb.org/t/p/w185${actor.profile_path}`
                          : 'https://via.placeholder.com/185x278?text=No+Image' }}
                        style={styles.castImage}
                      />
                      <Text style={styles.castName} numberOfLines={1}>{actor.name}</Text>
                      <Text style={styles.castCharacter} numberOfLines={1}>{actor.character}</Text>
                    </View>
                  ))}
                </ScrollView>
              </>
            )}

            {/* Proveedores */}
            {providers.length > 0 && (
              <> 
                <Text style={styles.sectionHeader}>Disponible en</Text>
                <View style={styles.providersContainer}>
                  {providers.map(p => (
                    <View key={p.provider_id} style={styles.providerItem}>
                      <Image source={{ uri: `https://image.tmdb.org/t/p/original${p.logo_path}` }} style={styles.providerLogo} />
                      <Text style={styles.providerName}>{p.provider_name}</Text>
                    </View>
                  ))}
                </View>
              </>
            )}
          </>
        ) : (
          <>
            {/* Críticas */}
            <View style={styles.reviewsHeader}>
              <Text style={styles.sectionHeader}>Críticas de usuarios</Text>
              <TouchableOpacity 
                style={styles.addReviewButton}
                onPress={() => setReviewModalVisible(true)}
              >
                <Text style={styles.addReviewButtonText}>Escribir</Text>
              </TouchableOpacity>
            </View>
            
            {reviews.length > 0 ? (
              reviews.map((review) => (
                <ReviewItem 
                  key={review.id} 
                  review={review}
                  onReact={handleReaction}
                />
              ))
            ) : (
              <View style={styles.emptyReviews}>
                <MaterialCommunityIcons name="comment-outline" size={48} color="#555" />
                <Text style={styles.emptyReviewsText}>No hay críticas todavía</Text>
                <TouchableOpacity 
                  style={styles.addFirstReviewButton}
                  onPress={() => setReviewModalVisible(true)}
                >
                  <Text style={styles.addReviewButtonText}>Sé el primero en opinar</Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* Botones inferiores */}
      <View style={styles.actionButtonsContainer}>
        <TouchableOpacity style={[styles.actionButton, styles.listButton]} onPress={toggleFavorite}>
          <Ionicons name={isFavorite ? 'add-circle' : 'add-circle-outline'} size={24} color="#fff" />
          <Text style={styles.actionButtonText}>Mi Lista</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={() => setRatingModalVisible(true)}>
          <Ionicons name={isViewed ? 'checkmark-circle' : 'checkmark-circle-outline'} size={24} color="#fff" />
          <Text style={styles.actionButtonText}>Vista</Text>
        </TouchableOpacity>
      </View>

      {/* Modales */}
      <RatingModal visible={ratingModalVisible} current={userRating} onClose={() => setRatingModalVisible(false)} onSelect={markAsViewedAndRate} />
      <ReviewModal visible={reviewModalVisible} text={reviewText} stars={reviewStars} onChangeText={setReviewText} onChangeStars={setReviewStars} onSubmit={handleSubmitReview} onClose={() => setReviewModalVisible(false)} />
    </View>
  );
}

// ---------------- Subcomponentes ----------------

const RatingModal = ({ visible, current, onClose, onSelect }: any) => (
  <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
    <View style={styles.modalOverlay}>
      <View style={styles.modalContent}>
        <Text style={styles.modalTitle}>Valorar película</Text>
        <View style={styles.ratingOptions}>
          {[1, 2, 3, 4, 5].map(i => (
            <TouchableOpacity key={i} onPress={() => onSelect(i)} style={styles.ratingOption}>
              <Ionicons name={i <= current ? 'star' : 'star-outline'} size={32} color="#FFD700" />
              <Text style={styles.ratingValue}>{i}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Text style={styles.closeButtonText}>Cancelar</Text>
        </TouchableOpacity>
      </View>
    </View>
  </Modal>
);

const ReviewModal = ({ visible, text, stars, onChangeText, onChangeStars, onSubmit, onClose }: any) => (
  <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
    <View style={styles.modalOverlay}>
      <View style={styles.modalContent}>
        <Text style={styles.modalTitle}>Escribir crítica</Text>
        <View style={styles.starsContainer}>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
            <TouchableOpacity 
              key={i} 
              onPress={() => onChangeStars(i)}
              style={styles.starOption}
            >
              <Ionicons 
                name={i <= stars ? "star" : "star-outline"} 
                size={24} 
                color="#FFD700" 
              />
            </TouchableOpacity>
          ))}
        </View>
        <Text style={styles.ratingValue}>{stars}/10</Text>
        
        <TextInput
          placeholder="Escribe tu crítica..."
          placeholderTextColor="#888"
          multiline
          numberOfLines={4}
          value={text}
          onChangeText={onChangeText}
          style={styles.reviewInput}
        />
        
        <View style={styles.modalButtons}>
          <TouchableOpacity 
            onPress={onClose}
            style={styles.cancelButton}
          >
            <Text style={styles.cancelButtonText}>Cancelar</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            onPress={onSubmit}
            style={styles.submitButton}
          >
            <Text style={styles.submitButtonText}>Publicar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  </Modal>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  header: {
    height: 60,
    paddingTop: 20,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#000',
    zIndex: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  banner: {
    height: height * 0.28,
    position: 'relative',
  },
  bannerImage: {
    height: '100%',
    width: '100%',
    opacity: 0.7,
  },
  posterWrapper: {
    position: 'absolute',
    top: 10,
    left: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 6,
  },
  posterImage: {
    width: 100,
    height: 150,
    borderRadius: 8,
  },
  titleContainer: {
    padding: 16,
    paddingTop: 8,
    backgroundColor: '#000',
  },
  title: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  yearDuration: {
    color: '#aaa',
    fontSize: 14,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 12,
  },
  ratingText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 4,
  },
  genreContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 4,
  },
  genrePill: {
    backgroundColor: '#333',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  genreText: {
    color: '#fff',
    fontSize: 13,
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#5E5CE6',
  },
  tabText: {
    color: '#888',
    fontSize: 15,
    fontWeight: '500',
  },
  activeTabText: {
    color: '#fff',
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  sectionHeader: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 10,
  },
  reviewsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 10,
  },
  synopsisText: {
    color: '#bbb',
    fontSize: 15,
    lineHeight: 22,
  },
  directorName: {
    color: '#bbb',
    fontSize: 15,
  },
  castScroll: {
    marginVertical: 12,
  },
  castMember: {
    width: 80,
    marginRight: 12,
  },
  castImage: {
    width: 80,
    height: 120,
    borderRadius: 8,
    marginBottom: 6,
  },
  castName: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  castCharacter: {
    color: '#999',
    fontSize: 11,
  },
  providersContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginVertical: 8,
  },
  providerItem: {
    width: 60,
    alignItems: 'center',
    marginRight: 12,
    marginBottom: 12,
  },
  providerLogo: {
    width: 40,
    height: 40,
    borderRadius: 8,
  },
  providerName: {
    color: '#ccc',
    fontSize: 10,
    textAlign: 'center',
    marginTop: 4,
  },
  reviewItem: {
    backgroundColor: '#111',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    alignItems: 'center',
  },
  reviewUser: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  reviewUsername: {
    color: '#fff',
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
  },
  ratingBadge: {
    backgroundColor: '#333',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  reviewContent: {
    color: '#ddd',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  emptyReviews: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  emptyReviewsText: {
    color: '#888',
    fontSize: 14,
    marginVertical: 8,
  },
  addReviewButton: {
    backgroundColor: '#5E5CE6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addFirstReviewButton: {
    backgroundColor: '#5E5CE6',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 16,
  },
  addReviewButtonText: {
    color: '#fff',
    fontWeight: '500',
    fontSize: 14,
  },
  // Estilos para reacciones
  reactionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  reactionsSummary: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reactionCount: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
  },
  reactionEmoji: {
    fontSize: 16,
    marginRight: 2,
  },
  reactionCountText: {
    color: '#999',
    fontSize: 13,
  },
  reactButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: '#222',
  },
  reactButtonText: {
    color: '#ccc',
    fontSize: 13,
  },
  reactionSelector: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#222',
    borderRadius: 20,
    marginTop: 10,
    padding: 8,
  },
  reactionOption: {
    padding: 8,
    borderRadius: 20,
  },
  selectedReaction: {
    backgroundColor: '#333',
  },
  actionButtonsContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    height: 70,
    paddingBottom: 10,
  },
  actionButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    height: 50,
  },
  listButton: {
    borderRightWidth: 1,
    borderRightColor: '#333',
  },
  actionButtonText: {
    color: '#fff',
    marginTop: 4,
    fontSize: 13,
    fontWeight: '500',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#222',
    borderRadius: 12,
    padding: 20,
    width: '90%',
    alignItems: 'center',
  },
  modalTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  ratingOptions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginVertical: 16,
  },
  ratingOption: {
    alignItems: 'center',
  },
  ratingValue: {
    color: '#fff',
    fontSize: 14,
    marginTop: 6,
  },
  closeButton: {
    marginTop: 16,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    backgroundColor: '#333',
  },
  closeButtonText: {
    color: '#fff',
    fontWeight: '500',
  },
  // Star rating styles for review
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 12,
    flexWrap: 'wrap',
  },
  starOption: {
    padding: 6,
  },
  reviewInput: {
    backgroundColor: '#333',
    borderRadius: 8,
    padding: 12,
    color: '#fff',
    fontSize: 14,
    width: '100%',
    height: 120,
    textAlignVertical: 'top',
    marginVertical: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  cancelButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: '#333',
  },
  cancelButtonText: {
    color: '#ccc',
    fontWeight: '500',
  },
  submitButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    marginLeft: 8,
    borderRadius: 20,
    backgroundColor: '#5E5CE6',
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  // Trailer button
  trailerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E50914',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 16,
    alignSelf: 'flex-start',
  },
  trailerButtonText: {
    color: '#fff',
    fontWeight: '600',
    marginLeft: 8,
  },
});