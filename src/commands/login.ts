import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import readline from "node:readline/promises";
import ora from "ora";
import chalk from "chalk";
import open from "open";

const CONFIG_PATH = path.join(os.homedir(), ".enver", "config.json");
const DASHBOARD_TOKEN_URL = process.env.ENVER_WEB_URL
    ? `${process.env.ENVER_WEB_URL}/settings/tokens`
    : "http://localhost:3000/settings/tokens";

export async function loginCommand(tokenArg?: string) {
    let token = tokenArg?.trim();

    console.log("TOKEN: ", token);

    // If no token argument passed, prompt interactively
    if (!token) {
        console.log(
            chalk.cyan(
                `\nOpening browser to copy your API key: ${chalk.underline(DASHBOARD_TOKEN_URL)}\n`,
            ),
        );

        try {
            await open(DASHBOARD_TOKEN_URL);
        } catch {
            // Ignore if browser fail to launch automatically
        }

        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
        });

        const inputToken = await rl.question(
            chalk.bold("Paste your Enver API key: "),
        );
        rl.close();

        token = inputToken.trim();
    }

    if (!token) {
        console.log(chalk.red("\n❌ No API key provided. Login aborted."));
        return;
    }

    const spinner = ora("Saving session token...").start();

    try {
        const configDir = path.dirname(CONFIG_PATH);
        await fs.mkdir(configDir, { recursive: true });

        await fs.writeFile(
            CONFIG_PATH,
            JSON.stringify({ token }, null, 2),
            "utf8",
        );

        spinner.succeed(
            chalk.green("Successfully logged in! Session token saved."),
        );
    } catch (error: any) {
        spinner.fail(
            chalk.red(`Failed to save session token: ${error.message}`),
        );
    }
}

export async function getStoredToken(): Promise<string | null> {
    try {
        const data = await fs.readFile(CONFIG_PATH, "utf8");
        const config = JSON.parse(data);
        return config.token || null;
    } catch {
        return null;
    }
}
