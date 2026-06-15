//
// Copyright 2026 Diffus. Licensed under MIT License.
//

import { createFalClient, type FalClient, withMiddleware } from "@fal-ai/client";

import { credentialsFromEnv } from "./config.js";
import { createDiffusMiddleware } from "./middleware.js";
import { wrapQueueClient } from "./queue.js";

type FalConfig = NonNullable<Parameters<typeof createFalClient>[0]>;

export function createDiffusClient(config: FalConfig = {}): FalClient {
    const { requestMiddleware, ...falConfig } = config;

    const client = createFalClient({
        credentials: credentialsFromEnv,
        ...falConfig,
        requestMiddleware: requestMiddleware
            ? withMiddleware(createDiffusMiddleware(), requestMiddleware)
            : createDiffusMiddleware(),
    });

    const queue = wrapQueueClient(client.queue);

    const realtime = {
        ...client.realtime,
        connect(): never {
            throw new Error("Diffus does not currently support realtime connections");
        },
    } as FalClient["realtime"];

    const stream: FalClient["stream"] = (endpointId, options) => {
        if (options.connectionMode === "client") {
            throw new Error("Diffus does not support client-mode streaming");
        }
        return client.stream(endpointId, options);
    };

    const streaming = {
        ...client.streaming,
        stream,
    };

    const subscribe: FalClient["subscribe"] = async (endpointId, options) => {
        const { request_id: requestId } = await queue.submit(endpointId, options);

        options.onEnqueue?.(requestId);
        await queue.subscribeToStatus(endpointId, { requestId, ...options });

        return queue.result(endpointId, { requestId });
    };

    return {
        ...client,
        queue,
        realtime,
        stream,
        streaming,
        subscribe,
    };
}
