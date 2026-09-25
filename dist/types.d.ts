export type LicenceStatus = 'unverified' | 'valid' | 'expired' | 'invalid';
export interface LicenceState {
    status: LicenceStatus;
    secondsRemaining: number;
    watermarked: boolean;
    blurred: boolean;
    code?: string;
    message?: string;
    features?: Record<string, boolean>;
}
export interface NosmaiGameEvent {
    event: string;
    game: string;
    sequence: number;
    data: Record<string, unknown>;
}
export type CameraPosition = 'front' | 'back';
export type MirrorMode = 'auto' | 'on' | 'off';
export interface NosmaiEffect {
    id: string;
    name: string;
    displayName: string;
    category: EffectCategory;
    source: 'local' | 'cloud';
    url?: string;
    previewUrl?: string;
    fileSize?: number;
    isFree: boolean;
    isDownloaded: boolean;
}
export type EffectCategory = 'filter' | 'effect' | 'background' | 'beautyEffect';
export interface CloudPage {
    items: NosmaiEffect[];
    page: number;
    totalPages: number;
    total: number;
    hasNextPage: boolean;
}
export interface EffectParameter {
    name: string;
    type: string;
    displayName: string;
    description: string;
    hasRange: boolean;
    minValue: number;
    maxValue: number;
    passId: number;
    currentValue: number | string | number[];
    defaultValue: number | string | number[];
    options: string[];
}
