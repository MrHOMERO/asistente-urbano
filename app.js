// Almacenamiento local para tarjetas dinámicas
let customCards = JSON.parse(localStorage.getItem('user_actions')) || [
  {
    id: "1",
    icon: "⚡",
    title: "Vencimiento de UTE",
    info: "Factura de septiembre: $2.850. Vence el 15.",
    fileData: null
  },
  {
    id: "2",
    icon: "🏍️",
    title: "Service del Vehículo",
    info: "Próximo cambio de aceite a los 15.000 km.",
    fileData: null
  }
];

let selectedEmoji = "⚡";
let isCommandMode = false; // Estado si la voz está atendiendo una orden

// Reconocimiento de Voz Continuo
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const SpeechSynthesis = window.speechSynthesis;
let recognition = null;

const assistantStatus = document.getElementById('assistant-status');
const voiceDot = document.getElementById('voice-dot');

function initContinuousSpeech() {
  if (!SpeechRecognition) {
    assistantStatus.innerText = "Reconocimiento de voz no soportado.";
    return;
  }

  recognition = new SpeechRecognition();
  recognition.lang = 'es-ES';
  recognition.continuous = true;
  recognition.interimResults = false;

  recognition.onstart = () => {
    voiceDot.className = "dot listening-bg";
  };

  recognition.onresult = (event) => {
    const lastIndex = event.results.length - 1;
    const text = event.results[lastIndex][0].transcript.toLowerCase().trim();
    console.log("Voz captada:", text);

    // MANDO DE ACTIVACIÓN SOLICITADO
    if (text.includes("encender micrófono") || text.includes("activar micrófono")) {
      isCommandMode = true;
      voiceDot.className = "dot active-bg";
      assistantStatus.innerText = "¡Micrófono activo y listo!";
      speak("El micrófono está funcionando, ¿qué deseas?");
      return;
    }

    // Procesar orden solo si ya se activó previamente con la palabra clave
    if (isCommandMode) {
      processVoiceAction(text);
    }
  };

  // Re-iniciar automáticamente si el navegador detiene el stream
  recognition.onend = () => {
    recognition.start();
  };

  recognition.onerror = () => {
    setTimeout(() => recognition.start(), 1000);
  };

  recognition.start();
}

function processVoiceAction(cmd) {
  assistantStatus.innerText = `Procesando: "${cmd}"`;

  if (cmd.includes("luz") || cmd.includes("vencimiento") || cmd.includes("factura")) {
    speak("Mostrando tus vencimientos y sucursales de pago cercanas.");
    showToast("Filtrando vencimientos de facturas...");
  } else if (cmd.includes("moto") || cmd.includes("service") || cmd.includes("auto")) {
    speak("Aquí tienes la información del mantenimiento de tu vehículo.");
    showToast("Abriendo módulo de vehículo...");
  } else {
    speak(`Buscando la información sobre ${cmd} en tus acciones guardadas.`);
  }

  // Finaliza el modo comando y vuelve a esperar la palabra clave "encender micrófono"
  setTimeout(() => {
    isCommandMode = false;
    voiceDot.className = "dot listening-bg";
    assistantStatus.innerText = 'Di "encender micrófono" para comenzar...';
  }, 4000);
}

function speak(text) {
  if (SpeechSynthesis) {
    SpeechSynthesis.cancel(); // Detiene audios previos
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'es-ES';
    SpeechSynthesis.speak(utterance);
  }
}

// RENDERIZADO DINÁMICO DE TARJETAS
function renderCards() {
  const container = document.getElementById('cards-container');
  container.innerHTML = '';

  customCards.forEach(card => {
    const cardEl = document.createElement('div');
    cardEl.className = 'card';
    cardEl.innerHTML = `
      <div class="card-header-row">
        <div class="card-title-box">
          <span class="card-icon">${card.icon}</span>
          <h3>${card.title}</h3>
        </div>
        <button class="btn-delete" onclick="deleteCard('${card.id}')">✕</button>
      </div>
      <p class="card-info-text">${card.info}</p>
      ${card.fileData ? `<img src="${card.fileData}" class="attachment-preview" alt="Adjunto">` : ''}
      <button class="card-btn-action" onclick="executeCardAction('${card.title}')">Ver Detalles / Pagar</button>
    `;
    container.appendChild(cardEl);
  });
}

function deleteCard(id) {
  customCards = customCards.filter(c => c.id !== id);
  localStorage.setItem('user_actions', JSON.stringify(customCards));
  renderCards();
  showToast("Acción eliminada");
}

function executeCardAction(title) {
  speak(`Abriendo la acción de ${title}. Buscando puntos de atención o detalles.`);
  showToast(`Ejecutando: ${title}`);
}

// LÓGICA DEL MODAL DE CREACIÓN
const modal = document.getElementById('modal-create');
document.getElementById('btn-open-modal').addEventListener('click', () => modal.classList.remove('hidden'));
document.getElementById('btn-close-modal').addEventListener('click', () => modal.classList.add('hidden'));

// Seleccionar Emoji
document.querySelectorAll('.emoji-btn').forEach(btn => {
  btn.addEventListener('click', (e) => {
    document.querySelectorAll('.emoji-btn').forEach(b => b.classList.remove('active'));
    e.target.classList.add('active');
    selectedEmoji = e.target.getAttribute('data-emoji');
  });
});

// Guardar Nueva Acción Personalizada
document.getElementById('form-create-card').addEventListener('submit', (e) => {
  e.preventDefault();
  
  const title = document.getElementById('card-title').value;
  const info = document.getElementById('card-info').value;
  const fileInput = document.getElementById('card-file');
  
  const saveAndClose = (fileData = null) => {
    const newCard = {
      id: Date.now().toString(),
      icon: selectedEmoji,
      title: title,
      info: info,
      fileData: fileData
    };

    customCards.push(newCard);
    localStorage.setItem('user_actions', JSON.stringify(customCards));
    renderCards();
    
    document.getElementById('form-create-card').reset();
    modal.classList.add('hidden');
    speak(`Nueva acción ${title} guardada con éxito`);
    showToast("Acción creada correctamente");
  };

  if (fileInput.files && fileInput.files[0]) {
    const reader = new FileReader();
    reader.onload = function(evt) {
      saveAndClose(evt.target.result);
    };
    reader.readAsDataURL(fileInput.files[0]);
  } else {
    saveAndClose();
  }
});

function showToast(msg) {
  const toast = document.getElementById('toast');
  toast.innerText = msg;
  toast.classList.remove('hidden');
  setTimeout(() => toast.classList.add('hidden'), 3000);
}

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
  renderCards();
  initContinuousSpeech();
});
