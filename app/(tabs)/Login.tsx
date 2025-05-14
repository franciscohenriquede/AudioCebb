import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { signInUser } from "../../Src/FireBase/FireBase";
import { router } from 'expo-router';

const Login = () => {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [mensagemErro, setMensagemErro] = useState('');

  const handleRegistro = () => {
    router.push('/(tabs)/Registro');
  };

  const handleLogin = async () => {
    if (!email || !senha) {
      setMensagemErro("⚠️ Preencha todos os campos.");
      return;
    }

    try {
      await signInUser(email, senha);
      setMensagemErro('');
      router.push('/(tabs)/Principal');
    } catch (error: any) {
      console.log("Erro de login:", error.code);

      let mensagem = "Erro ao fazer login. Verifique seus dados.";

      switch (error.code) {
        case 'auth/user-not-found':
          mensagem = "Usuário não encontrado. Verifique o e-mail.";
          break;
        case 'auth/wrong-password':
          mensagem = "Senha incorreta. Tente novamente.";
          break;
        case 'auth/invalid-email':
          mensagem = "E-mail inválido. Verifique o formato.";
          break;
        default:
          mensagem = "Erro: " + error.message;
      }

      setMensagemErro(`❌ ${mensagem}`);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🎙️ Meu App de Áudio</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor="#fff"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />

      <TextInput
        style={styles.input}
        placeholder="Senha"
        placeholderTextColor="#fff"
        secureTextEntry
        value={senha}
        onChangeText={setSenha}
      />

      {mensagemErro !== '' && (
        <Text style={styles.erroTexto}>{mensagemErro}</Text>
      )}

      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>Entrar</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.buttonRegistro} onPress={handleRegistro}>
        <Text style={styles.buttonText}>Registrar</Text>
      </TouchableOpacity>
    </View>
  );
};

export default Login;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#500000',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 28,
    color: '#fff',
    marginBottom: 40,
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#fff',
    padding: 12,
    marginBottom: 20,
    borderRadius: 8,
    color: '#fff',
  },
  button: {
    backgroundColor: '#008000',
    padding: 15,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
    marginBottom: 10,
  },
  buttonRegistro: {
    backgroundColor: 'rgb(210, 150, 42)',
    padding: 10,
    borderRadius: 8,
    width: '60%',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
  },
  erroTexto: {
    color: '#ffcccb',
    backgroundColor: '#8b0000',
    padding: 10,
    marginBottom: 15,
    borderRadius: 5,
    textAlign: 'center',
    width: '100%',
  },
});
