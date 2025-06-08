import { initializeApp } from "firebase/app";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { getFirestore, collection, addDoc, doc, setDoc, getDoc } from "firebase/firestore"; // Adicionando o getDoc
import { getAnalytics } from "firebase/analytics";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendEmailVerification } from "firebase/auth";
import { query, where, getDocs } from "firebase/firestore";

// 🔥 Configuração do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDZ7wmYUFgUC3WV_WTS77VRdSUHJaHy32o",
  authDomain: "audiobooks-b7d84.firebaseapp.com",
  projectId: "audiobooks-b7d84",
  storageBucket: "audiobooks-b7d84.firebasestorage.app",
  messagingSenderId: "302455004711",
  appId: "1:302455004711:web:d9604ac3d732fcfe58f802",
  measurementId: "G-M9ET95HCRK"
};

// 🔥 Inicializa Firebase apenas uma vez
const app = initializeApp(firebaseConfig);

// ✅ Apenas inicializa Analytics no navegador
let analytics;
if (typeof window !== "undefined") {
  analytics = getAnalytics(app);
}

const auth = getAuth(app);
const storage = getStorage(app);
const db = getFirestore(app);

// 📤 Função para fazer upload do áudio para Firebase Storage
export const uploadAudio = async (uri, capituloId, subcapituloId) => {
  try {
    const response = await fetch(uri);
    const blob = await response.blob();
    const filename = `audio_${Date.now()}.m4a`;

    const path = `audios/${capituloId}/${subcapituloId}/${filename}`;
    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, blob);

    const downloadURL = await getDownloadURL(storageRef);
    console.log("✅ Upload concluído! URL:", downloadURL);
    return downloadURL;
  } catch (error) {
    console.error("❌ Erro no upload:", error);
    return null;
  }
};



// 🔍 Buscar Capítulo por ID


// 📂 Função para salvar URL do áudio no Firestore
export const saveAudioUrl = async (downloadURL, livroId, capituloId, subcapituloId) => {
  if (!downloadURL || !livroId || !capituloId || !subcapituloId) {
    console.error("❌ Parâmetros faltando em saveAudioUrl", {
      downloadURL, livroId, capituloId, subcapituloId
    });
    return;
  }

  try {
    const subcapRef = doc(
      db,
      'Livros', livroId,
      'capitulos', capituloId,
      'subcapitulos', subcapituloId
    );

    await setDoc(subcapRef, {
      audioUrl: downloadURL,
      audioTimestamp: Date.now()
    }, { merge: true });

    console.log("✅ Áudio vinculado ao subcapítulo com sucesso!");
  } catch (error) {
    console.error("❌ Erro ao salvar URL no Firestore:", error);
  }
};

// ✅ Função para registrar usuário

export const registerUser = async (email, senha) => {
  try {
    // 1. Verifica se já existe usuário com o mesmo e-mail no Firestore
    const usuariosRef = collection(db, "Usuarios");
    const q = query(usuariosRef, where("email", "==", email));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const error = new Error("Este e-mail já está registrado.");
      error.code = "auth/email-already-in-use";
      throw error;
    }

    // 2. Cria o usuário no Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, email, senha);
    const user = userCredential.user;

    // 3. Envia email de verificação
    await sendEmailVerification(user);

    // 4. Cria documento do usuário no Firestore
    const userDocRef = doc(db, "Usuarios", user.uid);
    await setDoc(userDocRef, {
      email: user.email,
      criadoEm: new Date(),
        GravandoAlgumCapitulo: false, 
         uid: user.uid,//
    });

    console.log("✅ Usuário registrado e dados salvos com sucesso");

  } catch (error) {
    console.error("❌ Erro ao registrar o usuário:", error.message);
    throw error;  // Importante para o front poder capturar e mostrar mensagens
  }
};


// ✅ Função para login
export const signInUser = async (email, senha ) => {
  const userCredential = await signInWithEmailAndPassword(auth, email, senha);
  const user = userCredential.user;

  // 🔄 Atualiza os dados do usuário para garantir que a verificação esteja atualizada
  await user.reload();

  if (!user.emailVerified) {
    console.warn("❌ Email ainda não foi verificado.");
    throw new Error("E-mail não verificado. Por favor, acesse sua caixa de entrada e clique no link de confirmação enviado.");
  }

  return user;
};

// 📂 Atualiza os dados de um usuário
export const atualizarUsuario = async (userId, data) => {
  try {
    const usuarioRef = doc(db, "Usuarios", userId);
    await setDoc(usuarioRef, data, { merge: true });

    console.log(`✅ Usuário ${userId} atualizado com sucesso.`);
  } catch (error) {
    console.error(`❌ Erro ao atualizar usuário ${userId}:`, error);
  }
};

// 🔍 Função para buscar os dados do usuário (nome, GravandoAlgumCapitulo e id do Firestore)

export const buscarDadosUsuario = async (userId) => {
  try {
    // Referência ao documento do usuário no Firestore
    const usuarioRef = doc(db, "Usuarios", userId);

    // Buscando o documento
    const usuarioDoc = await getDoc(usuarioRef);

    if (usuarioDoc.exists()) {
      const usuarioData = usuarioDoc.data();
      const { email, GravandoAlgumCapitulo, nome } = usuarioData; // Supondo que esses campos estejam no documento do usuário

      return {
        id: userId,
        nome: nome || "Nome não informado", // Verifique se existe o campo 'nome'
        GravandoAlgumCapitulo: GravandoAlgumCapitulo || false, // GravandoAlgumCapitulo, ou um valor padrão (false)
        email: email || "Email não informado" // Caso você queira incluir o email também
      };
    } else {
      console.log("❌ Usuário não encontrado.");
      return null;
    }
  } catch (error) {
    console.error("❌ Erro ao buscar dados do usuário:", error);
    return null;
  }
};

// 🔄 Exportações úteis
export { app, auth, db, storage, firebaseConfig };
