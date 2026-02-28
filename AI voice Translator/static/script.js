const recordBtn = document.getElementById("recordBtn");
const uploadBtn = document.getElementById("uploadBtn"); // Naya
const audioFileInput = document.getElementById("audioFile"); // Naya
const resultDiv = document.getElementById("result");
const audioPlayer = document.getElementById("audioPlayer");
const languageSelect = document.getElementById("language");

let mediaRecorder;
let audioChunks = [];

// --- Recording Logic ---
recordBtn.addEventListener("click", async () => {
    if (!mediaRecorder || mediaRecorder.state === "inactive") {
        startRecording();
    } else {
        stopRecording();
    }
});

async function startRecording() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(stream);
        audioChunks = [];
        mediaRecorder.start();
        recordBtn.textContent = "⏹ Stop Recording";
        recordBtn.className = "stop";
        mediaRecorder.ondataavailable = e => audioChunks.push(e.data);
        mediaRecorder.onstop = () => {
            const blob = new Blob(audioChunks, { type: "audio/webm" });
            sendAudio(blob);
        };
    } catch (err) {
        alert("Microphone access denied.");
    }
}

function stopRecording() {
    mediaRecorder.stop();
    recordBtn.textContent = "🎤 Start Recording";
    recordBtn.className = "record";
}

// --- 🔼 Upload Logic (Naya Addition) ---
uploadBtn.addEventListener("click", () => {
    const file = audioFileInput.files[0];
    if (!file) {
        alert("Pehle koi audio file select karein!");
        return;
    }
    sendAudio(file); // File ko backend bhejna
});

// --- Server Communication ---
async function sendAudio(audioData) {
    const formData = new FormData();
    // Agar data Blob hai (recording) ya File object (upload), dono chalenge
    formData.append("audio", audioData, "audio_input.wav");
    formData.append("target", languageSelect.value);

    resultDiv.innerHTML = "Processing... ⏳ (Please wait)";

    try {
        const res = await fetch("/translate", { method: "POST", body: formData });
        const data = await res.json();

        if (data.error) {
            resultDiv.innerHTML = `<span style="color:red">${data.error}</span>`;
            return;
        }

        // Backend ke response keys se match karna zaroori hai
        resultDiv.innerHTML = `
            <p><b>You said:</b> ${data.original}</p>
            <p><b>Translation:</b> ${data.translated}</p>
        `;

        audioPlayer.src = data.audio_url;
        audioPlayer.play(); // Auto-play translation
    } catch (err) {
        resultDiv.innerHTML = `<span style="color:red">Server error!</span>`;
    }
}