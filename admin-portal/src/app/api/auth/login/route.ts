import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(req: Request) {
  try {
    const { password } = await req.json();
    const adminPass = process.env.ADMIN_PASSWORD || "pengufood@admin2026";

    if (!password || password.trim() !== adminPass.trim()) {
      return NextResponse.json(
        { success: false, error: "ভুল পাসওয়ার্ড! অনুগ্রহ করে সঠিক পাসওয়ার্ড দিন।" },
        { status: 401 }
      );
    }

    // Set secure auth cookie valid for 7 days
    const cookieStore = await cookies();
    cookieStore.set("pengufood_admin_token", "authenticated_" + Buffer.from(adminPass).toString("base64"), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return NextResponse.json({ success: true, message: "লগইন সফল হয়েছে!" });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
