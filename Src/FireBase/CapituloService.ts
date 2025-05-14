// capitulosService.ts
import { getFirestore, collection, getDocs, doc, updateDoc, getDoc, query, where } from 'firebase/firestore';
import { app } from './FireBase'; // ajuste o caminho conforme seu projeto
import CapitulosModels from "../../app/CapitulosModels";

const db = getFirestore(app);

// 🔍 Buscar capítulos de um livro
export const fetchCapitulos = async (livroId: string): Promise<CapitulosModels[]> => {
  try {
    const snapshot = await getDocs(collection(db, 'Livros', livroId, 'capitulos'));

    if (snapshot.empty) {
      return [];
    }

    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: data.id, // <- usa o campo interno 'id'!
        titulo: data.titulo || '',
        status: data.status || '',
        narradorId: data.narradorId || '',
      } as CapitulosModels;
    });

  } catch (error) {
    console.error("Erro ao buscar capítulos:", error);
    return [];
  }
};


// ✏️ Atualizar um capítulo
export const atualizarCapitulo = async (
  livroId: string,
  capituloId: string,
  data: Partial<CapitulosModels>
) => {
  try {
    const capituloRef = doc(
      db,
      'Livros',
      String(livroId),
      'capitulos',
      String(capituloId)
    );
    await updateDoc(capituloRef, data);
    console.log(`Capítulo ${capituloId} atualizado com sucesso.`);
  } catch (error) {
    console.error(`Erro ao atualizar capítulo ${capituloId}:`, error);
  }

};
export const atualizarIdEStatusCapitulo = async (
  livroId: string,
  capituloId: number,  // Capítulo é um número
  narradorId: string, 
  novoStatus: string
) => {
  try {
    // Verificando se os parâmetros estão corretos
    if (!livroId || !capituloId || !narradorId || !novoStatus) {
      throw new Error('Faltando parâmetros necessários para atualizar o capítulo.');
    }

    // Garantindo que livroId e capituloId sejam strings
    const livroIdString = String(livroId);
    const capituloIdString = String(capituloId);

    console.log("livroIdString:", livroIdString, "capituloIdString:", capituloIdString);

    // Criando a referência para a coleção de capítulos
    const capitulosRef = collection(db, 'Livros', livroIdString, 'capitulos');
    
    // Buscando todos os capítulos para encontrar aquele com o 'id' correspondente
    const q = query(capitulosRef, where('id', '==', capituloId));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      throw new Error(`Capítulo com ID ${capituloIdString} não encontrado.`);
    }

    // Encontrando o primeiro documento que corresponde ao critério
    const capituloDoc = querySnapshot.docs[0];
    console.log("Capítulo encontrado:", capituloDoc.data());

    // Atualizando os campos no Firestore
    await updateDoc(capituloDoc.ref, {
      narradorId: narradorId,  // Atualizando o campo 'narradorId'
      status: novoStatus,      // Atualizando o 'status'
    });

    console.log(`ID e status do capítulo ${capituloIdString} atualizados com sucesso.`);
  } catch (error) {
    console.error(`Erro ao atualizar ID e status do capítulo:`, error);
    alert(`Erro ao atualizar capítulo: ${error.message}`);
  }



};
export const resetarTodosCapitulos = async (livroId: string): Promise<void> => {
  try {
    const capitulosRef = collection(db, 'Livros', livroId, 'capitulos');
    const snapshot = await getDocs(capitulosRef);

    if (snapshot.empty) {
      console.warn('Nenhum capítulo encontrado para resetar.');
      return;
    }

    const atualizacoes = snapshot.docs.map(async (docSnap) => {
      await updateDoc(docSnap.ref, {
        narradorId: '',
        status: 'ok',
      });
    });

    await Promise.all(atualizacoes);
    console.log(`✅ Todos os capítulos do livro ${livroId} foram resetados com sucesso.`);
  } catch (error) {
    console.error('❌ Erro ao resetar capítulos:', error);
  }

};

export const buscarCapituloPorIdAtributo = async (
  livroId: string,
  valorDoId: number
): Promise<{ docId: string } | null> => {
  const capitulosRef = collection(db, "Livros", livroId, "capitulos");
  const q = query(capitulosRef, where("id", "==", valorDoId));
  const querySnapshot = await getDocs(q);

  if (!querySnapshot.empty) {
    const doc = querySnapshot.docs[0];
    return { docId: doc.id };
  }

  return null;
};
