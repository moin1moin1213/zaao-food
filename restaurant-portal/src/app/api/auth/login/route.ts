import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { catalogService } from "@/services/catalogService";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { verifyPassword } from "@/lib/auth/password";

export async function POST(req: Request) {
  try {
    const { restaurantId, password } = await req.json();

    if (!restaurantId || !password) {
      return NextResponse.json(
        { success: false, error: "রেস্তোরাঁ আইডি এবং পাসওয়ার্ড উভয়ই প্রদান করুন" },
        { status: 400 }
      );
    }

    // Verify restaurant exists
    const restaurants = await catalogService.getRestaurants();
    const targetRest = restaurants.find((r) => r.id === restaurantId || r.phone === restaurantId);

    if (!targetRest) {
      return NextResponse.json(
        { success: false, error: "রেস্তোরাঁটি খুঁজে পাওয়া যায়নি" },
        { status: 404 }
      );
    }

    // Fetch dynamic PBKDF2 hashed password from restaurant_staff table or app_settings fallback
    let storedHash: string | undefined;
    if (supabaseAdmin) {
      try {
        const { data: staffData } = await supabaseAdmin
          .from("restaurant_staff")
          .select("password_hash")
          .eq("login_id", targetRest.id)
          .eq("is_active", true)
          .single();

        if (staffData && staffData.password_hash) {
          storedHash = staffData.password_hash;
        }
      } catch (err) {
        // Table might not exist yet before migration
      }

      if (!storedHash) {
        try {
          const { data: settingsData } = await supabaseAdmin
            .from("app_settings")
            .select("value")
            .eq("key", "restaurant_passwords")
            .single();

          if (settingsData && settingsData.value) {
            storedHash = settingsData.value[targetRest.id];
          }
        } catch (err) {
          console.warn("Could not fetch restaurant passwords from Supabase:", err);
        }
      }
    }

    // Verify password against secure PBKDF2 SHA-512 hash
    let isMatch = false;

    if (storedHash) {
      isMatch = verifyPassword(password.trim(), storedHash);
    } else {
      // Fallback: Default temporary PIN for initial setup if not yet configured in DB
      isMatch = password.trim() === "123456";
    }

    if (!isMatch) {
      return NextResponse.json(
        { success: false, error: "ভুল পাসওয়ার্ড! অ্যাডমিনের সাথে যোগাযোগ করে সঠিক পাসওয়ার্ড জেনে নিন।" },
        { status: 401 }
      );
    }

    const sessionData = {
      restaurantId: targetRest.id,
      nameBn: targetRest.nameBn,
      nameEn: targetRest.nameEn,
      phone: targetRest.phone,
      loggedInAt: new Date().toISOString(),
    };

    const cookieStore = await cookies();
    cookieStore.set("pengufood_restaurant_session", JSON.stringify(sessionData), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 14, // 14 days
    });

    return NextResponse.json({
      success: true,
      restaurant: sessionData,
      message: "রেস্তোরাঁ কিচেন পোর্টালে লগইন সফল হয়েছে!",
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
