import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet, Alert, ActivityIndicator, Platform, Modal } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { getAuth, onAuthStateChanged, signOut } from 'firebase/auth';
import { app, atualizarUsuario, db } from '../Src/FireBase/FireBase';
import CapitulosModels from "./models/CapitulosModels";
import { fetchCapitulos, atualizarCapitulo, atualizarIdEStatusCapitulo, resetarTodosCapitulos, verificarSubcapitulosEAtualizarCapitulo, buscarCapituloPorIdAtributo, handleDescontinuarCapitulo } from '../Src/FireBase/CapituloService';
import { collection, doc, getDoc, updateDoc } from 'firebase/firestore';
import * as Font from 'expo-font';
import { buscarDadosUsuario } from '../Src/FireBase/FireBase';

const auth = getAuth(app);


export default function Capitulos() {
  const router = useRouter();
  const [refreshTrigger, setRefreshTrigger] = useState(false);
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
  const livroId = 'LivroId'; // substituir pelo ID correto



  const carregarCapitulos = async (livroId: string) => {
    console.log("User ID recebido:antes", userId);
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

        let idA = Number(a.id);
        let idB = Number(b.id);



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
    console.log("User ID recebido:antes", userId);
    if (!userId || !LivroId) return;

    try {
      console.log("User ID recebido:", userId);
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

      if (item.status && item.status.trim().toLowerCase() === 'disponivel' || (item.status.trim().toLowerCase() === 'gravando' && item.narradorId === dadosAtualizados.id)) {
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
          if (item.status && item.status.trim().toLowerCase()==='disponivel') {
            const confirmed = window.confirm('Ao escolher o capítulo você assume o compromisso de fazê-lo.');
            if (confirmed) confirmar();
          } else if (item.narradorId === dadosAtualizados.id && item.status.trim().toLowerCase() === 'gravando') {
            const confirmed = window.confirm('Continuar Gravação');
            if (confirmed) confirmar();
            else if (item.narradorId === dadosAtualizados.id && item.status.trim().toLowerCase() === '') {
              const confirmed = window.confirm('Continuar Gravação');
              if (confirmed) confirmar();
            }
          }
        } else {
          Alert.alert('Confirmação', 'Ao escolher o capítulo você assume o compromisso de fazê-lo.', [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Confirmar', onPress: confirmar },
          ]);
        }
      } else {
        setModalMessage('Esse capítulo está sendo gravado por outra pessoa.');
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

        const livroIdFixo = 'LivroId';
        setLivroId(livroIdFixo); // seta o livroId fixamente aqui

        try {
          const dados = await buscarDadosUsuario(user.uid);
          setDadosUsuario(dados);

          const userDocRef = doc(db, 'usuarios', user.uid);
          const docSnap = await getDoc(userDocRef);
          if (docSnap.exists()) {
            setStatusUsuario(docSnap.data().status === true);
          }

          // ⚠️ Agora podemos carregar os capítulos sem depender do state
          await carregarCapitulos(livroIdFixo);
        } catch (error) {
          setModalMessage('Erro ao carregar dados do usuário.');
          setModalVisible(true);
        }
      } else {
        router.replace('/tabs/login');
      }
    });


    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (livroId) {
      carregarCapitulos(livroId);
    }
  }, [refreshTrigger]);

  const renderItem = ({ item }: { item: CapitulosModels }) => {
    const corStatus = item.status === 'disponivel'
      ? '#008000' // Verde
      : item.status === 'gravacaoconcluida'
        ? '#FFD700' // Amarelo Dourado
        : '#B22222'; // Vermelho

    const estaGravando = item.narradorId === userId;
    const gravacaoConcluida = item.status === "gravacaoconcluida";

    return (
      <View style={styles.itemContainer}>
        <View style={styles.tituloBox}>
          {estaGravando && !gravacaoConcluida && (

            <>
              <Text style={styles.avisoTexto}>🤗 Ei, você está gravando este capítulo!</Text>
              <TouchableOpacity
                style={styles.botaoCancelarFixo}
                onPress={async () => {
                  const confirmar = window.confirm(
                    "Caso não possa continuar a assumir o capítulo, clique em OK. Os Capitulos que você já contriuiu não serão perdidos"
                  );
                  if (confirmar) {
                    await handleDescontinuarCapitulo(livroId, item.id, item.narradorId);
                    await carregarCapitulos(livroId);
                    await buscarDadosUsuario(userId);
                  }
                }}

              >
                <Text style={styles.textoBotao}> Ei. precisa por algum motivo cancelar o compromisso com as gravações ? clique aqui </Text>
              </TouchableOpacity>
            </>
          )}
          {gravacaoConcluida && (
            <Text style={styles.avisoTexto}>Este capítulo está com todos os subcapítulos gravados 💫🤭</Text>
          )}
          <Text style={styles.tituloTexto}>{item.titulo}</Text>

          {/* Microfone CENTRALIZADO DENTRO do bloco */}
          <TouchableOpacity
            style={[styles.micBox, { borderColor: corStatus }]}
            onPress={() => handleMicPress(item)}
          >
            {Platform.OS === 'web' ? (
              <Text style={{ fontSize: 30 }}>🎙️</Text>
            ) : (
              <FontAwesome name="microphone" size={40} color="black" />
            )}
          </TouchableOpacity>
        </View>
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

      {dadosUsuario && (
        <View style={{ marginBottom: 16 }}>
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
    marginBottom: 12,
    alignItems: 'stretch', // ocupa largura total
  },
  tituloBox: {
    backgroundColor: '#4B0000',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',  // CENTRALIZA tudo dentro
  },
  tituloTexto: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  micBox: {
    borderWidth: 3,
    borderRadius: 50,
    padding: 10,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
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

  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
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
    textAlign: 'center',
  },
  modalButton: {
    backgroundColor: 'blue',
    padding: 10,
    borderRadius: 8,
    width: 100,
    alignItems: 'center',
  },
  avisoTexto: {
    color: 'orange',
    fontSize: 16,
    marginBottom: 10,
  },
  botaoCancelar: {
    backgroundColor: 'red',
    padding: 10,
    borderRadius: 8,
    marginTop: 10,
  },
botaoCancelarFixo: {
  position: 'absolute',
  bottom: 20,
  right: 0,
  backgroundColor: 'transparent', // No background color
  paddingVertical: 10,
  paddingHorizontal: 10,
  borderRadius: 8,
  borderWidth: 2, // A clear border
  borderColor: '#FF6347', // Using your original cancel color for the border
  elevation: 0, // No shadow for a truly minimalist look
  shadowColor: 'transparent',
  opacity : 0.5
  
},

  textoBotao: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
  },
});
