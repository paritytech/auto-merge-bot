import { PullRequest } from "@octokit/webhooks-types";

import { ActionLogger, GitHubClient } from "./types";

/** API class that uses the default token to access the data from the pull request and the repository */
export class CommentsApi {
  constructor(
    private readonly api: GitHubClient,
    private readonly logger: ActionLogger,
    public readonly pullData: { repo: string, owner: string, number: number }
  ) { }

  getPrAuthor(pr: PullRequest): string {
    return pr.user.login;
  }

  async comment(message: string) {
    await this.api.rest.issues.createComment({ ...this.pullData, body: message, issue_number: this.pullData.number });
  }

  async reactToComment(commentId: number, reaction: "+1" | "confused"): Promise<void> {
    await this.api.rest.reactions.createForIssueComment({ ...this.pullData, comment_id: commentId, content: reaction });
  }

  async userBelongsToOrg(username:string):Promise<boolean> {
    const check = await this.api.rest.orgs.listForUser({username, per_page: 100});
    const orgs = check.data.map(org => org.login);
    this.logger.info("User belong to the following orgs: " + JSON.stringify(orgs));
    return orgs.some((org) => org === this.pullData.owner);
  }
}
