import React, { useState, useEffect } from "react";
import { View, TextInput, Button, FlatList, Text, StyleSheet, Alert, TouchableOpacity } from "react-native";
import { collection, addDoc, getDocs, query, where, doc, deleteDoc } from "firebase/firestore"; // Firestore
import { db, auth } from "../firebaseConfig"; // Firebase Config
import { useNavigation } from '@react-navigation/native'; // Navegação
import { Swipeable } from "react-native-gesture-handler"; // Swipeable para o gesto de swipe

const GrupoScreen = () => {
  const [nomeGrupo, setNomeGrupo] = useState(""); // Nome do grupo
  const [grupos, setGrupos] = useState([]); // Lista de grupos
  const [colecaoId] = useState("Hqs_e_mangas"); // Definindo a coleção "Hqs e Mangás" como exemplo
  const user = auth.currentUser; // Usuário logado
  const navigation = useNavigation(); // Para navegação

  // Função para buscar grupos da coleção no Firestore
  const fetchGrupos = async () => {
    try {
      const q = query(
        collection(db, "colecoes", colecaoId, "grupos"), // Referência para os grupos dentro da coleção
        where("userId", "==", user.uid)
      );
      const querySnapshot = await getDocs(q);
      const gruposList = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setGrupos(gruposList);
    } catch (error) {
      console.error("Erro ao buscar grupos:", error);
    }
  };

  useEffect(() => {
    fetchGrupos();
  }, []);

  // Função para adicionar um novo grupo no Firestore
  const handleAddGrupo = async () => {
    if (nomeGrupo.trim() === "") {
      Alert.alert("Erro", "O nome do grupo não pode estar vazio.");
      return;
    }

    try {
      const docRef = await addDoc(collection(db, "colecoes", colecaoId, "grupos"), {
        userId: user.uid,
        nome: nomeGrupo,
        valorTotal: 0, // Inicialmente, o valor total do grupo será 0
      });

      const novoGrupo = {
        id: docRef.id,
        nome: nomeGrupo,
        valorTotal: 0,
      };
      setGrupos([...grupos, novoGrupo]);
      setNomeGrupo("");
      Alert.alert("Sucesso", "Grupo criado com sucesso!");
    } catch (error) {
      console.error("Erro ao criar grupo:", error);
      Alert.alert("Erro", "Não foi possível criar o grupo.");
    }
  };

  // Função para deletar um grupo
  const handleDeleteGrupo = async (id) => {
    try {
      await deleteDoc(doc(db, "colecoes", colecaoId, "grupos", id));
      setGrupos(grupos.filter((grupo) => grupo.id !== id));
      Alert.alert("Sucesso", "Grupo deletado com sucesso.");
    } catch (error) {
      console.error("Erro ao deletar grupo:", error);
      Alert.alert("Erro", "Não foi possível deletar o grupo.");
    }
  };

  // Função para renderizar cada grupo
  const renderGrupo = ({ item }) => {
    return (
      <Swipeable
        onSwipeableRightOpen={() => handleDeleteGrupo(item.id)}
      >
        <TouchableOpacity
          onPress={() => navigation.navigate('Item', { grupoId: item.id, colecaoId, nome: item.nome })} // Navegar para o ItemScreen com colecaoId e grupoId
          style={styles.grupoItem}
        >
          <Text style={styles.grupoNome}>{item.nome}</Text>
          <Text style={styles.grupoValor}>Valor total: R$ {item.valorTotal}</Text>
        </TouchableOpacity>
      </Swipeable>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Meus Grupos</Text>

      <TextInput
        style={styles.input}
        placeholder="Nome do grupo"
        value={nomeGrupo}
        onChangeText={setNomeGrupo}
      />
      <Button title="Criar Grupo" onPress={handleAddGrupo} />

      <FlatList
        data={grupos}
        renderItem={renderGrupo}
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
  grupoItem: {
    padding: 16,
    borderBottomColor: "#ccc",
    borderBottomWidth: 1,
  },
  grupoNome: {
    fontSize: 18,
    fontWeight: "bold",
  },
  grupoValor: {
    fontSize: 16,
    marginTop: 4,
  },
});

export default GrupoScreen;
