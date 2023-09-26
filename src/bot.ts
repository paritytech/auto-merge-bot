import { IssueComment } from "@octokit/webhooks-types";
import { ActionLogger } from "./github/types";

const BOT_COMMAND = "/bot";

export const runOnComment = (comment: IssueComment, logger: ActionLogger) => {
    if (!comment.body.startsWith(BOT_COMMAND)) {
        logger.info(`Ignoring comment ${comment.html_url} as it does not start with '${BOT_COMMAND}'`);
        return;
    }

    const [_, command] = comment.body.split(" ");
    if (!command) {
        throw new Error("Lacking command");
    }

    if (command === "merge") {
        logger.info("Bot will enabled auto merge for this PR!");
    }
}
