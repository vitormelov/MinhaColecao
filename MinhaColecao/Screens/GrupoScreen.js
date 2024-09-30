import React, { useState, useEffect } from 'react';
import { View, TextInput, Button, FlatList, Text, StyleSheet, TouchableOpacity, Alert, Modal } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { collection, addDoc, getDocs, query, where, doc, updateDoc, deleteDoc } from 'firebase/firestore'; // Firestore
import { db, auth } from '../firebaseConfig'; // Firebase Config
import { useNavigation, useRoute } from '@react-navigation/native';

const GrupoScreen = () => {
  const [nomeGrupo, setNomeGrupo] = useState('');
  const [grupos, setGrupos] = useState([]);
  const [editandoGrupo, setEditandoGrupo] = useState(null); // Estado para o grupo que está sendo editado
  const [isModalVisible, setIsModalVisible] = useState(false); // Controle do modal
  const { colecaoId } = useRoute().params; // ID da coleção
  const user = auth.currentUser;
  const navigation = useNavigation();

  // Função para buscar grupos no Firestore
  const fetchGrupos = async () => {
    try {
      const q = query(collection(db, 'colecoes', colecaoId, 'grupos'), where('userId', '==', user.uid));
      const querySnapshot = await getDocs(q);
      const gruposList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setGrupos(gruposList);
    } catch (error) {
      console.error('Erro ao buscar grupos:', error);
    }
  };

  useEffect(() => {
    fetchGrupos();
  }, []);

  // Função para adicionar um novo grupo no Firestore
  const handleAddGrupo = async () => {
    if (nomeGrupo.trim() === '') {
      Alert.alert('Erro', 'O nome do grupo não pode estar vazio.');
      return;
    }

    try {
      const docRef = await addDoc(collection(db, 'colecoes', colecaoId, 'grupos'), {
        userId: user.uid,
        nome: nomeGrupo,
        valorTotal: 0, // Inicializa valorTotal como 0
      });

      const novoGrupo = {
        id: docRef.id,
        nome: nomeGrupo,
        valorTotal: 0, // Inicializa o valor no estado local também
      };
      setGrupos([...grupos, novoGrupo]);
      setNomeGrupo('');
      Alert.alert('Sucesso', 'Grupo criado com sucesso!');
    } catch (error) {
      console.error('Erro ao criar grupo:', error);
      Alert.alert('Erro', 'Não foi possível criar o grupo.');
    }
  };

  // Função para deletar todos os itens de um grupo
  const deleteAllItemsInGroup = async (grupoId) => {
    const itensSnapshot = await getDocs(collection(db, 'colecoes', colecaoId, 'grupos', grupoId, 'itens'));
    const deletePromises = itensSnapshot.docs.map((itemDoc) => deleteDoc(doc(db, 'colecoes', colecaoId, 'grupos', grupoId, 'itens', itemDoc.id)));
    await Promise.all(deletePromises); // Deletar todos os itens do grupo
  };

  // Função para deletar um grupo e seus itens
  const handleDeleteGrupo = async (grupo) => {
    try {
      const grupoId = grupo.id;

      // Deletar todos os itens dentro do grupo
      await deleteAllItemsInGroup(grupoId);

      // Deletar o grupo
      await deleteDoc(doc(db, 'colecoes', colecaoId, 'grupos', grupoId));

      Alert.alert('Sucesso', 'Grupo e itens deletados com sucesso!');

      // Atualiza o estado local removendo o grupo
      setGrupos(grupos.filter((g) => g.id !== grupoId));
    } catch (error) {
      console.error('Erro ao deletar grupo:', error);
      Alert.alert('Erro', 'Não foi possível deletar o grupo.');
    }
  };

  // Função para abrir o modal de edição com os dados do grupo
  const handleEditGrupo = (grupo) => {
    setEditandoGrupo(grupo); // Define o grupo que está sendo editado
    setNomeGrupo(grupo.nome); // Preenche o campo com o nome atual do grupo
    setIsModalVisible(true); // Abre o modal de edição
  };

  // Função para salvar as edições do grupo
  const handleSaveEdit = async () => {
    try {
      if (nomeGrupo.trim() === '') {
        Alert.alert('Erro', 'O nome do grupo não pode estar vazio.');
        return;
      }

      const grupoDocRef = doc(db, 'colecoes', colecaoId, 'grupos', editandoGrupo.id);
      await updateDoc(grupoDocRef, { nome: nomeGrupo });

      // Atualiza o estado local com o nome editado
      const gruposAtualizados = grupos.map((grupo) =>
        grupo.id === editandoGrupo.id ? { ...grupo, nome: nomeGrupo } : grupo
      );
      setGrupos(gruposAtualizados);

      setIsModalVisible(false); // Fecha o modal
      setEditandoGrupo(null); // Limpa o grupo que estava sendo editado
      Alert.alert('Sucesso', 'Nome do grupo atualizado com sucesso!');
    } catch (error) {
      console.error('Erro ao atualizar o grupo:', error);
      Alert.alert('Erro', 'Não foi possível atualizar o grupo.');
    }
  };

  // Função para renderizar as ações ao deslizar para a esquerda (editar) ou direita (deletar)
  const renderLeftActions = (grupo) => (
    <Button title="Editar" onPress={() => handleEditGrupo(grupo)} />
  );

  const renderRightActions = (grupo) => (
    <Button title="Deletar" color="red" onPress={() => handleDeleteGrupo(grupo)} />
  );

  // Função para renderizar cada grupo
  const renderItem = ({ item }) => {
    const valorTotal = typeof item.valorTotal === 'number' ? item.valorTotal : 0;

    return (
      <Swipeable renderRightActions={() => renderRightActions(item)} renderLeftActions={() => renderLeftActions(item)}>
        <TouchableOpacity onPress={() => navigation.navigate('Item', { grupoId: item.id, colecaoId, nome: item.nome })} style={styles.grupoItem}>
          <Text style={styles.grupoNome}>{item.nome}</Text>
          <Text style={styles.grupoValor}>Valor total do grupo: R$ {valorTotal.toFixed(2)}</Text>
        </TouchableOpacity>
      </Swipeable>
    );
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Nome do grupo"
        value={nomeGrupo}
        onChangeText={setNomeGrupo}
      />
      <Button title="Criar Grupo" onPress={handleAddGrupo} />

      <FlatList
        data={grupos}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
      />

      {/* Modal para editar o nome do grupo */}
      <Modal visible={isModalVisible} animationType="slide">
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>Editar Nome do Grupo</Text>
          <TextInput
            style={styles.input}
            placeholder="Nome do grupo"
            value={nomeGrupo}
            onChangeText={setNomeGrupo}
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
  grupoItem: {
    padding: 16,
    borderBottomColor: '#ccc',
    borderBottomWidth: 1,
  },
  grupoNome: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  grupoValor: {
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

export default GrupoScreen;
