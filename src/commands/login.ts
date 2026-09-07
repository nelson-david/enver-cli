import { exec } from "node:child_process";
import readline from "node:readline/promises";
import ora from "ora";
import chalk from "chalk";
import { saveConfig } from "../auth.js";

const DASHBOARD_TOKEN_URL = process.env.ENVER_WEB_URL
    ? `${process.env.ENVER_WEB_URL}/settings/tokens`
    : "https://app.enver-os.xyz/settings/tokens";

function openUrl(url: string) {
    const cmd =
        process.platform === "darwin"
            ? "open"
            : process.platform === "win32"
              ? "start"
              : "xdg-open";
    exec(`${cmd} "${url}"`);
}

export async function loginCommand(tokenArg?: string) {
    let token = tokenArg?.trim();

    // If no token argument passed, prompt interactively
    if (!token) {
        console.log(
            chalk.cyan(
                `\nOpening browser to copy your API key: ${chalk.underline(DASHBOARD_TOKEN_URL)}\n`,
            ),
        );

        try {
            openUrl(DASHBOARD_TOKEN_URL);
        } catch {
            // Ignore if browser fails to launch automatically
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
        saveConfig({ token });

        spinner.succeed(
            chalk.green("Successfully logged in! Session token saved."),
        );
    } catch (error: any) {
        spinner.fail(
            chalk.red(`Failed to save session token: ${error.message}`),
        );
    }
}
