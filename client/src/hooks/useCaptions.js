import { useRef, useState, useCallback, useEffect } from "react";

// Maps the human-readable language names used elsewhere in the app (see
// client/src/data/languages.js) to the BCP-47 locale codes the Web Speech
// API expects. This is the language the SELLER is speaking — separate from
// (and unrelated to) the language each CUSTOMER picks for their translated
// captions (see LiveSession.jsx) — accurate speech-to-text has to match the
// actual spoken language, or a Hindi sentence just comes out as English
// gibberish before translation ever gets a chance to run.
const RECOGNITION_LOCALES = {
  Hindi: "hi-IN",
  English: "en-IN",
  Bengali: "bn-IN",
  Marathi: "mr-IN",
  Telugu: "te-IN",
  Tamil: "ta-IN",
  Gujarati: "gu-IN",
  Kannada: "kn-IN",
  Malayalam: "ml-IN",
  Punjabi: "pa-IN",
  Odia: "or-IN",
  Assamese: "as-IN",
};

/**
 * Wraps the browser's built-in SpeechRecognition (Web Speech API) to turn the
 * seller's live mic audio into text chunks locally, with no server round trip
 * needed for the speech-to-text step itself. Only Chrome/Edge support this
 * reliably today, so the hook exposes `isSupported` and the UI should degrade
 * gracefully (hide the captions toggle) when it's false.
 */
export function useCaptions(onChunk) {
  const [isSupported] = useState(() => "webkitSpeechRecognition" in window || "SpeechRecognition" in window);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);

  const start = useCallback(
    (spokenLanguage = "Hindi") => {
      if (!isSupported) return;
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = false;
      recognition.lang = RECOGNITION_LOCALES[spokenLanguage] || "en-IN";

      recognition.onresult = (event) => {
        const last = event.results[event.results.length - 1];
        if (last.isFinal) {
          const text = last[0].transcript.trim();
          if (text) onChunk(text);
        }
      };

      recognition.onerror = (event) => {
        console.warn("Speech recognition error:", event.error);
      };

      recognition.onend = () => {
        // auto-restart while the seller has captions toggled on (browsers stop
        // the recognizer after periods of silence)
        if (recognitionRef.current === recognition) {
          try {
            recognition.start();
          } catch {
            /* already stopped elsewhere */
          }
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
      setIsListening(true);
    },
    [isSupported, onChunk]
  );

  const stop = useCallback(() => {
    if (recognitionRef.current) {
      const recognition = recognitionRef.current;
      recognitionRef.current = null; // clear first so onend doesn't auto-restart
      recognition.stop();
    }
    setIsListening(false);
  }, []);

  useEffect(() => stop, [stop]);

  return { isSupported, isListening, start, stop };
}