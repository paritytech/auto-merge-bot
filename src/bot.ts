import { Issue, IssueComment } from "@octokit/webhooks-types";
import { Merger } from "./github/merger";
import { ActionLogger } from "./github/types";
import { CommentsApi } from "./github/comments";

const BOT_COMMAND = "/bot";

type Command = "merge" | "cancel" | "help";

const botCommands = `
**Available commands**

- \`/bot merge\`: Enables auto-merge for Pull Request
- \`/bot cancel\`: Cancels auto-merge for Pull Request
- \`/bot help\`: Shows this menu

For more information see the [documentation](https://github.com/paritytech/auto-merge-bot)
`;

export class Bot {
    constructor(private readonly comment: IssueComment, private readonly pr: Issue, private readonly logger: ActionLogger, private readonly commentsApi: CommentsApi) { }

    async canTriggerBot() {
        this.logger.debug("Evaluating if user can trigger the bot");
        const author = this.pr.user.id;
        if (this.comment.user.id === author) {
            this.logger.debug("Author of comment is also author of PR")
            return true;
        }
        this.logger.debug("Author of comment is not the author of the PR");

        return await this.commentsApi.userBelongsToOrg(this.comment.user.login);
    }


    async run(merger: Merger): Promise<void> {
        this.logger.info("Running action on comment: " + this.comment.html_url);
        if (!this.comment.body.startsWith(BOT_COMMAND)) {
            this.logger.info(`Ignoring comment ${this.comment.html_url} as it does not start with '${BOT_COMMAND}'`);
            return;
        }

        if (!await this.canTriggerBot()) {
            const { login } = this.comment.user;
            const org = this.commentsApi.pullData.owner;
            this.logger.warn("User is not allowed to trigger the bot." + `He does not *publicly* belongs to the org: https://github.com/orgs/${org}/people`);
            await this.commentsApi.comment("## Auto-Merge-Bot\n" + `User @${login} is not the author of the PR and does not [*publicly* belong to the org \`${org}\`](https://github.com/orgs/${org}/people).\n\n` +
                "Only author or *public* org members can trigger the bot.")
            return;
        }
        this.logger.debug("User can trigger bot");

        const [_, command] = this.comment.body.split(" ");
        try {
            switch (command as Command) {
                case "merge":
                    await this.commentsApi.reactToComment(this.comment.id, "+1");
                    await merger.enableAutoMerge();
                    await this.commentsApi.comment("Enabled `auto-merge` in Pull Request");
                    break;
                case "cancel":
                    await this.commentsApi.reactToComment(this.comment.id, "+1");
                    await merger.disableAutoMerge();
                    await this.commentsApi.comment("Disabled `auto-merge` in Pull Request");
                    break;
                case "help":
                    await this.commentsApi.comment('## Auto-Merge-Bot\n' + botCommands);
                    break;
                default: {
                    await this.commentsApi.reactToComment(this.comment.id, "confused");
                    await this.commentsApi.comment('## Auto-Merge-Bot\n' + `Command \`${command}\` not recognized.\n\n` + botCommands);
                }
            }
        } catch (e) {
            this.logger.error(e as Error);
            throw e;
        }

    }
}
