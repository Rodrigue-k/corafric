import { NextResponse } from "next/server";
import { isCurrentUserAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const isAdmin = await isCurrentUserAdmin();
    return NextResponse.json({ isAdmin });
  } catch {
    return NextResponse.json({ isAdmin: false });
  }
}
