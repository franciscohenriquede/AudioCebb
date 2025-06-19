import React, { useState, useRef, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Image, Animated, Alert } from "react-native";
import { useRouter } from 'expo-router';
import { useNavigation } from '@react-navigation/native';
import { getAuth, onAuthStateChanged, User } from 'firebase/auth';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { app } from '../../Src/FireBase/FireBase';

export default function AccessiblePage(): JSX.Element {
  const navigation = useNavigation();
  const router = useRouter();
  const auth = getAuth(app);
  const db = getFirestore(app);

  const [progress, setProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const animatedProgress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log("onAuthStateChanged:", user?.email);

      if (!user) {
        console.log("Usuário não autenticado, redirecionando...");
        navigation.replace('Login');
      } else {
        console.log("Usuário autenticado:", user.email);
        setCurrentUser(user);  // Salva o usuário
      }

      setAuthChecked(true);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (authChecked && currentUser) {
      calcularProgresso();
    }
  }, [authChecked, currentUser]);

  useEffect(() => {
    if (isLoading) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(animatedProgress, {
            toValue: 80,
            duration: 1000,
            useNativeDriver: false,
          }),
          Animated.timing(animatedProgress, {
            toValue: 20,
            duration: 1000,
            useNativeDriver: false,
          }),
        ])
      ).start();
    } else {
      Animated.timing(animatedProgress, {
        toValue: progress,
        duration: 500,
        useNativeDriver: false,
      }).start();
    }
  }, [isLoading, progress]);

  const calcularProgresso = async () => {
    try {
      setIsLoading(true);
      const livroId = "LivroId"; // Confirme se este ID é válido!
      const capitulosRef = collection(db, `Livros/${livroId}/capitulos`);
      const snapshot = await getDocs(capitulosRef);

      let progresso = 0;

      for (const capitulo of snapshot.docs) {
        const capituloData = capitulo.data();

        if (capituloData.status === "gravando") {
          progresso += 1;
        }

        const subRef = collection(db, `Livros/${livroId}/capitulos/${capitulo.id}/subcapitulos`);
        const subSnap = await getDocs(subRef);

        subSnap.forEach((sub) => {
          if (sub.data().recorded === true) {
            progresso += 3;
          }
        });
      }

      const progressoFinal = Math.min(progresso, 100);
      setProgress(progressoFinal);
      setIsLoading(false);
    } catch (error: any) {
      console.error("Erro ao calcular progresso:", error.code, error.message);
      Alert.alert("Erro ao carregar progresso", error.message);
      setIsLoading(false);
    }
  };

  if (!authChecked) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Verificando autenticação...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Image source={require("../../assets/images/app.png")} style={styles.image} />

      <View style={styles.progressBarContainer}>
        <View style={styles.progressBar}>
          <Animated.View
            style={[
              styles.progress,
              {
                width: animatedProgress.interpolate({
                  inputRange: [0, 100],
                  outputRange: ["0%", "100%"],
                }),
              },
            ]}
          />
        </View>
        <Text style={styles.progressText}>
          {isLoading ? "🚀 Carregando missão..." : `${progress}% concluído`}
        </Text>
      </View>

      <TouchableOpacity
        style={styles.greenButton}
        onPress={() => router.push('/Capitulos')}
        disabled={isLoading}
      >
        <Text style={styles.buttonText}>
          {isLoading ? "Aguarde..." : "Contribuir com as gravações"}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.goldButton} disabled={isLoading}>
        <Text style={styles.buttonText}>Contribuir Com as Análises</Text>
      </TouchableOpacity>
    </View>
  );
}



const styles = StyleSheet.create({
  container: {
    padding: 20,
    flex: 1,
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  image: {
    width: 200,
    height: 200,
    alignSelf: 'center',
    marginBottom: 20,
  },
  progressBarContainer: {
    marginBottom: 20,
  },
  progressBar: {
    height: 12,
    backgroundColor: '#eee',
    borderRadius: 6,
    overflow: 'hidden',
  },
  progress: {
    height: 12,
    backgroundColor: '#27ae60',
  },
  progressText: {
    textAlign: 'center',
    marginTop: 8,
    fontWeight: 'bold',
    fontSize: 16,
  },
  greenButton: {
    backgroundColor: '#27ae60',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 10,
  },
  goldButton: {
    backgroundColor: '#f1c40f',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
