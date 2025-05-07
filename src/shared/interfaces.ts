// Removed the import for EventContext as it is now defined locally.

export type EventContext<Env, P extends string, Data> = {
    request: Request;
    functionPath: string;
    waitUntil: (promise: Promise<any>) => void;
    passThroughOnException: () => void;
    next: (input?: Request | string, init?: RequestInit) => Promise<Response>;
    env: Env;
    params: Record<P, string | string[]>;
    data: Data;
};

export type PagesFunction<Env = unknown, Params extends string = any, Data extends Record<string, unknown> = Record<string, unknown>> = (context: EventContext<Env, Params, Data>) => Response | Promise<Response>;

export interface FeatureRequest {
    title: string;
    description: string;
    comment: string;
}

export interface Feature {
uuid: string;
    title: string;
    description: string;
    timestamp: number;
    isComplete: boolean;
    needsFeedback: boolean;
    inProgress: boolean;
    targetRelease?: string;
}

export interface Vote {
    sha256: string;
    featureUuid: string;
    timestamp: number;
    comment?: string;
    userIdentifier?: string;
}

export interface Env {
    KV_STORE: KVNamespace;
    GOOGLE_CLIENT_ID: string;
    GOOGLE_CLIENT_SECRET: string;
}

export interface KVNamespace {
    get(key: string): Promise<string | null>;
    put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
}
