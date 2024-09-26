import React, { useState, useEffect } from "react";
import { View, TextInput, Button, FlatList, Text, StyleSheet, Alert, TouchableOpacity } from "react-native";
import { collection, addDoc, getDocs, query, where, doc, deleteDoc, updateDoc, orderBy, getDoc } from "firebase/firestore"; // Firestore
import { db, auth } from "../firebaseConfig"; // Firebase Config
import { useNavigation, useRoute } from '@react-navigation/native'; // Navegação
import { Swipeable } from "react-native-gesture-handler"; // Swipeable para capturar gestos de swipe

// Função auxiliar para formatar números com duas casas decimais e separador de vírgula
const formatValor = (valor) => {
  return parseFloat(valor).toFixed(2).replace('.', ',');
};

// Função auxiliar para converter valor de string com vírgula para número
const parseValor = (valor) => {
  return parseFloat(valor.replace(',', '.'));
};

const ItemScreen = () => {
  const [nomeItem, setNomeItem] = useState(""); // Nome do item
  const [detalhes, setDetalhes] = useState(""); // Detalhes do item
  const [dataAquisicao, setDataAquisicao] = useState(""); // Data de aquisição
  const [valor, setValor] = useState(""); // Valor do item
  const [itens, setItens] = useState([]); // Lista de itens
  const [valorTotalGrupo, setValorTotalGrupo] = useState(0); // Valor total do grupo

  const route = useRoute(); // Usado para acessar os parâmetros passados na navegação
  const { grupoId, colecaoId, nome } = route.params; // ID do grupo, ID da coleção e nome do grupo
  const user = auth.currentUser; // Usuário logado
  const navigation = useNavigation(); // Para navegação

  // Função para buscar os itens do grupo no Firestore
  const fetchItens = async () => {
    try {
      const q = query(
        collection(db, "colecoes", colecaoId, "grupos", grupoId, "itens"), // Caminho correto para acessar os itens dentro do grupo
        where("userId", "==", user.uid),
        orderBy("dataCriacao", "desc")
      );
      const querySnapshot = await getDocs(q);
      const itensList = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setItens(itensList);

      // Calcula o valor total do grupo somando os valores dos itens
      const total = itensList.reduce((acc, item) => acc + parseValor(item.valor), 0);
      setValorTotalGrupo(formatValor(total)); // Formata o valor total com duas casas decimais e separador de vírgula

      // Atualiza o valor total do grupo no Firestore
      const grupoDoc = doc(db, "colecoes", colecaoId, "grupos", grupoId);
      const grupoSnap = await getDoc(grupoDoc);
      if (grupoSnap.exists()) {
        await updateDoc(grupoDoc, { valorTotal: total.toFixed(2) });
      } else {
        console.error("Documento do grupo não encontrado.");
      }
    } catch (error) {
      console.error("Erro ao buscar itens:", error);
    }
  };

  useEffect(() => {
    fetchItens();
  }, []);

  // Função para adicionar um novo item ao Firestore
  const handleAddItem = async () => {
    if (nomeItem.trim() === "" || valor.trim() === "") {
      Alert.alert("Erro", "O nome e o valor do item são obrigatórios.");
      return;
    }

    // Verificar se o valor é um número válido
    const valorNumerico = parseValor(valor);
    if (isNaN(valorNumerico) || valorNumerico <= 0) {
      Alert.alert("Erro", "O valor do item deve ser um número válido maior que 0.");
      return;
    }

    try {
      const dataAquisicaoFormatada = dataAquisicao.trim() === "" ? "Indefinido" : dataAquisicao;
      const dataCriacao = new Date().toLocaleString(); // Data e hora de criação

      const docRef = await addDoc(collection(db, "colecoes", colecaoId, "grupos", grupoId, "itens"), {
        userId: user.uid,
        nome: nomeItem,
        detalhes: detalhes || "Sem detalhes", // Use um valor padrão se os detalhes não forem fornecidos
        dataAquisicao: dataAquisicaoFormatada,
        valor: valorNumerico.toFixed(2), // Certificar que o valor seja numérico e formatado com duas casas decimais
        dataCriacao,
      });

      const novoItem = {
        id: docRef.id,
        nome: nomeItem,
        detalhes: detalhes || "Sem detalhes",
        dataAquisicao: dataAquisicaoFormatada,
        valor: formatValor(valorNumerico), // Formata o valor com vírgula
        dataCriacao,
      };

      // Atualizar o estado com o novo item
      setItens([novoItem, ...itens]); // Adiciona o novo item à lista

      // Limpar os campos de entrada
      setNomeItem("");
      setDetalhes("");
      setDataAquisicao("");
      setValor("");
      
      Alert.alert("Sucesso", "Item criado com sucesso!");

      // Atualizar o valor total do grupo
      const novoValorTotal = formatValor(parseValor(valorTotalGrupo) + valorNumerico);
      setValorTotalGrupo(novoValorTotal);

      // Atualizar o Firestore com o novo valor total do grupo
      const grupoDoc = doc(db, "colecoes", colecaoId, "grupos", grupoId);
      await updateDoc(grupoDoc, { valorTotal: novoValorTotal.replace(',', '.') });
    } catch (error) {
      console.error("Erro ao criar item:", error);
      Alert.alert("Erro", "Não foi possível criar o item.");
    }
  };

  // Função para deletar um item
  const handleDeleteItem = async (id, valorItem) => {
    try {
      await deleteDoc(doc(db, "colecoes", colecaoId, "grupos", grupoId, "itens", id)); // Caminho correto para deletar o item dentro do grupo
      setItens(itens.filter((item) => item.id !== id));
      Alert.alert("Sucesso", "Item deletado com sucesso.");

      // Atualizar o valor total do grupo
      const novoValorTotal = formatValor(parseValor(valorTotalGrupo) - parseValor(valorItem));
      setValorTotalGrupo(novoValorTotal);
      await updateDoc(doc(db, "colecoes", colecaoId, "grupos", grupoId), { valorTotal: novoValorTotal.replace(',', '.') });
    } catch (error) {
      console.error("Erro ao deletar item:", error);
      Alert.alert("Erro", "Não foi possível deletar o item.");
    }
  };

  // Função para editar o item (exibe alerta por enquanto)
  const handleEditItem = (id) => {
    Alert.alert("Editar", "Funcionalidade de edição ainda não implementada.");
  };

  // Função para renderizar os itens com swipe
  const renderItem = ({ item }) => {
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
        onSwipeableRightOpen={() => handleDeleteItem(item.id, item.valor)}
        renderLeftActions={swipeLeftActions} // Ação de editar
        onSwipeableLeftOpen={() => handleEditItem(item.id)}
      >
        <TouchableOpacity style={styles.item}>
          <Text style={styles.itemNome}>{item.nome}</Text>
          <Text style={styles.itemDetalhes}>Detalhes: {item.detalhes}</Text>
          <Text style={styles.itemData}>Data de aquisição: {item.dataAquisicao}</Text>
          <Text style={styles.itemValor}>Valor: R$ {item.valor}</Text> 
          <Text style={styles.itemDataCriacao}>Criado em: {item.dataCriacao}</Text>
        </TouchableOpacity>
      </Swipeable>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Itens do Grupo: {nome}</Text>
      <Text style={styles.valorTotal}>Valor total do grupo: R$ {valorTotalGrupo}</Text> 

      {/* Campo para adicionar novo item */}
      <TextInput
        style={styles.input}
        placeholder="Nome do item"
        value={nomeItem}
        onChangeText={setNomeItem}
      />
      <TextInput
        style={styles.input}
        placeholder="Detalhes (opcional)"
        value={detalhes}
        onChangeText={setDetalhes}
      />
      <TextInput
        style={styles.input}
        placeholder="Data de aquisição (opcional)"
        value={dataAquisicao}
        onChangeText={setDataAquisicao}
      />
      <TextInput
        style={styles.input}
        placeholder="Valor (obrigatório)"
        value={valor}
        onChangeText={setValor}
        keyboardType="numeric"
      />
      <Button title="Criar Item" onPress={handleAddItem} />

      {/* Lista de itens */}
      <FlatList
        data={itens}
        renderItem={renderItem}
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
  valorTotal: {
    fontSize: 18,
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
  item: {
    padding: 16,
    borderBottomColor: "#ccc",
    borderBottomWidth: 1,
  },
  itemNome: {
    fontSize: 18,
    fontWeight: "bold",
  },
  itemDetalhes: {
    fontSize: 16,
  },
  itemData: {
    fontSize: 14,
    marginTop: 4,
  },
  itemValor: {
    fontSize: 16,
    marginTop: 4,
    color: "green",
  },
  itemDataCriacao: {
    fontSize: 12,
    marginTop: 4,
    color: "gray",
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

export default ItemScreen;
