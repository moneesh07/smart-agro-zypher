import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Sprout, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

const RATES: Record<string, { n: number; p: number; k: number }> = {
  Rice: { n: 120, p: 60, k: 40 },
  Wheat: { n: 100, p: 50, k: 30 },
  Tomato: { n: 80, p: 40, k: 40 },
};

function AnimatedNumber({ value }: { value: number }) {
  return (
    <motion.span
      key={value}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="text-3xl font-bold"
    >
      {value.toFixed(1)}
    </motion.span>
  );
}

export default function FertilizerCalculator() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [area, setArea] = useState("1");
  const [crop, setCrop] = useState("Rice");
  const [soil, setSoil] = useState("Loamy");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ n: number; p: number; k: number; total: number } | null>(null);

  const calculate = async () => {
    const a = parseFloat(area);
    if (!a || a <= 0 || a > 10000) { toast.error(t("calculator.invalidArea")); return; }
    const r = RATES[crop];
    const n = r.n * a, p = r.p * a, k = r.k * a;
    setLoading(true);
    await new Promise((res) => setTimeout(res, 400));
    setResult({ n, p, k, total: n + p + k });
    setLoading(false);

    if (user) {
      await supabase.from("fertilizer_logs").insert({
        user_id: user.id, crop, soil_type: soil, land_area: a,
        nitrogen: n, phosphorus: p, potassium: k,
      });
    }
    toast.success(t("calculator.saved"));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="glass rounded-3xl p-6 md:p-8 relative overflow-hidden radial-glow"
    >
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl glow-btn flex items-center justify-center">
            <Sprout className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">{t("calculator.title")}</h2>
            <p className="text-sm text-muted-foreground">{t("calculator.subtitle")}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <Label>{t("calculator.land")}</Label>
            <Input type="number" min="0" max="10000" step="0.1" value={area} onChange={(e) => setArea(e.target.value)} className="mt-1" />
          </div>
          <div>
            <Label>{t("calculator.crop")}</Label>
            <Select value={crop} onValueChange={setCrop}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Rice">Rice</SelectItem>
                <SelectItem value="Wheat">Wheat</SelectItem>
                <SelectItem value="Tomato">Tomato</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>{t("calculator.soil")}</Label>
            <Select value={soil} onValueChange={setSoil}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Loamy">Loamy</SelectItem>
                <SelectItem value="Clay">Clay</SelectItem>
                <SelectItem value="Sandy">Sandy</SelectItem>
                <SelectItem value="Silty">Silty</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button onClick={calculate} disabled={loading} className="glow-btn text-primary-foreground border-0 h-12 px-8 font-semibold">
          {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
          {t("calculator.calculate")}
        </Button>

        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3"
            >
              {[
                { label: t("calculator.nitrogen"), v: result.n, color: "from-emerald-400 to-green-500" },
                { label: t("calculator.phosphorus"), v: result.p, color: "from-sky-400 to-blue-500" },
                { label: t("calculator.potassium"), v: result.k, color: "from-amber-400 to-orange-500" },
                { label: t("calculator.total"), v: result.total, color: "from-fuchsia-400 to-pink-500" },
              ].map((x) => (
                <div key={x.label} className={`rounded-2xl p-4 bg-gradient-to-br ${x.color} text-white shadow-lg`}>
                  <div className="text-xs font-medium opacity-90">{x.label}</div>
                  <AnimatedNumber value={x.v} />
                  <div className="text-xs opacity-80">kg</div>
                </div>
              ))}
              <div className="col-span-2 md:col-span-4 rounded-2xl p-4 bg-primary/10 border border-primary/20">
                <p className="text-sm"><strong>{t("calculator.recommendation")}</strong> {t("calculator.stages")}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
