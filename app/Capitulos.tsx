import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet, Alert, ActivityIndicator, Platform, Modal } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { getAuth, onAuthStateChanged, signOut } from 'firebase/auth';
import { app, atualizarUsuario, db } from '../Src/FireBase/FireBase';
import CapitulosModels from "../app/CapitulosModels";
import { fetchCapitulos, atualizarCapitulo, atualizarIdEStatusCapitulo, resetarTodosCapitulos } from '../Src/FireBase/CapituloService';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { buscarDadosUsuario } from '../Src/FireBase/FireBase';
const auth = getAuth(app);

export default function Capitulos() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [capitulos, setCapitulos] = useState<CapitulosModels[]>([]);
  const [loading, setLoading] = useState(true);
  const [LivroId, setLivroId] = useState<string | null>(null);
  const [statusUsuario, setStatusUsuario] = useState<boolean>(false);  // Status do usuário
  const [dadosUsuario, setDadosUsuario] = useState<{
    id: string;
    email: string;
    GravandoAlgumCapitulo: boolean;
  } | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState('');

  const handleResetarCapitulos = async () => {
    if (!LivroId) {
      setModalMessage('Erro: LivroId indefinido.');
      setModalVisible(true);
      return;
    }
  
    try {
      await resetarTodosCapitulos(LivroId);
      setModalMessage('Sucesso: Todos os capítulos foram resetados.');
      setModalVisible(true);
      await carregarCapitulos(LivroId); // Atualiza a lista na tela
    } catch (error) {
      setModalMessage('Erro ao resetar capítulos.');
      setModalVisible(true);
    }
  };

  const carregarCapitulos = async (livroId: string) => {
    if (!livroId || typeof livroId !== 'string') {
      setModalMessage('Erro: livroId inválido ou indefinido');
      setModalVisible(true);
      setCapitulos([]);
      setLoading(false);
      return;
    }

    try {
      const capitulos = await fetchCapitulos(livroId);
      if (capitulos.length === 0) {
        setModalMessage('Nenhum capítulo encontrado.');
        setModalVisible(true);
        setCapitulos([]);
        return;
      }

      let capitulosFiltrados = capitulos;
      if (statusUsuario) {
        capitulosFiltrados = capitulos.filter(item => item.narradorId === userId);
      }

      const capitulosOrdenados = [...capitulosFiltrados].sort((a, b) => {
        const idA = Number(a.id);
        const idB = Number(b.id);
        return idA - idB;
      });

      setCapitulos(capitulosOrdenados);
    } catch (error) {
      setModalMessage('Erro ao carregar capítulos.');
      setModalVisible(true);
      setCapitulos([]);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    signOut(auth)
      .then(() => {
        setModalMessage('Você saiu com sucesso!');
        setModalVisible(true);
      })
      .catch((error) => {
        setModalMessage('Erro ao sair.');
        setModalVisible(true);
      });
  };

  const handleMicPress = async (item: CapitulosModels) => {
    if (!userId || !LivroId) return;

    try {
      const dadosAtualizados = await buscarDadosUsuario(userId);

      if (!dadosAtualizados) {
        setModalMessage('Erro ao buscar dados do usuário.');
        setModalVisible(true);
        return;
      }

      if (dadosAtualizados.GravandoAlgumCapitulo && dadosAtualizados.id != item.narradorId) {
        setModalMessage('Você já está gravando outro capítulo.');
        setModalVisible(true);
        return;
      }

      if (item.status && item.status.trim().toLowerCase() === 'ok' || (item.status.trim().toLowerCase() === 'gravando' && item.narradorId === dadosAtualizados.id)) {
        const confirmar = async () => {
          try {
            await atualizarIdEStatusCapitulo(LivroId, item.id, userId, 'gravando');
            await atualizarUsuario(userId, { GravandoAlgumCapitulo: true });

            router.push({
              pathname: '/SubCapitulos',
              params: { id: item.id, titulo: item.titulo, livroId: LivroId },
            });
          } catch (error) {
            setModalMessage('Erro ao tentar assumir o capítulo.');
            setModalVisible(true);
          }
        };

        if (Platform.OS === 'web') {
          if (item.status && item.status.trim().toLowerCase() === 'ok') {
            const confirmed = window.confirm('Ao escolher o capítulo você assume o compromisso de fazê-lo.');
            if (confirmed) confirmar();
          } else if (item.narradorId === dadosAtualizados.id && item.status.trim().toLowerCase() === 'gravando') {
            const confirmed = window.confirm('Continuar Gravação');
            if (confirmed) confirmar();
          }
        } else {
          Alert.alert('Confirmação', 'Ao escolher o capítulo você assume o compromisso de fazê-lo.', [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Confirmar', onPress: confirmar },
          ]);
        }
      } else {
        setModalMessage('Esse capítulo está sendo gravado por outra pessoa ou não está disponível.');
        setModalVisible(true);
      }
    } catch (error) {
      setModalMessage('Erro inesperado.');
      setModalVisible(true);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUserId(user.uid);
        setLivroId('LivroId');
  
        try {
          const dados = await buscarDadosUsuario(user.uid);
          setDadosUsuario(dados);
        } catch (error) {
          setModalMessage('Erro ao carregar dados do usuário.');
          setModalVisible(true);
        }
  
        const userDocRef = doc(db, 'usuarios', user.uid);
        getDoc(userDocRef).then((docSnap) => {
          if (docSnap.exists()) {
            setStatusUsuario(docSnap.data().status === true);
          }
        });
  
        if (LivroId) carregarCapitulos(LivroId);
      } else {
        router.replace('/Login');
      }
    });
  
    return () => unsubscribe();
  }, [LivroId]);

  const renderItem = ({ item }: { item: CapitulosModels }) => {
    const corStatus = item.status === 'ok' ? '#008000' : '#B22222';
    const estaGravando = item.narradorId === userId;

    return (
      <View style={styles.itemContainer}>
        <View style={styles.tituloBox}>
          {estaGravando && (
            <Text style={styles.avisoTexto}>🤗 Ei, você está gravando este capítulo!</Text>
          )}
          <Text style={styles.tituloTexto}>{item.titulo}</Text>
        </View>
        <TouchableOpacity
          style={[styles.micBox, { borderColor: corStatus }]}
          onPress={() => handleMicPress(item)}
        >
          <FontAwesome name="microphone" size={24} color="#000" />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={capitulos}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
      />
      <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
        <Text style={styles.buttonText}>Sair</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={handleResetarCapitulos} style={styles.resetButton}>
        <Text style={styles.buttonText}>Resetar Capítulos</Text>
      </TouchableOpacity>

      {dadosUsuario && (
        <View style={{ marginBottom: 16 }}>
          <Text style={{ fontSize: 18 }}>👤 Nome: {dadosUsuario.nome}</Text>
          <Text style={{ fontSize: 16 }}>📧 Email: {dadosUsuario.email}</Text>
          <Text style={{ fontSize: 16 }}>
            🎙️ Gravando capítulo? {dadosUsuario.GravandoAlgumCapitulo ? 'Sim' : 'Não'}
          </Text>
        </View>
      )}

      {/* Modal para mensagens */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalText}>{modalMessage}</Text>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.buttonText}>Fechar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  itemContainer: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'center',
  },
  tituloBox: {
    flex: 1,
    backgroundColor: '#4B0000',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  tituloTexto: {
    color: '#fff',
    fontSize: 16,
  },
  micBox: {
    borderWidth: 4,
    borderRadius: 4,
    padding: 10,
    marginLeft: 8,
    backgroundColor: '#fff',
  },
  logoutButton: {
    backgroundColor: 'red',
    padding: 15,
    borderRadius: 8,
    width: 200,
    alignItems: 'center',
    marginTop: 20,
    alignSelf: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
  },
  resetButton: {
    backgroundColor: 'blue',
    padding: 15,
    borderRadius: 8,
    width: 200,
    alignItems: 'center',
    marginTop: 10,
    alignSelf: 'center',
  },
  avisoTexto: {
    color: '#FFD700', // Dourado para chamar atenção
    fontWeight: 'bold',
    fontSize: 14,
    marginBottom: 4,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Transparência
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    width: 300,
    alignItems: 'center',
  },
  modalText: {
    fontSize: 18,
    marginBottom: 20,
  },
  modalButton: {
    backgroundColor: 'blue',
    padding: 10,
    borderRadius: 8,
    width: 100,
    alignItems: 'center',
  },
});

