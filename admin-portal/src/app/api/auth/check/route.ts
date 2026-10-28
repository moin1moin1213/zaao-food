import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get("pengufood_admin_token");
  const adminPass = process.env.ADMIN_PASSWORD || "pengufood@admin2026";
  const expectedToken = "authenticated_" + Buffer.from(adminPass).toString("base64");

  const isAuthenticated = Boolean(token && token.value === expectedToken);
  return NextResponse.json({ authenticated: isAuthenticated });
}
