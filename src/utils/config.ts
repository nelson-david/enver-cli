import fs from "node:fs/promises";
import path from "node:path";

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
