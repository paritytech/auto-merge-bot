import { validate } from "@octokit/graphql-schema";

import {PULL_REQUEST_ID_QUERY, ENABLE_AUTO_MERGE} from "../bot";

describe("Schemas", () => {
  test("PULL_REQUEST_ID_QUERY", () => {
    expect(validate(PULL_REQUEST_ID_QUERY)).toEqual([]);
  });

  test("ENABLE_AUTO_MERGE", () => {
    expect(validate(ENABLE_AUTO_MERGE)).toEqual([]);
  });
});