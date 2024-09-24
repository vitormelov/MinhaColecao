// Screens/CadastroScreen.js
import React, { useState } from "react";
import { View, TextInput, Button, Text, StyleSheet, TouchableOpacity } from "react-native";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebaseConfig"; // Certifique-se de que o arquivo firebaseConfig.js está configurado
import { useNavigation } from '@react-navigation/native';

const CadastroScreen = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const navigation = useNavigation();

  const handleSignup = async () => {
    if (password !== confirmPassword) {
      setError("As senhas não coincidem");
      return;
    }
    
    try {
      // Criar usuário com email e senha no Firebase Authentication
      await createUserWithEmailAndPassword(auth, email, password);
      // Navegar para a tela de login ou Home após cadastro bem-sucedido
      navigation.navigate('Login');
    } catch (err) {
      setError("Erro ao criar conta. Tente novamente.");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Criar Conta</Text>
      
      {/* Campo para Nome */}
      <TextInput
        style={styles.input}
        placeholder="Nome"
        value={name}
        onChangeText={setName}
      />

      {/* Campo para Email */}
      <TextInput
        style={styles.input}
        placeholder="Email"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
      />
      
      {/* Campo para Senha */}
      <TextInput
        style={styles.input}
        placeholder="Senha"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      
      {/* Campo para Repetir Senha */}
      <TextInput
        style={styles.input}
        placeholder="Repita a Senha"
        secureTextEntry
        value={confirmPassword}
        onChangeText={setConfirmPassword}
      />

      {/* Exibir erro, se houver */}
      {error ? <Text style={styles.error}>{error}</Text> : null}

      {/* Botão de Criar Conta */}
      <Button title="Cadastrar" onPress={handleSignup} />

      {/* Link para voltar à tela de Login */}
      <TouchableOpacity onPress={() => navigation.navigate('Login')}>
        <Text style={styles.loginText}>Já tem uma conta? Faça login</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 16,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 28,
    marginBottom: 20,
    textAlign: "center",
  },
  input: {
    height: 40,
    borderColor: "#ccc",
    borderWidth: 1,
    marginBottom: 12,
    paddingHorizontal: 8,
    borderRadius: 5,
  },
  error: {
    color: "red",
    textAlign: "center",
    marginVertical: 8,
  },
  loginText: {
    color: "#007BFF",
    marginTop: 20,
    textAlign: "center",
  },
});

export default CadastroScreen;
