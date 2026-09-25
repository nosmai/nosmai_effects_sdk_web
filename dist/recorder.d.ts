import type { CanvasMirror } from './canvas-mirror.js';
export interface RecordingResult {
    success: boolean;
    blob?: Blob;
    duration: number;
    fileSize: number;
    mimeType?: string;
    error?: string;
}
export interface RecordingOptions {
    audio?: boolean;
    videoBitsPerSecond?: number;
    mimeTypes?: string[];
}
export declare function recordingSupported(): boolean;
export declare class Recorder {
    private mirror;
    private onProgress?;
    private recorder;
    private chunks;
    private startedAt;
    private mimeType;
    private canvasStream;
    private progressTimer;
    constructor(mirror: CanvasMirror, onProgress?: ((seconds: number) => void) | undefined);
    get isRecording(): boolean;
    get duration(): number;
    start(canvas: HTMLCanvasElement, cameraStream: MediaStream | null, options?: RecordingOptions): void;
    frame(): void;
    stop(): Promise<RecordingResult>;
    cancel(): void;
    private cleanup;
}
export declare function captureCanvas(canvas: HTMLCanvasElement, type?: string, quality?: number): Promise<Blob>;
