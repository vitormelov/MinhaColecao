import React, { useState, useEffect } from 'react';
import { View, TextInput, Button, FlatList, Text, StyleSheet, TouchableOpacity, Alert, Modal } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { collection, getDocs, query, where, doc, updateDoc, addDoc, deleteDoc } from 'firebase/firestore'; // Firestore
import { db, auth } from '../firebaseConfig'; // Firebase Config
import { useNavigation } from '@react-navigation/native';

const ColecaoScreen = () => {
  const [nomeColecao, setNomeColecao] = useState('');
  const [colecoes, setColecoes] = useState([]);
  const [editandoColecao, setEditandoColecao] = useState(null); // Estado para a coleção que está sendo editada
  const [isModalVisible, setIsModalVisible] = useState(false); // Controle do modal
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

  // Função para deletar uma coleção e seus grupos e itens
  const handleDeleteColecao = async (colecao) => {
    try {
      const colecaoId = colecao.id;

      // Deletar todos os grupos e itens da coleção (mesma lógica já implementada)
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

  // Função para abrir o modal de edição com os dados da coleção
  const handleEditColecao = (colecao) => {
    setEditandoColecao(colecao); // Define a coleção que está sendo editada
    setNomeColecao(colecao.nome); // Preenche o campo com o nome atual da coleção
    setIsModalVisible(true); // Abre o modal de edição
  };

  // Função para salvar as edições da coleção
  const handleSaveEdit = async () => {
    try {
      if (nomeColecao.trim() === '') {
        Alert.alert('Erro', 'O nome da coleção não pode estar vazio.');
        return;
      }

      const colecaoDocRef = doc(db, 'colecoes', editandoColecao.id);
      await updateDoc(colecaoDocRef, { nome: nomeColecao });

      // Atualiza o estado local com o nome editado
      const colecoesAtualizadas = colecoes.map((colecao) =>
        colecao.id === editandoColecao.id ? { ...colecao, nome: nomeColecao } : colecao
      );
      setColecoes(colecoesAtualizadas);

      setIsModalVisible(false); // Fecha o modal
      setEditandoColecao(null); // Limpa a coleção que estava sendo editada
      Alert.alert('Sucesso', 'Nome da coleção atualizado com sucesso!');
    } catch (error) {
      console.error('Erro ao atualizar a coleção:', error);
      Alert.alert('Erro', 'Não foi possível atualizar a coleção.');
    }
  };

  // Função para renderizar as ações ao deslizar para a esquerda (editar) ou direita (deletar)
  const renderLeftActions = (colecao) => (
    <Button title="Editar" onPress={() => handleEditColecao(colecao)} />
  );

  const renderRightActions = (colecao) => (
    <Button title="Deletar" color="red" onPress={() => handleDeleteColecao(colecao)} />
  );

  // Função para renderizar cada coleção
  const renderItem = ({ item }) => {
    return (
      <Swipeable renderRightActions={() => renderRightActions(item)} renderLeftActions={() => renderLeftActions(item)}>
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

      {/* Modal para editar o nome da coleção */}
      <Modal visible={isModalVisible} animationType="slide">
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>Editar Nome da Coleção</Text>
          <TextInput
            style={styles.input}
            placeholder="Nome da coleção"
            value={nomeColecao}
            onChangeText={setNomeColecao}
          />
          <Button title="Salvar" onPress={handleSaveEdit} />
          <Button title="Cancelar" onPress={() => setIsModalVisible(false)} color="red" />
        </View>
      </Modal>
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
  modalContainer: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 22,
    marginBottom: 16,
    textAlign: 'center',
  },
});

export default ColecaoScreen;
