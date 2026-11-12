import React, { useState } from 'react';
import { Alert, View, Text, StyleSheet } from 'react-native';

import AuthLayout from '../components/AuthLayout';
import AppInput from '../components/AppInput';
import AppButton from '../components/AppButton';
import { authService } from '../services/authService';
import { theme } from '../styles/theme';

export default function RegisterScreen({ navigation }) {
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const updateField = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: null }));
  };

  
const handleRegister = async () => {
  const validation = {};

  if (!form.name.trim()) {
    validation.name = 'O Nome é obrigatório';
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
    validation.email = 'Insira um E-mail válido';
  }

  if (form.password.length < 8) {
    validation.password = 'A Senha deve ter no mínimo 8 caracteres';
  }

  if (form.password !== form.confirmPassword) {
    validation.confirmPassword = 'As Senhas não são iguais';
  }

  setErrors(validation);

  if (Object.keys(validation).length > 0) {
    console.log('Registration validation errors:', validation);
    return;
  }

  setLoading(true);

  try {
    console.log('Iniciando registro de usuário...');

    const response = await authService.register(
      form.name.trim(),
      form.email.trim(),
      form.password
    );

    console.log('Registration successful:', response);

    Alert.alert(
      'Conta Criada',
      'Você já pode logar.',
      [{
        text: 'Continuar',
        onPress: () => navigation.navigate('Login'),
      }]
    );

  } catch (error) {
    const message = error.message || 'Erro ao criar usuário';

    const normalized = message.toLowerCase();

    if (normalized.includes('email')) {
      setErrors(prev => ({
        ...prev,
        email: message,
      }));
    } else if (normalized.includes('password') ||
              normalized.includes('senha')) {
      setErrors(prev => ({
        ...prev,
        password: message,
      }));
    } else if (normalized.includes('name') ||
              normalized.includes('nome')) {
      setErrors(prev => ({
        ...prev,
        name: message,
      }));
    } else {
      setErrors(prev => ({
        ...prev,
        general: message,
      }));
    }

    console.log('REGISTRATION FAILED:', message);
  } finally {
    setLoading(false);
  }
};


  return (
    <AuthLayout
      title="Criar Conta"
      subtitle="Junte-se ao Event Reporter para começar a enviar relatórios"
    >
      <AppInput
        label="Nome Completo"
        placeholder="Seu Nome Completo"
        value={form.name}
        onChangeText={value => updateField('name', value)}
        autoCapitalize="words"
        autoComplete="name"
        error={errors.name}
      />

      <AppInput
        label="E-mail"
        placeholder="seu@exemplo.com"
        value={form.email}
        onChangeText={value => updateField('email', value)}
        keyboardType="email-address"
        autoComplete="email"
        error={errors.email}
      />

      <AppInput
        label="Senha"
        placeholder="Crie uma Senha"
        value={form.password}
        onChangeText={value => updateField('password', value)}
        secureTextEntry
        autoComplete="new-password"
        error={errors.password}
      />

      <AppInput
        label="Confirme sua Senha"
        placeholder="Repita sua Senha"
        value={form.confirmPassword}
        onChangeText={value =>
          updateField('confirmPassword', value)
        }
        secureTextEntry
        error={errors.confirmPassword}
      />

      <AppButton
        title="Criar Conta"
        onPress={handleRegister}
        loading={loading}
        style={{ marginTop: 10 }}
      />

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Já tem uma conta?
        </Text>

        <AppButton
          title="Logar"
          variant="outline"
          onPress={() => navigation.navigate('Login')}
          style={{ marginTop: 14 }}
        />
      </View>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  footer: { marginTop: 22 },
  footerText: {
    textAlign: 'center',
    color: theme.colors.muted,
  },
});
