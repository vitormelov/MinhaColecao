import React, { useState } from 'react';
import { View, TextInput, Alert, Image, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebaseConfig';
import { useNavigation } from '@react-navigation/native';

const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const navigation = useNavigation();

  // Função para lidar com o login
  const handleLogin = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, senha);
      Alert.alert('Sucesso', 'Login realizado com sucesso!');
      navigation.navigate('Colecao');
    } catch (error) {
      console.error('Erro ao fazer login:', error);
      Alert.alert('Erro', 'Não foi possível fazer login.');
    }
  };

  // Função para navegar para a tela de cadastro
  const handleNavigateToCadastro = () => {
    navigation.navigate('Cadastro');
  };

  return (
    <View style={styles.container}>
      {/* Adicionando a logo do app */}
      <Image source={require('../assets/logominhacolecao.png')} style={styles.logo} />

      {/* Campos de Email e Senha */}
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Senha"
        value={senha}
        onChangeText={setSenha}
        secureTextEntry
      />

      {/* Botão de Login personalizado */}
      <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
        <Text style={styles.loginButtonText}>Entrar</Text>
      </TouchableOpacity>

      {/* Botão para ir para a tela de cadastro */}
      <TouchableOpacity onPress={handleNavigateToCadastro}>
        <Text style={styles.registerText}>Criar uma nova conta</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-start', // Alinha os itens no topo
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
  },
  logo: {
    width: 250,
    height: 150,
    marginTop: 60,  // Aumenta o espaço entre o topo e a logo
    marginBottom: 40, // Espaço entre a logo e os inputs
  },
  input: {
    width: '90%',
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    marginBottom: 16,
    paddingHorizontal: 10,
    borderRadius: 5,
  },
  loginButton: {
    width: '90%',
    backgroundColor: '#4CAF50', // Cor do botão
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20, // Espaço acima do botão
    marginBottom: 16, // Espaço entre o botão e o botão de cadastro
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  registerText: {
    color: '#4CAF50', // Cor do texto de cadastro
    fontSize: 14,
    textDecorationLine: 'underline',
  },
});

export default LoginScreen;
