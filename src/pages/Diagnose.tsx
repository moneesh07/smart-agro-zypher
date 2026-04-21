import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Camera, Upload, RefreshCw, Loader2, Sparkles, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import PageShell from "@/components/PageShell";

type Result = { disease_name: string; confidence: number; treatment: string; crop: string };

export default function Diagnose() {
  const { user } = useAuth();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [cameraOn, setCameraOn] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);

  useEffect(() => () => stopCamera(), []);

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCameraOn(false);
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraOn(true);
      setPreview(null);
      setResult(null);
    } catch (e) {
      toast.error("Could not access camera. Try uploading an image instead.");
    }
  };

  const capture = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext("2d")?.drawImage(videoRef.current, 0, 0);
    setPreview(canvas.toDataURL("image/jpeg", 0.85));
    stopCamera();
  };

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      setPreview(reader.result as string);
      setResult(null);
    };
    reader.readAsDataURL(f);
  };

  const diagnose = async () => {
    if (!preview) return;
    setLoading(true);
    setResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("diagnose-disease", {
        body: { imageBase64: preview },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setResult(data);
      // upload image to storage + save record
      if (user) {
        try {
          const blob = await (await fetch(preview)).blob();
          const path = `${user.id}/${Date.now()}.jpg`;
          const { data: up } = await supabase.storage.from("crop-images").upload(path, blob, { contentType: "image/jpeg" });
          const url = up ? supabase.storage.from("crop-images").getPublicUrl(up.path).data.publicUrl : null;
          await supabase.from("disease_detections").insert({
            user_id: user.id,
            image_url: url,
            crop: data.crop,
            disease_name: data.disease_name,
            confidence: data.confidence,
            treatment: data.treatment,
          });
        } catch (e) {
          console.error("save failed", e);
        }
      }
      // speak result
      if ("speechSynthesis" in window) {
        const u = new SpeechSynthesisUtterance(`Detected ${data.disease_name} on ${data.crop} with ${Math.round(data.confidence)} percent confidence. ${data.treatment}`);
        window.speechSynthesis.speak(u);
      }
    } catch (e: any) {
      toast.error(e.message || "Diagnosis failed");
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setPreview(null);
    setResult(null);
  };

  const speak = () => {
    if (!result || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(`${result.disease_name} on ${result.crop}. ${result.treatment}`);
    window.speechSynthesis.speak(u);
  };

  return (
    <PageShell title="Disease Detection" subtitle="Capture or upload a crop photo for AI diagnosis">
      <Card className="glass border-0 overflow-hidden">
        <CardContent className="p-6 space-y-5">
          <div className="relative rounded-2xl overflow-hidden bg-muted aspect-[4/3] flex items-center justify-center">
            {cameraOn ? (
              <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
            ) : preview ? (
              <img src={preview} alt="Crop preview" className="w-full h-full object-cover" />
            ) : (
              <div className="text-center text-muted-foreground p-6">
                <Camera className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No image yet. Open camera or upload.</p>
              </div>
            )}
            {loading && (
              <div className="absolute inset-0 bg-background/70 backdrop-blur-sm flex flex-col items-center justify-center gap-2">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
                <p className="text-sm font-medium">Analyzing with AI…</p>
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-2 justify-center">
            {!cameraOn && !preview && (
              <>
                <Button onClick={startCamera} className="glow-btn text-primary-foreground">
                  <Camera className="w-4 h-4 mr-2" /> Open Camera
                </Button>
                <Button variant="outline" onClick={() => fileRef.current?.click()}>
                  <Upload className="w-4 h-4 mr-2" /> Upload
                </Button>
                <input ref={fileRef} type="file" accept="image/*" hidden onChange={onFile} />
              </>
            )}
            {cameraOn && (
              <>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={capture}
                  className="w-16 h-16 rounded-full glow-btn flex items-center justify-center text-primary-foreground"
                  aria-label="Capture"
                >
                  <div className="w-12 h-12 rounded-full border-4 border-white/80" />
                </motion.button>
                <Button variant="outline" onClick={stopCamera}>Cancel</Button>
              </>
            )}
            {preview && !loading && (
              <>
                <Button onClick={diagnose} className="glow-btn text-primary-foreground">
                  <Sparkles className="w-4 h-4 mr-2" /> Diagnose
                </Button>
                <Button variant="outline" onClick={reset}>
                  <RefreshCw className="w-4 h-4 mr-2" /> Retake
                </Button>
              </>
            )}
          </div>

          {result && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl p-5 bg-gradient-to-br from-primary/10 to-secondary/10 border border-primary/20"
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Diagnosis</p>
                  <h3 className="text-2xl font-bold">{result.disease_name}</h3>
                  <p className="text-sm text-muted-foreground">Crop: {result.crop}</p>
                </div>
                <Button variant="ghost" size="icon" onClick={speak} aria-label="Speak result">
                  <Volume2 className="w-5 h-5" />
                </Button>
              </div>
              <div className="mb-3">
                <div className="flex justify-between text-xs mb-1">
                  <span>Confidence</span>
                  <span className="font-semibold">{Math.round(result.confidence)}%</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, result.confidence)}%` }}
                    transition={{ duration: 0.8 }}
                    className="h-full bg-gradient-to-r from-primary to-secondary"
                  />
                </div>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Treatment</p>
                <p className="text-sm">{result.treatment}</p>
              </div>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </PageShell>
  );
}
