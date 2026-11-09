import React from 'react';
import { Alert, Text, View } from 'react-native';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { Ionicons } from '@expo/vector-icons';

import EventScreen from '../screens/EventScreen';
import ProfileScreen from '../screens/ProfileScreen';
import EventListScreen from '../screens/EventListScreen';

import { useAuth } from '../contexts/AuthContext';

const Drawer = createDrawerNavigator();

export default function DrawerNavigator() {
  const { logout } = useAuth();

  const handleLogout = (navigationState) => {
    if (hasPendingChanges(navigationState)) {
        Alert.alert(
        'Alterações não salvas',
        'Salve as alterações do perfil antes de sair da sua conta.'
        );
        return;
    }
    Alert.alert(
      'Sair',
      'Deseja realmente sair da sua conta?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sair',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
            } catch (error) {
              Alert.alert('Erro', error.message);
            }
          },
        },
      ]
    );
  };
  
  const hasPendingChanges = (navigationState) => {
    const profileRoute = navigationState.routes.find(
        route => route.name === 'Profile'
    );

    return profileRoute?.params?.hasUnsavedChanges === true;
    };

    const handleProtectedNavigation = (routeName, props) => {
    if (hasPendingChanges(props.state)) {
        Alert.alert(
        'Alterações não salvas',
        'Você precisa salvar as alterações antes de sair desta tela.',
        [{ text: 'Continuar editando' }]
        );
        return;
    }

    props.navigation.navigate(routeName);
    };

  return (
    <Drawer.Navigator
      initialRouteName="Event"
      screenOptions={({ route }) => ({
        headerStyle: {
          backgroundColor: '#000E35',
        },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        drawerActiveTintColor: '#203A6F',
        drawerInactiveTintColor: '#334155',
        drawerActiveBackgroundColor: '#E8EDF7',
        drawerLabelStyle: {
          fontSize: 15,
          fontWeight: '500',
        },
        drawerStyle: {
          width: 290,
          backgroundColor: '#FFFFFF',
        },
        drawerIcon: ({ color, size }) => {
          const iconName =
            route.name === 'Event'
              ? 'camera-outline'
              : 'person-outline';

          return (
            <Ionicons
              name={iconName}
              size={size}
              color={color}
            />
          );
        },
      })}
      drawerContent={(props) => (
        <View style={{ flex: 1 }}>
          <View
            style={{
              backgroundColor: '#000E35',
              paddingHorizontal: 22,
              paddingTop: 65,
              paddingBottom: 28,
            }}
          >
            <Ionicons
              name="location-outline"
              size={38}
              color="#FFFFFF"
            />
            <Text
              style={{
                color: '#FFFFFF',
                fontSize: 20,
                fontWeight: 'bold',
                marginTop: 12,
              }}
            >
              Mapeamento Urbano
            </Text>
          </View>

          <View style={{ flex: 1 }}>
            {props.state.routes.map((route, index) => {
                const focused = props.state.index === index;

                const menuItems = {
                    Event: {
                    label: 'Cadastrar evento',
                    icon: 'camera-outline',
                    },
                    EventList: {
                    label: 'Meus eventos',
                    icon: 'images-outline',
                    },
                    Profile: {
                    label: 'Meu perfil',
                    icon: 'person-outline',
                    },
                };

                const item = menuItems[route.name];

                if (!item) return null;

                return (
                    <View key={route.key}>
                    <MenuItem
                        label={item.label}
                        icon={item.icon}
                        focused={focused}
                        onPress={() =>
                        handleProtectedNavigation(route.name, props)
                        }
                    />
                    </View>
                );
                })}
          </View>

          <View
            style={{
              borderTopWidth: 1,
              borderTopColor: '#E2E8F0',
              paddingBottom: 25,
            }}
          >
            <MenuItem
              label="Sair"
              icon="log-out-outline"
              color="#DC2626"
              onPress={() => handleLogout(props.state)}
            />
          </View>
        </View>
      )}
    >
      <Drawer.Screen
        name="Event"
        component={EventScreen}
        options={{
          title: 'Cadastrar evento',
        }}
      />

      <Drawer.Screen
        name="EventList"
        component={EventListScreen}
        options={{
            title: 'Meus eventos',
        }}
      />

      <Drawer.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: 'Meu perfil',
        }}
      />
    </Drawer.Navigator>
  );
}

function MenuItem({
  label,
  icon,
  focused,
  color,
  onPress,
}) {
  const itemColor =
    color || (focused ? '#203A6F' : '#334155');

  return (
    <View
      style={{
        marginHorizontal: 10,
        marginTop: 6,
        borderRadius: 10,
        backgroundColor: focused ? '#E8EDF7' : 'transparent',
        overflow: 'hidden',
      }}
    >
      <Text
        onPress={onPress}
        style={{
          paddingVertical: 16,
          paddingHorizontal: 18,
          color: itemColor,
          fontSize: 15,
          fontWeight: focused ? 'bold' : '500',
        }}
      >
        <Ionicons
          name={icon}
          size={20}
          color={itemColor}
        />
        {'   '}
        {label}
      </Text>
    </View>
  );
}
