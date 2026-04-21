import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Phone, Plus, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import PageShell from "@/components/PageShell";

type Item = {
  id: string; name: string; category: string; price: number; unit: string;
  description: string | null; image_url: string | null; seller: string | null; phone: string | null; stock: number;
};

const CATEGORIES = ["All", "Seeds", "Fertilizers", "Tools"];

export default function Marketplace() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<Item[]>([]);
  const [cat, setCat] = useState("All");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from("marketplace_items").select("*").order("created_at", { ascending: false })
      .then(({ data }) => { setItems(data ?? []); setLoading(false); });
  }, []);

  const addToCart = async (item: Item) => {
    if (!user) return;
    const { data: existing } = await supabase.from("cart_items")
      .select("id, quantity").eq("user_id", user.id).eq("item_id", item.id).maybeSingle();
    if (existing) {
      await supabase.from("cart_items").update({ quantity: existing.quantity + 1 }).eq("id", existing.id);
    } else {
      await supabase.from("cart_items").insert({ user_id: user.id, item_id: item.id, quantity: 1 });
    }
    toast.success(`${item.name} added to cart`);
  };

  const filtered = cat === "All" ? items : items.filter(i => i.category === cat);

  return (
    <PageShell
      title="Marketplace"
      subtitle="Seeds, fertilizers & tools"
      action={<Button variant="outline" size="sm" onClick={() => navigate("/cart")}><ShoppingCart className="w-4 h-4 mr-2" />Cart</Button>}
    >
      <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
        {CATEGORIES.map(c => (
          <Button key={c} size="sm" variant={cat === c ? "default" : "outline"} className={cat === c ? "glow-btn text-primary-foreground" : ""} onClick={() => setCat(c)}>
            {c}
          </Button>
        ))}
      </div>

      {loading ? (
        <p className="text-center text-muted-foreground py-10">Loading products…</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
            >
              <Card className="glass border-0 overflow-hidden h-full flex flex-col hover:scale-[1.02] transition-transform">
                <div className="aspect-[4/3] bg-muted overflow-hidden">
                  {item.image_url ? (
                    <img src={item.image_url} alt={item.name} loading="lazy" className="w-full h-full object-cover" />
                  ) : <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20" />}
                </div>
                <CardContent className="p-4 flex-1 flex flex-col">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h3 className="font-semibold text-sm leading-tight">{item.name}</h3>
                    <Badge variant="secondary" className="shrink-0">{item.category}</Badge>
                  </div>
                  {item.description && <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{item.description}</p>}
                  <div className="mt-auto space-y-2">
                    <div className="flex items-baseline justify-between">
                      <span className="text-xl font-bold text-primary">₹{item.price}</span>
                      <span className="text-xs text-muted-foreground">/ {item.unit}</span>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" className="flex-1 glow-btn text-primary-foreground" onClick={() => addToCart(item)}>
                        <Plus className="w-4 h-4 mr-1" /> Add
                      </Button>
                      {item.phone && (
                        <Button size="sm" variant="outline" asChild>
                          <a href={`tel:${item.phone}`}><Phone className="w-4 h-4" /></a>
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </PageShell>
  );
}
