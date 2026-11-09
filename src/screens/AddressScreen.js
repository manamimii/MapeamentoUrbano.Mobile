
import React, { useState } from 'react';

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

import { addressService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

export default function AddressScreen({ navigation }) {
  const { completeFirstAccess } = useAuth();

  const [cep, setCep] = useState('');
  const [street, setStreet] = useState('');
  const [number, setNumber] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');

  const [loadingCep, setLoadingCep] = useState(false);
  const [saving, setSaving] = useState(false);

  const formatCep = (value) => {
    const digits = value.replace(/\D/g, '').slice(0, 8);

    if (digits.length > 5) {
      return digits.slice(0, 5) + '-' + digits.slice(5);
    }

    return digits;
  };

  const searchCep = async (value) => {
    const cleanCep = value.replace(/\D/g, '');

    if (cleanCep.length !== 8) return;

    setLoadingCep(true);
    Keyboard.dismiss();

    try {
      console.log('CEP REQUEST:', cleanCep);

      const response = await fetch(
        `https://viacep.com.br/ws/${cleanCep}/json/`
      );

      if (!response.ok) {
        throw new Error('Erro ao consultar CEP.');
      }

      const data = await response.json();

      if (data.erro) {
        Alert.alert(
          'CEP não encontrado',
          'Verifique o CEP informado.'
        );
        return;
      }

      setStreet(data.logradouro || '');
      setNeighborhood(data.bairro || '');
      setCity(data.localidade || '');
      setState(data.uf || '');

      console.log('CEP SUCCESS:', cleanCep);
    } catch (error) {
      console.log('CEP ERROR:', error.message);

      Alert.alert(
        'Erro',
        'Não foi possível consultar o CEP.'
      );
    } finally {
      setLoadingCep(false);
    }
  };

  const handleCepChange = (value) => {
    const formatted = formatCep(value);
    const digits = formatted.replace(/\D/g, '');

    setCep(formatted);

    setStreet('');
    setNeighborhood('');
    setCity('');
    setState('');

    if (digits.length === 8) {
      searchCep(digits);
    }
  };

  const handleSave = async () => {
    if (
      cep.replace(/\D/g, '').length !== 8 ||
      !street.trim() ||
      !number.trim() ||
      !neighborhood.trim() ||
      !city.trim() ||
      !state.trim()
    ) {
      Alert.alert(
        'Campos obrigatórios',
        'Preencha todos os campos obrigatórios.'
      );
      return;
    }

    if (saving || loadingCep) return;

    setSaving(true);

    try {
      const payload = {
        zipCode: cep.replace(/\D/g, ''),
        street: street.trim(),
        number: number.trim(),
        neighborhood: neighborhood.trim(),
        city: city.trim(),
        state: state.trim().toUpperCase(),
      };

      console.log('ADDRESS CREATE START');

      const result = await addressService.create(payload);

      console.log('ADDRESS CREATE SUCCESS:', result);

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
                console.log(
                  'COMPLETE FIRST ACCESS ERROR:',
                  error.message
                );

                Alert.alert(
                  'Erro',
                  'Endereço salvo, mas não foi possível atualizar a sessão.'
                );
              }
            },
          },
        ]
      );
    } catch (error) {
      console.log('ADDRESS CREATE ERROR:', error.message);

      Alert.alert(
        'Erro ao cadastrar endereço',
        error.message || 'Erro desconhecido.'
      );
    } finally {
      setSaving(false);
    }
  };

  const renderInput = (
    label,
    value,
    onChangeText,
    options = {}
  ) => (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>

      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={options.placeholder || label}
        keyboardType={options.keyboardType || 'default'}
        autoCapitalize="words"
        editable={!saving && !options.disabled}
      />
    </View>
  );

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
        Informe seu endereço residencial.
      </Text>

      <View style={styles.field}>
        <Text style={styles.label}>CEP</Text>

        <View style={styles.cepContainer}>
          <TextInput
            style={[styles.input, styles.cepInput]}
            value={cep}
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

      {renderInput('Rua', street, setStreet)}

      <View style={styles.row}>
        <View style={styles.half}>
          {renderInput('Número', number, setNumber)}
        </View>
      </View>

      {renderInput(
        'Bairro',
        neighborhood,
        setNeighborhood
      )}

      <View style={styles.row}>
        <View style={styles.city}>
          {renderInput('Cidade', city, setCity)}
        </View>

        <View style={styles.uf}>
          {renderInput('UF', state, setState)}
        </View>
      </View>

      <TouchableOpacity
        style={[
          styles.button,
          (saving || loadingCep) && styles.buttonDisabled,
        ]}
        onPress={handleSave}
        disabled={saving || loadingCep}
      >
        {saving ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.buttonText}>
            Salvar endereço
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
  button: {
    height: 52,
    backgroundColor: '#203A6F',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
