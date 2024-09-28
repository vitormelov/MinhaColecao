import React, { useState, useEffect } from 'react';
import { View, TextInput, Button, FlatList, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { collection, addDoc, getDocs, query, where } from 'firebase/firestore'; // Firestore
import { db, auth } from '../firebaseConfig'; // Firebase Config
import { useNavigation, useRoute } from '@react-navigation/native';

const GrupoScreen = () => {
  const [nomeGrupo, setNomeGrupo] = useState('');
  const [grupos, setGrupos] = useState([]);
  const { colecaoId, valorTotalGrupo } = useRoute().params; // Valor total atualizado do grupo
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

  // Função para navegar para a tela de itens
  const handleNavigateToItem = (grupoId, nome) => {
    navigation.navigate('Item', { grupoId, colecaoId, nome }); // Navega para a tela ItemScreen com os parâmetros necessários
  };

  // Função para renderizar cada grupo
  const renderItem = ({ item }) => {
    // O valor total exibido aqui é o resultado da soma dos itens do grupo
    const valorTotal = typeof item.valorTotal === 'number' ? item.valorTotal : 0;

    return (
      <TouchableOpacity onPress={() => handleNavigateToItem(item.id, item.nome)} style={styles.grupoItem}>
        <Text style={styles.grupoNome}>{item.nome}</Text>
        {/* Atualiza para usar o valor total do ItemScreen se disponível */}
        <Text style={styles.grupoValor}>Valor total do grupo: R$ {valorTotalGrupo || valorTotal.toFixed(2)}</Text>
      </TouchableOpacity>
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
        keyExtractor={item => item.id}
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
});

export default GrupoScreen;
