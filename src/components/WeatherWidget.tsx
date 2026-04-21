import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Sun, Cloud, CloudRain, CloudSnow, CloudLightning, Wind, Droplets, MapPin, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "react-i18next";

// WMO weather codes → icon + label
const codeMap: Record<number, { icon: any; label: string }> = {
  0: { icon: Sun, label: "Clear" },
  1: { icon: Sun, label: "Mainly clear" },
  2: { icon: Cloud, label: "Partly cloudy" },
  3: { icon: Cloud, label: "Overcast" },
  45: { icon: Cloud, label: "Fog" }, 48: { icon: Cloud, label: "Fog" },
  51: { icon: CloudRain, label: "Drizzle" }, 53: { icon: CloudRain, label: "Drizzle" }, 55: { icon: CloudRain, label: "Drizzle" },
  61: { icon: CloudRain, label: "Rain" }, 63: { icon: CloudRain, label: "Rain" }, 65: { icon: CloudRain, label: "Heavy rain" },
  71: { icon: CloudSnow, label: "Snow" }, 73: { icon: CloudSnow, label: "Snow" }, 75: { icon: CloudSnow, label: "Heavy snow" },
  80: { icon: CloudRain, label: "Showers" }, 81: { icon: CloudRain, label: "Showers" }, 82: { icon: CloudRain, label: "Heavy showers" },
  95: { icon: CloudLightning, label: "Thunderstorm" }, 96: { icon: CloudLightning, label: "Thunderstorm" }, 99: { icon: CloudLightning, label: "Thunderstorm" },
};
const codeInfo = (c: number) => codeMap[c] ?? { icon: Cloud, label: "Cloudy" };

type WeatherData = {
  location: string;
  current: { temperature_2m: number; relative_humidity_2m: number; weather_code: number; wind_speed_10m: number; precipitation: number };
  daily: { time: string[]; weather_code: number[]; temperature_2m_max: number[]; temperature_2m_min: number[]; precipitation_sum: number[] };
};

export default function WeatherWidget() {
  const [data, setData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation();

  useEffect(() => {
    const fetchWeather = async (lat?: number, lon?: number) => {
      try {
        const { data, error } = await supabase.functions.invoke("weather", {
          body: lat && lon ? { lat, lon } : { location: "India" },
        });
        if (error) throw error;
        setData(data);
      } catch (e) {
        console.error("weather fetch", e);
      } finally {
        setLoading(false);
      }
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => fetchWeather(pos.coords.latitude, pos.coords.longitude),
        () => fetchWeather(),
        { timeout: 4000 }
      );
    } else {
      fetchWeather();
    }
  }, []);

  const current = data?.current;
  const daily = data?.daily;
  const CurrentIcon = current ? codeInfo(current.weather_code).icon : Sun;
  const currentLabel = current ? codeInfo(current.weather_code).label : "Loading";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2 }}
      className="glass rounded-3xl p-6 relative overflow-hidden"
    >
      <div className="absolute top-0 right-0 w-40 h-40 bg-secondary/20 rounded-full blur-3xl" />
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div className="min-w-0">
            <h2 className="text-xl font-bold">{t("weather.title")}</h2>
            <p className="text-sm text-muted-foreground flex items-center gap-1 truncate">
              <MapPin className="w-3 h-3 shrink-0" />{data?.location ?? t("weather.locating")}
            </p>
          </div>
          <motion.div animate={{ rotate: [0, 8, -8, 0] }} transition={{ duration: 4, repeat: Infinity }}>
            <CurrentIcon className="w-10 h-10 text-amber-400" />
          </motion.div>
        </div>

        {loading ? (
          <div className="flex items-center gap-2 text-muted-foreground py-4">
            <Loader2 className="w-4 h-4 animate-spin" /> {t("weather.loading")}
          </div>
        ) : current ? (
          <>
            <div className="flex items-baseline gap-2 mb-4">
              <span className="text-5xl font-bold">{Math.round(current.temperature_2m)}°</span>
              <span className="text-muted-foreground text-sm">{currentLabel}</span>
            </div>

            <div className="flex gap-3 text-xs text-muted-foreground mb-5">
              <span className="flex items-center gap-1"><Droplets className="w-3 h-3" /> {current.relative_humidity_2m}%</span>
              <span className="flex items-center gap-1"><Wind className="w-3 h-3" /> {Math.round(current.wind_speed_10m)} km/h</span>
              {current.precipitation > 0 && (
                <span className="flex items-center gap-1 text-secondary font-semibold"><CloudRain className="w-3 h-3" /> {current.precipitation}mm</span>
              )}
            </div>

            {current.precipitation > 2 && (
              <motion.div
                initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                className="mb-4 p-3 rounded-xl bg-secondary/15 border border-secondary/30 text-xs text-foreground flex gap-2"
              >
                <CloudRain className="w-4 h-4 text-secondary shrink-0" />
                <span>{t("weather.rainAlert")}</span>
              </motion.div>
            )}

            <div className="grid grid-cols-4 gap-2">
              {daily?.time.slice(0, 4).map((time, i) => {
                const Ic = codeInfo(daily.weather_code[i]).icon;
                const day = i === 0 ? t("weather.today") : new Date(time).toLocaleDateString(undefined, { weekday: "short" });
                return (
                  <div key={time} className="rounded-xl p-3 bg-card/60 border border-border text-center">
                    <div className="text-xs text-muted-foreground">{day}</div>
                    <Ic className="w-6 h-6 mx-auto my-2 text-primary" />
                    <div className="text-sm font-semibold">{Math.round(daily.temperature_2m_max[i])}°</div>
                    <div className="text-[10px] text-muted-foreground">{Math.round(daily.temperature_2m_min[i])}°</div>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">{t("weather.unavailable")}</p>
        )}
      </div>
    </motion.div>
  );
}
