import Ar from './ar';
import { IUpdatedMesh } from './typings/photo-mesh';

export default class App {
    public gallery: any;
    public ar: Ar = new Ar();
    public camera: THREE.PerspectiveCamera | undefined;
    public scene: THREE.Scene | undefined;
    public renderer: THREE.WebGLRenderer | undefined;
    public raycaster: THREE.Raycaster | undefined;
    public video: HTMLVideoElement | undefined;
    public canvas: HTMLCanvasElement | undefined;
    private wrapper: THREE.Group | undefined;
    private matrixBuffer: number[][] = [];
    private threeModule: any;
    private actions: Array<() => void> = [];
    private isGalleryInitialized: boolean = false;
    constructor(){
        this.clickEventHandler = this.clickEventHandler.bind(this);
        this.swipeEventHandler = this.swipeEventHandler.bind(this);
        this.update = this.update.bind(this);
    }

    public async init(): Promise<any> {
        this.video = await this.initAr();
        this.canvas = await this.initThree();
        if(/^(iPhone|iPad|iPod)/.test(navigator.platform)){
            this.canvas.style.cursor = 'pointer';
        }
        this.camera!.projectionMatrix.fromArray((this.ar.controller!.getCameraMatrix() as number[]));
        document.body.appendChild(this.canvas!);
        this.onResize();
        window.addEventListener('resize', () => {
            this.onResize();
        });

        await this.setupMarkerDetection();

        window.addEventListener('touchstart', (evt: TouchEvent) => {
            
          });
    }

    // updates app every frame
    public update(): void {
        this.act();
        this.renderer!.render(this.scene!, this.camera!);
        requestAnimationFrame(this.update);
    }

    // performs all necessary window resize operations
    private onResize(): void {
        this.ar.onVideoResize();
        if(window.innerHeight > window.innerWidth){
            this.wrapper!.rotation.x = -(Math.PI * 0.25);
            this.wrapper!.scale.set(1, 1, 1);
        } else{
            this.wrapper!.rotation.x = 0;
            this.wrapper!.scale.set(1.3, 1.3, 1.3);
        }
        this.ar.onWindowResize(this.camera!, this.renderer!);
    }

    // dynamically loads and initializes three js
    private initThree(): Promise<HTMLCanvasElement>{
        return new Promise( async (resolve) => {
            this.threeModule = await import(/* webpackChunkName: "three" */'three');
            const { WebGLRenderer, PerspectiveCamera, Raycaster, Group, Scene } = this.threeModule;
            this.renderer = new WebGLRenderer({ antialias: true, alpha: true });
            this.renderer!.setSize(window.innerWidth, window.innerHeight);
            this.renderer!.setClearAlpha(0.0);

            this.scene = new Scene();
            this.camera = new PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 20000);
            this.camera!.position.z = 5;
            this.scene!.add(this.camera!);
            this.camera!.lookAt(this.scene!.position);
            this.raycaster = new Raycaster();
            this.wrapper = new Group();
            resolve(this.renderer!.domElement);
        });
    }

    // initializes ar class
    private initAr(): Promise<HTMLVideoElement>{
        return new Promise( async (resolve) => {
            const video = await this.ar.initCamera();
            resolve(video);
        });
    }

    // renders mesh on page
    private async renderMesh(position?: THREE.Vector3): Promise<void>{
        let mesh;
        try{
            mesh = await this.gallery.render();
        } catch(err){
            console.warn('it seems like we are out of photos!', err);
        };
        if(mesh){
            if(position){
                mesh.position.copy(position);
            }
            this.wrapper!.add(mesh);
            this.gallery.animateScale(mesh);
        }
    }

     // animates and removes mesh from scene
     private async hideMesh(mesh: THREE.Mesh | THREE.Object3D): Promise<void>{
        const meshToHide = await this.gallery.hide(mesh);
        this.wrapper!.remove(meshToHide);
    }

    // dispathces all app actions for request animation frame
    public act(): void{
        this.actions.forEach(action => {
            action();
        });
    }

    // click logic
    private clickEventHandler(evt: MouseEvent): void{
        evt.preventDefault();
        
        const clickedMesh = this.getIntersectedMesh(evt.clientX, evt.clientY);
        if (clickedMesh) {
            const maxScaleAfterAnimation = 0.999999;
            if(clickedMesh.scale.x < maxScaleAfterAnimation || clickedMesh.scale.y < maxScaleAfterAnimation){
                return;
            }
            this.hideMesh(clickedMesh);
            return;
        }

        // if empty space clicked, puts mesh on this.position
        const distance = - this.camera!.position.z / this.raycaster!.ray.direction.z;
        const newPosition = this.camera!.position.clone().add(this.raycaster!.ray.direction.multiplyScalar(distance));
        this.renderMesh(newPosition);
    }

    private swipeEventHandler(evt: TouchEvent): void {
        const startX = evt.touches[0].clientX;
        const touchEndHandler = (evt2: TouchEvent) => {
            const endX = evt2.changedTouches[0].clientX;
            const diff = startX - endX;
            if (Math.abs(diff) > 20) {
                const swipedMesh = this.getIntersectedMesh(evt.touches[0].clientX, evt.touches[0].clientY);
                if(swipedMesh){
                    window.open((swipedMesh as IUpdatedMesh).link,'_blank');
                }
            }
            window.removeEventListener('touchend', touchEndHandler);
        };
        window.addEventListener('touchend', touchEndHandler);
    }

    private getIntersectedMesh(x: number, y: number): THREE.Mesh | THREE.Object3D | void {

        const mouse = new this.threeModule.Vector2(
            (x / window.innerWidth) * 2 - 1,
            -(y / window.innerHeight) * 2 + 1
        );
        
        this.raycaster!.setFromCamera(mouse, this.camera!);

        // if mesh cicked, hides it
        const intersects = this.raycaster!.intersectObjects(this.wrapper!.children);
        if (intersects.length > 0) {
            return intersects[0].object;
        }
    }

    // adds msrker found event listener and adds root to scene
    private async setupMarkerDetection(): Promise<void> {
        const group = new this.threeModule.Group();
        const root = await this.ar.initMarker(group);
        root.add(this.wrapper!);
        root.visible = false;
        this.scene!.add(root);
        this.ar.controller!.addEventListener('getMarker', async (evt) => {
            const marker = evt.data.marker;
            const markerRoot = this.ar.controller!.threePatternMarkers[marker.idPatt];
            if(markerRoot){
                if(!this.isGalleryInitialized) {
                    this.isGalleryInitialized = true;
                    const module = await import(/* webpackChunkName: "gallery" */'./gallery'); 
                    this.gallery = new module.default();
                    await this.gallery.init();
                    window.addEventListener('click', this.clickEventHandler);
                    window.addEventListener('touchstart', this.swipeEventHandler);
                    this.renderMesh();
                }
                const newMat = this.interpolateMatrix(evt.data.matrixGL_RH);
                markerRoot.matrix.copy(newMat);
                markerRoot.visible = true;
            } else {
                root.visible = false;
            }
        });
        this.actions.push(this.ar.process);
    }

    // interpolation for marker matrices to decrease flickering
    private interpolateMatrix(detectedPos: number[]): THREE.Matrix4 {
        const newPos: number[] = [];
        let newMat;
        this.matrixBuffer.push(detectedPos);
        if(this.matrixBuffer.length < 2){
          newMat = new this.threeModule.Matrix4().fromArray(detectedPos);
        } else {
          if(this.matrixBuffer.length >= 5) {
            this.matrixBuffer.shift();
          }
          const bufferLength = this.matrixBuffer.length;
          for(let i = 0, length = this.matrixBuffer[i].length; i < length; i++) {
            newPos[i] = 0;
            for(let j = 0; j < bufferLength; j++) {
              newPos[i] += this.matrixBuffer[j][i];
            }
            newPos[i] = newPos[i] / bufferLength;
          }
          newMat = new this.threeModule.Matrix4().fromArray(newPos);
        }
        return newMat;
    }
}