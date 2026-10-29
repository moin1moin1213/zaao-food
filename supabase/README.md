# PenguFood — Supabase Backend Foundation & Migration Setup Guide

This guide provides instructions to connect PenguFood's frontend applications (Customer Web, Admin Portal, Restaurant Portal, and Android Rider App) to your dedicated Supabase project.

---

## 1. Project Directory Structure

```text
supabase/
├── migrations/
│   ├── 20261029000001_core_schema.sql            # Tables, FKs, constraints, indexes
│   ├── 20261029000002_functions_and_realtime.sql  # Asia/Dhaka sales RPCs & Realtime setup
│   ├── 20261029000003_row_level_security.sql     # RLS policies & strict role isolation
│   └── 20261029000004_seed_dev_data.sql          # Mathbaria dev seed catalog & credentials
├── verifyMigrations.mjs                          # Migration integrity test script
└── README.md                                     # This setup guide
```

---

## 2. Step 1: Create Supabase Project

1. Log in to your [Supabase Dashboard](https://supabase.com/dashboard) and click **"New Project"**.
2. **Project Name**: `pengufood-production` (or `pengufood-dev`).
3. **Database Password**: Choose a strong password and save it in a password manager.
4. **Region**: Select **Singapore (`ap-southeast-1`)** or **Mumbai (`ap-south-1`)** for optimal latency to Bangladesh.
5. Once provisioned, navigate to **Project Settings** $\rightarrow$ **API** to copy:
   - **Project URL**: `https://<your-project-ref>.supabase.co`
   - **Publishable Key (Anon Key)**: `eyJ...` (Public, safe for browsers and mobile apps)
   - **Service Role Key (`secret`)**: `eyJ...` (**PRIVATE**: Server-side only! Never expose to browser or mobile apps)

---

## 3. Step 2: Apply Migrations (In Order)

### Option A: Via Supabase Dashboard (Recommended for Quick Setup)
Open your project's **SQL Editor** in the Supabase Dashboard and run the 4 migration scripts in exact numerical order:

1. Copy and run `supabase/migrations/20261029000001_core_schema.sql`
   - Creates all 16 core tables (`customers`, `administrators`, `restaurants`, `restaurant_staff`, `riders`, `categories`, `products`, `delivery_zones`, `pricing_rules`, `coupons`, `banners`, `orders`, `order_items`, `order_status_history`, `notifications`, `app_settings`), indexes, and triggers.
2. Copy and run `supabase/migrations/20261029000002_functions_and_realtime.sql`
   - Creates Asia/Dhaka timezone sales calculation RPCs (`get_daily_sales_dhaka`, `get_weekly_sales_dhaka`), status audit triggers, and registers tables in `supabase_realtime`.
3. Copy and run `supabase/migrations/20261029000003_row_level_security.sql`
   - Enables RLS on all 16 tables. Enforces strict role isolation (e.g. restaurant accounts can never alter menus or profiles; public cannot tamper with prices).
4. *(For Development / Testing)* Copy and run `supabase/migrations/20261029000004_seed_dev_data.sql`
   - Seeds initial Mathbaria restaurants, PBKDF2 hashed staff credentials, products, delivery zones, and demo riders.

### Option B: Via Supabase CLI
```bash
# Link your local project
supabase link --project-ref <your-project-ref>

# Push migrations
supabase db push
```

---

## 4. Step 3: Configure Environment Variables

Create or update your `.env` or `.env.local` file at the root:

```env
# 1. Supabase Backend
NEXT_PUBLIC_SUPABASE_URL=https://<your-project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<your-anon-publishable-key>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-publishable-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-secret-key>

# 2. Rider App (Expo)
EXPO_PUBLIC_SUPABASE_URL=https://<your-project-ref>.supabase.co
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<your-anon-publishable-key>

# 3. Admin Security
ADMIN_PASSWORD=<your-secure-admin-passphrase>
```

---

## 5. Step 4: Create Initial Administrator Securely

To create your super admin account without storing plaintext passwords, execute this SQL query in the Supabase SQL Editor:

```sql
INSERT INTO public.administrators (
    username,
    full_name,
    email,
    phone,
    role,
    password_hash,
    is_active
) VALUES (
    'admin',
    'PenguFood Super Admin',
    'admin@pengufood.com',
    '01700000000',
    -- PBKDF2 SHA-512 hashed secondary password for web portal
    '814ba08e6485c28bd97b995c7ffd8900:d8ef91805202ed2c7fa49199735dd914ef510e78805742eaaf7b2eff330ac662a7454a937a1b0e5678fa734fd185f5481a4d6af4ae7ebfee5ef875b893a5ad63',
    'super_admin',
    true
)
ON CONFLICT (username) DO NOTHING;
```

---

## 6. Frontend Screen Progressive Integration Status

| App | Screen / Route | Data Source | Loading / Empty / Error State | Mock Fallback Status |
| :--- | :--- | :--- | :--- | :--- |
| **Customer Web** | `/` (Home) | Supabase `categories`, `products`, `banners`, `restaurants` | Shimmer Skeletons, Banner carousel | Active fallback to `MOCK_CATEGORIES` & `MOCK_FOODS` if unconfigured |
| **Customer Web** | `/foods`, `/foods/[slug]` | Supabase `products` | Skeleton grid, category filter tabs | Active fallback to `MOCK_FOODS` |
| **Customer Web** | `/cakes`, `/cakes/[slug]` | Supabase `products` (`is_cake = true`) | Advance notice alert, flavor selector | Active fallback to `MOCK_FOODS` |
| **Customer Web** | `/restaurants`, `/restaurants/[slug]` | Supabase `restaurants` & `products` | Restaurant header, open/closed badge | Active fallback to `MOCK_RESTAURANTS` |
| **Customer Web** | `/checkout` $\rightarrow$ `/api/orders` | **Server-side validated API** | Processing spinner, inline validation | Server calculates prices & delivery zones |
| **Customer Web** | `/orders/[orderId]` | Supabase `orders` + **Realtime** | Live GPS Leaflet map, OrderTimeline | Polls or listens to Realtime stream |
| **Customer Web** | `/notifications` | Supabase `notifications` | Unread badge, category filter | Fallback to local storage if offline |
| **Admin Portal** | `/` (Overview) | Supabase live orders & stats | Stat cards, revenue calculations | Real database aggregation |
| **Admin Portal** | `/orders` | Supabase `orders` + **Realtime** | Filter tabs, rider dispatch modal | Realtime sync on order creation |
| **Admin Portal** | `/restaurants` | Supabase `restaurants` & `restaurant_staff` | Password modal with one-time reveal | Full PBKDF2 SHA-512 encryption |
| **Admin Portal** | `/foods` | Supabase `products` | Add/Edit modal, image URL preview | Direct server action upsert |
| **Admin Portal** | `/pricing` | Supabase `delivery_zones` & `pricing_rules` | Interactive distance zone ledger | Changes take effect immediately |
| **Admin Portal** | `/riders` | Supabase `riders` | Fleet status, earnings, toggle | Realtime driver coordinates |
| **Restaurant Portal** | `/` (Kitchen) | `/api/restaurant/orders` + **Realtime** | Audio chime, cooking timer | Session-isolated (only own restaurant) |
| **Restaurant Portal** | `/sales` | Asia/Dhaka Sales functions | Saturday-to-Friday ledger, bar chart | Excludes cancelled orders from gross |
| **Rider App** | Active Deliveries | Supabase `riders` & `orders` | Location tracker, Accept/Reject buttons | Direct publishable key connection |
