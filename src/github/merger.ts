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

// https://docs.github.com/en/graphql/reference/mutations#mergepullrequest
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
    private readonly allowUnstable: boolean = false,
  ) {}

  errorPermitsToMerge(error: Error): boolean {
    // If it's clean it can be merged
    if (error.message.includes("Pull request is in clean status")) {
      return true;
    }

    // If it is unstable and allowed, it can also be merged
    if (error.message.includes("Pull request is in unstable status")) {
      this.logger.warn(
        "PR is unstable! Some non required status checks are failing.",
      );
      return this.allowUnstable;
    }

    return false;
  }

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
      this.logger.warn(error as Error);
      if (error instanceof Error && this.errorPermitsToMerge(error)) {
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
