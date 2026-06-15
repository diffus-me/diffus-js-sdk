//
// Copyright 2026 Diffus. Licensed under MIT License.
//

import type { RequestMiddleware } from "@fal-ai/client";

import { resolveHosts, USER_AGENT } from "./config.js";

function isBrowser(): boolean {
    return typeof window !== "undefined" && typeof window.document !== "undefined";
}

export function createDiffusMiddleware(): RequestMiddleware {
    const { runHost, queueHost } = resolveHosts();

    return async (request) => {
        const url = new URL(request.url);

        switch (url.hostname) {
            case "queue.fal.run":
                url.hostname = queueHost;
                break;
            case "fal.run":
            case "rest.fal.ai":
                url.hostname = runHost;
                break;
        }

        return {
            ...request,
            url: url.toString(),
            headers: {
                ...request.headers,
                ...(!isBrowser() && { "User-Agent": USER_AGENT }),
            },
        };
    };
}
