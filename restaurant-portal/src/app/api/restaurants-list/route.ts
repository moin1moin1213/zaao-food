import { NextResponse } from "next/server";
import { catalogService } from "@/services/catalogService";

export async function GET() {
  try {
    const restaurants = await catalogService.getRestaurants();
    const publicList = restaurants.map((r) => ({
      id: r.id,
      nameEn: r.nameEn,
      nameBn: r.nameBn,
      phone: r.phone,
      image: r.image,
    }));
    return NextResponse.json(publicList);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
