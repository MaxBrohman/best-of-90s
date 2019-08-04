import { Group } from 'three';

interface IVideoInt {
	width: {ideal: number};
	height: {ideal: number};
	facingMode: string;
}

export interface IVideoParams {
	audio: boolean;
	video: IVideoInt;
}

interface IPatternMarkers {
    [key: string]: Group;
}

export interface IARController {
    new(width: number, height: number, camera: any): IARController;
    getUserMedia: (configuration: any) => HTMLVideoElement;
    getCameraMatrix: () => Float64Array | number[];
    detectMarker: (video: HTMLVideoElement) => number;
    getMarkerNum: () => number;
    getTransMatSquare: (markerIndex: number, markerWidth: number, dst: Float64Array) => Float64Array;
    getTransMatSquareCont: (markerIndex: number, markerWidth: number, 
        previousMarkerTransform: Float64Array, dst: Float64Array) => Float64Array;
    loadMarker: (url: string, onload: (markerUID: number) => void) => any;
    transMatToGLMat: (transMat: Float64Array, glMat: Float64Array, scale?: number) => Float64Array;
    threePatternMarkers: IPatternMarkers | {};
    trackPatternMarkerId: (id: number, markerWidth?: number) => Group;
    addEventListener: (event: string, callback: (evt: any) => void) => void;
    process: (video: HTMLVideoElement) => void;
    canvas: HTMLCanvasElement;
}

export interface IARCameraParams {
    new(src?: string, onload?: () => void, onerror?: () => void): IARCameraParams;
    load: (src: string) => void;
    onload: () => void;
}