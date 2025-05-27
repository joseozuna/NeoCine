// src/screens/DirectorBioScreen.tsx
import React from 'react';
import { View, StyleSheet } from 'react-native';
import DirectorBioCard from '../components/DirectorBioCard';

export default function DirectorBioScreen({ route }) {
  const { directorName } = route.params;

  return (
    <View style={styles.container}>
      <DirectorBioCard directorName={directorName} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    paddingTop: 16,
  },
});
