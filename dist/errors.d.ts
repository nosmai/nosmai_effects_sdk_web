export type NosmaiErrorType = 'unknown' | 'stateError' | 'platformError' | 'networkError' | 'invalidParameter' | 'sdkNotInitialized' | 'invalidLicense' | 'licenseExpired' | 'cameraPermissionDenied' | 'cameraUnavailable' | 'webglUnavailable' | 'effectNotFound' | 'effectInvalidFormat' | 'effectLoadFailed' | 'recordingInProgress' | 'recordingWriteFailed';
export declare class NosmaiError extends Error {
    readonly type: NosmaiErrorType;
    readonly code: string;
    readonly details?: unknown;
    readonly cause?: unknown;
    constructor(init: {
        type: NosmaiErrorType;
        code?: string;
        message: string;
        details?: unknown;
        cause?: unknown;
    });
    get isRecoverable(): boolean;
    get userMessage(): string;
    get recoveryActions(): string[];
}
export declare function cameraErrorFrom(error: unknown): NosmaiError;
