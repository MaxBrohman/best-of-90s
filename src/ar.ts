import { IVideoParams, IARController, IARCameraParams } from './typings/controller';

// new version of ARtoolkit doesnt exist as npm package fo now 
declare const ARController: IARController;
declare const ARCameraParam: IARCameraParams;

export default class Ar {
	public video: HTMLVideoElement;
	public controller: IARController | undefined;
	private width: number = 640;
	private height: number = 480;
	private videoParams: IVideoParams;
	private cameraParams: IARCameraParams;
	private readonly cameraUrl: string = './camera_para.dat';
	private readonly patternUrl: string = './pattern-last.patt';
    constructor(){
		this.video = document.createElement('video');
		this.cameraParams = new ARCameraParam();
        this.videoParams = {
            audio: false,
            video: {
                width: {
					ideal: this.width
				},
                height: {
					ideal: this.height
				},
                facingMode: 'environment'
            }
		}; 
		this.process = this.process.bind(this);
		this.playVideo = this.playVideo.bind(this);
	}
	
	// initialiizes video stream and calibrates camera
	public initCamera(): Promise<HTMLVideoElement>{
		return new Promise((resolve) => {
			this.cameraParams.onload = () => {
				this.controller = new ARController(this.width, this.height, this.cameraParams);
				this.initVideoSource()
				.then((video) => {
					resolve((video as HTMLVideoElement));
				})
				.catch(err => {
					console.error('error occured', err.message);
				});
			};
			this.cameraParams.load(this.cameraUrl);
		});
	}

	// basically decorator around setMarker method
	public initMarker(root: THREE.Group): Promise<THREE.Group>{
		return new Promise( async (resolve) => {
			const newRoot = await this.setMarker(this.patternUrl, root);
			resolve(newRoot);
		});
	}

	// artoolkit frame processing
	public process(): void{
		return this.controller!.process(this.video);
	}

	// updates three js scene on resize
	public onWindowResize(camera: THREE.PerspectiveCamera, renderer: THREE.WebGLRenderer): void{
		camera.aspect = window.innerWidth / window.innerHeight;
		camera.updateProjectionMatrix();
		renderer.setSize(window.innerWidth, window.innerHeight);
	}
	
	// updates page on resize
	public onVideoResize(): void{
		const screenWidth = window.innerWidth;
		const screenHeight = window.innerHeight;
	
		// compute sourceWidth, sourceHeight
		const sourceWidth = this.video.videoWidth;
		const sourceHeight = this.video.videoHeight;
		
		// compute sourceAspect
		const sourceAspect = sourceWidth / sourceHeight;
		// compute screenAspect
		const screenAspect = screenWidth / screenHeight;
	
		// if screenAspect < sourceAspect, then change the width, else change the height
		if( screenAspect < sourceAspect ){
			// compute newWidth and set .width/.marginLeft
			const newWidth = sourceAspect * screenHeight;
			this.video.style.width = newWidth +'px';
			this.video.style.marginLeft = -(newWidth-screenWidth)/2 + 'px';
			
			// init style.height/.marginTop to normal value
			this.video.style.height = screenHeight + 'px';
			this.video.style.marginTop = '0px';
		}else{
			// compute newHeight and set .height/.marginTop
			const newHeight = 1 / (sourceAspect / screenWidth);
			this.video.style.height = newHeight + 'px';
			this.video.style.marginTop = -(newHeight-screenHeight)/2 + 'px';
			
			// init style.width/.marginLeft to normal value
			this.video.style.width = screenWidth + 'px';
			this.video.style.marginLeft = '0px';
		}
	}

	// loads marker pattern and creates scene root element
	private setMarker(url: string, root: THREE.Group): Promise<THREE.Group>{
		return new Promise((resolve) => {
		  	(this.controller as IARController).loadMarker(url, (markerUid: any) => {
				const markerRoot = this.createMarkerRoot(markerUid, root);
				resolve(markerRoot);
			});
		});
	}

	// gets stream from user camera
    private getStream(): Promise<MediaStream>{
        return navigator.mediaDevices.getUserMedia(this.videoParams);
    }

	// writes stream into video html element
    private initVideoSource(): Promise<HTMLVideoElement | void>{
		return new Promise((resolve) => {
			this.getStream()
            .then(stream => {
                // for devices that needs user interaction to play a video
                this.video.srcObject = stream;
				this.setVideoStyles();
                resolve(this.video);
            })
            .catch(err =>{
                // user denied camera access or webRTC is not supported
                console.warn('Camera access needed', err.message);
            });
		});
    }

	// helper function for some browsers
    private playVideo(): void{
        this.video.play();
        document.body.removeEventListener('click', this.playVideo);
	}
	
	// sets video styles
	private setVideoStyles(): void{
		this.video.style.position = 'absolute';
		this.video.style.top = '0px';
		this.video.style.left = '0px';
		this.video.style.zIndex = '-2';
		document.body.addEventListener('click', this.playVideo);
		this.video.setAttribute('autoplay', '');
		this.video.setAttribute('muted', '');
		this.video.setAttribute('playsinline', ''); 
		this.video.addEventListener('loadedmetadata', () => {
			document.body.appendChild(this.video);
			this.onVideoResize();
		});
		this.video.style.width = '640px';
		this.video.style.height = '480px';
	}

	// sets necessary properties for scene root element
	private createMarkerRoot(markerUid: number, root: THREE.Group): THREE.Group{
		this.controller!.threePatternMarkers = {};
		(root as any).markerTracker = this.controller!.trackPatternMarkerId(markerUid);
		(root as any).markerMatrix = new Float64Array(12);
		root.matrixAutoUpdate = false;
		this.controller!.threePatternMarkers[markerUid] = root;
		return root;
	}
}