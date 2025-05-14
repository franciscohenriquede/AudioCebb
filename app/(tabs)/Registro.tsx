import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { registerUser } from "../../Src/FireBase/FireBase";  // ajuste esse caminho se necessário

export default function Cadastro() {
  const [email, setEmail] = useState("");
  const [confirmaEmail, setConfirmaEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmaSenha, setConfirmaSenha] = useState("");

  const handleRegistro = async () => {
    if (email !== confirmaEmail) {
      Alert.alert("Erro", "Os e-mails não coincidem!");
      return;
    }
    if (senha !== confirmaSenha) {
      Alert.alert("Erro", "As senhas não coincidem!");
      return;
    }

    try {
      await registerUser(email, senha);
      Alert.alert("Sucesso", "Cadastro realizado com sucesso!");
      // Se quiser limpar os campos depois:
      setEmail("");
      setConfirmaEmail("");
      setSenha("");
      setConfirmaSenha("");
    } catch (error) {
      Alert.alert("Erro no registro", error.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.intro}>
        Olá! Vamos fazer seu cadastro — é super rápido! Basta informar seu e-mail e criar uma senha.
        Para sua segurança, escolha uma senha diferente da que você usa no e-mail ou em outras redes sociais.
      </Text>

      <Text style={styles.label}>Email:</Text>
      <TextInput
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        placeholder="Digite seu email"
        keyboardType="email-address"
      />

      <Text style={styles.label}>Confirma Email:</Text>
      <TextInput
        style={styles.input}
        value={confirmaEmail}
        onChangeText={setConfirmaEmail}
        placeholder="Confirme seu email"
        keyboardType="email-address"
      />

      <Text style={styles.label}>Senha:</Text>
      <TextInput
        style={styles.input}
        value={senha}
        onChangeText={setSenha}
        placeholder="Digite sua senha"
        secureTextEntry
      />

      <Text style={styles.label}>Confirma Senha:</Text>
      <TextInput
        style={styles.input}
        value={confirmaSenha}
        onChangeText={setConfirmaSenha}
        placeholder="Confirme sua senha"
        secureTextEntry
      />

      <TouchableOpacity style={styles.button} onPress={handleRegistro}>
        <Text style={styles.buttonText}>Efetuar Registro!</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: "#ddd",
    flex: 1,
    justifyContent: "center",
  },
  intro: {
    fontSize: 14,
    color: "#333",
    marginBottom: 20,
    textAlign: "justify",
  },
  label: {
    fontSize: 14,
    color: "#333",
    marginBottom: 5,
  },
  input: {
    backgroundColor: "#fff",
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 4,
    padding: 10,
    marginBottom: 15,
  },
  button: {
    backgroundColor: "rgb(141, 36, 49)",
    padding: 12,
    borderRadius: 4,
    alignItems: "center",
  },
  buttonText: {
    color: "rgb(255, 255, 255)",
    fontWeight: "bold",
  },
});
