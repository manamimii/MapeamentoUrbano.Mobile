import React from 'react';

import {
  View,
  ActivityIndicator,
} from 'react-native';

import {
  createNativeStackNavigator,
} from '@react-navigation/native-stack';

import { useAuth } from '../contexts/AuthContext';

import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import AddressScreen from '../screens/AddressScreen';
import DrawerNavigator from './DrawerNavigator';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const {
    isAuthenticated,
    firstAccess,
    initializing,
  } = useAuth();

  if (initializing) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <ActivityIndicator
          size="large"
          color="#203A6F"
        />
      </View>
    );
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#000E35',
        },
        headerTintColor: '#FFFFFF',
        animation: 'slide_from_right',
      }}
    >
      {!isAuthenticated ? (
        <Stack.Group navigationKey="guest">
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{
              headerShown: false,
            }}
          />

          <Stack.Screen
            name="Register"
            component={RegisterScreen}
            options={{
              title: 'Criar conta',
            }}
          />
        </Stack.Group>
      ) : firstAccess ? (
        <Stack.Group navigationKey="firstAccess">
          <Stack.Screen
            name="Address"
            component={AddressScreen}
            options={{
              title: 'Cadastrar endereço',
              headerBackVisible: false,
              gestureEnabled: false,
            }}
          />
        </Stack.Group>
      ) : (
        <Stack.Group navigationKey="authenticated">
          <Stack.Screen
            name="Main"
            component={DrawerNavigator}
            options={{
              headerShown: false,
              gestureEnabled: false,
            }}
          />
        </Stack.Group>
      )}
    </Stack.Navigator>
  );
}
