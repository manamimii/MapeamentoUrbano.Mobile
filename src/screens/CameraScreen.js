import React, { useState } from 'react';
import { ActivityIndicator, Alert, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { apiRequest, ROUTES } from '../services/api';

export default function CameraScreen({ onLogout }) {
  const [photo, setPhoto] = useState(null);
  const [coords, setCoords] = useState(null);
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  async function takePhoto() {
    try {
      const camera = await ImagePicker.requestCameraPermissionsAsync();
      if (!camera.granted) return Alert.alert('Permissão', 'Permita o acesso à câmera.');
      const locPermission = await Location.requestForegroundPermissionsAsync();
      if (!locPermission.granted) return Alert.alert('Permissão', 'A localização é necessária para registrar a foto.');
      const result = await ImagePicker.launchCameraAsync({ quality: 0.7, base64: true, mediaTypes: ['images'] });
      if (result.canceled) return;
      const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      setPhoto(result.assets[0]);
      setCoords(location.coords);
    } catch (e) { Alert.alert('Erro', e.message); }
  }
  async function send() {
    if (!photo?.base64 || !coords) return Alert.alert('Atenção', 'Tire uma foto com localização.');
    if (!description.trim()) return Alert.alert('Atenção', 'Informe a descrição.');
    setLoading(true);
    try {
      // ASP.NET Core byte[] accepts a base64 JSON string.
      await apiRequest(ROUTES.createEvent, { method: 'POST', body: { photo: photo.base64, latitude: coords.latitude, longitude: coords.longitude, description: description.trim() } });
      Alert.alert('Sucesso', 'Foto enviada com sucesso.');
      setPhoto(null); setCoords(null); setDescription('');
    } catch (e) { Alert.alert('Erro ao enviar', e.message); }
    finally { setLoading(false); }
  }
  return <ScrollView contentContainerStyle={s.container}>
    <Text style={s.title}>Registrar ocorrência</Text>
    <TouchableOpacity style={s.button} onPress={takePhoto}><Text style={s.buttonText}>Tirar foto</Text></TouchableOpacity>
    {photo && <Image source={{ uri: photo.uri }} style={s.image} />}
    {coords && <Text style={s.coordinates}>Latitude: {coords.latitude.toFixed(6)} | Longitude: {coords.longitude.toFixed(6)}</Text>}
    <TextInput style={s.input} multiline placeholder="Descreva a ocorrência" value={description} onChangeText={setDescription} />
    <TouchableOpacity style={s.button} onPress={send} disabled={loading}>{loading ? <ActivityIndicator color="white" /> : <Text style={s.buttonText}>Enviar foto</Text>}</TouchableOpacity>
    <TouchableOpacity onPress={onLogout} style={{ padding: 18, alignItems: 'center' }}><Text>Sair da conta</Text></TouchableOpacity>
  </ScrollView>;
}
const s = StyleSheet.create({ container: { padding: 24, backgroundColor: '#fff', flexGrow: 1 }, title: { fontSize: 24, fontWeight: 'bold', color: '#203A6F', marginBottom: 20 }, button: { backgroundColor: '#203A6F', padding: 16, borderRadius: 10, alignItems: 'center', marginVertical: 10 }, buttonText: { color: 'white', fontWeight: 'bold' }, image: { width: '100%', height: 260, borderRadius: 12, marginVertical: 12 }, coordinates: { color: '#475569' }, input: { minHeight: 100, borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 10, padding: 12, textAlignVertical: 'top', marginTop: 12 } });
