import { validate } from "@octokit/graphql-schema";

import { DISABLE_AUTO_MERGE, ENABLE_AUTO_MERGE } from "../github/merger";

describe("Schemas", () => {
  test("ENABLE_AUTO_MERGE", () => {
    expect(validate(ENABLE_AUTO_MERGE)).toEqual([]);
  });

  test("DISABLE_AUTO_MERGE", () => {
    expect(validate(DISABLE_AUTO_MERGE)).toEqual([]);
  });
});
