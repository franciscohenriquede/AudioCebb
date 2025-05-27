import Capitulos from "@/app/Capitulos";
import { getFirestore, collection, getDocs, query, where, doc, updateDoc } from "firebase/firestore";

const db = getFirestore();

const SubCapituloService = {
  // Busca subcapítulos de um capítulo específico
  async getSubcapitulosPorCapitulo(livroId: string, capituloId: number) {
    const capitulosRef = collection(db, `Livros/${livroId}/capitulos`);
    
    // 1. Primeiro, encontrar o documento que tenha o campo "id" igual ao capituloId
    const q = query(capitulosRef, where("id", "==", capituloId));
    const capitulosSnapshot = await getDocs(q);

    if (capitulosSnapshot.empty) {
      throw new Error("Capítulo não encontrado.");
    }

    // 2. Pegar o primeiro documento encontrado
    const capituloDoc = capitulosSnapshot.docs[0];
    const capituloDocId = capituloDoc.id;

    // 3. Agora acessar a coleção de subcapítulos
    const subcapitulosRef = collection(db, `Livros/${livroId}/capitulos/${capituloDocId}/subcapitulos`);
    const subcapitulosSnapshot = await getDocs(subcapitulosRef);

    return subcapitulosSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },

  
  async atualizarRecordSubCapitulo(livroId, capituloId, subCapituloId, novoValor: boolean): Promise<void> {
  const docRef = doc(db, `Livros/${livroId}/capitulos/${capituloId}/subcapitulos/${subCapituloId}`);
   console.log(`aqui antes ✅ Subcapítulo ${subCapituloId} do capítulo ${capituloId} atualizado: Record = ${novoValor}`);
  try {
    await updateDoc(docRef, {
      recorded: novoValor,
    });
    console.log(` ✅ Subcapítulo ${subCapituloId} do capítulo ${capituloId} atualizado: Record = ${novoValor}`);
  } catch (error) {
    console.error("Erro ao atualizar o campo Record:", error);
  }
}


};


export const buscarSubCapituloPorIdAtributo = async (
  livroId: string,
  valorDoId: number,
  capituloDocId: string,
): Promise<{ docId: string } | null> => {
  const subcapitulosRef = collection(db, `Livros/${livroId}/capitulos/${capituloDocId}/subcapitulos`);
  const q = query(subcapitulosRef, where("subcapituloId", "==", valorDoId)); // ou valorDoId.toString() se for string no Firestore
  const querySnapshot = await getDocs(q);

  if (!querySnapshot.empty) {
    const doc = querySnapshot.docs[0];
    return { docId: doc.id };
  }

  return null;
};

export default SubCapituloService;
export const resetarTodosSubCapitulos = async (
  livroId: string,
  capituloDocId : any
): Promise<void> => {
  try {
    const capitulosRef =   collection(db, `Livros/${livroId}/capitulos/${capituloDocId}/subcapitulos`);
    const snapshot = await getDocs(capitulosRef);

    if (snapshot.empty) {
      console.warn('Nenhum capítulo encontrado para resetar.');
      return;
    }

    const atualizacoes = snapshot.docs.map(async (docSnap) => {
      await updateDoc(docSnap.ref, {
        audioUrl: '',
        recorded: false 
      });
    });

    await Promise.all(atualizacoes);
    console.log(`✅ Todos os capítulos do livro ${livroId} foram resetados com sucesso.`);
  } catch (error) {
    console.error('❌ Erro ao resetar capítulos:', error);
  }

};
