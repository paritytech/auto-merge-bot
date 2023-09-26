import { IssueComment } from "@octokit/webhooks-types";
import { Merger } from "./github/merger";
import { ActionLogger } from "./github/types";

const BOT_COMMAND = "/bot";

export const PULL_REQUEST_ID_QUERY = `
query($organization: String!, $repo: String!, $number: Int!) {
    repository(name: $repo, owner: $organization) {
        pullRequest(number: $number) {
                  id
              }
        } 
}`;

export const ENABLE_AUTO_MERGE = `
mutation($prId: ID!) {
    enablePullRequestAutoMerge(input: {pullRequestId: $prId, mergeMethod: SQUASH}) {
        clientMutationId
         }
}`

export const runOnComment = async (comment: IssueComment, logger: ActionLogger, merger:Merger) => {
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
        }
        catch (e) {
            logger.error(e as Error);
            throw e;
        }
    } else if (command === "cancel") {
        try {
            await merger.disableAutoMerge();
        }
        catch (e) {
            logger.error(e as Error);
            throw e;
        }
    }
}
