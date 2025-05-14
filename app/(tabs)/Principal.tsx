import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Image } from "react-native";
import { useRouter } from 'expo-router';
import { useNavigation } from '@react-navigation/native';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { app } from '../../Src/FireBase/FireBase';

export default function AccessiblePage(): JSX.Element {
  const navigation = useNavigation();
  const router = useRouter();
  const auth = getAuth(app);
  const db = getFirestore(app);
  const [progress, setProgress] = useState(0);
  const totalCapitulos = 11; // fixo

useEffect(() => {
  const unsubscribe = onAuthStateChanged(auth, (user) => {
    if (!user) {
      navigation.replace('Login');
    }
  });

  calcularProgresso();

  const interval = setInterval(() => {
    calcularProgresso();
  }, 2000); // atualiza a cada 10 segundos

  return () => {
    unsubscribe();
    clearInterval(interval); // limpa o intervalo ao sair da tela
  };
}, []);

  const calcularProgresso = async () => {
    try {
      const livroId = "LivroId"; // substitua pelo ID real do seu livro
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
    } catch (error) {
      console.error("Erro ao calcular progresso:", error);
    }
  };

  return (
    <View style={styles.container}>
      <Image source={require("../../assets/images/app.png")} style={styles.image} />

      <View style={styles.progressBarContainer}>
        <View style={styles.progressBar}>
          <View style={{ ...styles.progress, width: `${progress}%` }} />
        </View>
        <Text style={styles.progressText}>{progress}%</Text>
      </View>

      <TouchableOpacity
        style={styles.greenButton}
        onPress={() => router.push('/Capitulos')}
      >
        <Text style={styles.buttonText}>Contribuir com as gravações</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.goldButton}>
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
    height: 10,
    backgroundColor: '#eee',
    borderRadius: 5,
    overflow: 'hidden',
  },
  progress: {
    height: 10,
    backgroundColor: '#27ae60',
  },
  progressText: {
    textAlign: 'right',
    marginTop: 5,
    fontWeight: 'bold',
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
