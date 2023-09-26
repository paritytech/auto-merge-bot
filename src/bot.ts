import { IssueComment } from "@octokit/webhooks-types";
import { ActionLogger } from "./github/types";
import { graphql } from "@octokit/graphql";

const BOT_COMMAND = "/bot";

const PULL_REQUEST_ID_QUERY = `
query($organization: String!, repo: String!, $number: Int!) {
    repository(name: !repo, owner: $organization) {
        pullRequest(number: $number) {
                  id
              }
        } 
}`;

export const runOnComment = (comment: IssueComment, logger: ActionLogger, gql: typeof graphql,) => {
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
        logger.info("Bot will enabled auto merge for this PR!");
        const query = gql(PULL_REQUEST_ID_QUERY, {
            organization: "paritytech-stg",
            repo: "auto-merge-bot",
            number: 1
        });
        logger.info("Returned " + JSON.stringify(query));
    }
}
