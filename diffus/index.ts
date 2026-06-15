//
// Copyright 2026 Diffus. Licensed under MIT License.
//

export {
    ApiError,
    ValidationError,
    isRetryableError,
    parseEndpointId,
    withMiddleware,
    withProxy,
} from "@fal-ai/client";
export type * from "@fal-ai/client";

export { createDiffusClient } from "./client.js";
export {
    DEFAULT_RUN_HOST,
    IN_PROGRESS_POLL_INTERVAL,
    QUEUED_POLL_INTERVAL,
    USER_AGENT,
    VERSION,
    credentialsFromEnv,
} from "./config.js";
export { createDiffusMiddleware } from "./middleware.js";

import { createDiffusClient } from "./client.js";
import type { FalClient } from "@fal-ai/client";

let defaultClient: FalClient | undefined;

export const fal = new Proxy({} as FalClient, {
    get(_target, property: keyof FalClient) {
        defaultClient ??= createDiffusClient();
        const value = defaultClient[property];
        return typeof value === "function" ? value.bind(defaultClient) : value;
    },
});
