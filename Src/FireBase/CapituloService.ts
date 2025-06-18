// capitulosService.ts
import { getFirestore, collection, getDocs, doc, updateDoc, getDoc, query, where } from 'firebase/firestore';
import { app, atualizarUsuario } from './FireBase'; // ajuste o caminho conforme seu projeto
import CapitulosModels from "../../app/models/CapitulosModels";
import Subcapitulos from '@/app/SubCapitulos';
import subCapitulosModels from '@/app/subCapitulosModels';

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
  capituloId: any,
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
  if (!livroId || capituloId === null || capituloId === undefined || !narradorId || !novoStatus) {
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

//uma aplicação do allteração do status do capitulo apos todos os subCapitulos Serem gravados, indetificando se existe 
// audio em todos os subcapitulos , o status do capitulos é alteradi. Mas nem todos os audios então funcionadno
//todos os sub capitulos ainda não estarem armazarenando o audio
///export const verificarConclusaoCapitulo = (subcapitulos: subCapitulosModels[]): boolean => {
  //return subcapitulos.every(sub => !!sub.audioURL);
//};

//export const atualizarStatusCapitulo = (capitulo: CapitulosModels, subcapitulos: subCapitulosModels[]): CapitulosModels => {
  //const todosGravados = verificarConclusaoCapitulo(subcapitulos);

  //return {
   // ...capitulo,
   // status: todosGravados ? "GravacaoConcluida" : "gravando"
  //};
//};



 
export const handleDescontinuarCapitulo = async (
  
  livroId: string,
   capituloId: any,
  usuarioId : any,
  ) => {

   const idReal =    await buscarCapituloPorIdAtributo(livroId , capituloId);
console.log('livroIdzxxxxx:', livroId, typeof livroId);
console.log('capituloIdxxxx:', capituloId, typeof capituloId);
console.log('capituloIdReal:', idReal, typeof idReal);
  console.log('capituloIdReal:' , usuarioId, typeof usuarioId);
  try {
 const capituloRef = doc(db, 'Livros', livroId, 'capitulos', String(idReal.docId));

    await updateDoc(capituloRef, {
      narradorId: '',
      status: 'disponivel',
    });
     await atualizarUsuario(usuarioId, { GravandoAlgumCapitulo: false });
    alert('Capítulo descontinuado com sucesso!');

  } catch (error) {
    console.error('Erro ao descontinuar capítulo:', error);
    alert('Ocorreu um erro ao descontinuar o capítulo.');
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
        status: 'Disponivel',
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


export async function verificarSubcapitulosEAtualizarCapitulo(livroId : string , idCapitulo : any , userId: any) {
  try {
    const subcapitulosRef =  collection(db, `Livros/${livroId}/capitulos/${idCapitulo}/subcapitulos`);
    const subcapitulosSnap = await getDocs(subcapitulosRef);

    if (subcapitulosSnap.empty) {
      console.log("Nenhum subcapítulo encontrado.");
      return;
    }

    // Verifica se todos os subcapítulos têm record === true
 const todosGravados = subcapitulosSnap.docs.every(doc => doc.data().recorded === true);


    if (todosGravados) {
      try {
      await atualizarUsuario(userId, { GravandoAlgumCapitulo: false });
      } catch (error) {
        console.error("Erro ao atualizar usuário:", error);
      }
       const capituloRef = doc(db, `Livros/${livroId}/capitulos/${idCapitulo}`);
      await updateDoc(capituloRef, { status: "gravacaoConcluida" });
      console.log(`Capítulo ${idCapitulo} atualizado com sucesso.`);
    } else {
      console.log(`Capítulo ${idCapitulo} ainda possui subcapítulos não gravados.`);
    }

  } catch (error) {
    console.error("Erro ao verificar ou atualizar:", error);
  }
}