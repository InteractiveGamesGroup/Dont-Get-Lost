
// Flags to determine which direction the player is moving
let moveForward = false;
let moveBackward = false;
let moveLeft = false;
let moveRight = false;
// Velocity vector for the player
let playerVelocity = new THREE.Vector3();
let playerRotation = 0;
// How fast the player will move
let PLAYERSPEED = 900.0;




class Game{

    constructor() {
        
        // Game Modes
        this.modes = Object.freeze({
            NONE: Symbol("none"),
            PRELOAD: Symbol("preload"),
			INITIALISING:  Symbol("initialising"),
			CREATING_LEVEL: Symbol("creating_level"),
			ACTIVE: Symbol("active"),
			GAMEOVER: Symbol("gameover")
        });
        // Default game mode is none
        this.mode = this.modes.NONE;

        const game = this;

        // ######################## Global variables ########################
        // Standard THREE.js variables
        this.canvas;
        this.camera;
        this.scene;
        this.renderer;
        this.controls;

        // Game blocker (instructions)
        this.blocker = document.getElementById('blocker');

        // Map variables
        this.UNITWIDTH = 90; // Width of a cubes in the maze
        this.UNITHEIGHT = 200; // Height of the cubes in the maze
        this.totalCubesWide = 0; // How many cubes wide the maze will be
        this.mapSize;    // The width/depth of the maze

        // The game textures
        // this.textureNames = ['grass','wall'];
        this.textures = []
        
        // Assests path( for the game textures)
        this.assetsPath = '/assets/textures/';

        // options of assets to load
        const options = {
            assets:[
                `${this.assetsPath}grass.jpg`,
                `${this.assetsPath}wall.jpg`,
                `${this.assetsPath}wall.jpg`,
            ],
            onComplete: function () {

                game.init();
                game.animate();
            }
        }

        //Change Game mode to preload
        this.mode = this.modes.PRELOAD;

        // Used for keeping track of animation
        this.clock = new THREE.Clock();
        
        // Loader used to load assets before game begins
        const preloader = new Preloader(options,this.textures);

    }// END CONSTRUCTOR

    
    // Function used to initialise
    init(){

        // Change game mode to initialising
        this.mode = this.modes.INITIALISING;

         // Hide the loading bar
        const loadingElem = document.querySelector('#loading');
        loadingElem.style.display = 'none';

        // ------------------- Set Scene settings ----------------------

        // Create the scene where everything will go
        this.scene = new THREE.Scene();
        //background of the scene  
        this.scene.background = new THREE.Color( '#87ceeb' );
        // Add some fog for effects
        this.scene.fog = new THREE.FogExp2(0xcccccc, 0.0030);
        // this.scene.fog = new THREE.Fog( 0xcce0ff);

        // ------------------- Set Camera settings ----------------------
        const fov = 60;
        const aspect = window.innerWidth / window.innerHeight;  // the canvas default
        const near = 1;
        const far = 1500;
        this.camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
        this.camera.position.x = 0;
        this.camera.position.y = 50; // Height the camera will be looking from
        this.camera.position.z = 0; 

        // ------------------- Set Global scene Light settings ----------------------
        // Add sunlight to the scene 
        let sunLight = new THREE.DirectionalLight(0xffffff,0.5);
        sunLight.castShadow = true;
        sunLight.position.set(900, 600, 800);
        sunLight.target.position.set(0,30, 70);
        sunLight.shadow.mapSize.width = 1024;
        sunLight.shadow.mapSize.height = 1024;
        sunLight.shadow.camera.near = 50;
        sunLight.shadow.camera.far = 2000;
        sunLight.shadow.camera.right = 700;
        sunLight.shadow.camera.left = -700;
        sunLight.shadow.camera.bottom = -300;
        sunLight.shadow.camera.top = 300;

        this.scene.add(sunLight);
        this.scene.add(sunLight.target);
        sunLight.target.updateMatrixWorld();
        sunLight.shadow.camera.updateProjectionMatrix();

        //Create a helpers the the directional light
        // let shadowhelper = new THREE.CameraHelper( sunLight.shadow.camera );
        // this.scene.add( shadowhelper );
        // let dirHelper = new THREE.DirectionalLightHelper( sunLight,5 );
        // this.scene.add( dirHelper );

        // Second Ambience light
        let ambienceLight = new THREE.AmbientLight( 0x404040 ); // soft white light
        this.scene.add( ambienceLight  );
    
    
        //------------------- Create the game's visible objects ----------------------
        const game = this;

        // Add the walls(cubes) of the maze
        game.createMazeCubes();
        game.createGround();
        game.createPerimWalls();

        //
        try{
            // Get the canvas
            this.canvas = document.getElementById("glcanvas");
            // Set render settings
            this.renderer = new THREE.WebGLRenderer({
                canvas: this.canvas,
                antialias: true,
                alpha:false
            });
            this.renderer.shadowMap.enabled = true;
            this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
            
        }catch(e){
            document.getElementById("message").innerHTML="<b>Sorry, an error occurred:<br>" +
                    e + "</b>";
            return;
        }

        game.installControls();
        game.listenForPlayerMovement();
        game.getPointerLock();

        // Listen for if the window changes sizes and adjust
        window.addEventListener('resize', game.onWindowResize(), false);

    }


    degreesToRadians(degrees) {
        return degrees * Math.PI / 180;
    }

    createMazeCubes() {
    // Maze wall mapping, assuming even square
    // 1's are cubes, 0's are empty space
        let map = [
        [0, 0, 1, 0, 1, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 0, ],
        [0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 0, ],
        [0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 1, 1, 1, 1, 1, 0, 1, 1, 0, 0, ],
        [0, 1, 0, 0, 0, 0, 1, 1, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, ],
        [0, 1, 1, 1, 1, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, ],
        [0, 0, 0, 0, 0, 0, 1, 1, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, ],
        [1, 1, 1, 0, 1, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 1, ],
        [0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 1, 0, 1, 0, 0, 1, 0, 0, 0, 0, ],
        [0, 1, 1, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, ],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, ],
        [0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 1, 0, 1, ],
        [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 1, 0, 0, ],
        [0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 1, 0, 1, 0, 1, 0, 0, 1, 1, 1, ],
        [0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 1, 0, 0, ],
        [0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 1, 1, 1, 0, 1, 0, 1, 0, 0, 0, ],
        [1, 1, 1, 0, 1, 1, 1, 1, 0, 1, 0, 1, 1, 0, 1, 0, 1, 0, 0, 0, ],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, ],
        [1, 1, 1, 0, 0, 0, 0, 0, 0, 1, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, ],
        [0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 1, 0, 1, 0, 1, 1, 1, 0, 0, ],
        [0, 0, 1, 1, 1, 0, 0, 0, 0, 1, 0, 1, 0, 1, 0, 0, 0, 1, 0, 0, ]
        ];
    
        // wall details
        let cubeGeo = new THREE.BoxGeometry(this.UNITWIDTH, this.UNITHEIGHT, this.UNITWIDTH);
        // let cubeMat = new THREE.MeshPhongMaterial({
        //   color: 0xff0000,
        // });

        // Wall texture
        let interior_wall = this.textures[1];

        //Immediately use the texture for material creation
        let cubeMat = new THREE.MeshBasicMaterial( { map: interior_wall } );
    
        // Keep cubes within boundry walls
        let widthOffset = this.UNITWIDTH / 2;
        // Put the bottom of the cube at y = 0
        let heightOffset = this.UNITHEIGHT / 2;
        
        // See how wide the map is by seeing how long the first array is
        this.totalCubesWide = map[0].length;
    
        // Place walls where 1`s are
        for (let i = 0; i < this.totalCubesWide; i++) {
        for (let j = 0; j < map[i].length; j++) {
            // If a 1 is found, add a cube at the corresponding position
            if (map[i][j]) {
            // Make the cube
            let cube = new THREE.Mesh(cubeGeo, cubeMat);
            cube.castShadow = true;
            cube.receiveShadow = true;
            // Set the cube position
            cube.position.z = (i - this.totalCubesWide / 2) * this.UNITWIDTH + widthOffset;
            cube.position.y = heightOffset;
            cube.position.x = (j - this.totalCubesWide / 2) * this.UNITWIDTH + widthOffset;
            // Add the cube
            this.scene.add(cube);
            // Used later for collision detection
            // collidableObjects.push(cube);
            }
        }
        }
      // The size of the maze will be how many cubes wide the array is * the width of a cube
      this.mapSize = this.totalCubesWide * this.UNITWIDTH;
    }

    createGround() {
        // Create ground geometry and material
        // let groundGeo = new THREE.PlaneGeometry(this.mapSize, this.mapSize);
        // let groundMat = new THREE.MeshPhongMaterial({ color: 0xA0522D, side: THREE.DoubleSide});
    
        // Grass Texture
        let grass = this.textures[0];
        grass.repeat.set(10,10);
        grass.wrapS = THREE.RepeatWrapping;
        grass.wrapT = THREE.RepeatWrapping;
        grass.encoding = THREE.sRGBEncoding;

        let groundGeo = new THREE.PlaneBufferGeometry( this.mapSize, this.mapSize );
        let groundMat = new THREE.MeshPhongMaterial( { color: 0xffffff, map: grass } );

        let ground = new THREE.Mesh(groundGeo, groundMat);
        ground.rotation.x = this.degreesToRadians(-90);
        ground.position.set(0, 1, 0);
        ground.receiveShadow = true;
        // ground.material.map.repeat.set( 10,10 );
        // ground.material.map.wrapS = THREE.RepeatWrapping;
        // ground.material.map.wrapT = THREE.RepeatWrapping;
        // ground.material.map.encoding = THREE.sRGBEncoding;
        this.scene.add(ground);


    //     ground.position.set(0, 1, 0);
    //     // Rotate the place to ground level
    //     ground.rotation.x = degreesToRadians(-90);
    //     ground.receiveShadow = true;
        

    }

    createPerimWalls() {
        let halfMap = this.mapSize / 2;  // Half the size of the map
        let sign = 1;               // Used to make an amount positive or negative
    
        // Loop through twice, making two perimeter walls at a time
        for (let i = 0; i < 2; i++) {
            let perimGeo = new THREE.PlaneGeometry(this.mapSize, this.UNITHEIGHT);

            // Wall texture
            let wall = this.textures[2];
            // Make the material double sided
            // let perimMat = new THREE.MeshPhongMaterial({ color: 0x464646, side: THREE.DoubleSide });
            let perimMat = new THREE.MeshBasicMaterial({ map:wall, side: THREE.DoubleSide });
            // Make two walls
            let perimWallLR = new THREE.Mesh(perimGeo, perimMat);
            perimWallLR.material.map.repeat.set(10,1);
            perimWallLR.material.map.wrapS = THREE.RepeatWrapping;
            perimWallLR.material.map.wrapT = THREE.RepeatWrapping;

            let perimWallFB = new THREE.Mesh(perimGeo, perimMat);
            perimWallFB.material.map.repeat.set(10,1);
            perimWallFB.material.map.wrapS = THREE.RepeatWrapping;
            perimWallFB.material.map.wrapT = THREE.RepeatWrapping;
    
            // Create left/right wall
            perimWallLR.position.set(halfMap * sign, this.UNITHEIGHT / 2, 0);
            perimWallLR.rotation.y = this.degreesToRadians(90);
            this.scene.add(perimWallLR);
            // Used later for collision detection
            // collidableObjects.push(perimWallLR);
            // Create front/back wall
            perimWallFB.position.set(0, this.UNITHEIGHT / 2, halfMap * sign);
            this.scene.add(perimWallFB);
    
            // Used later for collision detection
            // collidableObjects.push(perimWallFB);
    
            sign = -1; // Swap to negative value
        }
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();

        this.renderer.setSize(window.innerWidth,window.innerHeight);

    }

    animate(){
        const game = this;
        const delta = this.clock.getDelta();

        requestAnimationFrame( function(){ game.animate(); } );
        
        // Moves the player 
        // game.movePlayer(delta);
        // Gradual slowdown
        playerVelocity.x -= playerVelocity.x * 10.0 * delta;
        playerVelocity.z -= playerVelocity.z * 10.0 * delta;
        
        // console.log(this.moveForward);
        if (moveForward) {
            playerVelocity.z -= PLAYERSPEED * delta;
        } 
        if (moveBackward) {
            playerVelocity.z += PLAYERSPEED * delta;
        } 
        if (moveLeft) {
            playerVelocity.x -= PLAYERSPEED * delta;;
        } 
        if (moveRight) {
            playerVelocity.x += PLAYERSPEED * delta;

        }
        if( !( moveForward || moveBackward || moveLeft || moveRight)) {
          // No movement key being pressed. Stop movememnt
          playerVelocity.x = 0;
          playerVelocity.z = 0;
        }
        // console.log(this.controls);
        this.controls.getObject().translateX(playerVelocity.x * delta);
        this.controls.getObject().translateZ(playerVelocity.z * delta);

        this.renderer.render( this.scene, this.camera );
        
        

    }

    movePlayer(delta) {
        const game = this;
        // Gradual slowdown
        game .playerVelocity.x -= this.playerVelocity.x * 10.0 * delta;
        this.playerVelocity.z -= this.playerVelocity.z * 10.0 * delta;
        // console.log(this.playerVelocity);
        // console.log(game.movForward);
      
        if (this.moveForward) {
            this.playerVelocity.z -= this.PLAYERSPEED * delta;
        } 
        if (this.moveBackward) {
            this.playerVelocity.z += this.PLAYERSPEED * delta;
        } 
        if (this.moveLeft) {
            this.playerVelocity.x -= this.PLAYERSPEED * delta;;
        } 
        if (this.moveRight) {
            this.playerVelocity.x += this.PLAYERSPEED * delta;

        }
        if( !( this.moveForward || this.moveBackward || this.moveLeft || this.moveRight)) {
          // No movement key being pressed. Stop movememnt
          this.playerVelocity.x = 0;
          this.playerVelocity.z = 0;
        }
    
        this.controls.getObject().translateX(this.playerVelocity.x * delta);
        this.controls.getObject().translateZ(this.playerVelocity.z * delta);
      }

    installControls(){
    
        this.controls = new THREE.PointerLockControls(this.camera);
        this.scene.add(this.controls.getObject());
        
    }

    getPointerLock() {
        const game = this;
        document.onclick = function () {
            game.canvas.requestPointerLock();
        }
        document.addEventListener('pointerlockchange', ()=>{
                // Turn on controls
            if (document.pointerLockElement === game.canvas) {
                // Hide blocker and instructions
                game.blocker.style.display = "none";
                game.controls.enabled = true;
            // Turn off the controls
            } else {
                // Display the blocker and instruction
                game.blocker.style.display = "";
                game.controls.enabled = false;
            }
        }, false); 
    }

    listenForPlayerMovement() {
    
        // A key has been pressed
        let onKeyDown = function(event) {
          switch (event.keyCode) {
    
            case 38: // up
            case 87: // w
                moveForward = true;
                break;
    
            case 37: // left
            case 65: // a
                moveLeft = true;
                break;
    
            case 40: // down
            case 83: // s
                moveBackward = true;
                break;
    
            case 39: // right
            case 68: // d
                moveRight = true;
                break;
          }
      };
      
    
      // A key has been released
      let onKeyUp = function(event) {
        switch (event.keyCode) {
    
          case 38: // up
          case 87: // w
            moveForward = false;
            break;
    
          case 37: // left
          case 65: // a
            moveLeft = false;
            break;
    
          case 40: // down
          case 83: // s
            moveBackward = false;
            break;
    
          case 39: // right
          case 68: // d
            moveRight = false;
            break;
        }
      };
    
      // Add event listeners for when movement keys are pressed and released
      document.addEventListener('keydown', onKeyDown, false);
      document.addEventListener('keyup', onKeyUp, false);
    }


} // END GAME CLASS

class Preloader{

    constructor(options,textures){
        // Progress Bar
        let progressbarElem = document.querySelector('#progressbar');

        this.manager = new THREE.LoadingManager();

        // Loading the textures
        this.manager.onProgress = (url, itemsLoaded, itemsTotal) => {
            progressbarElem.style.width = `${itemsLoaded / itemsTotal * 100 | 0}%`;
        };

        for( let asset of options.assets){
            let tex = this.loadTexture(asset);
            textures.push(tex);
        }
        this.manager.onLoad = options.onComplete;

    }

    loadTexture(url){
        let textureLoader = new THREE.TextureLoader(this.manager);
        let texture = textureLoader.load(url);
        return texture;
    }
}

class Player{
    
}