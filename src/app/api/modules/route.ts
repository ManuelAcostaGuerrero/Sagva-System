import { NextResponse } from "next/server";
import { modulesConfig } from "@/config/modules.config";

export function GET() {
  return NextResponse.json({
    modules: modulesConfig.map(({ icon: _icon, ...moduleItem }) => moduleItem)
  });
}
