
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
    validation.name = 'Name is required';
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
    validation.email = 'Enter a valid email';
  }

  if (form.password.length < 8) {
    validation.password = 'Use at least 8 characters';
  }

  if (form.password !== form.confirmPassword) {
    validation.confirmPassword = 'Passwords do not match';
  }

  setErrors(validation);

  if (Object.keys(validation).length > 0) {
    console.log('Registration validation errors:', validation);
    return;
  }

  setLoading(true);

  try {
    console.log('Starting user registration...');

    const response = await authService.register(
      form.name.trim(),
      form.email.trim(),
      form.password
    );

    console.log('Registration successful:', response);

    Alert.alert(
      'Account created',
      'You can now sign in.',
      [{
        text: 'Continue',
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
      title="Create account"
      subtitle="Join Event Reporter to start submitting reports"
    >
      <AppInput
        label="Full name"
        placeholder="Your full name"
        value={form.name}
        onChangeText={value => updateField('name', value)}
        autoCapitalize="words"
        autoComplete="name"
        error={errors.name}
      />

      <AppInput
        label="Email address"
        placeholder="you@example.com"
        value={form.email}
        onChangeText={value => updateField('email', value)}
        keyboardType="email-address"
        autoComplete="email"
        error={errors.email}
      />

      <AppInput
        label="Password"
        placeholder="Create a password"
        value={form.password}
        onChangeText={value => updateField('password', value)}
        secureTextEntry
        autoComplete="new-password"
        error={errors.password}
      />

      <AppInput
        label="Confirm password"
        placeholder="Repeat your password"
        value={form.confirmPassword}
        onChangeText={value =>
          updateField('confirmPassword', value)
        }
        secureTextEntry
        error={errors.confirmPassword}
      />

      <AppButton
        title="Create Account"
        onPress={handleRegister}
        loading={loading}
        style={{ marginTop: 10 }}
      />

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Already have an account?
        </Text>

        <AppButton
          title="Sign In"
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
