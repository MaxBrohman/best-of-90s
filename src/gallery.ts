import { Clock, Mesh } from 'three';
import { PMOptions } from './typings/photo-mesh';
import PhotoMesh from './photo-mesh';

export default class PhotoGallery{
    private data: PMOptions[] | undefined;
    public meshes: Mesh[] = [];
    private meshCounter: number = 0;
    constructor(){}

    // creates all meshes and puts them on meshes property array
    public async init(): Promise<any> {
        const module = await import(/* webpackChunkName: "data" */'./data');
        this.data = module.data;
        this.data.forEach(img => {
            const newMesh = new PhotoMesh(img).init();
            newMesh.scale.set(0.000001, 0.000001, 0.000001);
            this.meshes.push(newMesh);
        });
    }

    // adds mesh to scene, animates and translate mesh from meshes property array to usedMeshes property array
    public async render(): Promise<Mesh> {
        const mesh = this.meshes[this.meshCounter];
        this.meshCounter++;
        return mesh;
    }

    public hide(mesh: Mesh): Promise<Mesh>{
        return new Promise((resolve) => {
            this.animateScale(mesh).then(() => {
                resolve(mesh);
            });
        });
    }

    // animate scale depending on current mesh scale
    public animateScale(mesh: Mesh): Promise<boolean>{
        return new Promise((resolve) => {

            let clock: Clock | null = new Clock();
            const duration = 0.8;
            const to = mesh.scale.x - 1;
            const from = -mesh.scale.x;
            const minAllowableScale = 0.000001;
            const animate = () => {
                const animationTime = clock!.getElapsedTime();
                const step = animationTime / duration;

                if(animationTime >= duration){
                    resolve(true);
                    clock = null;
                    const limit = Math.abs(to);
                    mesh.scale.set(limit, limit, minAllowableScale);
                    return;
                }
                
                const value = Math.abs(from + step);
                mesh.scale.set(value, value, minAllowableScale);

                requestAnimationFrame(animate);
            };
            animate();
        });
        
    }
};