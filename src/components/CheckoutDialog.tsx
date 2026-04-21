import { useState } from "react";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const schema = z.object({
  shipping_address: z.string().trim().min(8, "Address required").max(500),
  phone: z.string().trim().min(7, "Phone required").max(20),
  notes: z.string().trim().max(500).optional(),
});

type CartLine = {
  id: string;
  quantity: number;
  marketplace_items: { id: string; name: string; price: number; unit: string } | null;
};

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  lines: CartLine[];
  total: number;
  onPlaced: () => void;
}

export default function CheckoutDialog({ open, onOpenChange, lines, total, onPlaced }: Props) {
  const { user } = useAuth();
  const [form, setForm] = useState({ shipping_address: "", phone: "", notes: "" });
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!user) return;
    const parsed = schema.safeParse(form);
    if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
    const valid = lines.filter((l) => l.marketplace_items);
    if (valid.length === 0) { toast.error("Cart is empty"); return; }

    setBusy(true);
    try {
      const { data: order, error } = await supabase
        .from("orders")
        .insert({
          user_id: user.id,
          total,
          shipping_address: parsed.data.shipping_address,
          phone: parsed.data.phone,
          notes: parsed.data.notes || null,
        })
        .select()
        .single();
      if (error) throw error;

      const items = valid.map((l) => ({
        order_id: order.id,
        item_id: l.marketplace_items!.id,
        item_name: l.marketplace_items!.name,
        unit: l.marketplace_items!.unit,
        price: l.marketplace_items!.price,
        quantity: l.quantity,
      }));
      const { error: e2 } = await supabase.from("order_items").insert(items);
      if (e2) throw e2;

      // clear cart
      await supabase.from("cart_items").delete().eq("user_id", user.id);

      // welcome notification
      await supabase.from("notifications").insert({
        user_id: user.id,
        title: "Order placed",
        body: `Order #${order.id.slice(0, 8)} received — total ₹${total.toFixed(0)}`,
        link: "/orders",
      });

      toast.success("Order placed!");
      onOpenChange(false);
      onPlaced();
    } catch (e: any) {
      toast.error(e.message || "Could not place order");
    } finally { setBusy(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-popover">
        <DialogHeader>
          <DialogTitle>Checkout</DialogTitle>
          <DialogDescription>Confirm delivery details to place your order.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label htmlFor="addr">Shipping address</Label>
            <Textarea id="addr" rows={3} maxLength={500}
              value={form.shipping_address}
              onChange={(e) => setForm({ ...form, shipping_address: e.target.value })} />
          </div>
          <div>
            <Label htmlFor="phn">Phone</Label>
            <Input id="phn" maxLength={20} value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div>
            <Label htmlFor="nts">Notes (optional)</Label>
            <Textarea id="nts" rows={2} maxLength={500} value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-border">
            <span className="text-sm text-muted-foreground">Total</span>
            <span className="text-2xl font-bold text-primary">₹{total.toFixed(0)}</span>
          </div>
          <Button onClick={submit} disabled={busy} className="w-full glow-btn text-primary-foreground">
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : "Place order"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
