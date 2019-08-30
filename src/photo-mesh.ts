import {
    LinearMipMapLinearFilter,
    Mesh,
    MeshBasicMaterial,
    Texture,
    TextureLoader,
    PlaneGeometry,
    WebGLRenderer
} from 'three';
import { PMOptions, IUpdatedMesh } from './typings/photo-mesh';

// image plane class
export default class PhotoMesh{
    private texture: Texture;
    private link: string;
    private renderer: WebGLRenderer;
    private readonly DEF_WIDTH: number = 5;
    private readonly DEF_HEIGHT: number = 5;
    constructor(options: PMOptions, renderer: WebGLRenderer){
        this.link = options.link;
        this.renderer = renderer;
        this.texture = new TextureLoader().load(options.img);
    }
    // sets image as texture
    init(): IUpdatedMesh{
        // setting best filter
        this.texture.minFilter = LinearMipMapLinearFilter;
        // computes and sets best possible anisotropy
        const maxAnisotropy = this.renderer.getMaxAnisotropy();
        this.texture.anisotropy = maxAnisotropy;
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