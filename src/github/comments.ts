import { ActionLogger, GitHubClient } from "./types";

/** API class that uses the default token to access the data from the pull request and the repository */
export class CommentsApi {
  constructor(
    private readonly api: GitHubClient,
    private readonly logger: ActionLogger,
    public readonly pullData: { repo: string; owner: string; number: number },
    private readonly silentMode: boolean = false,
  ) {}

  /**
   * Logs and writes a comments. Will only log if silentMode is true
   * @param message Message to write in the comment
   * @param overrideSilentMode If silent mode should be overriden
   */
  async comment(message: string, overrideSilentMode = false): Promise<void> {
    this.logger.info("Commenting: " + message);
    if (!this.silentMode || overrideSilentMode) {
      await this.api.rest.issues.createComment({
        ...this.pullData,
        body: message,
        issue_number: this.pullData.number,
      });
    }
  }

  async reactToComment(
    commentId: number,
    reaction: "+1" | "-1" | "confused",
  ): Promise<void> {
    await this.api.rest.reactions.createForIssueComment({
      ...this.pullData,
      comment_id: commentId,
      content: reaction,
    });
  }

  async userBelongsToOrg(username: string): Promise<boolean> {
    const org = this.pullData.owner;
    this.logger.debug(
      `Checking if user ${username} belongs to ${org} as a public user.`,
    );
    // If the user does not belong to the org, this will throw an http error
    try {
      const { status } = await this.api.rest.orgs.checkPublicMembershipForUser({
        org,
        username,
      });
      return status === 204;
    } catch (error) {
      this.logger.warn(error as Error);
      return false;
    }
  }
}
