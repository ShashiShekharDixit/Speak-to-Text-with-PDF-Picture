let recognition = null;
let isRecording = false;
let hasPermission = false;

async function requestMicrophonePermission() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach((track) => track.stop());
    hasPermission = true;
    document.getElementById("permissionBtn").disabled = true;
    document.getElementById("startBtn").disabled = false;
    updateStatus(
      "Microphone access granted! You can now start recording.",
      "success"
    );
    initializeSpeechRecognition();
  } catch (error) {
    updateStatus(
      "Microphone access denied. Please allow access and try again.",
      "error"
    );
  }
}

function initializeSpeechRecognition() {
  const language = document.getElementById("language").value;

  if (
    !("webkitSpeechRecognition" in window) &&
    !("SpeechRecognition" in window)
  ) {
    updateStatus(
      "Speech recognition is not supported in this browser. Please use Chrome or Edge.",
      "error"
    );
    return;
  }

  recognition = new (window.SpeechRecognition ||
    window.webkitSpeechRecognition)();
  recognition.lang = language;
  recognition.continuous = true;

  recognition.onstart = () => {
    updateStatus("Recording... Speak now.", "recording");
    document.getElementById("startBtn").disabled = true;
    document.getElementById("stopBtn").disabled = false;
  };

  recognition.onend = () => {
    if (isRecording) recognition.start();
    else {
      updateStatus("Recording stopped.", "success");
      document.getElementById("startBtn").disabled = false;
      document.getElementById("stopBtn").disabled = true;
      document.getElementById("downloadBtn").disabled = false;
    }
  };

  recognition.onresult = (event) => {
    let transcript = "";
    for (let i = event.resultIndex; i < event.results.length; i++) {
      if (event.results[i].isFinal)
        transcript += event.results[i][0].transcript + " ";
    }
    document.getElementById("output").value += transcript;
  };

  recognition.onerror = (event) => {
    updateStatus("Error: " + event.error, "error");
    isRecording = false;
  };
}

function startRecording() {
  if (!hasPermission) return requestMicrophonePermission();
  recognition.start();
  isRecording = true;
}

function stopRecording() {
  if (isRecording && recognition) {
    recognition.stop();
    isRecording = false;
  }
}

function downloadOutput() {
  const text = document.getElementById("output").value.trim();
  const format = document.getElementById("outputFormat").value;

  if (!text) {
    updateStatus("No text available to download.", "error");
    return;
  }

  if (format === "pdf") downloadPDF(text);
  else downloadPicture(text);
}

function downloadPDF(text) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  const lines = doc.splitTextToSize(text, 180);
  let y = 10;

  lines.forEach((line) => {
    if (y > 280) {
      doc.addPage();
      y = 10;
    }
    doc.text(10, y, line);
    y += 10;
  });

  doc.save("speech-to-text.pdf");
  updateStatus("PDF downloaded successfully!", "success");
}

function downloadPicture(text) {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  canvas.width = 800;
  canvas.height = 600;

  context.fillStyle = "#fff";
  context.fillRect(0, 0, canvas.width, canvas.height);

  context.fillStyle = "#000";
  context.font = "20px Arial";
  context.fillText(text, 10, 30, canvas.width - 20);

  const link = document.createElement("a");
  link.download = "speech-to-text.png";
  link.href = canvas.toDataURL();
  link.click();

  updateStatus("Picture downloaded successfully!", "success");
}

function updateStatus(message, type = "") {
  const status = document.getElementById("status");
  status.textContent = message;
}
