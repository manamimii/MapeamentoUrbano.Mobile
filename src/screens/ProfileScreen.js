import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
  Alert,
  BackHandler,
} from 'react-native';

import {
  useFocusEffect,
  usePreventRemove,
} from '@react-navigation/native';

import { Ionicons } from '@expo/vector-icons';
import { profileService } from '../services/profileService';

export default function ProfileScreen({ navigation }) {
  const [originalProfile, setOriginalProfile] = useState(null);
  const [userDTO, setUserDTO] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const savingRef = useRef(false);

  const normalizeProfile = (data) => ({
    ...data,
    id: data?.id ?? data?.Id ?? null,
    userName:
        data?.userName ??
        data?.UserName ??
        data?.nomeUsuario ??
        data?.NomeUsuario ??
        '',
    email:
        data?.email ??
        data?.Email ??
        data?.userEmail ??
        data?.UserEmail ??
        '',
    });


  const loadProfile = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await profileService.getUserProfile();
      const normalized = normalizeProfile(data);

      setOriginalProfile(normalized);
      setUserDTO(normalized);
    } catch (err) {
      setError(
        err.message || 'Não foi possível carregar o perfil.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (!originalProfile) {
        loadProfile();
      }
    }, [originalProfile, loadProfile])
  );

  const hasChanges =
    originalProfile !== null &&
    userDTO !== null &&
    (
      userDTO.userName !== originalProfile.userName ||
      userDTO.email !== originalProfile.email
    );

    useEffect(() => {
        navigation.setParams({
            hasUnsavedChanges: hasChanges || saving,
        });
        }, [navigation, hasChanges, saving]);

  const updateField = (field, value) => {
    setUserDTO(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  // Bloqueia navegação com alterações pendentes.
  usePreventRemove(hasChanges || saving, () => {
    if (savingRef.current) return;

    Alert.alert(
      'Alterações não salvas',
      'Você precisa salvar as alterações antes de sair desta tela.',
      [
        {
          text: 'Continuar editando',
          style: 'default',
        },
      ]
    );
  });

  // Bloqueia o botão físico Voltar no Android.
  useFocusEffect(
    useCallback(() => {
      const subscription = BackHandler.addEventListener(
        'hardwareBackPress',
        () => {
          if (hasChanges || saving) {
            Alert.alert(
              'Alterações não salvas',
              'Salve suas alterações antes de sair.'
            );
            return true;
          }

          return false;
        }
      );

      return () => subscription.remove();
    }, [hasChanges, saving])
  );

  const handleSave = async () => {
    if (savingRef.current || !hasChanges) return;

    if (!userDTO.userName.trim()) {
      Alert.alert(
        'Validação',
        'O nome de usuário é obrigatório.'
      );
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(userDTO.email.trim())) {
      Alert.alert(
        'Validação',
        'Informe um e-mail válido.'
      );
      return;
    }

    savingRef.current = true;
    setSaving(true);

    try {
      // Preserva os demais campos retornados pela API.
        const payload = {
            ...userDTO,
            id: userDTO.id,
            userName: userDTO.userName.trim(),
            email: userDTO.email.trim(),
            };

            if (!payload.id) {
            throw new Error('Id do usuário não encontrado.');
        }

      await profileService.updateUser(payload);

      setOriginalProfile(payload);
      setUserDTO(payload);

      Alert.alert(
        'Sucesso',
        'Perfil atualizado com sucesso!'
      );
    } catch (err) {
      Alert.alert(
        'Erro',
        err.message || 'Não foi possível atualizar o perfil.'
      );
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#203A6F" />
        <Text style={styles.subtitle}>
          Carregando perfil...
        </Text>
      </View>
    );
  }

  if (error && !userDTO) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error}</Text>

        <TouchableOpacity
          style={styles.button}
          onPress={loadProfile}
        >
          <Text style={styles.buttonText}>
            Tentar novamente
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.avatarContainer}>
        <View style={styles.avatar}>
          <Ionicons
            name="person"
            size={50}
            color="#FFFFFF"
          />
        </View>

        <Text style={styles.title}>Meu perfil</Text>

        <Text style={styles.subtitle}>
          Gerencie suas informações pessoais
        </Text>
      </View>

      {hasChanges && (
        <View style={styles.warning}>
          <Ionicons
            name="alert-circle-outline"
            size={20}
            color="#92400E"
          />

          <Text style={styles.warningText}>
            Você possui alterações não salvas.
          </Text>
        </View>
      )}

      <View style={styles.card}>
        <Text style={styles.label}>
          Nome de usuário
        </Text>

        <TextInput
          style={styles.input}
          value={userDTO?.userName ?? ''}
          onChangeText={value =>
            updateField('userName', value)
          }
          autoCapitalize="words"
          editable={!saving}
          placeholder="Nome de usuário"
        />

        <Text style={styles.label}>
          E-mail
        </Text>

        <TextInput
          style={styles.input}
          value={userDTO?.email ?? ''}
          onChangeText={value =>
            updateField('email', value)
          }
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          editable={!saving}
          placeholder="E-mail"
        />
      </View>

      <TouchableOpacity
        style={[
          styles.button,
          (!hasChanges || saving) && styles.disabledButton,
        ]}
        onPress={handleSave}
        disabled={!hasChanges || saving}
      >
        {saving ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <>
            <Ionicons
              name="save-outline"
              size={20}
              color="#FFFFFF"
            />

            <Text style={styles.buttonText}>
              Salvar alterações
            </Text>
          </>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.button,
          {
            backgroundColor: '#FFFFFF',
            borderWidth: 1,
            borderColor: '#203A6F',
          },
          (hasChanges || saving) && styles.disabledButton,
        ]}
        onPress={() => navigation.navigate('AddressEdit')}
        disabled={hasChanges || saving}
      >
        <Text
          style={[
            styles.buttonText,
            { color: '#203A6F' },
          ]}
        >
          Editar endereço
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FB',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F7FB',
    padding: 20,
  },
  avatarContainer: {
    alignItems: 'center',
    marginTop: 25,
    marginBottom: 30,
  },
  avatar: {
    width: 95,
    height: 95,
    borderRadius: 48,
    backgroundColor: '#203A6F',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 25,
    fontWeight: 'bold',
    color: '#000E35',
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 6,
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 8,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 14,
    marginBottom: 20,
    backgroundColor: '#FFFFFF',
    color: '#0F172A',
    fontSize: 15,
  },
  warning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    padding: 14,
    borderRadius: 10,
    marginBottom: 18,
    gap: 10,
  },
  warningText: {
    flex: 1,
    color: '#92400E',
    fontSize: 13,
  },
  button: {
    height: 52,
    backgroundColor: '#203A6F',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 10,
    marginTop: 24,
    paddingHorizontal: 16,
  },
  disabledButton: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  errorText: {
    color: '#DC2626',
    textAlign: 'center',
  },
});
