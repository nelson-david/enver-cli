import fs from "node:fs/promises";
import path from "node:path";
import ora from "ora";
import chalk from "chalk";
import axios from "axios";
import { encryptPayload } from "../utils/crypto.js";
import { getStoredToken } from "./login.js";

const API_URL = process.env.ENVER_API_URL || "http://localhost:3250/api/v1";

interface LocalProjectConfig {
    projectId: string;
    name: string;
    defaultEnvironment?: string;
}

// Helper to read local .ev.json
async function getLocalProjectConfig(): Promise<LocalProjectConfig | null> {
    try {
        const configPath = path.join(process.cwd(), ".ev.json");
        const data = await fs.readFile(configPath, "utf8");
        return JSON.parse(data) as LocalProjectConfig;
    } catch {
        return null;
    }
}

export async function pushCommand(
    projectIdArg?: string,
    lockKeyArg?: string,
    environmentArg?: string,
) {
    const token = await getStoredToken();
    if (!token) {
        console.log(
            chalk.red(
                "Error: You are not logged in. Please run `ev login <your-token>` first.",
            ),
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
                "Error: Missing encryption lock key. Provide a lock key to encrypt your variables.",
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

    const spinner = ora(`Reading local .env file...`).start();

    try {
        // 4. Read local .env file
        const envPath = path.join(process.cwd(), ".env");
        let localEnvContent = "";

        try {
            localEnvContent = await fs.readFile(envPath, "utf8");
        } catch {
            spinner.fail(
                chalk.red("No .env file found in the current directory."),
            );
            return;
        }

        if (!localEnvContent.trim()) {
            spinner.fail(
                chalk.red("Local .env file is empty. Nothing to push."),
            );
            return;
        }

        spinner.text = `Encrypting environment variables locally...`;

        // 5. Encrypt locally using the provided Lock Key
        const { ciphertext, iv, salt, shares } = encryptPayload(
            localEnvContent,
            lockKey,
        );

        spinner.text = `Uploading encrypted payload for [${projectId}] (${targetEnvironment})...`;

        // 6. Post encrypted data to backend
        const response = await axios.post(
            `${API_URL}/envs`,
            {
                projectId,
                environment: targetEnvironment,
                ciphertext,
                iv,
                salt,
                shares: shares.map((shareData, index) => ({
                    shareIndex: index + 1,
                    shareData,
                })),
            },
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            },
        );

        if (response.data.success) {
            spinner.succeed(
                chalk.green(
                    `Successfully encrypted & pushed .env to remote (${targetEnvironment})`,
                ),
            );
        } else {
            throw new Error(
                response.data.error || "Failed to push environment variables.",
            );
        }
    } catch (error: any) {
        spinner.fail(
            chalk.red(
                `Failed to push secrets: ${error.response?.data?.error || error.message}`,
            ),
        );
    }
}
