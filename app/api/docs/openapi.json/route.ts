import { NextResponse } from "next/server";
import { getOpenApiDocument } from "@/lib/openapi/spec";

export async function GET() {
  const document = getOpenApiDocument();
  return NextResponse.json(document, {
    headers: {
      "Cache-Control": "public, max-age=60",
    },
  });
}
