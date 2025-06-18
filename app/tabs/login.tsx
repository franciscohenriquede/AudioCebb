import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Modal, Platform } from 'react-native';
import { getAuth, sendPasswordResetEmail, signInWithEmailAndPassword } from 'firebase/auth';
import { useRouter } from 'expo-router';
import { signInUser } from '@/Src/FireBase/FireBase';

const Login = () => {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [mensagemErro, setMensagemErro] = useState('');
  const [mostrarModal, setMostrarModal] = useState(false);
  const [emailParaRecuperar, setEmailParaRecuperar] = useState('');
  const router = useRouter();
  const auth = getAuth();

  const handleRegistro = () => {
    router.push('/tabs/registro');
  };

  const enviarRecuperacaoSenha = async () => {
    try {
      await sendPasswordResetEmail(auth, emailParaRecuperar);
      setMostrarModal(false);
      setMensagemErro('✅ Um e-mail de recuperação de senha foi enviado para sua caixa de entrada.');
    } catch (error) {
      console.error('Erro ao enviar e-mail de recuperação:', error);
      setMensagemErro('❌ Não foi possível enviar o e-mail de recuperação.');
    }
  };

  const handleLogin = async () => {
    if (!email || !senha) {
      setMensagemErro("⚠️ Preencha todos os campos.");
      return;
    }

    try {
      await  signInUser(email, senha )
      setMensagemErro('');
      router.push('/main/Principal');''
    } catch (error: any) {
      console.log("Erro de login:", error.code);

      let mensagem = "Erro ao fazer login. Verifique seus dados.";

      switch (error.code) {
        case 'auth/user-not-found':
        case 'auth/wrong-password':
        case 'auth/invalid-credential':
          mensagem = "E-mail ou senha incorretos.";
          setEmailParaRecuperar(email);
          setMostrarModal(true);
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
      <Text style={styles.title}>🎙️❤️☸️​​ Vozes do Dharma</Text>

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

      {/* Modal de Recuperação de Senha */}
      <Modal visible={mostrarModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Recuperação de Senha</Text>
            <Text style={styles.modalMessage}>
              senha ou email errado. Deseja tentar novamente ou quer que enviemos um e-mail de recuperação de senha?
            </Text>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: '#666' }]}
                onPress={() => setMostrarModal(false)}
              >
                <Text style={styles.buttonText}>Tentar Novamente</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: '#228B22' }]}
                onPress={enviarRecuperacaoSenha}
              >
                <Text style={styles.buttonText}>Enviar E-mail</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  modalOverlay: {
    flex: 1,
    backgroundColor: '#000000aa',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
 modalContent: {
  backgroundColor: '#fff',
  borderRadius: 12,
  padding: 20, // Reduzi um pouco
  width: '70%', // De '90%' para '70%'
  alignItems: 'center',
},
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#500000',
  },
  modalMessage: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  modalButton: {
    flex: 1,
    padding: 12,
    marginHorizontal: 5,
    borderRadius: 8,
    alignItems: 'center',
  },
});
