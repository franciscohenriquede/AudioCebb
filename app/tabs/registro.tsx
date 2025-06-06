import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import { registerUser } from "../../Src/FireBase/FireBase";  // ajuste esse caminho se necessário
import { useRouter } from "expo-router";

export default function Cadastro() {
  const [email, setEmail] = useState("");
  const [confirmaEmail, setConfirmaEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmaSenha, setConfirmaSenha] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [tipoMensagem, setTipoMensagem] = useState(""); // "erro" ou "sucesso"
  const [mostrarFormulario, setMostrarFormulario] = useState(true);

  const router = useRouter();

  const handleRegistro = async () => {
    setMensagem("");
    setTipoMensagem("");

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email || !confirmaEmail || !senha || !confirmaSenha) {
      setMensagem("Por favor, preencha todos os campos.");
      setTipoMensagem("erro");
      return;
    }

    if (!emailRegex.test(email)) {
      setMensagem("Digite um e-mail válido.");
      setTipoMensagem("erro");
      return;
    }

    if (email !== confirmaEmail) {
      setMensagem("Os e-mails não coincidem!");
      setTipoMensagem("erro");
      return;
    }

    if (senha.length < 6) {
      setMensagem("A senha deve ter no mínimo 6 caracteres.");
      setTipoMensagem("erro");
      return;
    }

    if (senha !== confirmaSenha) {
      setMensagem("As senhas não coincidem!");
      setTipoMensagem("erro");
      return;
    }

    try {
      await registerUser(email, senha);
      setMensagem("✅ Cadastro concluído com sucesso! \nEnviamos um link de verificação para o seu e-mail. \n ckick nele para verificar\n 📬 Verifique sua caixa de entrada (e spam também). \n Você será redirecionado para a tela de login em instantes...");
      setTipoMensagem("sucesso");

      // Esconde o formulário
      setMostrarFormulario(false);

      // Após 3 segundos redireciona para Login
      setTimeout(() => {
        router.push("/Login");
      }, 6000);
    } catch (error) {
      if (error.code === "auth/email-already-in-use") {
        setMensagem("Este e-mail já está em uso. Tente outro.");
      } else if (error.code === "auth/invalid-email") {
        setMensagem("E-mail inválido.");
      } else if (error.code === "auth/weak-password") {
        setMensagem("A senha é muito fraca.");
      } else {
        setMensagem("Erro ao registrar. Tente novamente.");
      }
      setTipoMensagem("erro");
    }
  };

  return (
    <View style={styles.container}>
      {mostrarFormulario ? (
        <>
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

          {mensagem !== "" && (
            <Text style={[styles.mensagem, tipoMensagem === "erro" ? styles.erro : styles.sucesso]}>
              {mensagem}
            </Text>
          )}

          <TouchableOpacity style={styles.button} onPress={handleRegistro}>
            <Text style={styles.buttonText}>Efetuar Registro!</Text>
          </TouchableOpacity>
        </>
      ) : (
        // Aqui mostramos só a mensagem após o registro e esconder o formulário
        <Text style={[styles.mensagem, styles.sucesso]}>{mensagem}</Text>
      )}
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
mensagem: {
  marginBottom: 15,
  textAlign: "center",
  fontSize: 14,
  padding: 12,
  borderRadius: 8,
// verde escuro ou vermelho escuro
  borderLeftWidth: 5,
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.1,
  shadowRadius: 4,
  elevation: 3,
},
  erro: {
    backgroundColor: "#ffe6e6",
    color: "#cc0000",
    borderColor: "#cc0000",
    borderWidth: 1,
  },
  sucesso: {
    backgroundColor: "#e6ffea",
    color: "#006600",
    borderColor: "#006600",
    borderWidth: 1,
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
