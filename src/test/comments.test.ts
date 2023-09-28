/* eslint-disable @typescript-eslint/unbound-method */
import { DeepMockProxy, mock, mockDeep, MockProxy } from "jest-mock-extended";

import { CommentsApi } from "../github/comments";
import { ActionLogger, GitHubClient } from "../github/types";

describe("Comments", () => {
  let comments: CommentsApi;
  let api: DeepMockProxy<GitHubClient>;
  let logger: MockProxy<ActionLogger>;
  const repo = { repo: "example", owner: "me", number: 123 };
  beforeEach(() => {
    api = mockDeep<GitHubClient>();
    logger = mock<ActionLogger>();
    comments = new CommentsApi(api, logger, repo);
  });

  describe("Comment action", () => {
    test("Should comment", async () => {
      await comments.comment("Hello");
      expect(api.rest.issues.createComment).toHaveBeenCalledWith({
        body: "Hello",
        ...repo,
        issue_number: repo.number,
      });
    });

    test("Should log when commenting", async () => {
      await comments.comment("Log this");
      expect(logger.info).toHaveBeenCalledWith("Commenting: Log this");
    });

    test("Should not comment on silent mode", async () => {
      comments = new CommentsApi(api, logger, repo, true);
      await comments.comment("Example");
      expect(api.rest.issues.createComment).not.toHaveBeenCalled();
    });

    test("Should log while in silent mode", async () => {
      comments = new CommentsApi(api, logger, repo, true);
      await comments.comment("Bye");
      expect(logger.info).toHaveBeenCalledWith("Commenting: Bye");
    });

    test("Should override silent mode", async () => {
      comments = new CommentsApi(api, logger, repo, true);
      await comments.comment("Overrider", true);
      expect(api.rest.issues.createComment).toHaveBeenCalledWith({
        body: "Overrider",
        ...repo,
        issue_number: repo.number,
      });
    });
  });

  describe("userBelongsToOrg", () => {
    test("Should return false when http call fails", async () => {
      api.rest.orgs.checkPublicMembershipForUser.mockRejectedValue(
        "This is an error",
      );
      const userBelongs = await comments.userBelongsToOrg("example");
      expect(userBelongs).toBeFalsy();
    });

    test("Should return false when http call returns 204", async () => {
      api.rest.orgs.checkPublicMembershipForUser.mockResolvedValue({
        status: 204,
      } as never);
      const userBelongs = await comments.userBelongsToOrg("example");
      expect(userBelongs).toBeTruthy();
    });
  });
});
