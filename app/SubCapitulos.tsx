import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import SubCapituloService, { resetarTodosSubCapitulos } from '../Src/FireBase/subCapitulosService';
import { useLocalSearchParams, useRouter } from 'expo-router';
import SubChapter from './subCapitulosModels';
import { buscarCapituloPorIdAtributo, verificarSubcapitulosEAtualizarCapitulo } from '@/Src/FireBase/CapituloService';
import { atualizarUsuario, auth, buscarDadosUsuario, db } from '@/Src/FireBase/FireBase';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

const Subcapitulos = () => {
  const [statusUsuario, setStatusUsuario] = useState<boolean>(false);
  const [LivroId, setLivroId] = useState<string | null>(null);
  const [subcapitulos, setSubcapitulos] = useState<SubChapter[]>([]);
  const [mensagem, setMensagem] = useState<string | null>(null);
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const livroId = 'LivroId'; // substituir pelo ID correto
  const idNumero = Number(id);
  const [dadosUsuario, setDadosUsuario] = useState<{
    id: string;
    email: string;
    GravandoAlgumCapitulo: boolean;
  } | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const uid = user.uid;
        setUserId(uid);
        setLivroId(livroId);

        try {
          const dados = await buscarDadosUsuario(uid);
          setDadosUsuario(dados);
        } catch (error) {
          Alert.alert('Erro', 'Erro ao carregar dados do usuário.');
        }

        try {
          const userDocRef = doc(db, 'usuarios', uid);
          const docSnap = await getDoc(userDocRef);
          if (docSnap.exists()) {
            setStatusUsuario(docSnap.data().status === true);
          }
        } catch (error) {
          console.error("Erro ao buscar status do usuário:", error);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  const buscarSubcapitulos = async () => {
    setMensagem(null);
    setSubcapitulos([]);

    try {
      const dados = await SubCapituloService.getSubcapitulosPorCapitulo(livroId, idNumero);

      const dadosOrdenados = dados.sort((a, b) => a.subcapituloId - b.subcapituloId);

      if (dadosOrdenados.length === 0) {
        setMensagem('Nenhum subcapítulo encontrado para este capítulo.');
      } else {
        setSubcapitulos(dadosOrdenados);
      }
    } catch (error: any) {
      console.error('Erro ao buscar subcapítulos:', error);
      setMensagem(error.message || 'Erro desconhecido ao buscar subcapítulos.');
    }
  };

  useEffect(() => {
    const checkAndUpdate = async () => {
      if (!userId || !livroId || !idNumero) return;

      const resultado = await buscarCapituloPorIdAtributo(livroId, idNumero);
      if (!resultado) return;

      const idChave = resultado.docId;
      await verificarSubcapitulosEAtualizarCapitulo(livroId, idChave, userId);
       
   
    };

    checkAndUpdate();
    buscarSubcapitulos();

    const interval = setInterval(() => {
      checkAndUpdate();
      buscarSubcapitulos();
    }, 60000);

    return () => clearInterval(interval);
  }, [userId, livroId, idNumero]);

  const handleMicrophoneClick = (item: SubChapter) => {
    router.push(`/Studio?capituloId=${item.idCapitulo}&subcapituloId=${item.subcapituloId}`);
  };



  return (
    <View style={styles.container}>
      <Text style={styles.header}>SubCapítulos</Text>

      {mensagem && <Text style={styles.errorMessage}>{mensagem}</Text>}

      <FlatList
        data={subcapitulos}
        keyExtractor={(item) => item.subcapituloId.toString()}
        style={styles.list}
        renderItem={({ item }) => (
          <View style={styles.listItem}>
            <View style={styles.leftContent}>
              <Text style={styles.title}>Mini tópicos do capítulo</Text>
              {Array.isArray(item.topics) ? (
                item.topics.map((topic, index) => (
                  <Text key={index} style={styles.topicItem}>
                    {topic}
                  </Text>
                ))
              ) : (
                <Text style={styles.topicItem}>{item.topics || 'Sem tópicos'}</Text>
              )}
              <Text style={styles.time}>Tempo estimado: {item.estimatedTime || 'Não informado'}</Text>
            </View>
            <View style={styles.rightContent}>
              {item.recorded ? (
                <Text style={styles.checkIcon}>✅</Text>
              ) : (
                <TouchableOpacity
                  style={styles.microphoneButtonRed}
                  onPress={() => handleMicrophoneClick(item)}
                >
                  <Text style={{ fontSize: 24 }}>🎙️</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
        ListEmptyComponent={() => (
          <Text style={styles.noData}>Aguardando resultados...</Text>
        )}
      />

      {subcapitulos.length > 0 && (
        <>
        

          
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#ffffff',
    flex: 1,
  },
  header: {
    textAlign: 'center',
    color: '#333',
    fontSize: 28,
    marginBottom: 20,
  },
  errorMessage: {
    marginTop: 10,
    color: 'red',
    textAlign: 'center',
    fontSize: 18,
    fontWeight: 'bold',
  },
  list: {
    marginBottom: 20,
  },
  listItem: {
    backgroundColor: '#600000',
    color: 'white',
    padding: 10,
    marginBottom: 15,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 100,
  },
  leftContent: {
    flex: 1,
    marginRight: 10,
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 8,
    fontSize: 18,
    color: 'white',
  },
  topicItem: {
    marginBottom: 4,
    fontSize: 16,
    color: 'white',
  },
  time: {
    fontSize: 14,
    color: '#ddd',
  },
  rightContent: {
    marginLeft: 10,
  },
  microphoneButtonRed: {
    backgroundColor: '#600000',
    borderColor: '#fff',
    borderWidth: 2,
    borderRadius: 50,
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkIcon: {
    fontSize: 32,
    color: '#00cc00',
    padding: 8,
  },
  noData: {
    textAlign: 'center',
    color: 'gray',
    fontSize: 18,
    marginTop: 20,
  },
  footerMessage: {
    marginTop: 30,
    padding: 12,
    backgroundColor: '#d3d3d3',
    textAlign: 'center',
    borderRadius: 8,
    fontSize: 18,
  },
  resetButton: {
    backgroundColor: 'blue',
    padding: 15,
    borderRadius: 8,
    width: 200,
    alignSelf: 'center',
    marginBottom: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    textAlign: 'center',
  },
});

export default Subcapitulos;
