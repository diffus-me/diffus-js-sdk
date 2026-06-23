//
// Copyright 2026 Diffus. Licensed under MIT License.
//

import { createFalClient, type FalClient, withMiddleware } from "@fal-ai/client";

import { credentialsFromEnv } from "./config.js";
import { createDiffusMiddleware } from "./middleware.js";
import { wrapQueueClient } from "./queue.js";
import { createDiffusStorageClient, transformInput } from "./storage.js";

type FalConfig = NonNullable<Parameters<typeof createFalClient>[0]>;
export type DiffusClientConfig = FalConfig;
export type DiffusClient = FalClient;

export function createDiffusClient(userConfig: FalConfig = {}): DiffusClient {
    const {
        credentials: configCredentials,
        proxyUrl,
        requestMiddleware: configRequestMiddleware,
        ...falConfig
    } = userConfig;

    if (proxyUrl !== undefined) {
        throw new Error("Diffus does not support proxyUrl configuration");
    }

    const requestMiddleware = configRequestMiddleware
        ? withMiddleware(createDiffusMiddleware(), configRequestMiddleware)
        : createDiffusMiddleware();

    const credentials = () => {
        const value = "credentials" in userConfig ? configCredentials : credentialsFromEnv;
        return typeof value === "function" ? value() : value;
    };

    const client = createFalClient({
        credentials,
        ...falConfig,
        requestMiddleware,
    });

    const storage = createDiffusStorageClient({
        credentials,
        fetch: falConfig.fetch,
        requestMiddleware,
    });

    const queue = wrapQueueClient(client.queue, storage);

    const realtime = {
        ...client.realtime,
        connect(): never {
            throw new Error("Diffus does not currently support realtime connections");
        },
    } as FalClient["realtime"];

    const stream: FalClient["stream"] = async (endpointId, options) => {
        if (options.connectionMode === "client") {
            throw new Error("Diffus does not support client-mode streaming");
        }
        const input = await transformInput(storage, options.input);
        return client.stream(endpointId, { ...options, input });
    };

    const streaming = {
        ...client.streaming,
        stream,
    };

    const run: FalClient["run"] = async (endpointId, options = {}) => {
        const input = await transformInput(storage, options.input);
        return client.run(endpointId, { ...options, input });
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
        run,
        storage,
        stream,
        streaming,
        subscribe,
    };
}
