import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

// Web Speech API types (lightweight)
type SR = any;

export default function VoiceAssistant() {
  const [open, setOpen] = useState(false);
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [reply, setReply] = useState("");
  const recogRef = useRef<SR>(null);
  const navigate = useNavigate();

  const supported = typeof window !== "undefined" &&
    ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);

  const speak = (text: string) => {
    if (!("speechSynthesis" in window)) return;
    const u = new SpeechSynthesisUtterance(text);
    u.onstart = () => setSpeaking(true);
    u.onend = () => setSpeaking(false);
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  };

  const handleCommand = (text: string) => {
    const t = text.toLowerCase();
    let r = "";

    const fertMatch = t.match(/fertilizer.*(rice|wheat|tomato).*?(\d+(?:\.\d+)?)/);
    if (fertMatch) {
      const crop = fertMatch[1]; const a = parseFloat(fertMatch[2]);
      const RATES: any = { rice: [120,60,40], wheat: [100,50,30], tomato: [80,40,40] };
      const [n,p,k] = RATES[crop];
      r = `For ${crop} on ${a} acres: ${n*a} kg nitrogen, ${p*a} kg phosphorus, ${k*a} kg potassium. Total ${ (n+p+k)*a } kilograms.`;
    } else if (t.includes("recommend") && t.includes("crop")) {
      navigate("/dashboard"); r = "Showing seasonal crop recommendations on your dashboard.";
    } else if (t.includes("marketplace")) {
      navigate("/marketplace"); r = "Opening the marketplace.";
    } else if (t.includes("cart")) {
      navigate("/cart"); r = "Opening your cart.";
    } else if (t.includes("disease") || t.includes("camera") || t.includes("detect") || t.includes("diagnose")) {
      navigate("/diagnose"); r = "Opening disease detection. Point your camera at the crop.";
    } else if (t.includes("shop")) {
      navigate("/shops"); r = "Showing nearby agri shops.";
    } else if (t.includes("community") || t.includes("expert")) {
      navigate("/community"); r = "Opening community and experts.";
    } else if (t.includes("profile")) {
      navigate("/profile"); r = "Opening your profile.";
    } else if (t.includes("dashboard") || t.includes("home")) {
      navigate("/dashboard"); r = "Opening the dashboard.";
    } else {
      r = "Try: calculate fertilizer for rice 2 acres, or recommend crops for this season.";
    }
    setReply(r);
    speak(r);
  };

  const start = () => {
    if (!supported) { toast.error("Voice not supported on this browser"); return; }
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recog = new SR();
    recog.lang = "en-US"; recog.interimResults = false; recog.continuous = false;
    recog.onstart = () => setListening(true);
    recog.onend = () => setListening(false);
    recog.onerror = () => setListening(false);
    recog.onresult = (ev: any) => {
      const text = ev.results[0][0].transcript;
      setTranscript(text);
      handleCommand(text);
    };
    recogRef.current = recog;
    setTranscript(""); setReply("");
    recog.start();
  };

  useEffect(() => () => { recogRef.current?.stop?.(); window.speechSynthesis?.cancel(); }, []);

  return (
    <>
      {/* Floating button */}
      <motion.button
        initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.8, type: "spring" }}
        whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }}
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-40 w-16 h-16 rounded-full glow-btn flex items-center justify-center text-primary-foreground"
        aria-label="Open voice assistant"
      >
        <Mic className="w-7 h-7" />
        <span className="absolute inset-0 rounded-full border-2 border-primary animate-pulse-ring" />
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-background/70 backdrop-blur-md flex items-end md:items-center justify-center p-4"
            onClick={() => setOpen(false)}
          >
            <motion.div
              initial={{ y: 60, opacity: 0, scale: 0.95 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 60, opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="glass rounded-3xl p-8 max-w-md w-full relative"
            >
              <button onClick={() => setOpen(false)} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>

              <div className="flex flex-col items-center">
                <motion.button
                  onClick={start}
                  whileTap={{ scale: 0.9 }}
                  className="relative w-28 h-28 rounded-full glow-btn flex items-center justify-center mb-6"
                >
                  <Mic className="w-12 h-12 text-primary-foreground" />
                  {listening && (
                    <>
                      <span className="absolute inset-0 rounded-full border-4 border-primary animate-pulse-ring" />
                      <span className="absolute inset-0 rounded-full border-4 border-primary animate-pulse-ring" style={{ animationDelay: "0.5s" }} />
                    </>
                  )}
                </motion.button>

                {speaking && (
                  <div className="flex items-end gap-1 h-10 mb-4">
                    {[0,1,2,3,4].map(i => (
                      <span key={i} className="w-1.5 rounded-full bg-primary animate-wave" style={{ height: "100%", animationDelay: `${i*0.1}s` }} />
                    ))}
                  </div>
                )}

                <p className="text-sm text-muted-foreground text-center mb-2">
                  {listening ? "Listening…" : speaking ? "Speaking…" : "Tap to speak"}
                </p>

                {transcript && (
                  <div className="w-full mt-3 p-3 rounded-2xl bg-muted text-sm">
                    <span className="text-xs text-muted-foreground">You: </span>{transcript}
                  </div>
                )}
                {reply && (
                  <div className="w-full mt-2 p-3 rounded-2xl bg-primary/10 text-sm">
                    <span className="text-xs text-primary font-semibold">Assistant: </span>{reply}
                  </div>
                )}

                <div className="mt-5 text-xs text-muted-foreground text-center">
                  Try: "Calculate fertilizer for rice 2 acres"
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
