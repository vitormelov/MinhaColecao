import React, { useState } from "react";
import { View, TextInput, Button, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebaseConfig"; // Importando a autenticação configurada no Firebase
import { useNavigation } from '@react-navigation/native';

const LoginScreen = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigation = useNavigation();

  const handleLogin = async () => {
    if (!email || !password) {
      setError("Preencha todos os campos");
      return;
    }

    try {
      await signInWithEmailAndPassword(auth, email, password);
      // Navega para a tela de coleções após o login bem-sucedido
      navigation.navigate('Colecao');
    } catch (err) {
      console.error("Erro ao fazer login:", err);
      setError("Usuário ou senha inválidos");
      Alert.alert("Erro", "Não foi possível fazer login. Verifique suas credenciais.");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Minha Coleção - Login</Text>
      
      {/* Campo de Email */}
      <TextInput
        style={styles.input}
        placeholder="Email"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
      />
      
      {/* Campo de Senha */}
      <TextInput
        style={styles.input}
        placeholder="Senha"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      
      {/* Exibe mensagem de erro, se houver */}
      {error ? <Text style={styles.error}>{error}</Text> : null}

      {/* Botão para Entrar */}
      <Button title="Entrar" onPress={handleLogin} />

      {/* Link para criação de cadastro */}
      <TouchableOpacity onPress={() => navigation.navigate('Cadastro')}>
        <Text style={styles.signupText}>Não tem uma conta? Crie uma agora</Text>
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
  signupText: {
    color: "#007BFF",
    marginTop: 20,
    textAlign: "center",
  },
});

export default LoginScreen;
