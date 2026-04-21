-- Marketplace items (public read, no writes from users)
CREATE TABLE public.marketplace_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  price NUMERIC NOT NULL,
  unit TEXT NOT NULL DEFAULT 'unit',
  description TEXT,
  image_url TEXT,
  seller TEXT,
  phone TEXT,
  stock INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.marketplace_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Marketplace viewable by everyone" ON public.marketplace_items FOR SELECT USING (true);

-- Cart items (user-owned)
CREATE TABLE public.cart_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  item_id UUID NOT NULL REFERENCES public.marketplace_items(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, item_id)
);
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View own cart" ON public.cart_items FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Insert own cart" ON public.cart_items FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Update own cart" ON public.cart_items FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Delete own cart" ON public.cart_items FOR DELETE USING (auth.uid() = user_id);

-- Experts (public read)
CREATE TABLE public.experts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  specialization TEXT NOT NULL,
  experience_years INTEGER NOT NULL DEFAULT 0,
  rating NUMERIC NOT NULL DEFAULT 0,
  phone TEXT,
  location TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.experts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Experts viewable by everyone" ON public.experts FOR SELECT USING (true);

-- Shops (public read)
CREATE TABLE public.shops (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  phone TEXT,
  distance_km NUMERIC NOT NULL DEFAULT 0,
  latitude NUMERIC,
  longitude NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.shops ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Shops viewable by everyone" ON public.shops FOR SELECT USING (true);

-- Disease detections (user-owned)
CREATE TABLE public.disease_detections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  image_url TEXT,
  crop TEXT,
  disease_name TEXT NOT NULL,
  confidence NUMERIC NOT NULL DEFAULT 0,
  treatment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.disease_detections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View own detections" ON public.disease_detections FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Insert own detections" ON public.disease_detections FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Delete own detections" ON public.disease_detections FOR DELETE USING (auth.uid() = user_id);

-- Storage bucket for crop images (public read)
INSERT INTO storage.buckets (id, name, public) VALUES ('crop-images', 'crop-images', true);

CREATE POLICY "Crop images public read" ON storage.objects FOR SELECT USING (bucket_id = 'crop-images');
CREATE POLICY "Users upload own crop images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'crop-images' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users delete own crop images" ON storage.objects FOR DELETE USING (bucket_id = 'crop-images' AND auth.uid()::text = (storage.foldername(name))[1]);