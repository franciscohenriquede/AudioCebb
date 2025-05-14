import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert } from "react-native";

export default function explore(): JSX.Element {
  const [email, setEmail] = useState<string>("");

  const handleRegister = (): void => {
    if (!email) {
      Alert.alert("Por favor, insira um email.");
      return;
    }
    Alert.alert("✅ Cadastro realizado", `Email cadastrado: ${email}`);
    setEmail("");
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        <Text style={styles.title}>📖 Projeto de Leitura Acessível</Text>

        <View style={styles.card}>
          <Text style={styles.text}>
            Olá. Queremos com este projeto que as pessoas com deficiência visual possam entrar em contato com os ensinamentos do Dharma.
            Que possamos gerar méritos contribuindo para esse projeto e que a leitura seja significativa em seu dia.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.text}>
            1️⃣ As gravações são divididas em blocos de 3 a 5 minutos. Inicie e finalize cada bloco com cuidado. 
            Você poderá revisar e aprovar seus próprios áudios.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.text}>
            2️⃣ Desejamos gravações orgânicas. Por favor, use apenas sua voz, sem ajuda de inteligência artificial.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.text}>
            3️⃣ Sugestão: use um computador para facilitar a leitura. Você pode ler com um livro físico ou diretamente no app. 
            Grave em um ambiente tranquilo.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.text}>
            4️⃣ Registre seu email abaixo para receber notificações sobre o andamento do projeto.
          </Text>
        </View>

      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    backgroundColor: "#f9f5f0",
    padding: 20,
  },
  container: {
    flex: 1,
    alignItems: "center",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#4a2c2a",
    textAlign: "center",
  },
  card: {
    backgroundColor: "#fff8ec",
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    width: "100%",
    borderLeftWidth: 6,
    borderLeftColor: "#d2962a",
    elevation: 2,
  },
  text: {
    fontSize: 16,
    color: "#333",
    lineHeight: 22,
  },
  inputContainer: {
    width: "100%",
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 12,
    borderRadius: 8,
    marginRight: 10,
    backgroundColor: "#fff",
    fontSize: 16,
  },
  button: {
    backgroundColor: "#8B0000",
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 8,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
  },
});
