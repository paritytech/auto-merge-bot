import { graphql } from "@octokit/graphql";
import { PullRequestMergeMethod } from "@octokit/graphql-schema";

import { ActionLogger } from "./types";

// https://docs.github.com/en/graphql/reference/mutations#enablepullrequestautomerge
export const ENABLE_AUTO_MERGE = `
mutation($prId: ID!, $mergeMethod: PullRequestMergeMethod!) {
    enablePullRequestAutoMerge(input: {pullRequestId: $prId, mergeMethod: $mergeMethod}) {
        clientMutationId
    }
}`;

// https://docs.github.com/en/graphql/reference/mutations#disablepullrequestautomerge
export const DISABLE_AUTO_MERGE = `
mutation($prId: ID!) {
    disablePullRequestAutoMerge(input: {pullRequestId: $prId}) {
        clientMutationId
    }
}`;

export const MERGE_PULL_REQUEST = `
mutation($prId: ID!, $mergeMethod: PullRequestMergeMethod!) {
  mergePullRequest(input: {pullRequestId: $prId, mergeMethod: $mergeMethod}) {
      clientMutationId
  }
}`;

export type MergeMethod = "SQUASH" | "MERGE" | "REBASE";

export class Merger {
  constructor(
    private readonly nodeId: string,
    private readonly gql: typeof graphql,
    private readonly logger: ActionLogger,
    private readonly mergeMethod: PullRequestMergeMethod,
  ) {}

  async enableAutoMerge(): Promise<void> {
    try {
      await this.gql<{
        enablePullRequestAutoMerge: { clientMutationId: unknown };
      }>(ENABLE_AUTO_MERGE, {
        prId: this.nodeId,
        mergeMethod: this.mergeMethod,
      });
      this.logger.info("Succesfully enabled auto-merge");
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.includes("Pull request is in clean status")
      ) {
        this.logger.warn(
          "Pull Request is ready to merge. Running merge command instead",
        );
        await this.gql<{
          mergePullRequest: { clientMutationId: unknown };
        }>(MERGE_PULL_REQUEST, {
          prId: this.nodeId,
          mergeMethod: this.mergeMethod,
        });
        this.logger.info("Succesfully merged PR");
      } else {
        throw error;
      }
    }
  }

  async disableAutoMerge(): Promise<void> {
    await this.gql<{
      disablePullRequestAutoMerge: { clientMutationId: unknown };
    }>(DISABLE_AUTO_MERGE, {
      prId: this.nodeId,
    });
    this.logger.info("Succesfully disabled auto-merge");
  }
}
