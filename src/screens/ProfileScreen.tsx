// ProfileScreen.tsx completo con nombre editable, avatar, mi lista y reseñas

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
  Modal,
  TextInput,
  ImageBackground,
  ImageSourcePropType,
} from 'react-native';
import { auth, storage } from '../services/firebaseConfig';
import { logout } from '../services/auth';
import { updateProfile, onAuthStateChanged, User } from 'firebase/auth';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Asset } from 'expo-asset';
import { Ionicons } from '@expo/vector-icons';
import { getDatabase, ref, onValue } from 'firebase/database';
import {
  useFonts,
  Merriweather_700Bold,
  Merriweather_400Regular,
} from '@expo-google-fonts/merriweather';

const avatarOptions: ImageSourcePropType[] = [
  require('../../assets/images/ghost.png'),
  require('../../assets/images/dracula.png'),
  require('../../assets/images/frank.png'),
  require('../../assets/images/ghostface.png'),
  require('../../assets/images/jason.png'),
  require('../../assets/images/momia.png'),
  require('../../assets/images/ophera_ghost.png'),
  require('../../assets/images/werewolf.png'),
];

export default function ProfileScreen({ navigation }: { navigation: any }) {
  const [user, setUser] = useState<User | null>(auth.currentUser);
  const [avatarUri, setAvatarUri] = useState<string | null>(auth.currentUser?.photoURL || null);
  const [showModal, setShowModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [favorites, setFavorites] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);

  const [fontsLoaded] = useFonts({
    Merriweather_700Bold,
    Merriweather_400Regular,
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAvatarUri(u?.photoURL || null);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    const db = getDatabase();
    const favRef = ref(db, `favorites/${uid}`);
    onValue(favRef, (snapshot) => {
      const data = snapshot.val() || {};
      setFavorites(Object.values(data));
    });

    const reviewRef = ref(db, `reviews/${uid}`);
    onValue(reviewRef, async (snapshot) => {
      const data = snapshot.val() || {};
      const reviewList = await Promise.all(
        Object.entries(data).map(async ([movieId, reviewData]: any) => {
          const res = await fetch(`https://api.themoviedb.org/3/movie/${movieId}?api_key=2029d83cada732a8eb3ff87318138e49&language=es-ES`);
          const movie = await res.json();
          return {
            movie,
            text: reviewData.text,
            rating: reviewData.rating,
          };
        })
      );
      setReviews(reviewList.reverse().slice(0, 5));
    });
  }, []);

  const handleAvatarSelect = async (index: number) => {
    if (!user) return;
    try {
      const asset = Asset.fromModule(avatarOptions[index]);
      await asset.downloadAsync();
      const uri = asset.localUri || asset.uri;
      const response = await fetch(uri);
      const blob = await response.blob();
      const avatarRef = storageRef(storage, `avatars/${user.uid}`);
      await uploadBytes(avatarRef, blob);
      const url = await getDownloadURL(avatarRef);
      await updateProfile(user, { photoURL: url });
      setAvatarUri(url);
      Alert.alert('Avatar actualizado');
    } catch (error: any) {
      Alert.alert('Error al actualizar avatar', error.message);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigation.replace('Login');
    } catch (error: any) {
      Alert.alert('Error al cerrar sesión', error.message);
    }
  };

  const handleUpdateName = async () => {
    if (!newName.trim()) return;
    try {
      await updateProfile(auth.currentUser!, { displayName: newName.trim() });
      setUser({ ...user!, displayName: newName.trim() } as User);
      setShowModal(false);
    } catch (error: any) {
      Alert.alert('Error al actualizar nombre', error.message);
    }
  };

  const openMovie = (movieId: number) => {
    navigation.navigate('MovieDetails', { movieId });
  };

  if (!fontsLoaded) return null;

  return (
    <ImageBackground source={require('../../assets/images/3.jpg')} style={styles.background} >
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.card}>
          {avatarUri ? <Image source={{ uri: avatarUri }} style={styles.avatar} /> : <Ionicons name="person-circle-outline" size={100} color="#888" />}
          <Text style={styles.name}>{user?.displayName || user?.email || 'Usuario'}</Text>
          <TouchableOpacity onPress={() => setShowModal(true)} style={styles.editNameButton}>
            <Ionicons name="create-outline" size={16} color="#fff" />
            <Text style={styles.editNameText}>Editar nombre</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
            <Ionicons name="log-out-outline" size={18} color="#fff" />
            <Text style={styles.logoutText}>Cerrar sesión</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.subtitle}>Elige un avatar:</Text>
        <View style={styles.avatarGrid}>
          {avatarOptions.map((src, idx) => (
            <TouchableOpacity key={idx} style={styles.avatarOptionWrapper} onPress={() => handleAvatarSelect(idx)}>
              <Image source={src} style={styles.avatarOption} />
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.subtitle}>Mi lista:</Text>
        <ScrollView horizontal contentContainerStyle={styles.favoriteScroll}>
          {favorites.length === 0 ? (
            <Text style={styles.emptyText}>No has añadido películas aún.</Text>
          ) : (
            favorites.map((movie: any) => (
              <TouchableOpacity key={movie.id} onPress={() => openMovie(movie.id)} style={styles.moviePosterWrapper}>
                <Image source={{ uri: `https://image.tmdb.org/t/p/w185${movie.poster_path}` }} style={styles.moviePoster} />
              </TouchableOpacity>
            ))
          )}
        </ScrollView>

        <Text style={styles.subtitle}>Mis reseñas:</Text>
        <View>
          {reviews.length === 0 ? (
            <Text style={styles.emptyText}>No has escrito reseñas aún.</Text>
          ) : (
            reviews.map((review) => (
              <TouchableOpacity key={review.movie.id} onPress={() => openMovie(review.movie.id)} style={styles.reviewCard}>
                <Image source={{ uri: `https://image.tmdb.org/t/p/w185${review.movie.poster_path}` }} style={styles.reviewPoster} />
                <View style={styles.reviewContent}>
                  <Text style={styles.reviewTitle} numberOfLines={1}>{review.movie.title}</Text>
                  <Text style={styles.reviewText} numberOfLines={2}>{review.text}</Text>
                  <View style={styles.reviewRating}>
                    <Ionicons name="star" size={14} color="#f9c74f" />
                    <Text style={styles.reviewRatingText}>{review.rating}/5</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>

        <Modal visible={showModal} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Editar nombre</Text>
              <TextInput placeholder="Nuevo nombre" value={newName} onChangeText={setNewName} style={styles.input} placeholderTextColor="#888" />
              <View style={styles.modalButtons}>
                <TouchableOpacity onPress={handleUpdateName} style={styles.saveButton}>
                  <Text style={styles.saveText}>Guardar</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setShowModal(false)} style={styles.cancelButton}>
                  <Text style={styles.cancelText}>Cancelar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </ScrollView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1 },
  container: { flexGrow: 1, padding: 20, paddingTop: 60 },
  card: { backgroundColor: 'rgba(0,0,0,0.75)', borderRadius: 20, padding: 20, alignItems: 'center', marginBottom: 30 },
  avatar: { width: 120, height: 120, borderRadius: 60, marginBottom: 12 },
  name: { fontSize: 20, fontFamily: 'Merriweather_700Bold', color: '#fff', marginBottom: 8, textAlign: 'center' },
  editNameButton: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  editNameText: { color: '#fff', marginLeft: 6, fontSize: 14 },
  logoutButton: { flexDirection: 'row', backgroundColor: '#d33', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 10, alignItems: 'center' },
  logoutText: { color: '#fff', marginLeft: 6, fontFamily: 'Merriweather_400Regular', fontSize: 14 },
  subtitle: { fontSize: 16, fontFamily: 'Merriweather_700Bold', marginBottom: 12, color: '#fff', textAlign: 'left' },
  avatarGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', marginBottom: 20 },
  avatarOptionWrapper: { padding: 6, margin: 6, borderRadius: 50, backgroundColor: '#222' },
  avatarOption: { width: 64, height: 64, borderRadius: 32 },
  favoriteScroll: { flexDirection: 'row', paddingVertical: 10 },
  moviePosterWrapper: { marginRight: 10 },
  moviePoster: { width: 90, height: 135, borderRadius: 8, backgroundColor: '#444' },
  emptyText: { color: '#aaa', fontFamily: 'Merriweather_400Regular', marginLeft: 10 },
  reviewCard: { flexDirection: 'row', backgroundColor: '#1a1a1a', borderRadius: 12, padding: 10, marginBottom: 10, alignItems: 'center' },
  reviewPoster: { width: 60, height: 90, borderRadius: 6, marginRight: 10, backgroundColor: '#333' },
  reviewContent: { flex: 1 },
  reviewTitle: { fontSize: 14, fontFamily: 'Merriweather_700Bold', color: '#fff', marginBottom: 4 },
  reviewText: { fontSize: 12, color: '#ccc', marginBottom: 6 },
  reviewRating: { flexDirection: 'row', alignItems: 'center' },
  reviewRatingText: { color: '#f9c74f', fontSize: 12, marginLeft: 4 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#222', padding: 20, borderRadius: 12 },
  modalTitle: { color: '#fff', fontFamily: 'Merriweather_700Bold', fontSize: 18, marginBottom: 10 },
  input: { backgroundColor: '#333', padding: 10, borderRadius: 8, color: '#fff', marginBottom: 12 },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-between' },
  saveButton: { backgroundColor: '#1db954', padding: 10, borderRadius: 8 },
  saveText: { color: '#fff', fontWeight: 'bold' },
  cancelButton: { padding: 10 },
  cancelText: { color: '#ccc' },
});