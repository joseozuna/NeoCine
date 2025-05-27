import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  Dimensions,
  ScrollView,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getAuth } from 'firebase/auth';
import {
  getDatabase,
  ref,
  set,
  push,
  serverTimestamp,
  onValue,
  update
} from 'firebase/database';

const { width } = Dimensions.get('window');

// Definimos el tipo para las reacciones
type ReactionType = '👍' | '😊' | '❤️' | '😮' | '😾';

// Interfaz extendida para Review con reacciones
interface ExtendedReview {
  id: string;
  movieId: number;
  movieTitle: string;
  content: string;
  rating: number;
  username: string;
  userId: string;
  userAvatar: string;
  createdAt: number;
  reactions?: {
    [userId: string]: ReactionType;
  };
  reactionCounts?: {
    [reaction in ReactionType]?: number;
  };
}

// Componente para una reseña individual
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
            <Ionicons name="person-circle" size={40} color="#888" />
          )}
          <View style={styles.reviewUserInfo}>
            <Text style={styles.reviewUsername}>{review.username}</Text>
            <Text style={styles.reviewDate}>
              {new Date(review.createdAt).toLocaleDateString()}
            </Text>
          </View>
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

// Componente principal de reseñas
export default function ReviewsComponent({ movieId, movieTitle }: { movieId: number, movieTitle: string }) {
  const [reviews, setReviews] = useState<ExtendedReview[]>([]);
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [reviewText, setReviewText] = useState('');
  const [reviewStars, setReviewStars] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);
  
  const currentUser = getAuth().currentUser;

  // Cargar reseñas
  useEffect(() => {
    if (!movieId) return;
    
    const db = getDatabase();
    const reviewsRef = ref(db, `reviews/${movieId}`);
    
    const unsubscribe = onValue(reviewsRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) {
        setReviews([]);
        return;
      }
      
      // Convertir los datos a un array y calcular los conteos de reacciones
      const reviewsArray: ExtendedReview[] = Object.entries(data).map(([id, review]: [string, any]) => {
        const reactionCounts: { [key in ReactionType]?: number } = {};
        
        if (review.reactions) {
          Object.values(review.reactions).forEach((reaction) => {
            const emoji = reaction as ReactionType;
            reactionCounts[emoji] = (reactionCounts[emoji] || 0) + 1;
          });
        }
        
        return {
          id,
          movieId,
          ...review,
          reactionCounts
        };
      });
      
      // Ordenar por fecha de creación (más recientes primero)
      reviewsArray.sort((a, b) => b.createdAt - a.createdAt);
      setReviews(reviewsArray);
    });
    
    return () => unsubscribe();
  }, [movieId, refreshKey]);

  // Añadir una reseña
  const handleSubmitReview = async () => {
    if (!currentUser) {
      Alert.alert('Error', 'Necesitas iniciar sesión para escribir una reseña');
      return;
    }
    
    if (!reviewText.trim() || reviewStars === 0) {
      Alert.alert('Error', 'Escribe una crítica y selecciona una puntuación');
      return;
    }
    
    try {
      const db = getDatabase();
      const reviewsRef = ref(db, `reviews/${movieId}`);
      
      await push(reviewsRef, {
        username: currentUser.displayName || 'Anónimo',
        userId: currentUser.uid,
        userAvatar: currentUser.photoURL || '',
        content: reviewText.trim(),
        rating: reviewStars,
        movieTitle,
        createdAt: Date.now(),
      });
      
      setReviewModalVisible(false);
      setReviewText('');
      setReviewStars(0);
      setRefreshKey(prev => prev + 1); // Forzar actualización
    } catch (error) {
      Alert.alert('Error', 'No se pudo publicar la reseña');
    }
  };

  // Añadir una reacción
  const handleReaction = async (reviewId: string, reaction: ReactionType) => {
    if (!currentUser) {
      Alert.alert('Error', 'Necesitas iniciar sesión para reaccionar');
      return;
    }
    
    try {
      const db = getDatabase();
      const reactionRef = ref(db, `reviews/${movieId}/${reviewId}/reactions/${currentUser.uid}`);
      
      // Si ya tenía esta reacción, la eliminamos (toggle)
      const review = reviews.find(r => r.id === reviewId);
      if (review?.reactions?.[currentUser.uid] === reaction) {
        await set(reactionRef, null);
      } else {
        await set(reactionRef, reaction);
      }
      
      setRefreshKey(prev => prev + 1); // Forzar actualización
    } catch (error) {
      Alert.alert('Error', 'No se pudo registrar tu reacción');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.sectionTitle}>Críticas de usuarios</Text>
        <TouchableOpacity 
          style={styles.addReviewButton}
          onPress={() => setReviewModalVisible(true)}
        >
          <Text style={styles.addReviewButtonText}>Escribir</Text>
        </TouchableOpacity>
      </View>
      
      {reviews.length > 0 ? (
        <ScrollView>
          {reviews.map((review) => (
            <ReviewItem 
              key={review.id} 
              review={review}
              onReact={handleReaction}
            />
          ))}
        </ScrollView>
      ) : (
        <View style={styles.emptyReviews}>
          <Ionicons name="chatbubble-outline" size={48} color="#555" />
          <Text style={styles.emptyReviewsText}>No hay críticas todavía</Text>
          <TouchableOpacity 
            style={styles.addFirstReviewButton}
            onPress={() => setReviewModalVisible(true)}
          >
            <Text style={styles.addReviewButtonText}>Sé el primero en opinar</Text>
          </TouchableOpacity>
        </View>
      )}
      
      {/* Modal para añadir reseña */}
      <Modal
        visible={reviewModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setReviewModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Escribir crítica</Text>
            
            <View style={styles.starsContainer}>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
                <TouchableOpacity 
                  key={i} 
                  onPress={() => setReviewStars(i)}
                  style={styles.starOption}
                >
                  <Ionicons 
                    name={i <= reviewStars ? "star" : "star-outline"} 
                    size={24} 
                    color="#FFD700" 
                  />
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.ratingValue}>{reviewStars}/10</Text>
            
            <TextInput
              placeholder="Escribe tu crítica..."
              placeholderTextColor="#888"
              multiline
              numberOfLines={4}
              value={reviewText}
              onChangeText={setReviewText}
              style={styles.reviewInput}
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                onPress={() => setReviewModalVisible(false)}
                style={styles.cancelButton}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                onPress={handleSubmitReview}
                style={styles.submitButton}
              >
                <Text style={styles.submitButtonText}>Publicar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  addReviewButton: {
    backgroundColor: '#5E5CE6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addReviewButtonText: {
    color: '#fff',
    fontWeight: '500',
    fontSize: 14,
  },
  reviewItem: {
    backgroundColor: '#111',
    borderRadius: 8,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  reviewUser: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  reviewUserInfo: {
    marginLeft: 12,
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  reviewUsername: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
  reviewDate: {
    color: '#999',
    fontSize: 12,
  },
  ratingBadge: {
    backgroundColor: '#333',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  ratingText: {
    color: '#FFD700',
    fontWeight: 'bold',
    fontSize: 14,
  },
  reviewContent: {
    color: '#ddd',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
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
  emptyReviews: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyReviewsText: {
    color: '#888',
    fontSize: 14,
    marginVertical: 8,
  },
  addFirstReviewButton: {
    backgroundColor: '#5E5CE6',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: width * 0.85,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 20,
  },
  modalTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  starOption: {
    padding: 6,
  },
  ratingValue: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
  reviewInput: {
    backgroundColor: '#222',
    color: '#fff',
    borderRadius: 8,
    padding: 12,
    height: 120,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cancelButton: {
    borderWidth: 1,
    borderColor: '#444',
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  cancelButtonText: {
    color: '#ccc',
    fontSize: 14,
  },
  submitButton: {
    backgroundColor: '#5E5CE6',
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 24,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  }
});