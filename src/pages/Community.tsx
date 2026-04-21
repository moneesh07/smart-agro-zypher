import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Phone, Star, MapPin, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import PageShell from "@/components/PageShell";

type Expert = { id: string; name: string; specialization: string; experience_years: number; rating: number; phone: string | null; location: string | null; avatar_url: string | null };

export default function Community() {
  const [experts, setExperts] = useState<Expert[]>([]);
  useEffect(() => {
    supabase.from("experts").select("*").order("rating", { ascending: false })
      .then(({ data }) => setExperts(data ?? []));
  }, []);

  return (
    <PageShell title="Community & Experts" subtitle="Connect with top agri specialists">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {experts.map((e, i) => (
          <motion.div key={e.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card className="glass border-0">
              <CardContent className="p-5">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/30 to-secondary/30 overflow-hidden shrink-0">
                    {e.avatar_url && <img src={e.avatar_url} alt={e.name} className="w-full h-full object-cover" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold truncate">{e.name}</h3>
                    <p className="text-sm text-primary font-medium">{e.specialization}</p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                      <span className="flex items-center gap-1"><Star className="w-3 h-3 fill-amber-400 text-amber-400" />{e.rating}</span>
                      <span>{e.experience_years} yrs exp</span>
                    </div>
                  </div>
                </div>
                {e.location && <p className="text-xs text-muted-foreground flex items-center gap-1 mb-3"><MapPin className="w-3 h-3" />{e.location}</p>}
                {e.phone && (
                  <div className="flex gap-2">
                    <Button asChild size="sm" className="flex-1 glow-btn text-primary-foreground">
                      <a href={`tel:${e.phone}`}><Phone className="w-4 h-4 mr-2" />Call</a>
                    </Button>
                    <Button asChild size="sm" variant="outline" className="flex-1">
                      <a href={`sms:${e.phone}`}><MessageCircle className="w-4 h-4 mr-2" />Message</a>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </PageShell>
  );
}
