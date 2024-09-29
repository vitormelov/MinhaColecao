import React, { useState, useEffect } from 'react';
import { View, TextInput, Button, FlatList, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { collection, addDoc, getDocs, query, where, doc, deleteDoc } from 'firebase/firestore'; // Firestore
import { db, auth } from '../firebaseConfig'; // Firebase Config
import { useNavigation } from '@react-navigation/native';

const ColecaoScreen = () => {
  const [nomeColecao, setNomeColecao] = useState('');
  const [colecoes, setColecoes] = useState([]);
  const user = auth.currentUser;
  const navigation = useNavigation();

  // Função para buscar coleções e seus grupos no Firestore
  const fetchColecoes = async () => {
    try {
      const q = query(collection(db, 'colecoes'), where('userId', '==', user.uid));
      const querySnapshot = await getDocs(q);
      const colecaoList = [];

      for (const doc of querySnapshot.docs) {
        const colecaoData = doc.data();
        const colecaoId = doc.id;

        // Buscar todos os grupos dessa coleção
        const gruposSnapshot = await getDocs(collection(db, 'colecoes', colecaoId, 'grupos'));
        const valorTotalColecao = gruposSnapshot.docs.reduce((total, grupoDoc) => {
          const grupoData = grupoDoc.data();
          return total + (grupoData.valorTotal || 0);
        }, 0);

        colecaoList.push({
          id: colecaoId,
          nome: colecaoData.nome,
          valorTotal: valorTotalColecao,
        });
      }

      setColecoes(colecaoList);
    } catch (error) {
      console.error('Erro ao buscar coleções:', error);
    }
  };

  useEffect(() => {
    fetchColecoes();
  }, []);

  // Função para adicionar uma nova coleção no Firestore
  const handleAddColecao = async () => {
    if (nomeColecao.trim() === '') {
      Alert.alert('Erro', 'O nome da coleção não pode estar vazio.');
      return;
    }

    try {
      const docRef = await addDoc(collection(db, 'colecoes'), {
        userId: user.uid,
        nome: nomeColecao,
        valorTotal: 0, // Inicializando valorTotal como 0
      });

      const novaColecao = {
        id: docRef.id,
        nome: nomeColecao,
        valorTotal: 0, // Também no estado local
      };

      setColecoes([...colecoes, novaColecao]);
      setNomeColecao('');
      Alert.alert('Sucesso', 'Coleção criada com sucesso!');
    } catch (error) {
      console.error('Erro ao criar coleção:', error);
      Alert.alert('Erro', 'Não foi possível criar a coleção.');
    }
  };

  // Função para deletar todos os itens dentro de um grupo
  const deleteAllItemsInGroup = async (colecaoId, grupoId) => {
    const itensSnapshot = await getDocs(collection(db, 'colecoes', colecaoId, 'grupos', grupoId, 'itens'));
    const deleteItemPromises = itensSnapshot.docs.map((itemDoc) =>
      deleteDoc(doc(db, 'colecoes', colecaoId, 'grupos', grupoId, 'itens', itemDoc.id))
    );
    await Promise.all(deleteItemPromises); // Deletar todos os itens do grupo
  };

  // Função para deletar todos os grupos e seus itens dentro de uma coleção
  const deleteAllGruposInColecao = async (colecaoId) => {
    const gruposSnapshot = await getDocs(collection(db, 'colecoes', colecaoId, 'grupos'));
    const deleteGroupPromises = gruposSnapshot.docs.map(async (grupoDoc) => {
      const grupoId = grupoDoc.id;
      // Deletar todos os itens dentro de cada grupo
      await deleteAllItemsInGroup(colecaoId, grupoId);
      // Deletar o próprio grupo
      await deleteDoc(doc(db, 'colecoes', colecaoId, 'grupos', grupoId));
    });
    await Promise.all(deleteGroupPromises); // Deletar todos os grupos e seus itens
  };

  // Função para deletar uma coleção e tudo dentro dela (grupos e itens)
  const handleDeleteColecao = async (colecao) => {
    try {
      const colecaoId = colecao.id;

      // Deletar todos os grupos e itens da coleção
      await deleteAllGruposInColecao(colecaoId);

      // Deletar a coleção
      await deleteDoc(doc(db, 'colecoes', colecaoId));

      // Atualiza o estado local removendo a coleção
      setColecoes(colecoes.filter((c) => c.id !== colecaoId));

      Alert.alert('Sucesso', 'Coleção, grupos e itens deletados com sucesso!');
    } catch (error) {
      console.error('Erro ao deletar coleção:', error);
      Alert.alert('Erro', 'Não foi possível deletar a coleção.');
    }
  };

  // Função para renderizar as ações ao deslizar para deletar
  const renderRightActions = (colecao) => (
    <Button title="Deletar" color="red" onPress={() => handleDeleteColecao(colecao)} />
  );

  // Função para renderizar cada coleção
  const renderItem = ({ item }) => {
    return (
      <Swipeable renderRightActions={() => renderRightActions(item)}>
        <TouchableOpacity onPress={() => navigation.navigate('Grupo', { colecaoId: item.id, nome: item.nome })} style={styles.colecaoItem}>
          <Text style={styles.colecaoNome}>{item.nome}</Text>
          <Text style={styles.colecaoValor}>Valor total da coleção: R$ {item.valorTotal.toFixed(2)}</Text>
        </TouchableOpacity>
      </Swipeable>
    );
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Nome da coleção"
        value={nomeColecao}
        onChangeText={setNomeColecao}
      />
      <Button title="Criar Coleção" onPress={handleAddColecao} />

      <FlatList
        data={colecoes}
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
    backgroundColor: '#fff',
  },
  input: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    marginBottom: 12,
    paddingHorizontal: 8,
    borderRadius: 5,
  },
  colecaoItem: {
    padding: 16,
    borderBottomColor: '#ccc',
    borderBottomWidth: 1,
  },
  colecaoNome: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  colecaoValor: {
    fontSize: 16,
    marginTop: 4,
  },
});

export default ColecaoScreen;
