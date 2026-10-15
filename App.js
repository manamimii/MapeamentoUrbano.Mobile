
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  StatusBar,
} from 'react-native';

import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';

const API_URL =
  'https://api-lovat-tau-30.vercel.app/api/Event/Create';

export default function App() {
  const [photo, setPhoto] = useState(null);
  const [description, setDescription] = useState('');
  const [coordinates, setCoordinates] = useState(null);
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);

  const getLocation = async () => {
    setLocating(true);

    try {
      const permission =
        await Location.requestForegroundPermissionsAsync();

      if (!permission.granted) {
        Alert.alert(
          'Permission denied',
          'Location permission is required.'
        );
        return null;
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
      Alert.alert(
        'Location error',
        error.message
      );
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
        Alert.alert(
          'Permission denied',
          'Camera permission is required.'
        );
        return;
      }

      const result =
        await ImagePicker.launchCameraAsync({
          mediaTypes: ['images'],
          allowsEditing: false,
          quality: 0.7,
          base64: true,
          cameraType: ImagePicker.CameraType.back,
        });

      if (result.canceled) return;

      const asset = result.assets[0];

      if (!asset.base64) {
        throw new Error('Could not read photo data.');
      }

      setPhoto({
        uri: asset.uri,
        base64: asset.base64,
      });

      // Capture coordinates after taking the photo.
      await getLocation();
    } catch (error) {
      Alert.alert('Camera error', error.message);
    }
  };

  const submitEvent = async () => {
    if (!photo) {
      Alert.alert('Missing photo', 'Take a photo first.');
      return;
    }

    if (!description.trim()) {
      Alert.alert(
        'Missing description',
        'Enter a description.'
      );
      return;
    }

    if (!coordinates) {
      Alert.alert(
        'Missing location',
        'Capture your GPS location first.'
      );
      return;
    }

    setLoading(true);

    try {
      const payload = {
        photo: photo.base64,
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
        description: description.trim(),
      };

      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const responseText = await response.text();

      if (!response.ok) {
        throw new Error(
          `HTTP ${response.status}: ${responseText}`
        );
      }

      Alert.alert(
        'Success',
        'Event successfully submitted!'
      );

      setPhoto(null);
      setCoordinates(null);
      setDescription('');
    } catch (error) {
      Alert.alert(
        'Upload failed',
        error.message
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      <StatusBar barStyle="dark-content" />

      <Text style={styles.title}>Event Reporter</Text>
      <Text style={styles.subtitle}>
        Capture and report an event
      </Text>

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
          <View style={styles.photoPlaceholder}>
            <Text style={styles.cameraIcon}>📷</Text>
            <Text style={styles.photoText}>
              Tap to take a photograph
            </Text>
          </View>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.secondaryButton}
        onPress={takePhoto}
        disabled={loading || locating}
      >
        <Text style={styles.secondaryButtonText}>
          {photo ? 'Retake Photo' : 'Open Camera'}
        </Text>
      </TouchableOpacity>

      <Text style={styles.label}>GPS Location</Text>

      <View style={styles.locationCard}>
        {locating ? (
          <ActivityIndicator color="#203A6F" />
        ) : coordinates ? (
          <>
            <Text style={styles.coordinateText}>
              Latitude: {coordinates.latitude.toFixed(6)}
            </Text>
            <Text style={styles.coordinateText}>
              Longitude: {coordinates.longitude.toFixed(6)}
            </Text>
          </>
        ) : (
          <Text style={styles.mutedText}>
            Location not captured
          </Text>
        )}

        <TouchableOpacity
          onPress={getLocation}
          disabled={loading || locating}
        >
          <Text style={styles.locationAction}>
            Refresh Location
          </Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.label}>Description</Text>

      <TextInput
        style={styles.input}
        placeholder="Describe what happened..."
        placeholderTextColor="#9CA3AF"
        multiline
        numberOfLines={4}
        textAlignVertical="top"
        value={description}
        onChangeText={setDescription}
        editable={!loading}
      />

      <TouchableOpacity
        style={[
          styles.submitButton,
          (loading || locating) && styles.disabledButton,
        ]}
        onPress={submitEvent}
        disabled={loading || locating}
      >
        {loading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.submitText}>
            Submit Event
          </Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#F7F9FC',
    padding: 24,
    paddingTop: 64,
    paddingBottom: 48,
  },
  title: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#203A6F',
  },
  subtitle: {
    fontSize: 15,
    color: '#6B7280',
    marginTop: 6,
    marginBottom: 28,
  },
  photoContainer: {
    height: 240,
    backgroundColor: '#E5EAF2',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#D1D9E6',
  },
  photo: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  photoPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraIcon: {
    fontSize: 46,
    marginBottom: 12,
  },
  photoText: {
    color: '#64748B',
    fontSize: 15,
  },
  secondaryButton: {
    padding: 14,
    alignItems: 'center',
    marginTop: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#203A6F',
  },
  secondaryButtonText: {
    color: '#203A6F',
    fontWeight: '600',
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 26,
    marginBottom: 10,
  },
  locationCard: {
    backgroundColor: '#FFFFFF',
    padding: 18,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  coordinateText: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 5,
  },
  mutedText: {
    color: '#9CA3AF',
  },
  locationAction: {
    color: '#203A6F',
    fontWeight: '600',
    marginTop: 12,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    minHeight: 110,
    color: '#111827',
  },
  submitButton: {
    backgroundColor: '#203A6F',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 30,
  },
  disabledButton: {
    opacity: 0.6,
  },
  submitText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
