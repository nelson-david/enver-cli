import { Command } from "commander";
import ora from "ora";
import chalk from "chalk";
import { input, select } from "@inquirer/prompts";
import { getStoredToken } from "../auth.js";
import { API_URL, getLocalProjectConfig } from "../utils/config.js";

export const membersCommand = new Command("members").description(
    "Manage team members in your Enver projects",
);

// ev members add [email]
membersCommand
    .command("add")
    .argument("[email]", "Email of the user to add")
    .description("Add a team member to a project")
    .option("-p, --project <projectId>", "The ID of the project")
    .option("-r, --role <role>", "User role (admin, editor, viewer)")
    .action(async (emailArg, options) => {
        const token = await getStoredToken();
        if (!token) {
            console.error(
                chalk.red("❌ Not authenticated. Please run `ev login` first."),
            );
            process.exit(1);
        }

        const localConfig = await getLocalProjectConfig();

        try {
            // 1. Resolve target Email
            let email = emailArg;
            if (!email) {
                email = await input({
                    message: "Enter the email of the member to add:",
                    validate: (val) =>
                        val.includes("@") ||
                        "Please enter a valid email address.",
                });
            }

            // 2. Resolve Project ID: Flag > .ev.json > Prompt
            let projectId = options.project || localConfig?.projectId;
            if (!projectId) {
                projectId = await input({
                    message: "Enter the project ID:",
                    validate: (val) =>
                        val.trim().length > 0 || "Project ID is required.",
                });
            }

            // 3. Resolve Role: Flag > Prompt
            let role = options.role;
            if (!role) {
                role = await select({
                    message: "Select member role:",
                    choices: [
                        { name: "Editor", value: "editor" },
                        { name: "Admin", value: "admin" },
                        { name: "Viewer", value: "viewer" },
                    ],
                    default: "editor",
                });
            }

            const spinner = ora(
                `Adding ${chalk.bold(email)} to project [${projectId}]...`,
            ).start();

            const res = await fetch(
                `${API_URL}/projects/${projectId}/members`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({ email, role }),
                },
            );

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Failed to add member");
            }

            spinner.succeed(
                chalk.green(
                    `Successfully added ${email} as ${role} to [${projectId}]!`,
                ),
            );
        } catch (error: any) {
            if (error.name === "ExitPromptError") {
                console.log(chalk.gray("\nOperation cancelled."));
                return;
            }
            console.error(
                chalk.red(`\n❌ Failed to add member: ${error.message}`),
            );
        }
    });

// ev members remove [email]
membersCommand
    .command("remove")
    .alias("rm")
    .argument("[email]", "Email of the user to remove")
    .description("Remove a team member from a project")
    .option("-p, --project <projectId>", "The ID of the project")
    .action(async (emailArg, options) => {
        const token = await getStoredToken();
        if (!token) {
            console.error(
                chalk.red("❌ Not authenticated. Please run `ev login` first."),
            );
            process.exit(1);
        }

        const localConfig = await getLocalProjectConfig();

        try {
            // 1. Resolve target Email
            let email = emailArg;
            if (!email) {
                email = await input({
                    message: "Enter the email of the member to remove:",
                    validate: (val) =>
                        val.includes("@") ||
                        "Please enter a valid email address.",
                });
            }

            // 2. Resolve Project ID: Flag > .ev.json > Prompt
            let projectId = options.project || localConfig?.projectId;
            if (!projectId) {
                projectId = await input({
                    message: "Enter the project ID:",
                    validate: (val) =>
                        val.trim().length > 0 || "Project ID is required.",
                });
            }

            const spinner = ora(
                `Removing ${chalk.bold(email)} from project [${projectId}]...`,
            ).start();

            const res = await fetch(
                `${API_URL}/projects/${projectId}/members/${encodeURIComponent(email)}`,
                {
                    method: "DELETE",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                },
            );

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Failed to remove member");
            }

            spinner.succeed(
                chalk.green(
                    `Successfully removed ${email} from [${projectId}].`,
                ),
            );
        } catch (error: any) {
            if (error.name === "ExitPromptError") {
                console.log(chalk.gray("\nOperation cancelled."));
                return;
            }
            console.error(
                chalk.red(`\n❌ Failed to remove member: ${error.message}`),
            );
        }
    });
