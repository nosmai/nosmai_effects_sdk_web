import type { NosmaiError } from './errors.js';
import type { LicenceState, NosmaiGameEvent } from './types.js';
export interface NosmaiEvents {
    ready: void;
    error: NosmaiError;
    licenseStatusChanged: LicenceState;
    faceDetected: boolean;
    fps: number;
    recordingProgress: number;
    gameEvent: NosmaiGameEvent;
}
type Handler<T> = (payload: T) => void;
export declare class EventBus {
    private handlers;
    on<K extends keyof NosmaiEvents>(event: K, handler: Handler<NosmaiEvents[K]>): () => void;
    off<K extends keyof NosmaiEvents>(event: K, handler: Handler<NosmaiEvents[K]>): void;
    emit<K extends keyof NosmaiEvents>(event: K, payload: NosmaiEvents[K]): void;
}
export {};
