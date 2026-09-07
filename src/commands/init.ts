import fs from "node:fs/promises";
import path from "node:path";
import ora from "ora";
import chalk from "chalk";
import { input, select, password } from "@inquirer/prompts";
import { getStoredToken } from "../auth.js";
import { API_URL } from "../utils/config.js";

const LOCAL_CONFIG_FILE = ".ev.json";

export async function initCommand() {
    const token = await getStoredToken();
    if (!token) {
        console.error(chalk.red("❌ Not logged in. Run `ev login` first."));
        process.exit(1);
    }

    const configPath = path.join(process.cwd(), LOCAL_CONFIG_FILE);

    // 1. Check if project is already initialized in current directory
    try {
        await fs.access(configPath);
        console.log(
            chalk.yellow(
                `\n⚠️ Project is already initialized in this directory (${LOCAL_CONFIG_FILE} exists).\n`,
            ),
        );
        return;
    } catch {
        // File does not exist, proceed
    }

    console.log(chalk.bold.cyan("\n🚀 Initializing Enver Project\n"));

    try {
        // Step A: Prompt for Project Name
        const defaultName = path.basename(process.cwd());
        const projectName = await input({
            message: "Enter project name:",
            default: defaultName,
        });

        // Step B: Select Environment using arrow keys
        const environment = await select({
            message: "Select target environment:",
            choices: [
                { name: "DEVELOPMENT", value: "DEVELOPMENT" },
                { name: "STAGING", value: "STAGING" },
                { name: "PRODUCTION", value: "PRODUCTION" },
            ],
            default: "DEVELOPMENT",
        });

        // Step C: Enter Encryption Lock Key
        const lockKey = await password({
            message: "Enter encryption lock key (keep this safe!):",
            mask: "*",
            validate: (value) => {
                if (!value || value.length < 8) {
                    return "Lock key must be at least 8 characters long.";
                }
                return true;
            },
        });

        const spinner = ora("Creating project workspace on Enver...").start();

        // 2. Register/Fetch project on Hono backend
        const res = await fetch(`${API_URL}/projects`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
                name: projectName,
                environment,
            }),
        });

        const data = await res.json();
        if (!res.ok) {
            throw new Error(data.error || res.statusText);
        }
        const project = data.data;

        // 3. Save configuration locally (.ev.json)
        const localConfig = {
            projectId: project.id,
            name: project.name,
            defaultEnvironment: environment,
            createdAt: new Date().toISOString(),
        };

        await fs.writeFile(
            configPath,
            JSON.stringify(localConfig, null, 2),
            "utf8",
        );

        spinner.succeed(chalk.green("Successfully initialized Enver project!"));

        console.log("\n📦 Initialized Settings");
        console.log("------------------------------------");
        console.log(`Project ID:    ${project.id}`);
        console.log(`Project Name:  ${project.name}`);
        console.log(`Environment:   ${chalk.yellow(environment)}`);
        console.log(`Config File:   ${LOCAL_CONFIG_FILE}`);
        console.log("------------------------------------");
        console.log(
            chalk.gray(
                `\nTip: You can now run ${chalk.cyan("ev push")} or ${chalk.cyan("ev pull")} without needing to pass flags.\n`,
            ),
        );
    } catch (err: any) {
        if (err.name === "ExitPromptError") {
            console.log(chalk.gray("\nInitialization cancelled."));
            return;
        }

        console.error(
            chalk.red(
                `\n❌ Failed to initialize project: ${err.message}\n`,
            ),
        );
    }
}
