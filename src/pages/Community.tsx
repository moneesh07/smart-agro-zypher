import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Phone, Star, MapPin, MessageCircle, Heart, MessageSquare, Send, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import PageShell from "@/components/PageShell";
import { z } from "zod";

type Expert = { id: string; name: string; specialization: string; experience_years: number; rating: number; phone: string | null; location: string | null; avatar_url: string | null };
type Post = { id: string; user_id: string; content: string; image_url: string | null; created_at: string };
type Comment = { id: string; post_id: string; user_id: string; content: string; created_at: string };

const postSchema = z.string().trim().min(1, "Say something").max(2000, "Max 2000 chars");
const commentSchema = z.string().trim().min(1).max(1000);

export default function Community() {
  const { user } = useAuth();
  const [experts, setExperts] = useState<Expert[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [likes, setLikes] = useState<Record<string, { count: number; liked: boolean }>>({});
  const [comments, setComments] = useState<Record<string, Comment[]>>({});
  const [profiles, setProfiles] = useState<Record<string, string>>({});
  const [openComments, setOpenComments] = useState<Record<string, boolean>>({});
  const [newPost, setNewPost] = useState("");
  const [newComment, setNewComment] = useState<Record<string, string>>({});
  const [posting, setPosting] = useState(false);

  // Load experts once
  useEffect(() => {
    supabase.from("experts").select("*").order("rating", { ascending: false })
      .then(({ data }) => setExperts(data ?? []));
  }, []);

  const loadFeed = async () => {
    const { data: ps } = await supabase.from("posts").select("*").order("created_at", { ascending: false }).limit(50);
    setPosts(ps ?? []);
    if (ps && ps.length) {
      const ids = ps.map(p => p.id);
      const userIds = Array.from(new Set(ps.map(p => p.user_id)));
      const [{ data: ls }, { data: cs }, { data: pf }] = await Promise.all([
        supabase.from("post_likes").select("post_id, user_id").in("post_id", ids),
        supabase.from("post_comments").select("*").in("post_id", ids).order("created_at", { ascending: true }),
        supabase.from("profiles").select("user_id, full_name").in("user_id", userIds),
      ]);
      const lmap: Record<string, { count: number; liked: boolean }> = {};
      (ls ?? []).forEach(l => {
        lmap[l.post_id] ??= { count: 0, liked: false };
        lmap[l.post_id].count++;
        if (user && l.user_id === user.id) lmap[l.post_id].liked = true;
      });
      setLikes(lmap);
      const cmap: Record<string, Comment[]> = {};
      (cs ?? []).forEach(c => { cmap[c.post_id] ??= []; cmap[c.post_id].push(c as Comment); });
      setComments(cmap);
      const pmap: Record<string, string> = {};
      (pf ?? []).forEach(p => { if (p.user_id) pmap[p.user_id] = p.full_name ?? "Farmer"; });
      // also fetch commenter names
      const commenterIds = Array.from(new Set((cs ?? []).map(c => c.user_id).filter(id => !pmap[id])));
      if (commenterIds.length) {
        const { data: pf2 } = await supabase.from("profiles").select("user_id, full_name").in("user_id", commenterIds);
        (pf2 ?? []).forEach(p => { if (p.user_id) pmap[p.user_id] = p.full_name ?? "Farmer"; });
      }
      setProfiles(pmap);
    }
  };

  useEffect(() => {
    loadFeed();
    const ch = supabase
      .channel("community-feed")
      .on("postgres_changes", { event: "*", schema: "public", table: "posts" }, loadFeed)
      .on("postgres_changes", { event: "*", schema: "public", table: "post_likes" }, loadFeed)
      .on("postgres_changes", { event: "*", schema: "public", table: "post_comments" }, loadFeed)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const createPost = async () => {
    if (!user) return;
    const parsed = postSchema.safeParse(newPost);
    if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
    setPosting(true);
    const { error } = await supabase.from("posts").insert({ user_id: user.id, content: parsed.data });
    setPosting(false);
    if (error) toast.error(error.message);
    else { setNewPost(""); toast.success("Posted!"); }
  };

  const toggleLike = async (postId: string) => {
    if (!user) return;
    const liked = likes[postId]?.liked;
    if (liked) {
      await supabase.from("post_likes").delete().eq("post_id", postId).eq("user_id", user.id);
    } else {
      await supabase.from("post_likes").insert({ post_id: postId, user_id: user.id });
    }
  };

  const addComment = async (postId: string) => {
    if (!user) return;
    const parsed = commentSchema.safeParse(newComment[postId] ?? "");
    if (!parsed.success) return;
    const { error } = await supabase.from("post_comments").insert({ post_id: postId, user_id: user.id, content: parsed.data });
    if (!error) setNewComment(s => ({ ...s, [postId]: "" }));
  };

  const deletePost = async (postId: string) => {
    await supabase.from("posts").delete().eq("id", postId);
  };

  const timeAgo = (iso: string) => {
    const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
    if (s < 60) return "just now";
    if (s < 3600) return `${Math.floor(s / 60)}m ago`;
    if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
    return `${Math.floor(s / 86400)}d ago`;
  };

  return (
    <PageShell title="Community & Experts" subtitle="Share, learn, connect">
      <Tabs defaultValue="feed" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-sm mx-auto mb-6">
          <TabsTrigger value="feed">Feed</TabsTrigger>
          <TabsTrigger value="experts">Experts</TabsTrigger>
        </TabsList>

        <TabsContent value="feed" className="space-y-4">
          <Card className="glass border-0">
            <CardContent className="p-4 space-y-3">
              <Textarea
                value={newPost}
                onChange={e => setNewPost(e.target.value)}
                placeholder="Share a tip, ask the community, show your harvest… 🌾"
                maxLength={2000}
                className="min-h-20 resize-none bg-background/50"
              />
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">{newPost.length}/2000</span>
                <Button onClick={createPost} disabled={posting || !newPost.trim()} className="glow-btn text-primary-foreground">
                  <Send className="w-4 h-4 mr-2" />{posting ? "Posting…" : "Post"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {posts.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No posts yet. Be the first! 🌱</p>
          ) : (
            <AnimatePresence initial={false}>
              {posts.map((p) => {
                const l = likes[p.id] ?? { count: 0, liked: false };
                const pc = comments[p.id] ?? [];
                const author = profiles[p.user_id] ?? "Farmer";
                const initial = author.trim().charAt(0).toUpperCase() || "F";
                return (
                  <motion.div
                    key={p.id}
                    layout
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                  >
                    <Card className="glass border-0">
                      <CardContent className="p-5">
                        <div className="flex items-start gap-3 mb-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-primary-foreground font-bold text-sm shrink-0">
                            {initial}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <h3 className="font-semibold text-sm truncate">{author}</h3>
                              <span className="text-xs text-muted-foreground shrink-0">{timeAgo(p.created_at)}</span>
                            </div>
                            {user?.id === p.user_id && (
                              <button onClick={() => deletePost(p.id)} className="text-xs text-muted-foreground hover:text-destructive transition-colors flex items-center gap-1">
                                <Trash2 className="w-3 h-3" />Delete
                              </button>
                            )}
                          </div>
                        </div>
                        <p className="text-sm whitespace-pre-wrap mb-4">{p.content}</p>
                        <div className="flex items-center gap-4 text-sm">
                          <button
                            onClick={() => toggleLike(p.id)}
                            className={`flex items-center gap-1 transition-colors ${l.liked ? "text-rose-500" : "text-muted-foreground hover:text-rose-500"}`}
                          >
                            <Heart className={`w-4 h-4 ${l.liked ? "fill-current" : ""}`} />
                            <span>{l.count}</span>
                          </button>
                          <button
                            onClick={() => setOpenComments(s => ({ ...s, [p.id]: !s[p.id] }))}
                            className="flex items-center gap-1 text-muted-foreground hover:text-primary transition-colors"
                          >
                            <MessageSquare className="w-4 h-4" />
                            <span>{pc.length}</span>
                          </button>
                        </div>

                        <AnimatePresence>
                          {openComments[p.id] && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden"
                            >
                              <div className="mt-4 pt-4 border-t space-y-3">
                                {pc.map(c => (
                                  <div key={c.id} className="flex gap-2 items-start">
                                    <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-xs font-semibold shrink-0">
                                      {(profiles[c.user_id] ?? "F").charAt(0).toUpperCase()}
                                    </div>
                                    <div className="flex-1 bg-muted/50 rounded-2xl px-3 py-2">
                                      <div className="flex justify-between items-center gap-2">
                                        <span className="text-xs font-semibold">{profiles[c.user_id] ?? "Farmer"}</span>
                                        <span className="text-[10px] text-muted-foreground">{timeAgo(c.created_at)}</span>
                                      </div>
                                      <p className="text-sm">{c.content}</p>
                                    </div>
                                  </div>
                                ))}
                                <div className="flex gap-2 items-center">
                                  <Input
                                    placeholder="Write a comment…"
                                    maxLength={1000}
                                    value={newComment[p.id] ?? ""}
                                    onChange={e => setNewComment(s => ({ ...s, [p.id]: e.target.value }))}
                                    onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addComment(p.id); } }}
                                    className="bg-background/50"
                                  />
                                  <Button size="icon" onClick={() => addComment(p.id)} className="glow-btn text-primary-foreground shrink-0">
                                    <Send className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
        </TabsContent>

        <TabsContent value="experts">
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
        </TabsContent>
      </Tabs>
    </PageShell>
  );
}
