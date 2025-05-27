import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { useFonts, Merriweather_700Bold, Merriweather_400Regular } from '@expo-google-fonts/merriweather';
import axios from 'axios';

interface Props {
  directorName: string;
  language?: 'es' | 'en';
}

interface WikiData {
  title: string;
  extract: string;
  image: string | null;
}

export default function DirectorBioCard({ directorName, language = 'es' }: Props) {
  const [data, setData] = useState<WikiData | null>(null);
  const [loading, setLoading] = useState(true);

  const [fontsLoaded] = useFonts({ 
    Merriweather_700Bold,
    Merriweather_400Regular
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const formattedName = directorName.replace(/ /g, '_');
        const response = await axios.get(
          `https://${language}.wikipedia.org/api/rest_v1/page/summary/${formattedName}`
        );
        const { title, extract, thumbnail } = response.data;
        setData({
          title,
          extract,
          image: thumbnail?.source || null,
        });
      } catch (error) {
        console.error('Wikipedia fetch error:', error);
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [directorName]);

  const extractAwards = (text: string): string[] => {
    const awards = [
      'Oscar',
      'Óscar',
      'BAFTA',
      'Palma de Oro',
      'Palme d\'Or',
      'Globo de Oro',
      'León de Oro',
      'Cannes',
      'Emmy',
      'Goya',
      'Oso de Oro',
    ];
    return awards.filter((award) => text.toLowerCase().includes(award.toLowerCase()));
  };

  if (!fontsLoaded || loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color="#1db954" size="small" />
      </View>
    );
  }

  if (!data) {
    return <Text style={styles.errorText}>Lo sentimos, no se pudo cargar la biografía.</Text>;
  }

  const awards = extractAwards(data.extract);

  return (
    <View style={styles.card}>
      <View style={styles.imageWrapper}>
        {data.image ? (
          <Image source={{ uri: data.image }} style={styles.image} resizeMode="cover" />
        ) : (
          <View style={styles.placeholderImage}>
            <Text style={styles.placeholderText}>{data.title.charAt(0)}</Text>
          </View>
        )}
        <View style={styles.gradient} />
        <Text style={styles.name}>{data.title}</Text>
      </View>
      
      <View style={styles.contentContainer}>
        <Text style={styles.bio}>{data.extract}</Text>

        {awards.length > 0 && (
          <View style={styles.awardsContainer}>
            <Text style={styles.awardsTitle}>🏆 Premios</Text>
            <View style={styles.awardsList}>
              {awards.map((award, index) => (
                <Text key={index} style={styles.awardItem}>
                  <Text style={styles.awardBullet}>•</Text> {award}
                </Text>
              ))}
            </View>
          </View>
        )}

        <TouchableOpacity
          style={styles.linkButton}
          onPress={() =>
            Linking.openURL(`https://${language}.wikipedia.org/wiki/${directorName.replace(/ /g, '_')}`)
          }
        >
          <Text style={styles.linkText}>Leer más en Wikipedia</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    marginVertical: 16,
    marginHorizontal: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.23,
    shadowRadius: 6,
    elevation: 7,
  },
  imageWrapper: {
    width: '100%',
    height: 220,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#2A2A2A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    color: '#fff',
    fontSize: 60,
    fontFamily: 'Merriweather_700Bold',
    opacity: 0.7,
  },
  gradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
    backgroundColor: 'rgba(26, 26, 26, 0.85)',
  },
  name: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    fontFamily: 'Merriweather_700Bold',
    fontSize: 22,
    color: '#fff',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  contentContainer: {
    padding: 20,
  },
  bio: {
    fontFamily: 'Merriweather_400Regular',
    color: '#DDD',
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'justify',
  },
  awardsContainer: {
    marginTop: 20,
    backgroundColor: 'rgba(29, 185, 84, 0.1)',
    borderRadius: 8,
    padding: 12,
  },
  awardsTitle: {
    color: '#1db954',
    fontFamily: 'Merriweather_700Bold',
    fontSize: 16,
    marginBottom: 8,
  },
  awardsList: {
    paddingLeft: 4,
  },
  awardItem: {
    color: '#DDD',
    fontFamily: 'Merriweather_400Regular',
    fontSize: 14,
    lineHeight: 22,
  },
  awardBullet: {
    color: '#1db954',
    fontSize: 16,
  },
  linkButton: {
    marginTop: 22,
    alignSelf: 'center',
    backgroundColor: 'rgba(29, 185, 84, 0.15)',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#1db954',
  },
  linkText: {
    color: '#1db954',
    fontFamily: 'Merriweather_700Bold',
    fontSize: 14,
    textAlign: 'center',
  },
  loadingContainer: {
    padding: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: '#999',
    textAlign: 'center',
    marginVertical: 20,
    fontFamily: 'Merriweather_400Regular',
  },
});