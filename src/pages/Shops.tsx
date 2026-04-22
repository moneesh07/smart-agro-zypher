import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Phone, MapPin, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "react-i18next";
import PageShell from "@/components/PageShell";

type Shop = { id: string; name: string; address: string; phone: string | null; distance_km: number };

export default function Shops() {
  const { t } = useTranslation();
  const [shops, setShops] = useState<Shop[]>([]);
  useEffect(() => {
    supabase.from("shops").select("*").order("distance_km", { ascending: true })
      .then(({ data }) => setShops(data ?? []));
  }, []);

  return (
    <PageShell title={t("shops.title")} subtitle={t("shops.subtitle")}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {shops.map((s, i) => (
          <motion.div key={s.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card className="glass border-0">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <h3 className="font-bold text-lg">{s.name}</h3>
                  <div className="flex items-center gap-1 text-xs font-semibold bg-primary/10 text-primary px-2 py-1 rounded-full shrink-0">
                    <Navigation className="w-3 h-3" /> {s.distance_km} km
                  </div>
                </div>
                <p className="text-sm text-muted-foreground flex items-start gap-2 mb-4">
                  <MapPin className="w-4 h-4 mt-0.5 shrink-0" /> {s.address}
                </p>
                {s.phone && (
                  <Button asChild className="w-full glow-btn text-primary-foreground">
                    <a href={`tel:${s.phone}`}><Phone className="w-4 h-4 mr-2" />{t("shops.callNow")} — {s.phone}</a>
                  </Button>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </PageShell>
  );
}
