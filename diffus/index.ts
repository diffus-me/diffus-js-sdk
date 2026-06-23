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
export type { DiffusClient, DiffusClientConfig } from "./client.js";
export {
    DEFAULT_RUN_HOST,
    IN_PROGRESS_POLL_INTERVAL,
    QUEUED_POLL_INTERVAL,
    USER_AGENT,
    VERSION,
    credentialsFromEnv,
} from "./config.js";
export { createDiffusMiddleware } from "./middleware.js";

import { createDiffusClient, type DiffusClient, type DiffusClientConfig } from "./client.js";

type SingletonDiffusClient = DiffusClient & {
    config(config: DiffusClientConfig): void;
};

function createSingletonDiffusClient(): SingletonDiffusClient {
    let currentClient = createDiffusClient();

    return {
        config(config) {
            currentClient = createDiffusClient(config);
        },
        get queue() {
            return currentClient.queue;
        },
        get realtime() {
            return currentClient.realtime;
        },
        get storage() {
            return currentClient.storage;
        },
        get streaming() {
            return currentClient.streaming;
        },
        run(endpointId, options) {
            return currentClient.run(endpointId, options);
        },
        subscribe(endpointId, options) {
            return currentClient.subscribe(endpointId, options);
        },
        stream(endpointId, options) {
            return currentClient.stream(endpointId, options);
        },
    } satisfies SingletonDiffusClient;
}

export const fal = createSingletonDiffusClient();
