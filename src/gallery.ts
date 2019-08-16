import { Clock, Mesh } from 'three';
import { PMOptions } from './typings/photo-mesh';
import PhotoMesh from './photo-mesh';

export default class PhotoGallery {
    private data: PMOptions[] | undefined;
    public meshes: Mesh[] = [];
    private usedMeshes: Mesh[] = [];

    // creates all meshes and puts them on meshes array
    public async init(): Promise<any> {
        const module = await import(/* webpackChunkName: "data" */'./data');
        this.data = module.data;
        this.data.forEach(img => {
            const newMesh = new PhotoMesh(img).init();
            newMesh.scale.set(0.000001, 0.000001, 0.000001);
            this.meshes.push(newMesh);
        });
    }

    // adds mesh to scene, animates and translate mesh from meshes array to usedMeshes array
    public render(wrapper: THREE.Group, position?: THREE.Vector3): void {
        if(this.meshes.length === 0){
            this.meshes = [...this.usedMeshes];
            this.usedMeshes = [];
        }
        const showedMesh = this.meshes.shift();
        this.usedMeshes.push(showedMesh!);
        if(position){
            showedMesh!.position.copy(position);
        }
        wrapper.add(showedMesh!);
        this.animateScale(showedMesh!);
    }

    // removes mesh from scene and animates it
    public hide(mesh: Mesh, wrapper: THREE.Group): Promise<void>{
        return new Promise((resolve) => {
            this.animateScale(mesh).then(() => {
                wrapper.remove(mesh);
                resolve();
            });
        });
    }

    // animate scale depending on current mesh scale
    private animateScale(mesh: Mesh): Promise<boolean>{
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