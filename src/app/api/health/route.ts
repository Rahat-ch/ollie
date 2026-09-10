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
  return NextResponse.json({ ok: true, audioDir, audioDirWritable });
}
