import React, {
  useEffect,
  useRef,
  useState,
} from 'react';

import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Keyboard,
} from 'react-native';

import {
  usePreventRemove,
} from '@react-navigation/native';

import { addressService } from '../services/addressService';
import { useAuth } from '../contexts/AuthContext';

const emptyAddress = {
  id: null,
  zipCode: '',
  street: '',
  number: '',
  neighborhood: '',
  city: '',
  state: '',
};

const normalizeAddress = (data) => ({
  id: data?.id ?? data?.Id ?? null,
  zipCode: String(data?.zipCode ?? '').replace(/\D/g, ''),
  street: data?.street ?? '',
  number: String(data?.number ?? ''),
  neighborhood: data?.neighborhood ?? '',
  city: data?.city ?? '',
  state: data?.state ?? '',
});

const formatCep = (value) => {
  const digits = value.replace(/\D/g, '').slice(0, 8);

  if (digits.length > 5) {
    return digits.slice(0, 5) + '-' + digits.slice(5);
  }

  return digits;
};

const hasAddressChanged = (original, current) => {
  if (!original || !current) return false;

  return [
    'zipCode',
    'street',
    'number',
    'neighborhood',
    'city',
    'state',
  ].some(field => original[field] !== current[field]);
};

export default function AddressScreen({ navigation, route }) {
  const { completeFirstAccess } = useAuth();

  const isEdit = route?.params?.mode === 'edit';

  const [address, setAddress] = useState(emptyAddress);
  const [original, setOriginal] = useState(null);

  const [loading, setLoading] = useState(isEdit);
  const [loadingCep, setLoadingCep] = useState(false);
  const [saving, setSaving] = useState(false);

  const cepRequestRef = useRef(0);
  const savingRef = useRef(false);

  const hasChanges =
    isEdit && hasAddressChanged(original, address);

  const isBusy = saving || loadingCep;

  useEffect(() => {
    if (!isEdit) return;

    let active = true;

    const loadAddress = async () => {
      setLoading(true);

      try {
        const data = await addressService.getProfileAddress();

        if (!active) return;

        const normalized = normalizeAddress(data);

        if (!normalized.id) {
          throw new Error('Id do endereço não encontrado.');
        }

        setAddress(normalized);
        setOriginal(normalized);
      } catch (error) {
        if (active) {
          Alert.alert(
            'Erro',
            error.message || 'Não foi possível carregar o endereço.'
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    loadAddress();

    return () => {
      active = false;
      cepRequestRef.current += 1;
    };
  }, [isEdit]);

  useEffect(() => {
    if (!isEdit) return;

    navigation.setParams({
      hasUnsavedChanges: hasChanges || isBusy,
    });
  }, [navigation, isEdit, hasChanges, isBusy]);

  usePreventRemove(
    isEdit && (hasChanges || isBusy),
    () => {
      Alert.alert(
        'Alterações não salvas',
        'Você precisa salvar as alterações antes de sair desta tela.',
        [{ text: 'Continuar editando' }]
      );
    }
  );

  const updateField = (field, value) => {
    setAddress(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const searchCep = async (value) => {
    const cleanCep = value.replace(/\D/g, '');

    if (cleanCep.length !== 8) return;

    const requestId = ++cepRequestRef.current;

    setLoadingCep(true);
    Keyboard.dismiss();

    try {
      const response = await fetch(
        `https://viacep.com.br/ws/${cleanCep}/json/`
      );

      if (!response.ok) {
        throw new Error('Erro ao consultar CEP.');
      }

      const data = await response.json();

      if (requestId !== cepRequestRef.current) return;

      if (data.erro) {
        Alert.alert(
          'CEP não encontrado',
          'Verifique o CEP informado.'
        );
        return;
      }

      setAddress(prev => ({
        ...prev,
        street: data.logradouro || '',
        neighborhood: data.bairro || '',
        city: data.localidade || '',
        state: data.uf || '',
      }));
    } catch (error) {
      if (requestId === cepRequestRef.current) {
        Alert.alert(
          'Erro',
          'Não foi possível consultar o CEP.'
        );
      }
    } finally {
      if (requestId === cepRequestRef.current) {
        setLoadingCep(false);
      }
    }
  };

  const handleCepChange = (value) => {
    const digits = value.replace(/\D/g, '').slice(0, 8);

    cepRequestRef.current += 1;
    setLoadingCep(false);

    setAddress(prev => ({
      ...prev,
      zipCode: digits,
      street: '',
      neighborhood: '',
      city: '',
      state: '',
    }));

    if (digits.length === 8) {
      searchCep(digits);
    }
  };

  const handleSave = async () => {
    if (savingRef.current || loadingCep || loading) return;

    if (
      address.zipCode.length !== 8 ||
      !address.street.trim() ||
      !address.number.trim() ||
      !address.neighborhood.trim() ||
      !address.city.trim() ||
      !address.state.trim()
    ) {
      Alert.alert(
        'Campos obrigatórios',
        'Preencha todos os campos obrigatórios.'
      );
      return;
    }

    if (isEdit && !address.id) {
      Alert.alert('Erro', 'Id do endereço não encontrado.');
      return;
    }

    savingRef.current = true;
    setSaving(true);

    try {
      const payload = {
        ...address,
        street: address.street.trim(),
        number: address.number.trim(),
        neighborhood: address.neighborhood.trim(),
        city: address.city.trim(),
        state: address.state.trim().toUpperCase(),
      };

      if (isEdit) {
        await addressService.update(payload);

        // Reconsulta os dados persistidos.
        const updated = await addressService.getProfileAddress();
        const normalized = normalizeAddress(updated);

        setAddress(normalized);
        setOriginal(normalized);

        Alert.alert(
          'Sucesso',
          'Endereço atualizado com sucesso!'
        );
      } else {
        await addressService.create(payload);

        Alert.alert(
          'Sucesso',
          'Endereço cadastrado com sucesso!',
          [
            {
              text: 'OK',
              onPress: async () => {
                try {
                  await completeFirstAccess();
                } catch (error) {
                  Alert.alert(
                    'Erro',
                    'Endereço salvo, mas não foi possível atualizar a sessão.'
                  );
                }
              },
            },
          ]
        );
      }
    } catch (error) {
      Alert.alert(
        'Erro ao salvar endereço',
        error.message || 'Erro desconhecido.'
      );
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };

  const renderInput = (
    label,
    field,
    options = {}
  ) => (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>

      <TextInput
        style={styles.input}
        value={address[field]}
        onChangeText={value => updateField(field, value)}
        placeholder={label}
        keyboardType={options.keyboardType || 'default'}
        autoCapitalize={options.autoCapitalize || 'words'}
        editable={!isBusy}
      />
    </View>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#203A6F" />
        <Text>Carregando endereço...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.title}>
        Meu endereço
      </Text>

      <Text style={styles.subtitle}>
        {isEdit
          ? 'Atualize seu endereço residencial.'
          : 'Informe seu endereço residencial.'}
      </Text>

      {hasChanges && (
        <View style={styles.warning}>
          <Text style={styles.warningText}>
            Você possui alterações não salvas.
          </Text>
        </View>
      )}

      <View style={styles.field}>
        <Text style={styles.label}>CEP</Text>

        <View style={styles.cepContainer}>
          <TextInput
            style={[styles.input, styles.cepInput]}
            value={formatCep(address.zipCode)}
            onChangeText={handleCepChange}
            placeholder="00000-000"
            keyboardType="numeric"
            maxLength={9}
            editable={!saving}
          />

          {loadingCep && (
            <ActivityIndicator color="#203A6F" />
          )}
        </View>
      </View>

      {renderInput('Rua', 'street')}

      <View style={styles.row}>
        <View style={styles.half}>
          {renderInput('Número', 'number')}
        </View>
      </View>

      {renderInput('Bairro', 'neighborhood')}

      <View style={styles.row}>
        <View style={styles.city}>
          {renderInput('Cidade', 'city')}
        </View>

        <View style={styles.uf}>
          {renderInput('UF', 'state', {
            autoCapitalize: 'characters',
          })}
        </View>
      </View>

      <TouchableOpacity
        style={[
          styles.button,
          (
            saving ||
            loadingCep ||
            (isEdit && !hasChanges)
          ) && styles.buttonDisabled,
        ]}
        onPress={handleSave}
        disabled={
          saving ||
          loadingCep ||
          (isEdit && !hasChanges)
        }
      >
        {saving ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.buttonText}>
            {isEdit
              ? 'Salvar alterações'
              : 'Salvar endereço'}
          </Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    padding: 24,
    paddingBottom: 50,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#203A6F',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 28,
  },
  field: {
    marginBottom: 16,
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
    backgroundColor: '#FFFFFF',
    color: '#0F172A',
    fontSize: 15,
  },
  cepContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cepInput: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  half: {
    flex: 1,
  },
  city: {
    flex: 3,
  },
  uf: {
    flex: 1,
  },
  warning: {
    backgroundColor: '#FEF3C7',
    padding: 14,
    borderRadius: 10,
    marginBottom: 20,
  },
  warningText: {
    color: '#92400E',
    fontSize: 13,
  },
  button: {
    height: 52,
    backgroundColor: '#203A6F',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
