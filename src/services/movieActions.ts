// src/services/movieActionsExtended.ts
import {
  getDatabase,
  ref,
  set,
  push,
  serverTimestamp,
  onValue,
  remove,
  update
} from 'firebase/database';
import { getAuth } from 'firebase/auth';
import { ReactionType } from '../types/ExtendedReview';

export const addToFavoritesRealtime = async (movie: any) => {
  const user = getAuth().currentUser;
  if (!user) throw new Error('No autenticado');

  const db = getDatabase();
  const path = `favorites/${user.uid}/${movie.id}`;

  await set(ref(db, path), {
    id:           movie.id,
    title:        movie.title,
    poster_path:  movie.poster_path || '',
    release_date: movie.release_date || '',
    vote_average: typeof movie.vote_average === 'number' ? movie.vote_average : null,
    userId:       user.uid,
  });
};

export const markAsViewed = async (movieId: number) => {
  const user = getAuth().currentUser;
  if (!user) throw new Error('No autenticado');

  const db = getDatabase();
  const path = `userRatings/${user.uid}/${movieId}`;

  await set(ref(db, path), {
    viewed:    true,
    timestamp: Date.now(),
  });
};

export const addRating = async (movieId: number, rating: number) => {
  const user = getAuth().currentUser;
  if (!user) throw new Error('No autenticado');

  const db = getDatabase();
  const path = `userRatings/${user.uid}/${movieId}`;

  await set(ref(db, path), {
    viewed:    true,
    rating,
    timestamp: Date.now(),
  });
};

export const removeRating = async (movieId: number) => {
  const user = getAuth().currentUser;
  if (!user) throw new Error('No autenticado');

  const db = getDatabase();
  const path = `userRatings/${user.uid}/${movieId}`;

  await remove(ref(db, path));
};

/**
 * Añade una reseña a reviews/{movie.id}
 * Guarda también movieTitle y userAvatar para la lista pública
 */
export const addReview = async (
  movie: any,
  content: string,
  rating: number
) => {
  const user = getAuth().currentUser;
  if (!user) throw new Error('No autenticado');

  const db = getDatabase();
  const reviewRef = ref(db, `reviews/${movie.id}`);

  await push(reviewRef, {
    username:   user.displayName || 'Anónimo',
    userId:     user.uid,
    content,
    rating,
    // Campos extra para la lista pública
    movieTitle: movie.title,
    userAvatar: user.photoURL || '',
    createdAt:  Date.now(),
  });
};

/**
 * Añade o elimina una reacción a una reseña
 */
export const toggleReaction = async (
  movieId: number,
  reviewId: string,
  reaction: ReactionType
) => {
  const user = getAuth().currentUser;
  if (!user) throw new Error('No autenticado');

  const db = getDatabase();
  const reactionPath = `reviews/${movieId}/${reviewId}/reactions/${user.uid}`;
  const reactionRef = ref(db, reactionPath);

  // Primero obtenemos la reacción actual (si existe)
  return new Promise<void>((resolve, reject) => {
    onValue(
      reactionRef,
      (snapshot) => {
        const currentReaction = snapshot.val();
        
        // Si la reacción es la misma, la eliminamos (toggle)
        if (currentReaction === reaction) {
          set(reactionRef, null)
            .then(resolve)
            .catch(reject);
        } else {
          // Si no hay reacción o es diferente, la establecemos
          set(reactionRef, reaction)
            .then(resolve)
            .catch(reject);
        }
      },
      { onlyOnce: true }
    );
  });
};

/**
 * Obtiene las reseñas de una película, incluyendo reacciones
 */
export const getReviewsWithReactions = async (movieId: number) => {
  const db = getDatabase();
  const reviewRef = ref(db, `reviews/${movieId}`);
  
  return new Promise((resolve) => {
    onValue(reviewRef, (snapshot) => {
      const data = snapshot.val() || {};
      
      // Convertir el objeto a un array y añadir el ID como campo
      const reviews = Object.entries(data).map(([id, reviewData]: [string, any]) => {
        // Calcular los conteos de reacciones
        const reactionCounts: { [key: string]: number } = {};
        
        if (reviewData.reactions) {
          Object.values(reviewData.reactions).forEach((reaction) => {
            reactionCounts[reaction as string] = (reactionCounts[reaction as string] || 0) + 1;
          });
        }
        
        return {
          id,
          ...reviewData,
          reactionCounts,
        };
      });
      
      // Ordenar por fecha de creación (más recientes primero)
      reviews.sort((a, b) => b.createdAt - a.createdAt);
      
      resolve(reviews);
    });
  });
};

/**
 * Lee todas las reseñas públicas de todas las películas
 */
export const getPublicReviewsExtended = async () => {
  const db = getDatabase();
  const reviewsRef = ref(db, 'reviews');
  
  return new Promise((resolve) => {
    onValue(reviewsRef, (snap) => {
      const data = snap.val() || {};
      const allReviews = [];

      // Iteramos por cada película
      for (const movieId in data) {
        const movieReviews = data[movieId];
        
        // Iteramos por cada reseña de esta película
        for (const reviewId in movieReviews) {
          const review = movieReviews[reviewId];
          
          // Calculamos conteos de reacciones
          const reactionCounts: { [key: string]: number } = {};
          if (review.reactions) {
            Object.values(review.reactions).forEach((reaction) => {
              reactionCounts[reaction as string] = (reactionCounts[reaction as string] || 0) + 1;
            });
          }
          
          allReviews.push({
            id: reviewId,
            movieId: parseInt(movieId),
            ...review,
            reactionCounts,
          });
        }
      }
      
      // Ordenamos por fecha (más recientes primero)
      allReviews.sort((a, b) => b.createdAt - a.createdAt);
      resolve(allReviews);
    });
  });
};