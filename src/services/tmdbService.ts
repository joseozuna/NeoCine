// src/services/tmdbService.ts
import axios from 'axios';

const API_KEY = '2029d83cada732a8eb3ff87318138e49';

// Ajusta idioma y región según necesidad (p.ej. 'MX')
const defaultParams = {
  api_key: '2029d83cada732a8eb3ff87318138e49',
  language: 'es-ES',
  region: 'MX',
};

const tmdb = axios.create({
  baseURL: 'https://api.themoviedb.org/3',
  params: defaultParams,
});

// Tipos
export interface Movie {
  id: number;
  title: string;
  poster_path: string;
  vote_average: number;
  release_date: string;
}

// Funciones existentes
export const getMovieGenres = () => tmdb.get('/genre/movie/list');
export const getTVGenres = () => tmdb.get('/genre/tv/list');
export const getPopularMovies = (page: number = 1) =>
  tmdb.get('/movie/popular', { params: { page } });
export const getPopularSeries = (page: number = 1) =>
  tmdb.get('/tv/popular', { params: { page } });
export const searchMovies = (query: string, page: number = 1) =>
  tmdb.get('/search/movie', { params: { query, page } });
export const searchSeries = (query: string, page: number = 1) =>
  tmdb.get('/search/tv', { params: { query, page } });
export const getMovieDetails = (movieId: number) =>
  tmdb.get(`/movie/${movieId}`, { params: { append_to_response: 'videos,credits' } });
export const getSeriesDetails = (tvId: number) =>
  tmdb.get(`/tv/${tvId}`, { params: { append_to_response: 'videos,credits' } });
export const getWatchProviders = (movieId: number) =>
  tmdb.get(`/movie/${movieId}/watch/providers`);
export const getMoviesByGenre = (genreId: number, page: number = 1) =>
  tmdb.get('/discover/movie', {
    params: { with_genres: genreId, sort_by: 'popularity.desc', page },
  });

// Mejores películas dirigidas por un director
export const getTopMoviesByDirector = async (directorId: number): Promise<Movie[]> => {
  const res = await tmdb.get(`/person/${directorId}/movie_credits`);
  const crew: any[] = res.data.crew;
  const movies: Movie[] = crew
    .filter(credit => credit.job === 'Director' && credit.vote_count > 50)
    .sort((a, b) => b.vote_average - a.vote_average);
  return movies;
};

export const getTopRatedMovies = async (page: number = 1) => {
  const response = await tmdb.get('/movie/top_rated', {
    params: { page }
  });
  return response.data.results;
};

// Trailers de películas recién estrenadas
export const getMovieTrailers = async (): Promise<{ id: string; uri: string }[]> => {
  // 1) Películas en cartelera (now_playing)
  const nowRes = await tmdb.get('/movie/now_playing', { params: { page: 1 } });
  const movies: any[] = nowRes.data.results;

  // 2) Obtener videos y filtrar trailers de YouTube
  const trailers = await Promise.all(
    movies.map(async m => {
      const vidsRes = await tmdb.get(`/movie/${m.id}/videos`);
      const trailer = vidsRes.data.results.find(
        (v: any) => v.site === 'YouTube' && v.type === 'Trailer'
      );
      if (!trailer) return null;
      return { id: trailer.id, uri: `https://www.youtube.com/watch?v=${trailer.key}` };
    })
  );

  // 3) Retornar solo los válidos
  return trailers.filter((t): t is { id: string; uri: string } => !!t);
};

// Directores legendarios por país
export const LEGENDARY_DIRECTORS = [
  { country: 'MX', name: 'Guillermo del Toro', id: 10828 },
  { country: 'JP', name: 'Hayao Miyazaki', id: 608 },
  { country: 'US', name: 'John Carpenter', id: 11770 },
  { country: 'FR', name: 'François Truffaut', id: 1650 },
  { country: 'IT', name: 'Federico Fellini', id: 4415 },
  { country: 'GB', name: 'Christopher Nolan', id: 525 },
  { country: 'SE', name: 'Ingmar Bergman', id: 6648 },
  { country: 'KR', name: 'Bong Joon-ho', id: 21684 },
  { country: 'IR', name: 'Abbas Kiarostami', id: 119294 },
  { country: 'BR', name: 'Fernando Meirelles', id: 8557 },
  { country: 'IN', name: 'Satyajit Ray', id: 12160 },
  { country: 'HK', name: 'Wong Kar-wai', id: 7403 },
  { country: 'CA', name: 'Denis Villeneuve', id: 137427 },
  { country: 'AU', name: 'George Miller', id: 20629 },
  { country: 'RU', name: 'Andrei Tarkovsky', id: 8452 },
  { country: 'AR', name: 'Lucrecia Martel', id: 56208 },
  { country: 'ES', name: 'Pedro Almodóvar', id: 309 },
];

// Export por defecto (si lo prefieres)
export default {
  getMovieGenres,
  getTVGenres,
  getPopularMovies,
  getPopularSeries,
  searchMovies,
  searchSeries,
  getMovieDetails,
  getSeriesDetails,
  getWatchProviders,
  getMoviesByGenre,
  getTopMoviesByDirector,
  getMovieTrailers,
  getTopRatedMovies, 
  LEGENDARY_DIRECTORS,
};
