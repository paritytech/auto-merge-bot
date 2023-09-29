import { debug, error, getInput, info, warning } from "@actions/core";

import { ActionLogger } from "./github/types";

export function generateCoreLogger(): ActionLogger {
  return { info, debug, warn: warning, error };
}

export function getallowlistedUsers(): string[] {
  const users = getInput("ALLOWLIST", { required: false });
  if (users) {
    return users.split(",");
  }
  return [];
}
