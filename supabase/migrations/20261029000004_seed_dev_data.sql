-- ====================================================================
-- PenguFood Migration 04: Development & Initial Mathbaria Seed Data
-- Version: 20261029000004
-- NOTE: Kept strictly separate from production data migrations.
-- ====================================================================

-- 1. Seed Categories
INSERT INTO public.categories (id, slug, name_en, name_bn, description_en, description_bn, image_url, display_order, is_cake_category)
VALUES
  ('cat_biryani', 'biryani', 'Biryani & Polao', 'বিরিয়ানি ও পোলাও', 'Authentic traditional Biryani, Kacchi & Khichuri', 'ঐতিহ্যবাহী সুস্বাদু কাচ্চি বিরিয়ানি ও পোলাও', 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=600&q=80', 1, false),
  ('cat_rice', 'rice-meals', 'Rice & Curries', 'ভাত ও তরকারি', 'Daily traditional Bengali lunch & dinner sets', 'প্রতিদিনের তাজা ভাত, মাছ, মাংস ও ভর্তা', 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80', 2, false),
  ('cat_fastfood', 'fast-food', 'Burgers & Fast Food', 'বার্গার ও ফাস্টফুড', 'Crispy chicken, juicy burgers and French fries', 'ক্রিস্পি ফ্রাইড চিকেন, পিজ্জা ও বার্গার', 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80', 3, false),
  ('cat_snacks', 'snacks', 'Evening Snacks', 'সান্ধ্যকালীন নাশতা', 'Singara, Samusa, Puris & Tea snacks', 'গরম গরম সিঙ্গারা, সমুচা, চপ ও নাশতা', 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=600&q=80', 4, false),
  ('cat_cakes', 'cakes', 'Homemade Cakes', 'হোমমেড কেক', 'Freshly baked customized birthday and anniversary cakes', 'টাটকা হোমমেড বার্থডে কেক ও পেস্ট্রি', 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=600&q=80', 5, true)
ON CONFLICT (slug) DO NOTHING;

-- 2. Seed Partner Restaurants in Mathbaria
INSERT INTO public.restaurants (
    id, slug, name_en, name_bn, phone, owner_phone, owner_email,
    image_url, banner_url, cuisines_en, cuisines_bn, rating, review_count,
    is_open, opening_hours_en, opening_hours_bn, min_order, address_en,
    address_bn, distance_km, prep_time_minutes, commission_rate
) VALUES
  ('rest-1', 'kacchi-mahal', 'Kacchi Mahal & Biryani House', 'কাচ্চি মহল ও বিরিয়ানি হাউজ', '01711223344', '01711223344', 'kacchi@mathbaria.com',
   'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=600&q=80',
   'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=80',
   ARRAY['Biryani', 'Kacchi', 'Bengali'], ARRAY['বিরিয়ানি', 'কাচ্চি', 'বাঙালি'], 4.8, 142,
   true, '11:00 AM - 10:30 PM', 'সকাল ১১:০০ - রাত ১০:৩০', 150.00,
   'Main Road, Mathbaria Bazar, Mathbaria', 'মেইন রোড, মঠবাড়িয়া বাজার, মঠবাড়িয়া', 0.4, 25, 15.0),

  ('rest-2', 'bismillah-hotel', 'Bismillah Hotel & Restaurant', 'বিসমিল্লাহ হোটেল অ্যান্ড রেস্টুরেন্ট', '01819876543', '01819876543', 'bismillah@mathbaria.com',
   'https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=600&q=80',
   'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1200&q=80',
   ARRAY['Bengali Meals', 'Fish Curry', 'Khichuri'], ARRAY['বাঙালি খাবার', 'মাছের তরকারি', 'খিচুড়ি'], 4.6, 98,
   true, '07:00 AM - 10:00 PM', 'সকাল ০৭:০০ - রাত ১০:০০', 100.00,
   'College Road, Near Govt. Degree College, Mathbaria', 'কলেজ রোড, সরকারি ডিগ্রি কলেজের কাছে, মঠবাড়িয়া', 1.1, 20, 15.0),

  ('rest-3', 'mathbaria-fast-food', 'Mathbaria Cafe & Fast Food', 'মঠবাড়িয়া ক্যাফে অ্যান্ড ফাস্ট ফুড', '01912340987', '01912340987', 'cafe@mathbaria.com',
   'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=600&q=80',
   'https://images.unsplash.com/photo-1561758033-d89a9ad46330?auto=format&fit=crop&w=1200&q=80',
   ARRAY['Burgers', 'Fried Chicken', 'Pizza'], ARRAY['বার্গার', 'ফ্রাইড চিকেন', 'পিজ্জা'], 4.5, 76,
   true, '12:00 PM - 11:00 PM', 'দুপুর ১২:০০ - রাত ১১:০০', 120.00,
   'Hospital Road, Ward 3, Mathbaria', 'হাসপাতাল রোড, ৩ নং ওয়ার্ড, মঠবাড়িয়া', 1.5, 30, 15.0),

  ('rest-4', 'annapurna-mistanna', 'Annapurna Sweets & Snacks', 'অন্নপূর্ণা মিষ্টান্ন ও নাশতা', '01722334455', '01722334455', 'annapurna@mathbaria.com',
   'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=600&q=80',
   'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=1200&q=80',
   ARRAY['Sweets', 'Snacks', 'Singara', 'Tea'], ARRAY['মিষ্টি', 'নাশতা', 'সিঙ্গারা', 'চা'], 4.7, 115,
   true, '06:30 AM - 09:30 PM', 'সকাল ০৬:৩০ - রাত ০৯:৩০', 80.00,
   'Launch Ghat Road, Mathbaria Bazar', 'লঞ্চঘাট রোড, মঠবাড়িয়া বাজার', 0.6, 15, 12.0),

  ('rest-5', 'mom-bakes', 'Mom Bakes Mathbaria', 'মাম বেকস মঠবাড়িয়া', '01633445566', '01633445566', 'mombakes@mathbaria.com',
   'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=600&q=80',
   'https://images.unsplash.com/photo-1535141192574-5d4897c13136?auto=format&fit=crop&w=1200&q=80',
   ARRAY['Cakes', 'Pastries', 'Desserts'], ARRAY['কেক', 'পেস্ট্রি', 'মিষ্টান্ন'], 4.9, 89,
   true, '09:00 AM - 09:00 PM', 'সকাল ০৯:০০ - রাত ০৯:০০', 300.00,
   'Thana Road, Ward 2, Mathbaria', 'থানা রোড, ২ নং ওয়ার্ড, মঠবাড়িয়া', 0.8, 45, 10.0)
ON CONFLICT (id) DO UPDATE SET
  name_en = EXCLUDED.name_en,
  name_bn = EXCLUDED.name_bn,
  phone = EXCLUDED.phone,
  is_open = EXCLUDED.is_open;

-- 3. Seed Restaurant Staff Accounts with PBKDF2 SHA-512 Secure Hashes
-- Credentials format: salt:hash (10,000 iterations, SHA-512)
INSERT INTO public.restaurant_staff (restaurant_id, login_id, full_name, phone, role, password_hash, can_change_password)
VALUES
  ('rest-1', 'rest-1', 'কাচ্চি মহল কিচেন ইনচার্জ', '01711223344', 'kitchen_manager',
   '814ba08e6485c28bd97b995c7ffd8900:d8ef91805202ed2c7fa49199735dd914ef510e78805742eaaf7b2eff330ac662a7454a937a1b0e5678fa734fd185f5481a4d6af4ae7ebfee5ef875b893a5ad63', false),

  ('rest-2', 'rest-2', 'বিসমিল্লাহ হোটেল ম্যানেজার', '01819876543', 'kitchen_manager',
   '209c8243e6ba00216d3c2e8fb173ac18:070e8b38462c23a8b89bd96fb3d4e24fe70ce602362fd575fb7f7ecf22dc22b626ecd33043a60afa047ddca89f37bbf920580fc7929dcf941684eaea0fd624f8', false),

  ('rest-3', 'rest-3', 'ক্যাফে ডি মঠবাড়িয়া কিচেন', '01912340987', 'kitchen_manager',
   '2c4a2a4480e420ec2f5b99b0cf1fe9f0:f0e94ddd40f386c4ea6c5b40a0df22565c40937e6d373eef325bdd7a41ee30cc2dfb2721d3bd2099f929a9e5e7b4c4ab42581a7d1877c33bf6c9c426252266b7', false),

  ('rest-4', 'rest-4', 'অন্নপূর্ণা মিষ্টান্ন ইনচার্জ', '01722334455', 'kitchen_manager',
   'af8b40414910b262b0ebf442ad1279e0:61017389f94c42d3aa002359a120aef033e10bc2e34b49315832626609e7217758e0c4c1c9df4957d4dd9d3bc43a1a5b11579a95acba478c5b61ed9568453dc8', false),

  ('rest-5', 'rest-5', 'মাম বেকস মাস্টার শেফ', '01633445566', 'kitchen_manager',
   'f472ff65bfa41c4e171d6b866fddc4e1:a5672478fbdeea6553c6ada20f937628648cd0ee98a2d8c3c3e433e9d8b71d596ec202afcc1cbbca1d5d5b86d9a6ea0bc2dc63612e9310eee7a0339158d098be', false)
ON CONFLICT (login_id) DO UPDATE SET
  password_hash = EXCLUDED.password_hash;

-- Also store credentials in app_settings for backwards compatibility with existing authentication routes
INSERT INTO public.app_settings (key, value, description)
VALUES (
    'restaurant_passwords',
    '{
      "rest-1": "814ba08e6485c28bd97b995c7ffd8900:d8ef91805202ed2c7fa49199735dd914ef510e78805742eaaf7b2eff330ac662a7454a937a1b0e5678fa734fd185f5481a4d6af4ae7ebfee5ef875b893a5ad63",
      "rest-2": "209c8243e6ba00216d3c2e8fb173ac18:070e8b38462c23a8b89bd96fb3d4e24fe70ce602362fd575fb7f7ecf22dc22b626ecd33043a60afa047ddca89f37bbf920580fc7929dcf941684eaea0fd624f8",
      "rest-3": "2c4a2a4480e420ec2f5b99b0cf1fe9f0:f0e94ddd40f386c4ea6c5b40a0df22565c40937e6d373eef325bdd7a41ee30cc2dfb2721d3bd2099f929a9e5e7b4c4ab42581a7d1877c33bf6c9c426252266b7",
      "rest-4": "af8b40414910b262b0ebf442ad1279e0:61017389f94c42d3aa002359a120aef033e10bc2e34b49315832626609e7217758e0c4c1c9df4957d4dd9d3bc43a1a5b11579a95acba478c5b61ed9568453dc8",
      "rest-5": "f472ff65bfa41c4e171d6b866fddc4e1:a5672478fbdeea6553c6ada20f937628648cd0ee98a2d8c3c3e433e9d8b71d596ec202afcc1cbbca1d5d5b86d9a6ea0bc2dc63612e9310eee7a0339158d098be"
    }'::jsonb,
    'PBKDF2 SHA-512 securely hashed restaurant credentials'
) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- 4. Seed Products
INSERT INTO public.products (
    id, slug, restaurant_id, category_id, name_en, name_bn,
    description_en, description_bn, price, original_price, image_url,
    is_available, is_popular, is_recommended, is_cake, cake_advance_days, cake_sizes, cake_flavors
) VALUES
  ('prod-1', 'mutton-kacchi-full', 'rest-1', 'cat_biryani', 'Special Shahi Mutton Kacchi', 'স্পেশাল শাহী খাসির কাচ্চি',
   'Tender mutton cooked with aromatic basmati rice, potatoes, and special spices.',
   'সুগন্ধি বাসমতী চাল, নরম খাসির মাংস ও আলু দিয়ে রান্না করা ঐতিহ্যবাহী কাচ্চি বিরিয়ানি।',
   280.00, 320.00,
   'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=600&q=80',
   true, true, true, false, 0, NULL, NULL),

  ('prod-2', 'chicken-biryani', 'rest-1', 'cat_biryani', 'Chicken Dum Biryani', 'চিকেন দম বিরিয়ানি',
   'Delicious aromatic chicken biryani served with boiled egg and salad.',
   'রসালো চিকেন পিস, ডিম ও সুবাসিত চালের পারফেক্ট কম্বিনেশনের দম বিরিয়ানি।',
   180.00, 200.00,
   'https://images.unsplash.com/photo-1633945274405-b6c8069047b0?auto=format&fit=crop&w=600&q=80',
   true, true, false, false, 0, NULL, NULL),

  ('prod-3', 'rui-fish-meal', 'rest-2', 'cat_rice', 'Rui Fish Rice Thali', 'রুই মাছের দুপুরের মিল',
   'Steamed rice with fresh Rui fish curry, dal, mixed vegetables, and mashed potato bhorta.',
   'গরম ভাত, তাজা রুই মাছের ঝোল, পাতলা ডাল, সবজি ও আলু ভর্তা।',
   130.00, NULL,
   'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80',
   true, true, true, false, 0, NULL, NULL),

  ('prod-4', 'crispy-zinger-burger', 'rest-3', 'cat_fastfood', 'Crispy Chicken Zinger Burger', 'ক্রিস্পি চিকেন জিঙ্গার বার্গার',
   'Extra crunchy fried chicken fillet topped with fresh lettuce and signature sauce.',
   'মুচমুচে ফ্রাইড চিকেন, সতেজ লেটুস ও পেঙ্গু স্পেশাল সসের সুস্বাদু বার্গার।',
   140.00, 160.00,
   'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80',
   true, true, false, false, 0, NULL, NULL),

  ('prod-5', 'hot-singara-set', 'rest-4', 'cat_snacks', 'Hot Potato Singara (4 pcs)', 'গরম আলু সিঙ্গারা (৪ টি)',
   'Golden crispy crust stuffed with spiced potato and peanuts, served with tamarind chutney.',
   'মচমচে খোলসে বাদাম ও মসলাদার আলুর পুর দেওয়া গরম গরম সিঙ্গারা।',
   40.00, NULL,
   'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=600&q=80',
   true, false, false, false, 0, NULL, NULL),

  ('prod-6', 'black-forest-cake', 'rest-5', 'cat_cakes', 'Classic Black Forest Cake (1 Pound)', 'ক্লাসিক ব্ল্যাক ফরেস্ট বার্থডে কেক (১ পাউন্ড)',
   'Layered rich chocolate sponge with fresh whipped cream and cherries. Minimum 2 days advance notice.',
   'চকলেট স্পঞ্জ, তাজা হুইপড ক্রিম ও চেরির ক্লাসিক বার্থডে কেক। কমপক্ষে ২ দিন পূর্বে অর্ডার আবশ্যক।',
   650.00, 700.00,
   'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=600&q=80',
   true, true, true, true, 2,
   '[{"id": "1lb", "labelEn": "1 Pound", "labelBn": "১ পাউন্ড", "price": 650, "weight": "1 lb"}, {"id": "2lb", "labelEn": "2 Pounds", "labelBn": "২ পাউন্ড", "price": 1200, "weight": "2 lbs"}]'::jsonb,
   '[{"id": "choco", "nameEn": "Dark Chocolate", "nameBn": "ডার্ক চকলেট"}, {"id": "vanilla", "nameEn": "Vanilla Cherry", "nameBn": "ভ্যানিলা চেরি"}]'::jsonb)
ON CONFLICT (id) DO UPDATE SET
  price = EXCLUDED.price,
  is_available = EXCLUDED.is_available;

-- 5. Seed Delivery Zones (Mathbaria Bazar Center)
INSERT INTO public.delivery_zones (id, name_en, name_bn, min_distance_km, max_distance_km, regular_fee, cake_fee, is_active)
VALUES
  ('zone_0_2', 'Mathbaria Town Core (0-2 km)', 'মঠবাড়িয়া পৌর এলাকা (০-২ কিমি)', 0.0, 2.0, 40.00, 100.00, true),
  ('zone_2_3', 'Extended Town (2-3 km)', 'পৌর সীমানা সংলগ্ন (২-৩ কিমি)', 2.0, 3.0, 60.00, 100.00, true),
  ('zone_3_8', 'Suburbs & Union Cakes (3-8 km)', 'উপশহর ও ইউনিয়ন কেক ডেলিভারি (৩-৮ কিমি)', 3.0, 8.0, 150.00, 150.00, true)
ON CONFLICT (id) DO UPDATE SET
  regular_fee = EXCLUDED.regular_fee,
  cake_fee = EXCLUDED.cake_fee;

-- 6. Seed Dynamic Pricing Rules
INSERT INTO public.pricing_rules (id, name, rule_type, base_fee, per_km_fee, min_order_amount, rider_base_cut, parameters, is_active)
VALUES
  ('rule_reg_0_2', 'Core Regular Food (0-2 km)', 'delivery_rate', 40.00, 0.00, 0.00, 35.00, '{"max_km": 2.0}'::jsonb, true),
  ('rule_reg_2_3', 'Extended Regular Food (2-3 km)', 'delivery_rate', 60.00, 0.00, 0.00, 35.00, '{"max_km": 3.0}'::jsonb, true),
  ('rule_cake_0_3', 'Town Homemade Cakes (0-3 km)', 'cake_rate', 100.00, 0.00, 0.00, 60.00, '{"advance_days": 2}'::jsonb, true),
  ('rule_cake_3_8', 'Special Union Cake Delivery (3-8 km)', 'cake_rate', 150.00, 0.00, 0.00, 100.00, '{"advance_days": 2, "cake_only": true}'::jsonb, true)
ON CONFLICT (id) DO UPDATE SET
  base_fee = EXCLUDED.base_fee,
  rider_base_cut = EXCLUDED.rider_base_cut;

-- 7. Seed Riders
INSERT INTO public.riders (id, name, phone, vehicle, is_active, is_online, current_lat, current_lng, total_deliveries, total_earnings, balance, rating)
VALUES
  ('rdr_1', 'Tariqul Islam', '01711223344', 'Honda 125 (Barishal-Ha-1234)', true, true, 22.2858, 89.9614, 42, 1470.00, 520.00, 4.9),
  ('rdr_2', 'Shafiqur Rahman', '01819876543', 'Discover 110 (Barishal-Ha-5678)', true, true, 22.2842, 89.9602, 28, 980.00, 350.00, 4.8),
  ('rdr_3', 'Mehedi Hasan', '01912340987', 'Runner Bike', true, false, 22.2850, 89.9610, 15, 525.00, 175.00, 4.7)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  phone = EXCLUDED.phone;

-- 8. Seed Welcome Coupons
INSERT INTO public.coupons (code, description_en, description_bn, discount_type, discount_value, min_order, max_discount, is_active)
VALUES
  ('PENGU50', 'Get 50 BDT off on your first order', 'প্রথম অর্ডারে ৫০ টাকা ছাড়', 'fixed', 50.00, 250.00, 50.00, true),
  ('MATHBARIA', '10% discount on local orders', '১০% স্পেশাল ডিসকাউন্ট', 'percentage', 10.00, 200.00, 80.00, true)
ON CONFLICT (code) DO NOTHING;

-- 9. Seed Promotional Banners
INSERT INTO public.banners (id, badge_en, badge_bn, title_en, title_bn, subtitle_en, subtitle_bn, link, button_text_en, button_text_bn, image_url, is_active, display_order)
VALUES
  ('bnr_welcome', 'Mathbaria Special', 'মঠবাড়িয়া স্পেশাল',
   'Craving Delicious Food in Mathbaria?', 'মঠবাড়িয়ার সেরা সব রেস্তোরাঁর খাবার এখন আপনার দ্বারে!',
   'Order fresh biryani, burgers, and home-cooked delicacies directly to your door in 30 minutes.',
   'কাচ্চি, বিরিয়ানি, ফাস্টফুড কিংবা দুপুরের ঘরোয়া খাবার—দ্রুততম সময়ে পৌঁছে দিচ্ছি আমরা।',
   '/foods', 'Order Food', 'খাবার অর্ডার করুন',
   'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=80', true, 1),

  ('bnr_cake', 'Custom Cakes', 'স্পেশাল হোমমেড কেক',
   'Celebrating a Birthday or Anniversary?', 'জন্মদিন বা বিশেষ উৎসবের হোমমেড ফ্রেশ কেক',
   'Order customized bakery and home-baker cakes with your personalized greeting message.',
   'পছন্দের ফ্লেভার ও নাম লেখার অপশনসহ ঘরে বসেই অর্ডার করুন টাটকা সুস্বাদু কেক।',
   '/cakes', 'Explore Cakes', 'কেক দেখুন',
   'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=1200&q=80', true, 2)
ON CONFLICT (id) DO NOTHING;
