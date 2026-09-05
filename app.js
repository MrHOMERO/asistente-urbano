// Reconocimiento de voz por APIs nativas del navegador
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const SpeechSynthesis = window.speechSynthesis;

const btnVoice = document.getElementById('btn-voice');
const assistantStatus = document.getElementById('assistant-status');
const cameraInput = document.getElementById('camera-input');
const pdfInput = document.getElementById('pdf-input');

let recognition = null;

if (SpeechRecognition) {
  recognition = new SpeechRecognition();
  recognition.lang = 'es-ES';
  recognition.continuous = false;

  recognition.onstart = () => {
    btnVoice.classList.add('listening');
    assistantStatus.innerText = "Te escucho... Habla ahora";
  };

  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript.toLowerCase();
    processVoiceCommand(transcript);
  };

  recognition.onerror = () => {
    speak("No pude entenderte bien, por favor intenta de nuevo.");
    resetMicUI();
  };

  recognition.onend = () => {
    resetMicUI();
  };
} else {
  assistantStatus.innerText = "Reconocimiento de voz no soportado en este navegador.";
}

function resetMicUI() {
  btnVoice.classList.remove('listening');
  assistantStatus.innerText = "Presiona el micrófono o habla...";
}

// Procesador de Comandos de Voz
function processVoiceCommand(cmd) {
  assistantStatus.innerText = `Dijiste: "${cmd}"`;

  if (cmd.includes("luz") || cmd.includes("vencimiento") || cmd.includes("cuánto debo")) {
    speak("Tu factura de UTE vence el 15 de este mes y el importe es de 2.850 pesos. ¿Quieres ver los puntos de pago más cercanos?");
    showToast("Consulta: Vencimiento UTE ($2.850)");
  } else if (cmd.includes("moto") || cmd.includes("auto") || cmd.includes("service") || cmd.includes("aceite")) {
    speak("Anotado. El próximo mantenimiento de tu vehículo quedó programado para los 15.000 kilómetros.");
    showToast("Mantenimiento actualizado a los 15.000 km");
  } else {
    speak("Entendido. He registrado tu consulta en tu panel central.");
    showToast("Comando guardado");
  }
}

// Sintetizador de Voz (La App responde hablando)
function speak(text) {
  if (SpeechSynthesis) {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'es-ES';
    SpeechSynthesis.speak(utterance);
  }
}

// Evento al presionar el botón del micrófono
btnVoice.addEventListener('click', () => {
  if (recognition) {
    speak("Estoy lista para escucharte");
    setTimeout(() => recognition.start(), 1200);
  }
});

// Captura de Foto/Factura desde Cámara
cameraInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file) {
    showToast("Escaneando factura con la cámara...");
    speak("Procesando la foto de la factura. Extrayendo monto y vencimiento.");
  }
});

// Carga de PDF
pdfInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file) {
    showToast(`PDF cargado: ${file.name}`);
    speak("Documento PDF recibido. Se ha agregado a tu lista de vencimientos.");
  }
});

document.getElementById('btn-pay-location').addEventListener('click', () => {
  speak("Buscando las sucursales de Abitab y Redpagos más cercanas a tu ubicación.");
  showToast("Ubicando sucursales de pago cercanas...");
});

function showToast(msg) {
  const toast = document.getElementById('toast');
  toast.innerText = msg;
  toast.classList.remove('hidden');
  setTimeout(() => toast.classList.add('hidden'), 3500);
}
