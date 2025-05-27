// src/screens/RegisterScreen.tsx
import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, TouchableWithoutFeedback,
  Keyboard, Alert, ImageBackground, Image, ImageSourcePropType,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { register } from '../services/auth';
import { updateProfile } from 'firebase/auth';
import { auth, storage } from '../services/firebaseConfig';
import bgImage from '../../assets/images/m1.jpg';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Asset } from 'expo-asset';

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

export default function RegisterScreen({ navigation }: { navigation: any }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [sel, setSel] = useState(0);

  const handleRegister = async () => {
    if (password !== confirm) {
      Alert.alert('Error', 'Las contraseñas no coinciden');
      return;
    }
    try {
      const cred = await register(email.trim(), password);
      const user = cred.user;

      // Descarga y convierte avatar a Blob
      const asset = Asset.fromModule(avatarOptions[sel]);
      await asset.downloadAsync();
      const uri = asset.localUri || asset.uri;
      const resp = await fetch(uri);
      const blob = await resp.blob();

      // Sube a Storage
      const ref = storageRef(storage, `avatars/${user.uid}`);
      await uploadBytes(ref, blob);
      const url = await getDownloadURL(ref);

      // Actualiza perfil
      await updateProfile(user, { displayName: name.trim(), photoURL: url });

      navigation.replace('Home');
    } catch (e: any) {
      Alert.alert('Error al registrar', e.message);
    }
  };

  return (
    <ImageBackground source={bgImage} style={styles.bg}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.inner}>
            <Text style={styles.title}>Registro</Text>

            {/** Inputs **/}
            <View style={styles.inputContainer}>
              <Ionicons name="person-outline" size={20} color="#999" style={styles.icon} />
              <TextInput
                placeholder="Nombre completo"
                placeholderTextColor="#666"
                value={name}
                onChangeText={setName}
                style={styles.input}
              />
            </View>
            <View style={styles.inputContainer}>
              <Ionicons name="mail-outline" size={20} color="#999" style={styles.icon} />
              <TextInput
                placeholder="Correo electrónico"
                placeholderTextColor="#666"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
                style={styles.input}
              />
            </View>
            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={20} color="#999" style={styles.icon} />
              <TextInput
                placeholder="Contraseña"
                placeholderTextColor="#666"
                secureTextEntry={!show}
                value={password}
                onChangeText={setPassword}
                style={styles.input}
              />
              <TouchableOpacity onPress={() => setShow(!show)}>
                <Ionicons
                  name={show ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color="#999"
                />
              </TouchableOpacity>
            </View>
            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={20} color="#999" style={styles.icon} />
              <TextInput
                placeholder="Confirmar contraseña"
                placeholderTextColor="#666"
                secureTextEntry={!show}
                value={confirm}
                onChangeText={setConfirm}
                style={styles.input}
              />
            </View>

            {/** Avatares **/}
            <Text style={styles.subtitle}>Elige tu avatar:</Text>
            <View style={styles.avatarGrid}>
              {avatarOptions.map((src, i) => (
                <TouchableOpacity
                  key={i}
                  onPress={() => setSel(i)}
                  style={[
                    styles.avatarWrapper,
                    sel === i && styles.avatarSelected,
                  ]}
                >
                  <Image source={src} style={styles.avatarImg} />
                </TouchableOpacity>
              ))}
            </View>

            {/** Botón **/}
            <TouchableOpacity style={styles.button} onPress={handleRegister}>
              <Text style={styles.buttonText}>Crear cuenta</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.link}>¿Ya tienes cuenta? Inicia sesión</Text>
            </TouchableOpacity>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, width: '100%', height: '100%' },
  container: { flex: 1, padding: 20, justifyContent: 'center' },
  inner: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 20,
    borderRadius: 10,
  },
  title: { fontSize: 28, color: '#fff', fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#222',
    borderRadius: 8,
    marginBottom: 15,
    paddingHorizontal: 12,
    height: 48,
  },
  icon: { marginRight: 10 },
  input: { flex: 1, color: '#fff', fontSize: 16 },
  subtitle: { fontSize: 16, color: '#fff', marginVertical: 8 },
  avatarGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 20 },
  avatarWrapper: { padding: 4, borderRadius: 40, backgroundColor: '#222' },
  avatarSelected: { borderWidth: 2, borderColor: '#1DB954' },
  avatarImg: { width: 64, height: 64, borderRadius: 32 },
  button: { backgroundColor: '#1DB954', paddingVertical: 14, borderRadius: 8, alignItems: 'center', marginBottom: 12 },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  link: { color: '#aaa', textAlign: 'center', fontSize: 14 },
});
