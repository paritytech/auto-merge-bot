import { getInput, setFailed, setOutput } from "@actions/core";
import { context, getOctokit } from "@actions/github";
import { Context } from "@actions/github/lib/context";
import { graphql } from "@octokit/graphql/dist-types/types";
import { PullRequestMergeMethod } from "@octokit/graphql-schema";
import { Issue, IssueComment } from "@octokit/webhooks-types";

import { Bot } from "./bot";
import { CommentsApi } from "./github/comments";
import { Merger } from "./github/merger";
import { generateCoreLogger } from "./util";

const getRepo = (ctx: Context) => {
  let repo = getInput("repo", { required: false });
  if (!repo) {
    repo = ctx.repo.repo;
  }

  let owner = getInput("owner", { required: false });
  if (!owner) {
    owner = ctx.repo.owner;
  }

  return { repo, owner };
};

const repo = getRepo(context);
const logger = generateCoreLogger();

setOutput("repo", `${repo.owner}/${repo.repo}`);

logger.debug("Event received: " + JSON.stringify(context.payload));
logger.info(`Received event of typer ${context.eventName}`);

if (context.eventName !== "issue_comment") {
  throw new Error("Wrong event type");
  // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
} else if (!context.payload.issue?.pull_request) {
  throw new Error("Comment happened on an issue, not a PR");
}

const getMergeMethod = (): PullRequestMergeMethod => {
  const method = (getInput("MERGE_METHOD", { required: false }) ??
    "SQUASH") as PullRequestMergeMethod;
  if (method !== "SQUASH" && method !== "MERGE" && method !== "REBASE") {
    throw new Error(
      "MERGE_METHOD must be either 'SQUASH', 'MERGE' or 'REBASE'",
    );
  }
  logger.info(`Merge type is '${method}'`);

  return method;
};

if (context.payload.comment) {
  const token = getInput("GITHUB_TOKEN", { required: true });
  const comment = context.payload.comment as unknown as IssueComment;
  const issue = context.payload.issue as unknown as Issue;
  const commentsApi = new CommentsApi(getOctokit(token), logger, {
    ...repo,
    number: issue.number,
  });
  const gql = getOctokit(token).graphql.defaults({
    headers: { authorization: `token ${token}` },
  }) as graphql;
  const merger = new Merger(issue.node_id, gql, logger, getMergeMethod());
  const bot = new Bot(comment, issue, logger, commentsApi);
  bot
    .run(merger)
    .then(() => logger.info("Finished!"))
    .catch(setFailed);
} else {
  throw new Error("No 'comment' object in the payload!");
}
