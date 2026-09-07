import fs from "node:fs/promises";
import path from "node:path";
import ora from "ora";
import chalk from "chalk";
import { decryptPayload } from "../utils/crypto.js";
import { getStoredToken } from "../auth.js";
import { API_URL, getLocalProjectConfig, parseEnv } from "../utils/config.js";

export async function pullCommand(
    projectIdArg?: string,
    lockKeyArg?: string,
    environmentArg?: string,
) {
    const token = await getStoredToken();
    if (!token) {
        console.log(
            chalk.red("Authentication required. Please run `ev login` first."),
        );
        return;
    }

    const localConfig = await getLocalProjectConfig();

    // 1. Resolve Project ID: Explicit arg > .ev.json > Fallback
    const projectId = projectIdArg || localConfig?.projectId;
    if (!projectId) {
        console.log(
            chalk.red(
                "Error: Missing project ID. Run `ev init` or pass a project ID.",
            ),
        );
        return;
    }

    // 2. Resolve Lock Key
    const lockKey = lockKeyArg;
    if (!lockKey) {
        console.log(
            chalk.red(
                "Error: Missing encryption lock key. Provide the lock key used to encrypt your variables.",
            ),
        );
        return;
    }

    // 3. Resolve Environment: Explicit arg > .ev.json > Default "DEVELOPMENT"
    const targetEnvironment = (
        environmentArg ||
        localConfig?.defaultEnvironment ||
        "DEVELOPMENT"
    ).toUpperCase();

    const spinner = ora(
        `Fetching secret payload for [${projectId}] (${targetEnvironment})...`,
    ).start();

    try {
        // 4. Fetch secret payload from backend with Auth header
        const url = new URL(`${API_URL}/envs/share/${projectId}`);
        url.searchParams.set("environment", targetEnvironment);

        const res = await fetch(url.toString(), {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        const data = await res.json();
        if (!res.ok) {
            throw new Error(data.error || res.statusText);
        }

        const { ciphertext, iv, salt, shares } = data.data;
        spinner.text = "Decrypting secrets locally...";

        // 5. Decrypt secret payload locally
        const shareDataArray = shares.map(
            (s: { shareData: string }) => s.shareData,
        );
        const plainTextEnv = decryptPayload(
            ciphertext,
            iv,
            salt,
            shareDataArray,
            lockKey,
        );

        // 6. Write / Merge into local .env file
        const envPath = path.join(process.cwd(), ".env");
        let existingEnvs: Record<string, string> = {};

        try {
            const existingFile = await fs.readFile(envPath, "utf8");
            existingEnvs = parseEnv(existingFile);
        } catch {
            // File does not exist yet
        }

        const newEnvs = parseEnv(plainTextEnv);
        const mergedEnvs = { ...existingEnvs, ...newEnvs };

        const formattedEnvFile = Object.entries(mergedEnvs)
            .map(([key, value]) => `${key}=${value}`)
            .join("\n");

        await fs.writeFile(envPath, formattedEnvFile, "utf8");

        spinner.succeed(
            chalk.green(
                `Successfully pulled and decrypted envs into .env (${targetEnvironment})`,
            ),
        );
    } catch (error: any) {
        spinner.fail(
            chalk.red(
                `Failed to pull secrets: ${error.message}`,
            ),
        );
    }
}
