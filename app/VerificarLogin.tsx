import React, { useEffect } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { app } from '../Src/FireBase/FireBase';

const VerificarLogin = () => {
  useEffect(() => {
    const auth = getAuth(app);

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        console.log("✅ Usuário logado:", user.email);
      } else {
        console.log("❌ Nenhum usuário logado.");
      }
    });

    // Remove o listener quando o componente desmonta
    return () => unsubscribe();
  }, []);

  return null; // Você pode colocar isso em qualquer tela ou componente
};

export default VerificarLogin;