import { type NosmaiEvents } from './events.js';
import { NosmaiError } from './errors.js';
import type { CameraPosition, EffectCategory, LicenceState, MirrorMode, NosmaiEffect, EffectParameter, CloudPage } from './types.js';
import { type RecordingOptions, type RecordingResult } from './recorder.js';
import { MakeupLayer, ReshapeType, type Rgb } from './beauty-types.js';
export declare const SDK_VERSION = "0.1.0-alpha.1";
export interface InitializeOptions {
    assetBase?: string;
}
export interface InitializeResult {
    ok: boolean;
    licence: LicenceState;
    error?: NosmaiError;
}
export interface CameraOptions {
    position?: CameraPosition;
    width?: number;
    height?: number;
    stream?: MediaStream;
}
declare class CameraApi {
    private sdk;
    constructor(sdk: Nosmai);
    start(options?: CameraOptions): Promise<void>;
    stop(): void;
    switchCamera(): Promise<boolean>;
    setMirror(mode: MirrorMode): void;
    get isRunning(): boolean;
    get position(): CameraPosition;
    list(): Promise<MediaDeviceInfo[]>;
}
declare class EffectsApi {
    private sdk;
    constructor(sdk: Nosmai);
    apply(source: ArrayBuffer | Uint8Array | Blob | string): Promise<void>;
    clear(): Promise<void>;
    get active(): NosmaiEffect | null;
    get isActive(): boolean;
    get activeType(): string;
    parameters(): EffectParameter[];
    setParameter(name: string, value: number): boolean;
    setParameterString(name: string, value: string): boolean;
    pause(): void;
    resume(): void;
    getParameter(name: string): number;
    getParameterString(name: string): string;
}
declare class BeautyApi {
    private sdk;
    readonly makeup: MakeupApi;
    readonly reshape: ReshapeApi;
    constructor(sdk: Nosmai);
    setSkinSmoothing(level: number): void;
    setSkinWhitening(level: number): void;
    setTeethWhitening(level: number): void;
    setSharpening(level: number): void;
    setContourHighlighter(level: number): void;
    setDarkCircleCorrector(level: number): void;
    setEyeColor(colour: Rgb | string, intensity?: number): void;
    setEyeColorIntensity(intensity: number): void;
    get isEyeColorActive(): boolean;
    clear(): void;
    get activeMask(): number;
}
declare class ReshapeApi {
    private sdk;
    constructor(sdk: Nosmai);
    set(type: ReshapeType, value: number): void;
    clear(): void;
    get isActive(): boolean;
}
declare class MakeupApi {
    private sdk;
    constructor(sdk: Nosmai);
    apply(layer: MakeupLayer, style: number, colour: Rgb | string, intensity?: number): void;
    setIntensity(layer: MakeupLayer, intensity: number): void;
    isActive(layer: MakeupLayer): boolean;
    remove(layer: MakeupLayer): void;
    clear(): void;
}
declare class HairApi {
    private sdk;
    constructor(sdk: Nosmai);
    setColor(colour: Rgb | string, intensity?: number): void;
    setIntensity(intensity: number): void;
    get isEnabled(): boolean;
    clear(): void;
}
declare class OutputApi {
    private sdk;
    constructor(sdk: Nosmai);
    stream(): MediaStream;
    videoTrack(): MediaStreamTrack;
    get isActive(): boolean;
    release(): void;
}
declare class RecordingApi {
    private sdk;
    constructor(sdk: Nosmai);
    get isSupported(): boolean;
    get isRecording(): boolean;
    get duration(): number;
    start(options?: RecordingOptions): void;
    stop(): Promise<RecordingResult>;
    cancel(): void;
    capturePhoto(type?: string, quality?: number): Promise<Blob>;
}
declare class BackgroundApi {
    private sdk;
    constructor(sdk: Nosmai);
    blur(strength: number): void;
    color(colour: Rgb | string, alpha?: number): void;
    image(source: string | Blob | HTMLImageElement | HTMLCanvasElement | ImageBitmap): Promise<void>;
    video(source: string | Blob | HTMLVideoElement): Promise<void>;
    private _videoStop;
    private _stopVideo;
    clear(): void;
}
declare class ColorApi {
    private sdk;
    constructor(sdk: Nosmai);
    setBrightness(value: number): void;
    setContrast(value: number): void;
    setHsb(hueDegrees: number, saturation?: number, brightness?: number): void;
    setWhiteBalance(temperature: number, tint?: number): void;
    setRgb(r?: number, g?: number, b?: number): void;
    setGrayscale(on: boolean): void;
    setLut(source: string | Blob | Uint8Array | ArrayBuffer, intensity?: number): Promise<void>;
    setLutIntensity(intensity: number): void;
    clear(): void;
}
declare class GameApi {
    private sdk;
    constructor(sdk: Nosmai);
    get isReady(): boolean;
    tap(x: number, y: number): boolean;
    input(name: string, x?: number, y?: number, value?: number): boolean;
    pause(): void;
    resume(): void;
    restart(): void;
}
declare class CloudApi {
    private sdk;
    constructor(sdk: Nosmai);
    private requireCloudFeature;
    list(options?: {
        category?: EffectCategory;
        page?: number;
        limit?: number;
    }): Promise<CloudPage>;
    download(effectId: string, onProgress?: (fraction: number) => void): Promise<Uint8Array>;
    isDownloaded(effectId: string): Promise<boolean>;
    downloadedIds(): Promise<string[]>;
    clearCache(effectId?: string): Promise<void>;
    apply(effectId: string, onProgress?: (fraction: number) => void): Promise<void>;
}
export declare class Nosmai {
    private static _instance;
    private bus;
    private stream;
    private ownsStream;
    private video;
    private stopRender;
    private assetBase;
    private licence;
    private mirror;
    private canvas;
    private initialized;
    readonly camera: CameraApi;
    readonly effects: EffectsApi;
    readonly beauty: BeautyApi;
    readonly hair: HairApi;
    readonly background: BackgroundApi;
    readonly color: ColorApi;
    readonly cloud: CloudApi;
    readonly game: GameApi;
    readonly recording: RecordingApi;
    readonly output: OutputApi;
    private constructor();
    static get instance(): Nosmai;
    static initialize(licenseKey: string, options?: InitializeOptions): Promise<InitializeResult>;
    get isInitialized(): boolean;
    get isProcessing(): boolean;
    isFeatureEnabled(feature: string): boolean;
    get isCloudFilterEnabled(): boolean;
    get isBeautyEffectEnabled(): boolean;
    get licenceState(): LicenceState;
    on<K extends keyof NosmaiEvents>(event: K, handler: (payload: NosmaiEvents[K]) => void): () => void;
    attach(canvas: HTMLCanvasElement): Promise<void>;
    private applyMirror;
    private sampling;
    private sampleTick;
    private startSampling;
    dispose(): void;
}
export {};
