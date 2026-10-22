
import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  Alert,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';

import AppButton from '../components/AppButton';
import AppInput from '../components/AppInput';
import { apiRequest } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { theme } from '../styles/theme';

export default function EventScreen() {
  const { logout } = useAuth();

  const [photo, setPhoto] = useState(null);
  const [coordinates, setCoordinates] = useState(null);
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);

  const getLocation = async () => {
    setLocating(true);
    setCoordinates(null);

    try {
      const permission =
        await Location.requestForegroundPermissionsAsync();

      if (!permission.granted) {
        throw new Error('Location permission denied.');
      }

      const location =
        await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });

      const coords = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };

      setCoordinates(coords);
      return coords;
    } catch (error) {
      Alert.alert('Location error', error.message);
      return null;
    } finally {
      setLocating(false);
    }
  };

  const takePhoto = async () => {
    try {
      const permission =
        await ImagePicker.requestCameraPermissionsAsync();

      if (!permission.granted) {
        throw new Error('Camera permission denied.');
      }

      const result =
        await ImagePicker.launchCameraAsync({
          mediaTypes: ['images'],
          quality: 0.7,
          base64: true,
        });

      if (result.canceled) return;

      const asset = result.assets[0];

      if (!asset.base64) {
        throw new Error('Photo data unavailable.');
      }

      setPhoto({
        uri: asset.uri,
        base64: asset.base64,
      });

      await getLocation();
    } catch (error) {
      Alert.alert('Camera error', error.message);
    }
  };

  const submitEvent = async () => {
    if (!photo || !coordinates || !description.trim()) {
      Alert.alert(
        'Missing information',
        'Photo, GPS location and description are required.'
      );
      return;
    }

    setLoading(true);

    try {
      const response = await apiRequest('/Event/Create', {
        method: 'POST',
        authenticated: true,
        body: {
          photo: photo.base64,
          latitude: coordinates.latitude,
          longitude: coordinates.longitude,
          description: description.trim(),
        },
      });

      Alert.alert('Success', 'Event submitted successfully.');

      setPhoto(null);
      setCoordinates(null);
      setDescription('');
    } catch (error) {
      Alert.alert('Submission failed', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>New Event</Text>
            <Text style={styles.subtitle}>
              Capture and submit a report
            </Text>
          </View>

          <TouchableOpacity onPress={logout}>
            <Text style={styles.logout}>Logout</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.photoContainer}
          onPress={takePhoto}
          disabled={loading || locating}
        >
          {photo ? (
            <Image
              source={{ uri: photo.uri }}
              style={styles.photo}
            />
          ) : (
            <View style={styles.placeholder}>
              <Text style={styles.cameraIcon}>📷</Text>
              <Text style={styles.muted}>Take a photograph</Text>
            </View>
          )}
        </TouchableOpacity>

        <AppButton
          title={photo ? 'Retake Photo' : 'Open Camera'}
          variant="outline"
          onPress={takePhoto}
          disabled={loading || locating}
          style={{ marginTop: 12 }}
        />

        <Text style={styles.label}>GPS Location</Text>

        <View style={styles.locationBox}>
          {locating ? (
            <ActivityIndicator color={theme.colors.primary} />
          ) : coordinates ? (
            <>
              <Text>
                Latitude: {coordinates.latitude.toFixed(6)}
              </Text>
              <Text>
                Longitude: {coordinates.longitude.toFixed(6)}
              </Text>
            </>
          ) : (
            <Text style={styles.muted}>
              No coordinates captured
            </Text>
          )}
        </View>

        <AppButton
          title="Refresh Location"
          variant="outline"
          onPress={getLocation}
          disabled={loading || locating}
          style={{ marginTop: 12 }}
        />

        <View style={{ marginTop: 24 }}>
          <AppInput
            label="Description"
            placeholder="Describe what happened..."
            value={description}
            onChangeText={setDescription}
            multiline
          />
        </View>

        <AppButton
          title="Submit Event"
          onPress={submitEvent}
          loading={loading}
          disabled={locating || !photo || !coordinates}
          style={{ marginTop: 12 }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    padding: 24,
    paddingBottom: 50,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 28,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  subtitle: {
    color: theme.colors.muted,
    marginTop: 5,
  },
  logout: {
    color: theme.colors.error,
    fontWeight: '600',
  },
  photoContainer: {
    height: 230,
    borderRadius: 16,
    backgroundColor: '#E5EAF2',
    overflow: 'hidden',
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraIcon: {
    fontSize: 42,
    marginBottom: 12,
  },
  muted: {
    color: theme.colors.muted,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.text,
    marginTop: 25,
    marginBottom: 10,
  },
  locationBox: {
    backgroundColor: '#FFF',
    padding: 18,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: 5,
  },
});
