import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import LoginScreen from "./src/screens/LoginScreen";
import HomeScreen from "./src/screens/HomeScreen";
import AddressScreen from "./src/screens/AddressScreen";
import CameraScreen from "./src/screens/CameraScreen";

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Login"
        screenOptions={{
          headerStyle: {
            backgroundColor: "#203A6F",
          },
          headerTintColor: "#FFFFFF",
          headerTitleStyle: {
            fontWeight: "bold",
          },
          headerBackTitle: "Voltar",
          animation: "slide_from_right",
          contentStyle: {
            backgroundColor: "#FFFFFF",
          },
        }}
      >
        {/* LOGIN */}
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{
            headerShown: false,
          }}
        />

        {/* HOME */}
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{
            title: "Mapeamento Urbano",
            headerBackVisible: false,
            gestureEnabled: false,
          }}
        />

        {/* CADASTRO DE ENDEREÇO */}
        <Stack.Screen
          name="Address"
          component={AddressScreen}
          options={{
            title: "Cadastrar endereço",
          }}
        />

        {/* CÂMERA / ENVIO DE FOTOGRAFIA */}
        <Stack.Screen
          name="Camera"
          component={CameraScreen}
          options={{
            title: "Registrar ocorrência",
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
