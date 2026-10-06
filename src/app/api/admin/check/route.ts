import { NextResponse } from "next/server";
import { isCurrentUserAdmin, isCurrentUserSuperAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [isAdmin, isSuperAdmin] = await Promise.all([
      isCurrentUserAdmin(),
      isCurrentUserSuperAdmin(),
    ]);
    return NextResponse.json({ isAdmin, isSuperAdmin });
  } catch {
    return NextResponse.json({ isAdmin: false, isSuperAdmin: false });
  }
}
