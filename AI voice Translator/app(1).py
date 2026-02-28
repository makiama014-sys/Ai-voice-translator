import os
import tempfile
from flask import Flask, render_template, request, jsonify, send_file
from faster_whisper import WhisperModel
from deep_translator import GoogleTranslator
from gtts import gTTS

app = Flask(__name__)

# Base model download hone mein fast hai aur accurate hai
print("Loading Whisper model (base)...")
model = WhisperModel("base", device="cpu", compute_type="int8")

@app.route("/")
def home():
    return render_template("index.html")

@app.route("/translate", methods=["POST"])
def translate_audio():
    target_lang = request.form.get("target", "en")

    if "audio" not in request.files:
        return jsonify({"error": "No audio file"}), 400

    audio_file = request.files["audio"]

    with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as tmp:
        audio_path = tmp.name
        audio_file.save(audio_path)

    try:
        # 🔥 FIX: Hum yahan 'language="ur"' specify kar rahe hain 
        # Taake Whisper Hindi script ki jagah Urdu script (Perso-Arabic) use kare.
        segments, info = model.transcribe(audio_path, language="ur", beam_size=5)
        
        original_text = " ".join([seg.text for seg in segments]).strip()

        if not original_text:
            return jsonify({"error": "Awaaz samajh nahi aai."}), 400

        # Translation
        translated_text = GoogleTranslator(source="auto", target=target_lang).translate(original_text)

        # Text to Speech
        tts = gTTS(text=translated_text, lang=target_lang)
        output_temp_path = tempfile.NamedTemporaryFile(delete=False, suffix=".mp3").name
        tts.save(output_temp_path)

        if os.path.exists(audio_path):
            os.remove(audio_path)

        return jsonify({
            "detected_language": "Urdu",
            "original": original_text,     # Ab yahan Urdu script aayegi
            "translated": translated_text,
            "audio_url": f"/audio/{os.path.basename(output_temp_path)}"
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/audio/<filename>")
def audio(filename):
    path = os.path.join(tempfile.gettempdir(), filename)
    return send_file(path, mimetype="audio/mpeg")

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)