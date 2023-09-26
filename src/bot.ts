import { IssueComment } from "@octokit/webhooks-types";
import { Merger } from "./github/merger";
import { ActionLogger } from "./github/types";
import { PullRequestApi } from "./github/pullRequest";

const BOT_COMMAND = "/bot";

type Command = "merge" | "cancel" | "help";

const botCommands = `
**Available commands**

- \`/bot merge\`: Enabled auto-merge for Pull Request
- \`/bot cancel\`: Cancels auto-merge for Pull Request
- \`/bot help\`: Shows this menu

For more information see the [documentation](https://github.com/paritytech/auto-merge-bot)
`;

export const runOnComment = async (comment: IssueComment, logger: ActionLogger, merger: Merger, api: PullRequestApi) => {
    logger.info("Running action on comment: " + comment.html_url);
    if (!comment.body.startsWith(BOT_COMMAND)) {
        logger.info(`Ignoring comment ${comment.html_url} as it does not start with '${BOT_COMMAND}'`);
        return;
    }

    const [_, command] = comment.body.split(" ");
    try {
        switch (command as Command) {
            case "merge":
                await api.reactToComment(comment.id, "+1");
                await merger.enableAutoMerge();
                await api.comment("Enabled `auto-merge` in Pull Request");
                break;
            case "cancel":
                await api.reactToComment(comment.id, "+1");
                await merger.disableAutoMerge();
                await api.comment("Disabled `auto-merge` in Pull Request");
                break;
            case "help":
                await api.comment('## Auto-Merge-Bot\n' + botCommands);
                break;
            default: {
                await api.reactToComment(comment.id, "confused");
                await api.comment('## Auto-Merge-Bot\n' + `Command \`${command}\` not recognized.\n\n` + botCommands);
            }
        }
    } catch (e) {
        logger.error(e as Error);
        throw e;
    }
}
