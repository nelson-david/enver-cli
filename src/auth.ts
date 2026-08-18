import fs from "fs-extra";
import path from "node:path";
import os from "node:os";

const CONFIG_PATH = path.join(os.homedir(), ".enver", "config.json");

export interface EnverConfig {
    token: string;
    apiKey?: string;
}

export function saveConfig(config: EnverConfig) {
    fs.ensureDirSync(path.dirname(CONFIG_PATH));
    fs.writeJsonSync(CONFIG_PATH, config, { spaces: 2 });
}

export function getConfig(): EnverConfig | null {
    if (!fs.existsSync(CONFIG_PATH)) return null;
    try {
        return fs.readJsonSync(CONFIG_PATH);
    } catch {
        return null;
    }
}

// Exported helper so members.ts and other commands can read the stored token directly
export async function getStoredToken(): Promise<string | null> {
    const config = getConfig();
    return config?.token || null;
}

export function logoutUser() {
    if (fs.existsSync(CONFIG_PATH)) {
        fs.removeSync(CONFIG_PATH);
    }
}
