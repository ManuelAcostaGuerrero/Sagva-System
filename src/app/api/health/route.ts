import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({
    ok: true,
    app: "Sagva System",
    phase: "aplicacion-armable"
  });
}
