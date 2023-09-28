import { validate } from "@octokit/graphql-schema";

import { DISABLE_AUTO_MERGE, ENABLE_AUTO_MERGE, MERGE_PULL_REQUEST } from "../github/merger";

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
});
