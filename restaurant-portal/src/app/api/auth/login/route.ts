import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { catalogService } from "@/services/catalogService";

const DEFAULT_RESTAURANT_PASSWORDS: Record<string, string> = {
  "rest-1": "kacchi123",
  "rest-2": "bismillah123",
  "rest-3": "cafe123",
  "rest-4": "sultana123",
  "rest-5": "roshona123",
};

const MASTER_RESTAURANT_PIN = "123456";

export async function POST(req: Request) {
  try {
    const { restaurantId, password } = await req.json();

    if (!restaurantId || !password) {
      return NextResponse.json(
        { success: false, error: "রেস্তোরাঁ এবং পাসওয়ার্ড উভয়ই প্রদান করুন" },
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

    // Verify password
    const expectedPassword = DEFAULT_RESTAURANT_PASSWORDS[targetRest.id];
    const isMasterMatch = password.trim() === MASTER_RESTAURANT_PIN;
    const isSpecificMatch = expectedPassword && password.trim() === expectedPassword;

    if (!isMasterMatch && !isSpecificMatch) {
      return NextResponse.json(
        { success: false, error: "ভুল পাসওয়ার্ড বা পিন! অনুগ্রহ করে সঠিক পাসওয়ার্ড দিন।" },
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
      message: "রেস্তোরাঁ লগইন সফল হয়েছে!",
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
