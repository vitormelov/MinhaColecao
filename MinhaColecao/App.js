// App.js
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import LoginScreen from './Screens/LoginScreen';
import CadastroScreen from './Screens/CadastroScreen';
import ColecaoScreen from './Screens/ColecaoScreen';
import GrupoScreen from './Screens/GrupoScreen';
import ItemScreen from './Screens/ItemScreen'; // Nova tela para Itens

const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login">
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Cadastro" component={CadastroScreen} />
        <Stack.Screen name="Colecao" component={ColecaoScreen} />
        <Stack.Screen name="Grupo" component={GrupoScreen} /> 
        <Stack.Screen name="Item" component={ItemScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
