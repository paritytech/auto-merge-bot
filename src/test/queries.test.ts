import { validate } from "@octokit/graphql-schema";

import DISABLE_AUTO_MERGE from "../github/graphql/DisableAutoMerge";
import ENABLE_AUTO_MERGE from "../github/graphql/EnableAutoMerge";
import MERGE_PULL_REQUEST from "../github/graphql/MergePullRequest";
import UPDATE_PULL_REQUEST from "../github/graphql/UpdatePullRequest";

describe("Schemas", () => {
  test("ENABLE_AUTO_MERGE", () => {
    expect(validate(ENABLE_AUTO_MERGE)).toEqual([]);
  });

  test("DISABLE_AUTO_MERGE", () => {
    expect(validate(DISABLE_AUTO_MERGE)).toEqual([]);
  });

  test("MERGE_PULL_REQUEST", () => {
    expect(validate(MERGE_PULL_REQUEST)).toEqual([]);
  });

  test("UPDATE_PULL_REQUEST", () => {
    expect(validate(UPDATE_PULL_REQUEST)).toEqual([]);
  });
});
