//
// Copyright 2026 Diffus. Licensed under MIT License.
//

export const VERSION = "0.1.0";
export const USER_AGENT = `diffus/${VERSION} (javascript)`;

export const DEFAULT_RUN_HOST = "diffus.me";
export const QUEUED_POLL_INTERVAL = 3_000;
export const IN_PROGRESS_POLL_INTERVAL = 1_000;

type GlobalWithProcess = typeof globalThis & {
    process?: {
        env?: Record<string, string | undefined>;
    };
};

function environment(name: string): string | undefined {
    return (globalThis as GlobalWithProcess).process?.env?.[name];
}

export function credentialsFromEnv(): string | undefined {
    return environment("DIFFUS_KEY");
}

export function resolveHosts(): {
    runHost: string;
    queueHost: string;
} {
    const runHost = environment("DIFFUS_RUN_HOST") ?? DEFAULT_RUN_HOST;
    const queueHost = environment("DIFFUS_QUEUE_RUN_HOST") ?? `queue.${runHost}`;

    return { runHost, queueHost };
}
