import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("pengufood_restaurant_session");

  if (!sessionCookie || !sessionCookie.value) {
    return NextResponse.json({ authenticated: false, restaurant: null });
  }

  try {
    const restaurant = JSON.parse(sessionCookie.value);
    return NextResponse.json({ authenticated: true, restaurant });
  } catch {
    return NextResponse.json({ authenticated: false, restaurant: null });
  }
}
