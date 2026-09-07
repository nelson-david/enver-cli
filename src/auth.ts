import fs from "node:fs";
import path from "node:path";
import os from "node:os";

const CONFIG_PATH = path.join(os.homedir(), ".enver", "config.json");

export interface EnverConfig {
    token: string;
    apiKey?: string;
}

export function saveConfig(config: EnverConfig) {
    fs.mkdirSync(path.dirname(CONFIG_PATH), { recursive: true });
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
}

export function getConfig(): EnverConfig | null {
    if (!fs.existsSync(CONFIG_PATH)) return null;
    try {
        return JSON.parse(fs.readFileSync(CONFIG_PATH, "utf8"));
    } catch {
        return null;
    }
}

// Exported helper so members.ts and other commands can read the stored token directly
export async function getStoredToken(): Promise<string | null> {
    const config = getConfig();
    return config?.token || config?.apiKey || null;
}

export function logoutUser() {
    if (fs.existsSync(CONFIG_PATH)) {
        fs.rmSync(CONFIG_PATH, { force: true });
    }
}
