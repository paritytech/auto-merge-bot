import { getInput, info, setFailed, setOutput } from "@actions/core";
import { context, getOctokit } from "@actions/github";
import { Context } from "@actions/github/lib/context";
import { Issue, IssueComment } from "@octokit/webhooks-types";
import { PullRequest } from "@octokit/webhooks-types";

import { CommentsApi } from "./github/comments";
import { generateCoreLogger } from "./util";
import { runOnComment } from "./bot";
import { graphql } from "@octokit/graphql/dist-types/types";
import { Merger } from "./github/merger";

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

setOutput("repo", `${repo.owner}/${repo.repo}`);

console.log("Event received", context.payload);
console.log("Job", context.job);
console.log("Action", context.action);
console.log("event name", context.eventName);

if (context.eventName !== "issue_comment") {
  throw new Error("Wrong event type");
} else if (!context.payload.issue?.pull_request) {
  console.log("Comment happened on an issue, not a PR");
}

if (context.payload.comment) {
  const token = getInput("token", { required: true });
  const comment = context.payload.comment as unknown as IssueComment;
  const issue = context.payload.issue as unknown as Issue;
  const logger = generateCoreLogger();
  const commentsApi = new CommentsApi(getOctokit(token), logger, { ...repo, number: issue.number });
  const gql = getOctokit(token).graphql.defaults({ headers: { authorization: `token ${token}` } }) as graphql;
  const merger = new Merger(issue.node_id, gql, logger);
  runOnComment(comment, logger, merger, commentsApi).then(() => logger.info("Finished!")).catch(setFailed);
} else {
  console.error("No 'comment' object in the payload!");
}
