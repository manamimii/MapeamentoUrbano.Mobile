
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
} from 'react-native';
import { theme } from '../styles/theme';

export default function AppInput({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry = false,
  error,
  multiline = false,
  ...props
}) {
  const [visible, setVisible] = useState(false);

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}

      <View style={[
        styles.inputContainer,
        error && styles.inputError,
      ]}>
        <TextInput
          style={[
            styles.input,
            multiline && styles.multiline,
          ]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#9CA3AF"
          secureTextEntry={secureTextEntry && !visible}
          multiline={multiline}
          textAlignVertical={multiline ? 'top' : 'center'}
          autoCapitalize="none"
          {...props}
        />

        {secureTextEntry && (
          <Pressable
            onPress={() => setVisible(!visible)}
            style={styles.toggle}
          >
            <Text style={styles.toggleText}>
              {visible ? 'Hide' : 'Show'}
            </Text>
          </Pressable>
        )}
      </View>

      {error ? (
        <View style={styles.errorRow}>
          <Text style={styles.errorIcon}>!</Text>
          <Text style={styles.error}>{error}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 18,
  },
  label: {
    color: theme.colors.text,
    fontWeight: '600',
    fontSize: 14,
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius,
  },
  inputError: {
    borderColor: theme.colors.error,
  },
  input: {
    flex: 1,
    minHeight: 52,
    paddingHorizontal: 15,
    color: theme.colors.text,
    fontSize: 15,
  },
  multiline: {
    minHeight: 110,
    paddingTop: 14,
  },
  toggle: {
    paddingHorizontal: 14,
  },
  toggleText: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
  error: {
    color: theme.colors.error,
    marginTop: 5,
    fontSize: 12,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 6,
  },
  errorIcon: {
    color: '#DC2626',
    fontSize: 13,
    fontWeight: 'bold',
  },
  error: {
    color: '#DC2626',
    fontSize: 12,
    flexShrink: 1,
  },
});
