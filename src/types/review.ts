// src/types/ExtendedReview.ts

// Tipo para las reacciones posibles
export type ReactionType = '👍' | '😊' | '❤️' | '😮' | '😾';

// Interfaz extendida para Review con reacciones
export interface ExtendedReview {
  id: string;           // key push() de Firebase
  movieId: number;      // ID de la película
  movieTitle: string;   // Título de la película para mostrar en listas
  content: string;      // Texto de la reseña
  rating: number;       // Puntuación 0-10
  username: string;     // Nombre del usuario que escribe la reseña
  userId: string;       // ID del usuario para identificar sus reseñas
  userAvatar: string;   // URL del avatar o cadena vacía
  createdAt: number;    // timestamp en ms

  // Mapa de reacciones: userId -> tipo de reacción
  reactions?: {
    [userId: string]: ReactionType;
  };
  
  // Conteo de cada tipo de reacción (calculado)
  reactionCounts?: {
    [reaction in ReactionType]?: number;
  };
}