import React, { useState, useEffect } from "react";
import { View, TextInput, Button, FlatList, Text, StyleSheet, Alert } from "react-native";
import { collection, addDoc, getDocs, query, where } from "firebase/firestore"; // Importar Firestore
import { db, auth } from "../firebaseConfig"; // Firestore e Auth configurados

const ColecaoScreen = () => {
  const [nomeColecao, setNomeColecao] = useState(""); // Estado para o nome da nova coleção
  const [colecoes, setColecoes] = useState([]); // Estado para armazenar as coleções do usuário

  const user = auth.currentUser; // Obtém o usuário atual logado

  // Função para buscar coleções do Firestore
  const fetchColecoes = async () => {
    try {
      const q = query(
        collection(db, "colecoes"),
        where("userId", "==", user.uid) // Filtrar pelas coleções do usuário autenticado
      );
      const querySnapshot = await getDocs(q);
      const colecoesList = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setColecoes(colecoesList); // Atualizar o estado com as coleções recuperadas
    } catch (error) {
      console.error("Erro ao buscar coleções:", error);
    }
  };

  // Chama a função para buscar coleções na primeira montagem do componente
  useEffect(() => {
    fetchColecoes();
  }, []);

  // Função para adicionar uma nova coleção ao Firestore
  const handleAddColecao = async () => {
    if (nomeColecao.trim() === "") {
      Alert.alert("Erro", "O nome da coleção não pode estar vazio.");
      return;
    }

    try {
      // Adiciona uma nova coleção ao Firestore
      const docRef = await addDoc(collection(db, "colecoes"), {
        userId: user.uid, // ID do usuário autenticado
        nome: nomeColecao,
        valorTotal: 0, // Valor inicial
      });
      
      // Atualiza o estado com a nova coleção
      const novaColecao = {
        id: docRef.id,
        nome: nomeColecao,
        valorTotal: 0,
      };
      setColecoes([...colecoes, novaColecao]); // Adiciona a nova coleção à lista existente

      setNomeColecao(""); // Limpa o campo de entrada após adicionar
      Alert.alert("Sucesso", "Coleção criada com sucesso!");
    } catch (error) {
      console.error("Erro ao criar coleção:", error);
      Alert.alert("Erro", "Não foi possível criar a coleção.");
    }
  };

  // Função para renderizar cada coleção na lista
  const renderColecao = ({ item }) => (
    <View style={styles.colecaoItem}>
      <Text style={styles.colecaoNome}>{item.nome}</Text>
      <Text style={styles.colecaoValor}>Valor total: R$ {item.valorTotal}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Minhas Coleções</Text>

      {/* Campo para adicionar nova coleção */}
      <TextInput
        style={styles.input}
        placeholder="Nome da coleção"
        value={nomeColecao}
        onChangeText={setNomeColecao}
      />
      <Button title="Criar Coleção" onPress={handleAddColecao} />

      {/* Exibe as coleções existentes */}
      <FlatList
        data={colecoes}
        renderItem={renderColecao}
        keyExtractor={(item) => item.id}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 24,
    marginBottom: 16,
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
  colecaoItem: {
    padding: 16,
    borderBottomColor: "#ccc",
    borderBottomWidth: 1,
  },
  colecaoNome: {
    fontSize: 18,
    fontWeight: "bold",
  },
  colecaoValor: {
    fontSize: 16,
    marginTop: 4,
  },
});

export default ColecaoScreen;
