import { useEffect, useState } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { useRouter } from 'expo-router';
import { View, Text, ActivityIndicator } from 'react-native';
import { app } from '../Src/FireBase/FireBase';

export default function Index() {
  const router = useRouter();
  const auth = getAuth(app);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        console.log("Usuário já autenticado, redirecionando para Principal");
        router.replace('/main/Principal');
      } else {
        console.log("Usuário não autenticado, indo para login");
        router.replace('/tabs/login');
      }
      setChecking(false);
    });

    return unsubscribe;
  }, []);

  if (checking) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
        <Text>Verificando autenticação...</Text>
      </View>
    );
  }

  return null;
}
