import { motion } from "framer-motion";
import { Sun, Cloud, Snowflake, Droplets } from "lucide-react";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

function getSeason() {
  const m = new Date().getMonth() + 1;
  if (m >= 3 && m <= 5) return "summer";
  if (m >= 6 && m <= 9) return "monsoon";
  return "winter";
}

const DATA: Record<string, { icon: any; color: string; crops: { name: string; yield: string; water: string }[] }> = {
  summer: {
    icon: Sun, color: "from-amber-400 to-orange-500",
    crops: [
      { name: "Tomato", yield: "25–35 t/ha", water: "High" },
      { name: "Okra", yield: "12–18 t/ha", water: "Moderate" },
      { name: "Cucumber", yield: "20–30 t/ha", water: "High" },
    ],
  },
  monsoon: {
    icon: Cloud, color: "from-sky-400 to-blue-600",
    crops: [
      { name: "Rice", yield: "5–7 t/ha", water: "Very high" },
      { name: "Maize", yield: "6–8 t/ha", water: "Moderate" },
      { name: "Soybean", yield: "2–3 t/ha", water: "Low" },
    ],
  },
  winter: {
    icon: Snowflake, color: "from-cyan-400 to-indigo-500",
    crops: [
      { name: "Wheat", yield: "4–6 t/ha", water: "Low" },
      { name: "Mustard", yield: "1–2 t/ha", water: "Low" },
      { name: "Peas", yield: "3–5 t/ha", water: "Moderate" },
    ],
  },
};

export default function SeasonalRecommendation() {
  const season = useMemo(getSeason, []);
  const info = DATA[season];
  const Icon = info.icon;
  const { t } = useTranslation();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.1 }}
      className="glass rounded-3xl p-6"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${info.color} flex items-center justify-center shadow-lg`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold">{t(`season.${season}`)}</h2>
          <p className="text-sm text-muted-foreground">{t("season.subtitle")}</p>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {info.crops.map((c, i) => (
          <motion.div
            key={c.name}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + i * 0.1 }}
            whileHover={{ y: -4 }}
            className="rounded-2xl p-4 bg-card border border-border hover:border-primary/40 transition-all"
          >
            <h3 className="font-bold text-lg">{c.name}</h3>
            <p className="text-sm text-muted-foreground mt-1">{t("season.yield")} {c.yield}</p>
            <div className="flex items-center gap-1 mt-2 text-xs text-secondary">
              <Droplets className="w-3 h-3" /> {c.water} {t("season.water")}
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
