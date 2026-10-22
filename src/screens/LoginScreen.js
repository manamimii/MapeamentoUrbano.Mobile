import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';

import AuthLayout from '../components/AuthLayout';
import AppInput from '../components/AppInput';
import AppButton from '../components/AppButton';
import { useAuth } from '../contexts/AuthContext';
import { theme } from '../styles/theme';

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const [errors, setErrors] = useState({
    email: '',
    password: '',
    general: '',
  });

  const handleEmailChange = (value) => {
    setEmail(value);

    setErrors(prev => ({
      ...prev,
      email: '',
      general: '',
    }));
  };

  const handlePasswordChange = (value) => {
    setPassword(value);

    setErrors(prev => ({
      ...prev,
      password: '',
      general: '',
    }));
  };

  const handleLogin = async () => {
    const validation = {
      email: '',
      password: '',
      general: '',
    };

    if (!email.trim()) {
      validation.email = 'Email is required';
    } else if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
    ) {
      validation.email = 'Enter a valid email address';
    }

    if (!password) {
      validation.password = 'Password is required';
    }

    setErrors(validation);

    if (validation.email || validation.password) {
      return;
    }

    setLoading(true);

    try {
      await login(email.trim(), password);

    } catch (error) {
      const message =
        error.message || 'An unexpected error occurred.';

      const normalized = message.toLowerCase();

      const newErrors = {
        email: '',
        password: '',
        general: '',
      };

      if (
        normalized.includes('usuário não encontrado') ||
        normalized.includes('usuario nao encontrado') ||
        normalized.includes('user not found') ||
        normalized.includes('email not found')
      ) {
        newErrors.email = 'Usuário não encontrado';

      } else if (
        normalized.includes('senha incorreta') ||
        normalized.includes('senha inválida') ||
        normalized.includes('invalid password') ||
        normalized.includes('incorrect password')
      ) {
        newErrors.password = 'Senha incorreta';

      } else if (
        normalized.includes('credenciais inválidas') ||
        normalized.includes('invalid credentials')
      ) {
        newErrors.general = 'Email ou senha incorretos';

      } else {
        newErrors.general = message;
      }

      setErrors(newErrors);

      // Use console.log to avoid Expo's error overlay.
      console.log('LOGIN FAILED:', message);

    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to continue reporting events"
    >
      <AppInput
        label="Email address"
        placeholder="you@example.com"
        value={email}
        onChangeText={handleEmailChange}
        keyboardType="email-address"
        autoComplete="email"
        error={errors.email}
      />

      <AppInput
        label="Password"
        placeholder="Enter your password"
        value={password}
        onChangeText={handlePasswordChange}
        secureTextEntry
        autoComplete="current-password"
        error={errors.password}
      />

      {errors.general ? (
        <Text style={{
          color: '#DC2626',
          fontSize: 13,
          marginBottom: 12,
        }}>
          {errors.general}
        </Text>
      ) : null}

      <AppButton
        title="Sign In"
        onPress={handleLogin}
        loading={loading}
        style={{ marginTop: 12 }}
      />

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Don't have an account?
        </Text>

        <TouchableOpacity
          onPress={() => navigation.navigate('Register')}
        >
          <Text style={styles.link}>
            Create Account
          </Text>
        </TouchableOpacity>
      </View>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  errorContainer: {
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
  },
  generalError: {
    color: theme.colors.error,
    fontSize: 13,
    textAlign: 'center',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 28,
    gap: 6,
    flexWrap: 'wrap',
  },
  footerText: {
    color: theme.colors.muted,
  },
  link: {
    color: theme.colors.primary,
    fontWeight: '700',
  },
});
