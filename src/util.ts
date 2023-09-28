import { debug, error, getInput, info, warning } from "@actions/core";

import { ActionLogger } from "./github/types";

export function generateCoreLogger(): ActionLogger {
  return { info, debug, warn: warning, error };
}

export function getWhitelistedUsers(): string[] {
  const users = getInput("WHITELISTED_USERS", { required: false });
  if (users) {
    return users.split(",");
  }
  return [];
}
