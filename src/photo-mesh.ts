import {
    Mesh,
    MeshBasicMaterial,
    Texture,
    TextureLoader,
    PlaneGeometry
} from 'three';
import { PMOptions, IUpdatedMesh } from './typings/photo-mesh';

// image plane class
export default class PhotoMesh{
    private texture: Texture;
    private link: string;
    private readonly DEF_WIDTH: number = 5;
    private readonly DEF_HEIGHT: number = 5;
    constructor(options: PMOptions){
        this.texture = new TextureLoader().load(options.img);
        this.link = options.link;
    }
    // sets image as texture
    init(): IUpdatedMesh{
        const geometry = new PlaneGeometry(
            this.DEF_WIDTH,
            this.DEF_HEIGHT
        );
        const material = new MeshBasicMaterial({
            map: this.texture,
            depthWrite: false,
            alphaTest: 0.5
        });
        const mesh = new Mesh(geometry, material);
        (mesh as IUpdatedMesh).link = this.link
        return mesh;
    }
};