import { NosmaiError } from '../errors.js';
import type { CameraPosition, MirrorMode } from '../types.js';
export interface NosmaiCameraPreviewProps {
    width?: number | string;
    height?: number | string;
    onInitialized?: () => void;
    onError?: (error: NosmaiError) => void;
    facingMode?: CameraPosition;
    mirror?: MirrorMode;
    objectFit?: 'contain' | 'cover';
    effect?: string | Uint8Array | Blob | null;
    className?: string;
    style?: React.CSSProperties;
    onGameTap?: (tap: {
        normalizedX: number;
        normalizedY: number;
        locationX: number;
        locationY: number;
        previewWidth: number;
        previewHeight: number;
    }) => void;
}
export interface NosmaiCameraPreviewHandle {
    reinitialize: () => Promise<void>;
    readonly isInitialized: boolean;
    readonly currentError: string | null;
}
export declare const NosmaiCameraPreview: import("react").ForwardRefExoticComponent<NosmaiCameraPreviewProps & import("react").RefAttributes<NosmaiCameraPreviewHandle>>;
