import {
    Mesh,
    MeshBasicMaterial,
    Texture,
    TextureLoader,
    PlaneGeometry
} from 'three';
import { PMOptions, OptionsSize } from './typings/photo-mesh';

// image plane class
export default class PhotoMesh{
    private texture: Texture;
    private size: OptionsSize;
    private scale: number;
    constructor(options: PMOptions){
        this.texture = new TextureLoader().load(options.img);
        this.size = options.size;
        this.scale = options.scale;
    }
    // sets image as texture
    init(): Mesh{
        const geometry = new PlaneGeometry(
            this.size.width * this.scale,
            this.size.height * this.scale
        );
        const material = new MeshBasicMaterial({
            map: this.texture,
            depthWrite: false,
            alphaTest: 0.5
        });
        return new Mesh(geometry, material);
    }
};