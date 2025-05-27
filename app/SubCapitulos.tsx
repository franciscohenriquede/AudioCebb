import React, { useEffect, useState } from 'react';
import SubCapituloService from '../Src/FireBase/subCapitulosService';
import { useLocalSearchParams, useRouter } from 'expo-router';
import SubChapter from './subCapitulosModels';
import { buscarCapituloPorIdAtributo, verificarSubcapitulosEAtualizarCapitulo } from '@/Src/FireBase/CapituloService';

const Subcapitulos = () => {
  const [subcapitulos, setSubcapitulos] = useState<SubChapter[]>([]);
  const [mensagem, setMensagem] = useState<string | null>(null);
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const livroId = 'LivroId'; // <-- substitua pelo ID correto
  const idNumero = Number(id);

  console.log("idCap" + id);
  const buscarSubcapitulos = async () => {
    setMensagem(null);
    setSubcapitulos([]);

    try {
      const dados = await SubCapituloService.getSubcapitulosPorCapitulo(livroId, idNumero);

      // Ordena os subcapítulos pelo ID (número)
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
    if (livroId && idNumero) {
      const resultado = await buscarCapituloPorIdAtributo(livroId, idNumero);

      if (!resultado) {
        console.warn("Nenhum capítulo encontrado para esse idNúmero:", idNumero);
        return;
      }

      const idChave = resultado.docId;
      console.log("id base (param):", idNumero);
      console.log("id chave (docId):", idChave);

      await verificarSubcapitulosEAtualizarCapitulo(livroId, idChave);
    }
  };

  checkAndUpdate();
  buscarSubcapitulos();

  const interval = setInterval(() => {
    console.log("Atualizando subcapítulos automaticamente...");
    checkAndUpdate();
    buscarSubcapitulos();
  }, 60000); // 60 segundos

  return () => clearInterval(interval);
}, [livroId, idNumero]);


  const handleMicrophoneClick = (item: SubChapter) => {
    console.log('Capítulo ID:', item.idCapitulo);
    console.log('Subcapítulo ID:', item.subcapituloId);

    router.push(
      `/Studio?capituloId=${item.idCapitulo}&subcapituloId=${item.subcapituloId}`
    );
  };
  return (
    <div style={styles.container}>
      <h1 style={styles.header}>SubCapítulos</h1>

      {mensagem && <div style={styles.errorMessage}>{mensagem}</div>}

      <div style={styles.listContainer}>
        {subcapitulos.length > 0 ? (
          <ul style={styles.list}>
            {subcapitulos.map((sub) => (
              <li key={sub.subcapituloId} style={styles.listItem}>
                <div style={styles.leftContent}>
                  <div style={styles.title}>Mini tópicos do capítulo</div>
                  <div style={styles.topics}>
                    {Array.isArray(sub.topics) ? (
                      sub.topics.map((topic, index) => (
                        <div key={index} style={styles.topicItem}>
                          {topic}
                        </div>
                      ))
                    ) : (
                      <div style={styles.topicItem}>{sub.topics || 'Sem tópicos'}</div>
                    )}
                  </div>
                  <div style={styles.time}>
                    Tempo estimado: {sub.estimatedTime || 'Não informado'}
                  </div>
                </div>
                <div style={styles.rightContent}>
                  {sub.recorded ? (
                    <div style={styles.checkIcon}>✅</div>
                  ) : (
                    <button
                      style={styles.microphoneButtonRed}
                      onClick={() => handleMicrophoneClick(sub)}
                    >
                      🎤
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p style={styles.noData}>Aguardando resultados...</p>
        )}
      </div>

      {subcapitulos.length > 0 && (
        <div style={styles.footerMessage}>
          Capítulo Concluído. Os áudios já estão armazenados no nosso banco de dados.
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    padding: '20px',
    backgroundColor: '#ffffff',
    color: '#000',
    width: '100%',
    maxWidth: '800px',
    margin: '0 auto',
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    overflowY: 'auto', // Permite rolar verticalmente
    maxHeight: '100vh', // Garante que não ultrapasse a altura da tela
  },
  header: {
    textAlign: 'center',
    color: '#333',
    fontSize: '1.8rem',
    marginBottom: '20px',
  },
  errorMessage: {
    marginTop: '10px',
    color: 'red',
    textAlign: 'center',
    fontSize: '1.2rem',
    fontWeight: 'bold',
  },
  listContainer: {
    marginTop: '20px',
  },
  list: {
    listStyleType: 'none',
    paddingLeft: 0,
  },
  listItem: {
    backgroundColor: '#600000',
    color: 'white',
    padding: '10px',
    marginBottom: '15px',
    borderRadius: '8px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
    minHeight: '100px',
  },
  leftContent: {
    flex: 1,
    marginRight: '10px',
  },
  title: {
    fontWeight: 'bold',
    marginBottom: '8px',
    fontSize: '1.1rem',
  },
  topics: {
    marginBottom: '8px',
  },
  topicItem: {
    marginBottom: '4px',
    fontSize: '0.95rem',
  },
  time: {
    fontSize: '0.8rem',
    color: '#ddd',
  },
  rightContent: {
    marginLeft: '10px',
  },
  microphoneButtonRed: {
    backgroundColor: '#600000',
    color: 'white',
    border: '2px solid #fff',
    borderRadius: '50%',
    padding: '12px',
    fontSize: '1.5rem',
    cursor: 'pointer',
  },
  microphoneButtonGreen: {
    backgroundColor: '#008000',
    color: 'white',
    border: '2px solid #fff',
    borderRadius: '50%',
    padding: '12px',
    fontSize: '1.5rem',
    cursor: 'pointer',
  },
  noData: {
    textAlign: 'center',
    color: 'gray',
    fontSize: '1.2rem',
  },
  footerMessage: {
    marginTop: '30px',
    padding: '12px',
    backgroundColor: '#d3d3d3',
    textAlign: 'center',
    borderRadius: '8px',
    fontSize: '1rem',
  },
checkIcon: {
  fontSize: '2rem',
  color: '#00cc00', // verde
  padding: '8px',
},

}

;

export default Subcapitulos;
