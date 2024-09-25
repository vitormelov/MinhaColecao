import React, { useState, useEffect } from "react";
import { View, TextInput, Button, FlatList, Text, StyleSheet, Alert, TouchableOpacity } from "react-native";
import { collection, addDoc, getDocs, query, where, doc, deleteDoc } from "firebase/firestore"; // Importações do Firestore
import { db, auth } from "../firebaseConfig"; // Firestore e Auth configurados
import { useNavigation } from '@react-navigation/native'; // Para navegação
import { Swipeable } from "react-native-gesture-handler"; // Swipeable para capturar os gestos

const ColecaoScreen = () => {
  const [nomeColecao, setNomeColecao] = useState(""); // Nome da nova coleção
  const [colecoes, setColecoes] = useState([]); // Lista de coleções

  const user = auth.currentUser; // Usuário logado
  const navigation = useNavigation(); // Para navegação

  // Buscar as coleções do Firestore
  const fetchColecoes = async () => {
    try {
      const q = query(
        collection(db, "colecoes"),
        where("userId", "==", user.uid)
      );
      const querySnapshot = await getDocs(q);
      const colecoesList = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setColecoes(colecoesList);
    } catch (error) {
      console.error("Erro ao buscar coleções:", error);
    }
  };

  useEffect(() => {
    fetchColecoes();
  }, []);

  // Adicionar nova coleção ao Firestore
  const handleAddColecao = async () => {
    if (nomeColecao.trim() === "") {
      Alert.alert("Erro", "O nome da coleção não pode estar vazio.");
      return;
    }

    try {
      const docRef = await addDoc(collection(db, "colecoes"), {
        userId: user.uid,
        nome: nomeColecao,
        valorTotal: 0,
      });

      const novaColecao = {
        id: docRef.id,
        nome: nomeColecao,
        valorTotal: 0,
      };
      setColecoes([...colecoes, novaColecao]);
      setNomeColecao("");
      Alert.alert("Sucesso", "Coleção criada com sucesso!");
    } catch (error) {
      console.error("Erro ao criar coleção:", error);
      Alert.alert("Erro", "Não foi possível criar a coleção.");
    }
  };

  // Deletar uma coleção
  const handleDeleteColecao = async (id) => {
    try {
      await deleteDoc(doc(db, "colecoes", id));
      setColecoes(colecoes.filter((colecao) => colecao.id !== id));
      Alert.alert("Sucesso", "Coleção deletada com sucesso.");
    } catch (error) {
      console.error("Erro ao deletar coleção:", error);
      Alert.alert("Erro", "Não foi possível deletar a coleção.");
    }
  };

  // Função para editar a coleção
  const handleEditColecao = (id) => {
    // Aqui você pode implementar a navegação para uma tela de edição ou abrir um modal
    Alert.alert("Editar", "Funcionalidade de edição ainda não implementada.");
  };

  // Função para renderizar a coleção com swipe
  const renderColecao = ({ item }) => {
    const swipeRightActions = () => {
      return (
        <View style={styles.deleteAction}>
          <Text style={styles.actionText}>Deletar</Text>
        </View>
      );
    };

    const swipeLeftActions = () => {
      return (
        <View style={styles.editAction}>
          <Text style={styles.actionText}>Editar</Text>
        </View>
      );
    };

    return (
      <Swipeable
        renderRightActions={swipeRightActions} // Ação de deletar
        onSwipeableRightOpen={() => handleDeleteColecao(item.id)}
        renderLeftActions={swipeLeftActions} // Ação de editar
        onSwipeableLeftOpen={() => handleEditColecao(item.id)}
      >
        <TouchableOpacity
          onPress={() => navigation.navigate('Grupo', { colecaoId: item.id, nome: item.nome })}
          style={styles.colecaoItem}
        >
          <Text style={styles.colecaoNome}>{item.nome}</Text>
          <Text style={styles.colecaoValor}>Valor total: R$ {item.valorTotal}</Text>
        </TouchableOpacity>
      </Swipeable>
    );
  };

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

      {/* Lista de coleções */}
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
  deleteAction: {
    backgroundColor: "red",
    justifyContent: "center",
    alignItems: "flex-end",
    padding: 20,
  },
  editAction: {
    backgroundColor: "blue",
    justifyContent: "center",
    padding: 20,
  },
  actionText: {
    color: "#fff",
    fontWeight: "bold",
  },
});

export default ColecaoScreen;
