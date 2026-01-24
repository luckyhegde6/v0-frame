-- Create images table
CREATE TABLE IF NOT EXISTS images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  src TEXT NOT NULL,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  file_size INTEGER,
  mime_type TEXT,
  exif_data JSONB,
  created_by UUID,
  is_favorite BOOLEAN DEFAULT FALSE
);

-- Create collections table
CREATE TABLE IF NOT EXISTS collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  image_count INTEGER DEFAULT 0
);

-- Create collection_images join table
CREATE TABLE IF NOT EXISTS collection_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id UUID NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
  image_id UUID NOT NULL REFERENCES images(id) ON DELETE CASCADE,
  added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(collection_id, image_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_images_uploaded_at ON images(uploaded_at DESC);
CREATE INDEX IF NOT EXISTS idx_images_created_by ON images(created_by);
CREATE INDEX IF NOT EXISTS idx_images_is_favorite ON images(is_favorite);
CREATE INDEX IF NOT EXISTS idx_collection_images_collection_id ON collection_images(collection_id);
CREATE INDEX IF NOT EXISTS idx_collection_images_image_id ON collection_images(image_id);

-- Enable RLS (Row Level Security)
ALTER TABLE images ENABLE ROW LEVEL SECURITY;
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE collection_images ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for public access (for this demo)
CREATE POLICY "Public access to images" ON images FOR SELECT USING (true);
CREATE POLICY "Public access to collections" ON collections FOR SELECT USING (true);
CREATE POLICY "Public access to collection_images" ON collection_images FOR SELECT USING (true);

-- Insert sample data
INSERT INTO images (title, description, src, mime_type, is_favorite) VALUES
('Mountain Sunrise', 'A breathtaking sunrise over snow-capped mountains', 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80', 'image/jpeg', true),
('Ocean Waves', 'Powerful waves crashing on the shore', 'https://images.unsplash.com/photo-1505142468610-359e7d316be0?w=800&q=80', 'image/jpeg', false),
('Forest Path', 'A serene path through an ancient forest', 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&q=80', 'image/jpeg', true),
('Desert Dunes', 'Golden sand dunes under a clear sky', 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&q=80', 'image/jpeg', false),
('Aurora Borealis', 'Green lights dancing in the Arctic sky', 'https://images.unsplash.com/photo-1444080748397-f442aa95c3e5?w=800&q=80', 'image/jpeg', true),
('Tropical Beach', 'Turquoise waters and white sand', 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80', 'image/jpeg', false);

INSERT INTO collections (name, description, image_count) VALUES
('Landscapes', 'Natural landscapes and scenery', 3),
('Portraits', 'Portrait and people photography', 2),
('Travel', 'Travel photography from around the world', 3);

INSERT INTO collection_images (collection_id, image_id) 
SELECT c.id, i.id FROM collections c, images i 
WHERE (c.name = 'Landscapes' AND i.title IN ('Mountain Sunrise', 'Forest Path', 'Desert Dunes'))
OR (c.name = 'Travel' AND i.title IN ('Ocean Waves', 'Aurora Borealis', 'Tropical Beach'));
