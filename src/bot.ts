import { Issue, IssueComment } from "@octokit/webhooks-types";

import { CommentsApi } from "./github/comments";
import { Merger } from "./github/merger";
import { ActionLogger } from "./github/types";

const BOT_COMMAND = "/merge";

type Command = "merge" | "cancel" | "help";

const botCommands = `
- \`/merge\`: Enables auto-merge for Pull Request
- \`/merge cancel\`: Cancels auto-merge for Pull Request
- \`/merge help\`: Shows this menu

For more information see the [documentation](https://github.com/paritytech/auto-merge-bot)
`;

const detailCommands = `
<details><summary> <b>Available commands</b> </summary>

${botCommands}
</details> 
`;

export class Bot {
  constructor(
    private readonly comment: IssueComment,
    private readonly pr: Issue,
    private readonly logger: ActionLogger,
    private readonly commentsApi: CommentsApi,
    private readonly allowlistedUsers: string[],
    private readonly actionUrl: string,
  ) {}

  /** Verifies if the author is the author of the PR or a member of the org */
  async canTriggerBot(): Promise<boolean> {
    this.logger.debug("Evaluating if user can trigger the bot");
    const author = this.pr.user.id;
    if (this.comment.user.id === author) {
      this.logger.info("Author of comment is also author of PR");
      return true;
    }
    this.logger.debug("Author of comment is not the author of the PR");

    if (this.allowlistedUsers && this.allowlistedUsers.length > 0) {
      if (this.allowlistedUsers.indexOf(this.comment.user.login) > -1) {
        this.logger.info("User belongs to allowlisted users");
        return true;
      }
      this.logger.debug("User does not belong to list of allowlisted users");
    }

    this.logger.debug(
      "Evaluating if author of comment is a public member of the org",
    );
    return await this.commentsApi.userBelongsToOrg(this.comment.user.login);
  }

  async run(merger: Merger): Promise<void> {
    this.logger.info("Running action on comment: " + this.comment.html_url);
    if (!this.comment.body.startsWith(BOT_COMMAND)) {
      this.logger.info(
        `Ignoring comment ${this.comment.html_url} as it does not start with '${BOT_COMMAND}'`,
      );
      return;
    }

    if (this.pr.state === "closed") {
      this.logger.info("Ignoring PR as it is closed");
      return;
    }

    if (!(await this.canTriggerBot())) {
      const { login } = this.comment.user;
      const org = this.commentsApi.pullData.owner;
      this.logger.warn(
        "User is not allowed to trigger the bot. " +
          `He is not the author of the PR and does not *publicly* belong to the org: https://github.com/orgs/${org}/people`,
      );
      await this.commentsApi.reactToComment(this.comment.id, "-1");
      await this.commentsApi.comment(
        "## Auto-Merge-Bot\n" +
          `User @${login} is not the author of the PR and does not [*publicly* belong to the org \`${org}\`](https://github.com/orgs/${org}/people).\n\n` +
          "Only author or *public* org members can trigger the bot.",
      );
      return;
    }
    this.logger.debug("User can trigger bot");

    const [, command] = this.comment.body.split(" ");
    try {
      switch (command as Command) {
        // Simply `/merge`
        case undefined:
          await this.commentsApi.reactToComment(this.comment.id, "+1");
          await merger.enableAutoMerge();
          await this.commentsApi.comment(
            "Enabled `auto-merge` in Pull Request\n\n" + detailCommands,
          );
          break;
        // `/merge cancel`
        case "cancel":
          await this.commentsApi.reactToComment(this.comment.id, "+1");
          await merger.disableAutoMerge();
          await this.commentsApi.comment(
            "Disabled `auto-merge` in Pull Request\n\n" + detailCommands,
          );
          break;
        // `/merge help`
        case "help":
          await this.commentsApi.comment(
            "## Auto-Merge-Bot\n\n" + "**Available commands**" + botCommands,
            true,
          );
          break;
        // `/merge anything else`
        default: {
          await this.commentsApi.reactToComment(this.comment.id, "confused");
          await this.commentsApi.comment(
            "## Auto-Merge-Bot\n" +
              `Command \`${command}\` not recognized.\n\n` +
              detailCommands,
            true,
          );
        }
      }
    } catch (e) {
      this.logger.error(e as Error);

      // If possible, let's try to comment about an issue
      await this.commentsApi.comment(
        "### There was a problem running the action.\n\n" +
          "❌😵❌\n\n" +
          `Please find more information in the [logs](${this.actionUrl}).`,
        true,
      );
      throw e;
    }
  }
}
