import React, { useState, useEffect } from 'react';
import { View, TextInput, Button, FlatList, Text, StyleSheet, Alert, Modal } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { collection, addDoc, getDocs, query, where, doc, updateDoc, deleteDoc, getDoc } from 'firebase/firestore'; // Firestore
import { db, auth } from '../firebaseConfig'; // Firebase Config
import { useRoute, useNavigation } from '@react-navigation/native';

const ItemScreen = () => {
  const [nomeItem, setNomeItem] = useState('');
  const [detalhes, setDetalhes] = useState('');
  const [dataAquisicao, setDataAquisicao] = useState('');
  const [valor, setValor] = useState('');
  const [itens, setItens] = useState([]);
  const [valorTotalGrupo, setValorTotalGrupo] = useState(0); // Valor total do grupo
  const [editandoItem, setEditandoItem] = useState(null); // Estado para o item que está sendo editado
  const [valorOriginal, setValorOriginal] = useState(null); // Valor original do item antes de edição
  const [isModalVisible, setIsModalVisible] = useState(false); // Controle do modal

  const { grupoId, colecaoId, nome } = useRoute().params; // ID do grupo e da coleção
  const user = auth.currentUser;
  const navigation = useNavigation(); // Para navegação

  // Função para formatar o valor como moeda brasileira
  const formatarValor = (valor) => {
    return valor.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
    });
  };

  // Função para buscar itens do grupo no Firestore
  const fetchItens = async () => {
    try {
      const q = query(collection(db, 'colecoes', colecaoId, 'grupos', grupoId, 'itens'), where('userId', '==', user.uid));
      const querySnapshot = await getDocs(q);

      const itensList = querySnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          nome: data.nome || 'Sem nome',
          valor: data.valor !== undefined && !isNaN(data.valor) ? parseFloat(data.valor) : 0,
          detalhes: data.detalhes || 'Sem detalhes',
          dataAquisicao: data.dataAquisicao || 'Indefinido',
          dataCriacao: data.dataCriacao || 'Desconhecido',
        };
      });

      setItens(itensList);

      const total = itensList.reduce((acc, item) => acc + item.valor, 0);
      setValorTotalGrupo(total);

    } catch (error) {
      console.error('Erro ao buscar itens:', error);
      Alert.alert('Erro', 'Não foi possível buscar os itens corretamente.');
    }
  };

  useEffect(() => {
    fetchItens();
  }, []);

  // Função para adicionar um novo item ao Firestore
  const handleAddItem = async () => {
    const valorDecimal = valor.replace(',', '.');

    if (nomeItem.trim() === '' || valorDecimal.trim() === '') {
      Alert.alert('Erro', 'O nome e o valor do item são obrigatórios.');
      return;
    }

    if (isNaN(parseFloat(valorDecimal)) || parseFloat(valorDecimal) <= 0) {
      Alert.alert('Erro', 'O valor do item deve ser um número maior que 0.');
      return;
    }

    try {
      const dataCriacao = new Date().toLocaleString();

      const docRef = await addDoc(collection(db, 'colecoes', colecaoId, 'grupos', grupoId, 'itens'), {
        userId: user.uid,
        nome: nomeItem,
        detalhes: detalhes || 'Sem detalhes',
        dataAquisicao: dataAquisicao || 'Indefinido',
        valor: parseFloat(valorDecimal),
        dataCriacao,
      });

      const novoItem = {
        id: docRef.id,
        nome: nomeItem,
        detalhes: detalhes || 'Sem detalhes',
        dataAquisicao: dataAquisicao || 'Indefinido',
        valor: parseFloat(valorDecimal),
        dataCriacao,
      };

      setItens([novoItem, ...itens]);
      setNomeItem('');
      setDetalhes('');
      setDataAquisicao('');
      setValor('');

      Alert.alert('Sucesso', 'Item criado com sucesso!');

      const novoValorTotalGrupo = valorTotalGrupo + parseFloat(valorDecimal);
      setValorTotalGrupo(novoValorTotalGrupo);

      const grupoDoc = doc(db, 'colecoes', colecaoId, 'grupos', grupoId);
      await updateDoc(grupoDoc, { valorTotal: novoValorTotalGrupo });

      // Atualiza o valor total da coleção
      await atualizarValorTotalColecao();

      navigation.navigate('Grupo', { grupoId, valorTotalGrupo: novoValorTotalGrupo });

    } catch (error) {
      console.error('Erro ao criar item:', error);
      Alert.alert('Erro', 'Não foi possível criar o item.');
    }
  };

  // Função para deletar o item e atualizar o valor total do grupo e da coleção
  const handleDeleteItem = async (item) => {
    try {
      const itemId = item.id;
      const itemValor = item.valor; // Valor do item que será subtraído

      // Deleta o item do Firestore
      await deleteDoc(doc(db, 'colecoes', colecaoId, 'grupos', grupoId, 'itens', itemId));

      // Atualiza o valor total do grupo
      const novoValorTotalGrupo = valorTotalGrupo - itemValor;
      setValorTotalGrupo(novoValorTotalGrupo);

      const grupoDoc = doc(db, 'colecoes', colecaoId, 'grupos', grupoId);
      await updateDoc(grupoDoc, { valorTotal: novoValorTotalGrupo });

      // Atualiza o valor total da coleção
      await atualizarValorTotalColecao();

      // Remove o item da lista local
      setItens(itens.filter((i) => i.id !== itemId));

      Alert.alert('Sucesso', 'Item deletado e valores atualizados com sucesso!');
    } catch (error) {
      console.error('Erro ao deletar item:', error);
      Alert.alert('Erro', 'Não foi possível deletar o item.');
    }
  };

  // Função para abrir o modal de edição com os dados do item
  const handleEditItem = (item) => {
    setEditandoItem(item); // Define o item que está sendo editado
    setNomeItem(item.nome);
    setDetalhes(item.detalhes);
    setDataAquisicao(item.dataAquisicao);
    setValor(item.valor.toString().replace('.', ','));
    setValorOriginal(item.valor); // Armazena o valor original do item para calcular a diferença
    setIsModalVisible(true); // Abre o modal de edição
  };

  // Função para salvar as edições de um item
  const handleSaveEdit = async () => {
    try {
      const valorDecimal = valor.replace(',', '.');
      if (isNaN(parseFloat(valorDecimal)) || parseFloat(valorDecimal) <= 0) {
        Alert.alert('Erro', 'O valor do item deve ser um número maior que 0.');
        return;
      }

      const itemDocRef = doc(db, 'colecoes', colecaoId, 'grupos', grupoId, 'itens', editandoItem.id);
      await updateDoc(itemDocRef, {
        nome: nomeItem,
        detalhes: detalhes,
        dataAquisicao: dataAquisicao || 'Indefinido',
        valor: parseFloat(valorDecimal),
      });

      // Atualiza o estado local com o item editado
      const itensAtualizados = itens.map((item) =>
        item.id === editandoItem.id
          ? { ...item, nome: nomeItem, detalhes: detalhes, dataAquisicao: dataAquisicao, valor: parseFloat(valorDecimal) }
          : item
      );
      setItens(itensAtualizados);

      // Atualiza o valor total do grupo com base na diferença entre o valor original e o novo valor
      const diferencaValor = parseFloat(valorDecimal) - valorOriginal;
      const novoValorTotalGrupo = valorTotalGrupo + diferencaValor;
      setValorTotalGrupo(novoValorTotalGrupo);

      const grupoDoc = doc(db, 'colecoes', colecaoId, 'grupos', grupoId);
      await updateDoc(grupoDoc, { valorTotal: novoValorTotalGrupo });

      // Atualiza o valor total da coleção
      await atualizarValorTotalColecao(diferencaValor);

      setIsModalVisible(false); // Fecha o modal
      setEditandoItem(null); // Limpa o item que estava sendo editado
      Alert.alert('Sucesso', 'Item atualizado com sucesso!');
    } catch (error) {
      console.error('Erro ao atualizar item:', error);
      Alert.alert('Erro', 'Não foi possível atualizar o item.');
    }
  };

  // Função para atualizar o valor total da coleção
  const atualizarValorTotalColecao = async (diferencaValor = 0) => {
    try {
      const colecaoDocRef = doc(db, 'colecoes', colecaoId);
      const colecaoSnapshot = await getDoc(colecaoDocRef);

      if (colecaoSnapshot.exists()) {
        const valorAtualColecao = colecaoSnapshot.data().valorTotal || 0;
        const novoValorTotalColecao = valorAtualColecao + diferencaValor;

        await updateDoc(colecaoDocRef, { valorTotal: novoValorTotalColecao });
      }
    } catch (error) {
      console.error('Erro ao atualizar o valor da coleção:', error);
    }
  };

  // Função para renderizar as ações ao deslizar para a esquerda (editar) ou direita (deletar)
  const renderLeftActions = (item) => (
    <Button title="Editar" onPress={() => handleEditItem(item)} />
  );

  const renderRightActions = (item) => (
    <Button title="Deletar" color="red" onPress={() => handleDeleteItem(item)} />
  );

  const renderItem = ({ item }) => (
    <Swipeable renderRightActions={() => renderRightActions(item)} renderLeftActions={() => renderLeftActions(item)}>
      <View style={styles.item}>
        <Text style={styles.itemNome}>{item.nome}</Text>
        <Text style={styles.itemDetalhes}>Detalhes: {item.detalhes}</Text>
        <Text style={styles.itemData}>Data de aquisição: {item.dataAquisicao}</Text>
        <Text style={styles.itemValor}>Valor: {formatarValor(item.valor)}</Text>
        <Text style={styles.itemDataCriacao}>Criado em: {item.dataCriacao}</Text>
      </View>
    </Swipeable>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Itens do Grupo: {nome}</Text>
      <Text style={styles.valorTotal}>Valor total do grupo: {formatarValor(valorTotalGrupo)}</Text>

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
      <Button title={editandoItem ? "Salvar Alterações" : "Criar Item"} onPress={editandoItem ? handleSaveEdit : handleAddItem} />

      {itens.length === 0 ? (
        <Text style={styles.noItemsText}>Nenhum item encontrado. Adicione um item.</Text>
      ) : (
        <FlatList
          data={itens}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
        />
      )}

      {/* Modal para editar item */}
      <Modal visible={isModalVisible} animationType="slide">
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>Editar Item</Text>
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
  title: {
    fontSize: 24,
    marginBottom: 16,
    textAlign: 'center',
  },
  valorTotal: {
    fontSize: 18,
    marginBottom: 16,
    textAlign: 'center',
  },
  input: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    marginBottom: 12,
    paddingHorizontal: 8,
    borderRadius: 5,
  },
  item: {
    padding: 16,
    borderBottomColor: '#ccc',
    borderBottomWidth: 1,
  },
  itemNome: {
    fontSize: 18,
    fontWeight: 'bold',
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
    color: 'green',
  },
  itemDataCriacao: {
    fontSize: 12,
    marginTop: 4,
    color: 'gray',
  },
  noItemsText: {
    textAlign: 'center',
    fontSize: 16,
    color: 'gray',
    marginTop: 20,
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

export default ItemScreen;
