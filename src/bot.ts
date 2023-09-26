import { IssueComment } from "@octokit/webhooks-types";
import { Merger } from "./github/merger";
import { ActionLogger } from "./github/types";
import { PullRequestApi } from "./github/pullRequest";

const BOT_COMMAND = "/bot";

type Command = "merge" | "cancel";

export const runOnComment = async (comment: IssueComment, logger: ActionLogger, merger:Merger, api: PullRequestApi) => {
    logger.info("Running action on comment: " + comment.html_url);
    if (!comment.body.startsWith(BOT_COMMAND)) {
        logger.info(`Ignoring comment ${comment.html_url} as it does not start with '${BOT_COMMAND}'`);
        return;
    }

    const [_, command] = comment.body.split(" ");
    if (!command) {
        throw new Error("Lacking command");
    }

    if (command === "merge") {
        try {
            await merger.enableAutoMerge();
            await api.comment("Enabled `auto-merge` in Pull Request");
        }
        catch (e) {
            logger.error(e as Error);
            throw e;
        }
    } else if (command === "cancel") {
        try {
            await merger.disableAutoMerge();
            await api.comment("Disabled `auto-merge` in Pull Request");
        }
        catch (e) {
            logger.error(e as Error);
            throw e;
        }
    } else {
        await api.comment(`## Auto-Merge-Bot

        ### Available commands

        - \`/bot merge\`: Enabled auto-merge for Pull Request
        - \`/bot cancel\`: Cancels auto-merge for Pull Request
        `);
    }
}
