import React, { useEffect, useState } from "react";
import { View, Text, Platform, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Modal } from "react-native";
import * as ExpoAV from "expo-av";
import { useLocalSearchParams } from "expo-router";
import { WebView } from "react-native-webview";
import { uploadAudio, saveAudioUrl } from "../Src/FireBase/FireBase";
import SubCapituloService, { buscarSubCapituloPorIdAtributo } from "../Src/FireBase/subCapitulosService";
import linksPorCapitulo from "../app/PdfLInks";
import * as DocumentPicker from "expo-document-picker";
import { buscarCapituloPorIdAtributo, verificarSubcapitulosEAtualizarCapitulo } from "@/Src/FireBase/CapituloService";
import { getFirestore, collection, addDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes } from 'firebase/storage';

const livroId = 'LivroId';

export default function Studio() {
  const { capituloId, subcapituloId} = useLocalSearchParams();
  const idNumero = Number(capituloId); // ✅ Agora está dentro do componente
  const [userId, setUserId] = useState<string | null>(null);
  const [recording, setRecording] = useState<any>(null);
  const [recordingUri, setRecordingUri] = useState("");
  const [uploading, setUploading] = useState(false);
  const [paused, setPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [intervalId, setIntervalId] = useState<any>(null);
  const [modalVisible, setModalVisible] = useState(true);  // Estado para o modal

  const importAudioFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "audio/*",
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (result?.assets && result.assets.length > 0) {
        const uri = result.assets[0].uri;
        setRecordingUri(uri);
        alert("Áudio importado com sucesso!");
      } else {
        console.log("Nenhum arquivo selecionado.");
      }
    } catch (err) {
      console.error("Erro ao importar áudio:", err);
    }
  };

  const checkAndUpdate = async () => {
    console.log("🧠 checkAndUpdate foi chamado com:", { livroId, idNumero });

    if (livroId && !isNaN(idNumero)) {
      const resultado = await buscarCapituloPorIdAtributo(livroId, idNumero);

      if (!resultado) {
        console.warn("Nenhum capítulo encontrado para esse idNúmero:", idNumero);
        return;
      }

      const idChave = resultado.docId;
      console.log("id base (param):", idNumero);
      console.log("id chave (docId):", idChave);

        await verificarSubcapitulosEAtualizarCapitulo(livroId, idChave, userId);
             
    } else {
      console.warn("❌ livroId ou idNumero estão indefinidos ou inválidos", { livroId, idNumero });
    }
  };






  useEffect(() => {
    
    console.log("Capítulo ID---::", capituloId);
        console.log("Capítulo ID---::", subcapituloId);
  }, [capituloId]);

  if (!capituloId) {
    return <Text style={{ color: "white", marginTop: 10 }}>Carregando parâmetros...</Text>;
  }

  const pdfURL = linksPorCapitulo[capituloId as string];

  if (!pdfURL) {
    return <Text style={{ color: "white", marginTop: 10 }}>❌ Capítulo não encontrado.</Text>;
  }

  const formatTime = (seconds: number) => {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${String(min).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  };

  const startRecording = async () => {
    try {
      if (Platform.OS === "web") {
        if (!navigator.mediaDevices) {
          return;
        }

        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        let audioChunks: Blob[] = [];

        mediaRecorder.ondataavailable = (event) => audioChunks.push(event.data);
        mediaRecorder.onstop = () => {
          const audioBlob = new Blob(audioChunks, { type: "audio/webm" });
          const audioUrl = URL.createObjectURL(audioBlob);
          setRecordingUri(audioUrl);
        };

        mediaRecorder.start();
        setRecording(mediaRecorder);
        setPaused(false);

        const interval = setInterval(() => setRecordingTime((t) => t + 1), 1000);
        setIntervalId(interval);
      } else {
        const { status } = await ExpoAV.Audio.requestPermissionsAsync();
        if (status !== "granted") {
          alert("Permissão negada!");
          return;
        }

        await ExpoAV.Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
        });

        const recordingObj = new ExpoAV.Audio.Recording();
        await recordingObj.prepareToRecordAsync(ExpoAV.Audio.RecordingOptionsPresets.HIGH_QUALITY);
        await recordingObj.startAsync();
        setRecording(recordingObj);
        setPaused(false);

        const interval = setInterval(() => setRecordingTime((t) => t + 1), 1000);
        setIntervalId(interval);
      }
    } catch (error) {
      console.error("Erro ao iniciar gravação:", error);
    }
  };

  const pauseRecording = async () => {
    if (!recording) return;

    if (Platform.OS === "web") {
      recording.pause();
    } else {
      await recording.pauseAsync();
    }

    clearInterval(intervalId);
    setPaused(true);
  };

  const resumeRecording = async () => {
    if (!recording) return;

    if (Platform.OS === "web") {
      recording.resume();
    } else {
      await recording.startAsync();
    }

    const interval = setInterval(() => setRecordingTime((t) => t + 1), 1000);
    setIntervalId(interval);
    setPaused(false);
  };

  const stopRecording = async () => {
    if (!recording) return;

    if (Platform.OS === "web") {
      recording.stop();
    } else {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecordingUri(uri || "");
    }

    setRecording(null);
    clearInterval(intervalId);
  };

  const cancelRecording = async () => {
    const confirmed = window.confirm('Se cancelar vai perder toda gravação. Cancelar mesmo assim?');
    if (recording) {
      try {
        if (Platform.OS !== "web") {
          alert("Nenhum áudio gravado!");
          await recording.stopAndUnloadAsync();
        } else if (confirmed) {
          recording.stop(); // web
        }
      } catch (e) {
        console.warn("Erro ao cancelar gravação:", e);
      }
    }

    clearInterval(intervalId);
    setRecording(null);
    setRecordingUri("");
    setRecordingTime(0);
    setPaused(false);
  };

  const playRecording = async () => {
    if (!recordingUri) {
      alert("Nenhum áudio gravado!");
      return;
    }

    try {
      if (Platform.OS === "web") {
        const audio = new Audio(recordingUri);
        audio.play();
      } else {
        const { sound } = await ExpoAV.Audio.Sound.createAsync({ uri: recordingUri });
        await sound.playAsync();
      }
    } catch (error) {
      console.error("Erro ao reproduzir áudio:", error);
    }
  };

  const uploadToFirebase = async () => {
    const confirmedSalvamento = window.confirm('o audio sera salvo no banco de dados , enviar?');
const CapituloChaveId = await buscarCapituloPorIdAtributo(livroId, Number(capituloId));
const subCapituloChaveId = await buscarSubCapituloPorIdAtributo(livroId, Number(subcapituloId), CapituloChaveId.docId);
    console.log("chaveobj" +capituloId , "  //// " + subcapituloId)
   
    if (!recordingUri) return;
    setUploading(true);

    try {
      const downloadURL = await uploadAudio(recordingUri, capituloId, subcapituloId);
      if (downloadURL && confirmedSalvamento) {
       console.log("✅ Confirmado:", confirmedSalvamento);
       console.log("✅ downloadURL:", downloadURL);

        await saveAudioUrl(recordingUri, livroId, CapituloChaveId?.docId, subCapituloChaveId?.docId);
        await SubCapituloService.atualizarRecordSubCapitulo( livroId, CapituloChaveId?.docId, subCapituloChaveId?.docId, true);
        console.log("🔔 Chamada saveAudioUrl com:", {
          downloadURL,
          livroId,
          CapituloChaveId,
          subCapituloChaveId
        });
          await checkAndUpdate();
        alert("Áudio salvo com sucesso!");

      } else {
        alert("Erro ao salvar áudio no Firebase.");
      }
    } catch (error) {
      console.error("Erro ao enviar áudio:", error);
    } finally {
      setUploading(false);
    }

  };
  const [currentModalIndex, setCurrentModalIndex] = useState(0);
const instrucoes = [
  "1️⃣ Que tal praticar um pouco de Shamata e Metta Bhavana? Intencione os estudos como um benefício para todos os seres.",
  "2️⃣ Agora vamos dar duas orientações importantes antes de iniciar a gravação:",
  "2️⃣ ✅ Clique em 'Gravar', fale por 3 a 5 segundos, pare a gravação e em seguida reproduza o áudio.",
  "2️⃣ ✅ Se a gravação estiver audível e com boa qualidade, clique em 'Cancelar' e só então comece a gravação do conteúdo real.",
  "3️⃣ Outra orientação importante: os PDFs estão organizados por capítulo, mas todos os subcapítulos ficam acessíveis na mesma tela.",
  "3️⃣ Por isso, é fundamental que você respeite o subcapítulo correspondente. Você está atualmente no capítulo: " + capituloId +", gravando o subCapitulo :" +subcapituloId,
  "4️⃣ Para ajudar, Caso seu capitulo possua mais de um  subCapitulo ao final do seu  subcapítulo  há um rio desenhado. Sempre que você visualizar este desenho:",
  "5️⃣ é porque você chegou a fim do subCapitulo. 🛑 Pare a gravação, ☁️ salve o áudio, ✅ aguarde a confirmação 'Salvo com sucesso!', 🔁 só então volte para a página de subcapítulos e escolha o próximo subcapítulo para gravar.",
  "6️⃣ É de extrema importância que esse processo seja respeitado para garantir que os áudios fiquem organizados e associados corretamente."


]

const avancarModal = () => {
  if (currentModalIndex < instrucoes.length - 1) {
    setCurrentModalIndex((prev) => prev + 1);
  } else {
    setModalVisible(false);
  }
};
  return (
  
  
  
  
  
  <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>🎙️ Estúdio de Gravação</Text>

      {/* Modal com a mensagem de introdução */}
      <Modal
  transparent={true}
  visible={modalVisible}
  animationType="fade"
  onRequestClose={() => setModalVisible(false)}
>
  <View style={styles.modalContainer}>
    <View style={styles.modalContent}>
      <Text style={styles.modalTitle}>🔊 Instrução {currentModalIndex + 1}</Text>
      <Text style={styles.modalText}>{instrucoes[currentModalIndex]}</Text>

      <TouchableOpacity style={styles.modalButton} onPress={avancarModal}>
        <Text style={styles.controlText}>
          {currentModalIndex < instrucoes.length - 1 ? "Próximo" : "OK, Entendi"}
        </Text>
      </TouchableOpacity>
    </View>
  </View>
</Modal>

      {Platform.OS === "web" ? (
        <iframe
          src={pdfURL}
          width="100%"
          height="500"
          style={{ border: "1px solid #ccc", marginTop: 10 }}
          title="Visualizador PDF"
        />
      ) : (
        <View style={{ height: 500, width: "100%", marginTop: 10 }}>
          <WebView source={{ uri: pdfURL }} style={{ flex: 1 }} originWhitelist={["*"]} />
        </View>
      )}

      <View style={styles.controls}>
        <TouchableOpacity
          style={[styles.controlButton, recording ? styles.btnStop : styles.btnRecord]}
          onPress={recording ? stopRecording : startRecording}
        >
          <Text style={styles.controlText}>{recording ? "⏹️ Parar" : "🎤 Gravar"}</Text>
        </TouchableOpacity>

        {recording && (
          paused ? (
            <TouchableOpacity style={styles.controlButton} onPress={resumeRecording}>
              <Text style={styles.controlText}>▶️ Continuar</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.controlButton} onPress={pauseRecording}>
              <Text style={styles.controlText}>⏸️ Pausar</Text>
            </TouchableOpacity>
          )
        )}

        {recordingUri !== "" && (
          <>
            <TouchableOpacity
              style={styles.controlButton}
              onPress={playRecording}
            >
              <Text style={styles.controlText}>▶️ Reproduzir</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.controlButton, uploading && styles.btnDisabled]}
              onPress={uploadToFirebase}
              disabled={uploading}
            >
              {uploading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.controlText}>☁️ Salvar</Text>
              )}
            </TouchableOpacity>
          </>
        )}

        <TouchableOpacity
          style={[styles.controlButton, styles.btnCancel]}
          onPress={cancelRecording}
          disabled={!recording && !recordingUri}
        >
          <Text style={styles.controlText}>❌ Cancelar</Text>
        </TouchableOpacity>
          
             

        <TouchableOpacity
          style={styles.controlButton}
          onPress={importAudioFile}
        >
          <Text style={styles.controlText}>📂 Importar Áudio</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.timeContainer}>
        <Text style={styles.timeText}>⏱️ Tempo: {formatTime(recordingTime)}</Text>
      </View>

      {recordingUri && (
        <Text style={styles.audioInfo}>🔗 URI: {recordingUri}</Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: "#121212",
    flexGrow: 1,
    alignItems: "center",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "white",
    marginBottom: 15,
  },
  controls: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    marginTop: 20,
    gap: 10,
  },
  controlButton: {
    padding: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    backgroundColor: "#333",
    margin: 5,
  },
  controlText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
  btnRecord: {
    backgroundColor: "#4CAF50",
  },
  btnStop: {
    backgroundColor: "#F44336",
  },
  btnCancel: {
    backgroundColor: "#9E9E9E",
  },
  btnDisabled: {
    backgroundColor: "#888",
  },
  timeContainer: {
    marginTop: 15,
    padding: 10,
    backgroundColor: "#222",
    borderRadius: 8,
  },
  timeText: {
    color: "#fff",
    fontSize: 16,
  },
  audioInfo: {
    color: "#ccc",
    fontSize: 12,
    marginTop: 10,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.7)",
  },
  modalContent: {
    width: 300,
    padding: 20,
    backgroundColor: "#fff",
    borderRadius: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 10,
  },
  modalText: {
    fontSize: 14,
    marginBottom: 20,
  },
  modalButton: {
    backgroundColor: "#4CAF50",
    paddingVertical: 10,
    borderRadius: 5,
    alignItems: "center",
  },


});

