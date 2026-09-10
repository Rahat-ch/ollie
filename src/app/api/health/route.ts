import { constants } from "node:fs";
import { access, mkdir } from "node:fs/promises";
import { NextResponse } from "next/server";
import { readEnv } from "@/lib/env";

export const dynamic = "force-dynamic";

async function ensureWritable(dir: string): Promise<boolean> {
  try {
    await mkdir(dir, { recursive: true });
    await access(dir, constants.W_OK);
    return true;
  } catch {
    return false;
  }
}

export async function GET() {
  const { audioDir } = readEnv();
  const audioDirWritable = await ensureWritable(audioDir);
  // The Docker HEALTHCHECK and Coolify only look at the status code, so an
  // unwritable audio directory must surface as a non-2xx response.
  return NextResponse.json(
    { ok: audioDirWritable, audioDir, audioDirWritable },
    { status: audioDirWritable ? 200 : 503 },
  );
}
