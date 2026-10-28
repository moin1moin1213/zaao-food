import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST() {
  const cookieStore = await cookies();
  cookieStore.delete("pengufood_admin_token");
  return NextResponse.json({ success: true, message: "লগআউট সম্পন্ন হয়েছে" });
}
