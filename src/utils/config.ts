import fs from "node:fs/promises";
import path from "node:path";

export const API_URL =
    process.env.ENVER_API_URL || "https://api-staging.enver-os.xyz/api/v1";

export interface LocalProjectConfig {
    projectId: string;
    name: string;
    defaultEnvironment?: "PRODUCTION" | "STAGING" | "DEVELOPMENT";
}

export async function getLocalProjectConfig(): Promise<LocalProjectConfig | null> {
    try {
        const configPath = path.join(process.cwd(), ".ev.json");
        const data = await fs.readFile(configPath, "utf8");
        return JSON.parse(data) as LocalProjectConfig;
    } catch {
        return null;
    }
}

export function parseEnv(content: string): Record<string, string> {
    const result: Record<string, string> = {};
    for (const line of content.split("\n")) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;
        const idx = trimmed.indexOf("=");
        if (idx === -1) continue;
        result[trimmed.slice(0, idx).trim()] = trimmed.slice(idx + 1).trim();
    }
    return result;
}
