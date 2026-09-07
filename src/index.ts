#!/usr/bin/env node --no-warnings

import { Command } from "commander";
import { pullCommand } from "./commands/pull.js";
import { pushCommand } from "./commands/push.js";
import { loginCommand } from "./commands/login.js";
import { getConfig } from "./auth.js";
import { membersCommand } from "./commands/members.js";
import { initCommand } from "./commands/init.js";
import { getLocalProjectConfig, API_URL } from "./utils/config.js";

import pkg from "../package.json" with { type: "json" };

const program = new Command();
program
    .name("ev")
    .description("Security-first environment variable orchestrator")
    .version(pkg.version);

program
    .command("login")
    .description("Log in to Enver using an API key")
    .argument("[token]", "Enver API key/token")
    .action(async (token) => {
        await loginCommand(token);
    });

program
    .command("user")
    .description("Display currently authenticated Enver user details")
    .action(async () => {
        try {
            const config = getConfig();
            const token = config?.token || config?.apiKey;

            if (!token) {
                console.error("❌ Not logged in. Run `ev login` first.");
                process.exit(1);
            }

            const res = await fetch(`${API_URL}/auth/me`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || res.statusText);
            const user = data.data;

            console.log("\n👤 Enver Authenticated User Profile");
            console.log("------------------------------------");
            console.log(`ID:        ${user.id}`);
            console.log(`Name:      ${user.name || "N/A"}`);
            console.log(`Email:     ${user.email}`);
            console.log(`Clerk ID:  ${user.clerkId}`);
            console.log(
                `Joined:    ${new Date(user.createdAt).toLocaleDateString()}`,
            );
            console.log("------------------------------------\n");
        } catch (err: any) {
            console.error(
                "❌ Failed to fetch user details:",
                err.message,
            );
        }
    });

program
    .command("init")
    .description(
        "Interactively initialize a new Enver project in current directory",
    )
    .action(initCommand);

program
    .command("pull")
    .description("Fetch and decrypt environment variables into local .env")
    .argument("[projectId]", "Project ID (defaults to .ev.json)")
    .argument("[lockKey]", "Encryption Lock Key")
    .argument("[environment]", "Target environment")
    .action(async (arg1, arg2, arg3) => {
        const localConfig = await getLocalProjectConfig();

        let projectId = arg1;
        let lockKey = arg2;
        let environment = arg3;

        if (localConfig?.projectId && arg1 && !arg2) {
            projectId = localConfig.projectId;
            lockKey = arg1;
        }

        await pullCommand(projectId, lockKey, environment);
    });

program
    .command("push")
    .description("Encrypt and upload local .env to server")
    .argument("[projectId]", "Project ID (defaults to .ev.json)")
    .argument("[lockKey]", "Encryption Lock Key")
    .argument(
        "[environment]",
        "Target environment (PRODUCTION, STAGING, DEVELOPMENT)",
    )
    .action(async (projectId, lockKey, environment) => {
        // Handle shifting arguments if user runs `ev push <lockKey>` directly
        const localConfig = await getLocalProjectConfig();

        let finalProjectId = projectId;
        let finalLockKey = lockKey;
        let finalEnv = environment;

        // If only 1 arg passed (e.g. `ev push winterandsummer`), treat it as lockKey if .ev.json exists
        if (localConfig && projectId && !lockKey) {
            finalLockKey = projectId;
            finalProjectId = localConfig.projectId;
        }

        await pushCommand(finalProjectId, finalLockKey, finalEnv);
    });

program.addCommand(membersCommand);

program.parse(process.argv);
