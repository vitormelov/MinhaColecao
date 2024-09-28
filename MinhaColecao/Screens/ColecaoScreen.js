import React, { useState, useEffect } from 'react';
import { View, TextInput, Button, FlatList, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { collection, addDoc, getDocs, query, where, updateDoc, doc, getDoc } from 'firebase/firestore'; // Firestore
import { db, auth } from '../firebaseConfig'; // Firebase Config
import { useNavigation } from '@react-navigation/native';

const ColecaoScreen = () => {
  const [nomeColecao, setNomeColecao] = useState('');
  const [colecoes, setColecoes] = useState([]);
  const user = auth.currentUser;
  const navigation = useNavigation();

  // Função para buscar coleções no Firestore
  const fetchColecoes = async () => {
    try {
      const q = query(collection(db, 'colecoes'), where('userId', '==', user.uid));
      const querySnapshot = await getDocs(q);
      const colecaoList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
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

  // Função para navegar para a tela de grupos
  const handleNavigateToGrupo = (colecaoId, nome) => {
    navigation.navigate('Grupo', { colecaoId, nome });
  };

  // Função para renderizar cada coleção
  const renderItem = ({ item }) => {
    // O valor total exibido aqui é o resultado da soma dos valores dos grupos da coleção
    const valorTotal = typeof item.valorTotal === 'number' ? item.valorTotal : 0;

    return (
      <TouchableOpacity onPress={() => handleNavigateToGrupo(item.id, item.nome)} style={styles.colecaoItem}>
        <Text style={styles.colecaoNome}>{item.nome}</Text>
        <Text style={styles.colecaoValor}>Valor total da coleção: R$ {valorTotal.toFixed(2)}</Text>
      </TouchableOpacity>
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
