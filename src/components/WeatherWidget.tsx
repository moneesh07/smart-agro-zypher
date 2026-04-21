import { motion } from "framer-motion";
import { Sun, Cloud, CloudRain, Wind, Droplets } from "lucide-react";

export default function WeatherWidget() {
  // Simulated forecast (real API hookup can be added later)
  const forecast = [
    { day: "Today", icon: Sun, temp: 29, cond: "Sunny" },
    { day: "Tue", icon: Cloud, temp: 27, cond: "Cloudy" },
    { day: "Wed", icon: CloudRain, temp: 24, cond: "Rain" },
    { day: "Thu", icon: Sun, temp: 30, cond: "Sunny" },
  ];

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
          <div>
            <h2 className="text-xl font-bold">Weather</h2>
            <p className="text-sm text-muted-foreground">4-day forecast</p>
          </div>
          <motion.div animate={{ rotate: [0, 8, -8, 0] }} transition={{ duration: 4, repeat: Infinity }}>
            <Sun className="w-10 h-10 text-amber-400" />
          </motion.div>
        </div>

        <div className="flex items-baseline gap-2 mb-4">
          <span className="text-5xl font-bold">29°</span>
          <span className="text-muted-foreground">Sunny, light breeze</span>
        </div>

        <div className="flex gap-3 text-xs text-muted-foreground mb-5">
          <span className="flex items-center gap-1"><Droplets className="w-3 h-3" /> 62%</span>
          <span className="flex items-center gap-1"><Wind className="w-3 h-3" /> 8 km/h</span>
        </div>

        <div className="grid grid-cols-4 gap-2">
          {forecast.map((f) => {
            const Icon = f.icon;
            return (
              <div key={f.day} className="rounded-xl p-3 bg-card/60 border border-border text-center">
                <div className="text-xs text-muted-foreground">{f.day}</div>
                <Icon className="w-6 h-6 mx-auto my-2 text-primary" />
                <div className="text-sm font-semibold">{f.temp}°</div>
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
