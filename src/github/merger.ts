import { graphql } from "@octokit/graphql";
import { PullRequestMergeMethod } from "@octokit/graphql-schema";

import { ActionLogger } from "./types";

export type MergeMethod = "SQUASH" | "MERGE" | "REBASE";

export class Merger {
  constructor(
    private readonly nodeId: string,
    private readonly gqlApi: typeof graphql,
    private readonly logger: ActionLogger,
    private readonly mergeMethod: PullRequestMergeMethod,
    private readonly allowUnstable: boolean = false,
  ) {
  }

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
      await this.gqlApi<{
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
        await this.gqlApi<{
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
    await this.gqlApi<{
      disablePullRequestAutoMerge: { clientMutationId: unknown };
    }>(DISABLE_AUTO_MERGE as string, {
      prId: this.nodeId,
    });
    this.logger.info("Succesfully disabled auto-merge");
  }
}
