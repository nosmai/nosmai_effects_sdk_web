export declare const ReshapeType: {
    readonly lipSize: 0;
    readonly faceSlim: 1;
    readonly eyeSize: 2;
    readonly noseSize: 3;
    readonly chin: 4;
    readonly brow: 5;
    readonly browThickness: 6;
    readonly jaw: 7;
    readonly mouthWidth: 8;
    readonly forehead: 9;
};
export type ReshapeType = (typeof ReshapeType)[keyof typeof ReshapeType];
export declare const RESHAPE_RANGE: Record<ReshapeType, number>;
export declare const RESHAPE_LABELS: Record<ReshapeType, string>;
export declare const MakeupLayer: {
    readonly lipstick: 0;
    readonly eyeshadow: 1;
    readonly blusher: 2;
    readonly eyelash: 3;
    readonly eyebrow: 4;
};
export type MakeupLayer = (typeof MakeupLayer)[keyof typeof MakeupLayer];
export declare const LipstickStyle: {
    readonly classic: 0;
    readonly matte: 1;
    readonly natural: 2;
    readonly testing: 3;
    readonly beautyV3: 4;
};
export declare const EyeshadowStyle: {
    readonly smokey: 0;
    readonly shimmer: 1;
    readonly natural: 2;
    readonly beautyV3: 3;
};
export declare const BlusherStyle: {
    readonly round: 0;
    readonly contour: 1;
    readonly natural: 2;
    readonly beautyV3: 3;
};
export declare const EyelashStyle: {
    readonly natural: 0;
    readonly dramatic: 1;
    readonly wispy: 2;
    readonly beautyV3: 3;
};
export declare const EyebrowStyle: {
    readonly natural: 0;
    readonly bold: 1;
    readonly arched: 2;
    readonly beautyV3: 3;
};
export interface Rgb {
    r: number;
    g: number;
    b: number;
}
export declare function rgbFromHex(hex: string): Rgb;
