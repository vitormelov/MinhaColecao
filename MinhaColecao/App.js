// App.js
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import LoginScreen from './Screens/LoginScreen';
import CadastroScreen from './Screens/CadastroScreen';
import ColecaoScreen from './Screens/ColecaoScreen'; // Tela de Coleções

const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login">
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Cadastro" component={CadastroScreen} />
        <Stack.Screen name="Colecao" component={ColecaoScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
