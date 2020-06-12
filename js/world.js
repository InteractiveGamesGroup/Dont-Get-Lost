
// Velocity vector for the player
let playerVelocity = new THREE.Vector3();
// How fast the player will move
let PLAYERSPEED = 900.0;
// Distance of collision of the player from object
const PLAYERCOLLISIONDISTANCE = 35; 


class World {
  constructor() {
      // ######################## Global variables ########################
      // Standard THREE.js variables
      this.canvas;
      this.scene;
      this.camera;
      this.renderer;
      this.clock = new THREE.Clock();
      this.paused = false;
      this.controls;
      // ------------------- Load assets(models, textures etc.) ----------------------
      const world = this;
      this.textures = {
          inner_wall: { url:'/assets/textures/wall.jpg'},
          outer_wall: { url:'/assets/textures/wall.jpg'},
          grass: {url:'/assets/textures/grass.jpg'},
          wood: {url: '/assets/textures/wood.jpg'},
          window: {url: '/assets/textures/window.png'}
      }
      this.models = {
          soldier: {url:'/assets/models/SoldierModel.gltf'},
          door: {url:'/assets/models/WoodenDoor.gltf'}
      }
      const options ={
        onComplete: function () {
            world.init();
            world.animate();
        }
      }
      // Dont show Blocker
      const blocker = document.getElementById('blocker');
      blocker.style.display = "none";
      // Dont show hameOver
      const gameOver = document.getElementById('game-over');
      gameOver.style.display = "none";
      // Loader used to load assets before game begins
      const preloader = new Preloader(world.textures,world.models,options);

      // ------------------- Map variables ----------------------
      this.UNITWIDTH = 90; // Width of a cubes in the maze
      this.UNITHEIGHT = 200; // Height of the cubes in the maze
      this.totalCubesWide = 0; // How many cubes wide the maze will be
      this.mapSize;    // The width/depth of the maze

      // Setup door
      this.door = {} // Empty door object

      // ------------------- Create the player ----------------------
      this.player;
      this.collidablePlayer = [];
      this.collidableObjects = []; // An array of collidable objects

      // ------------------- Game Counter ----------------------
      this.counter = 0;
      this.timeLeft = 300;
      this.timeinterval;
      this.time;

      // ------------------- Switch cameras ----------------------
      this.cameraModes = {
        Near: false,
        Back: true,
        Wide: false
      };

  }

  init(){
      console.log("INITIALISING");
      // hide the loading bar
      const loadingElem = document.querySelector('#loading');
      loadingElem.style.display = 'none';
      

      // ------------------- Set Scene settings ----------------------
      // Create the scene where everything will go
      this.scene = new THREE.Scene();
      //background of the scene  
      this.scene.background = new THREE.Color( '#87ceeb' );
      // Add some fog for effects
      this.scene.fog = new THREE.FogExp2(0xcccccc, 0.002);
      // this.scene.fog = new THREE.FogExp2(0xcccccc, 0.0030);
      // this.scene.fog = new THREE.Fog( 0xcce0ff);
      // ------------------- Set Camera settings ----------------------
      this.camera = new Camera();
      
      // ------------------- Set Global scene Light settings ----------------------
      // Add sunlight to the scene 
      let sunLight = new THREE.DirectionalLight(0xffffff,0.5);
      sunLight.castShadow = true;
      sunLight.position.set(900, 750, 800);
      sunLight.target.position.set(0,30, 70);
      sunLight.shadow.camera.near = 50;
      sunLight.shadow.camera.far = 2000;
      sunLight.shadow.camera.right = 1050;
      sunLight.shadow.camera.left = -1050;
      sunLight.shadow.camera.bottom = -350;
      sunLight.shadow.camera.top = 300;
      this.scene.add(sunLight);
      this.scene.add(sunLight.target);
      sunLight.target.updateMatrixWorld();
      sunLight.shadow.camera.updateProjectionMatrix();
      // Light Helper
      // let helper = new THREE.DirectionalLightHelper( sunLight, 5 );
      // this.scene.add( helper );
      // //Create a helper for the shadow camera (optional)
      // let shadowHelper = new THREE.CameraHelper( sunLight.shadow.camera );
      // this.scene.add( shadowHelper );
      // Second Ambience light
      let ambienceLight = new THREE.AmbientLight( 0x404040 ); // soft white light
      this.scene.add( ambienceLight  );

      // ------------------- Create World ----------------------
      const world = this;
      // Create the world
      world.createMazeCubes();
      world.createGround();
      world.createPerimWalls();

      // ------------------- Create Player ----------------------
      this.player = new Player("Soldier",world.models.soldier);
      world.scene.add(this.player.returnObject());
      this.player.listenForMovement();

      // Dump player object
      // console.log(dumpObject(world.player.root).join('\n'));

      // Play idle clip when game begins
      this.player.clipActions.Idle.play();

      // Switch cameras functionality
      this.switchCamera();

      // ------------------- Setup End Game functionality ----------------------
      // Add player to collidable playerwa
      world.collidablePlayer.push(world.player.returnObject());
      // Setup Wooden door
      world.setupDoor("Wooden Door",world.models.door);
      // Collidable objects
      world.collidableObjects.push(world.door.doorMesh)
      world.scene.add(world.door.object);

      // ------------------- Renderer and Canvas ----------------------
      this.canvas = document.getElementById("glcanvas");
      this.renderer = new THREE.WebGLRenderer({
        canvas: this.canvas,
        antialias: true,
        alpha:false
    });
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.setSize(window.innerWidth,window.innerHeight);

    // Make Controls
    world.createOrbitControls();

    // Add game pausing listener
    world.pauseGame();
    

    // Listen for if the window changes sizes and adjust
    window.addEventListener('resize', function(){
      console.log("RESIZE!!");
      world.camera.returnObject().aspect = window.innerWidth / window.innerHeight;
      world.camera.returnObject().updateProjectionMatrix();
      world.renderer.setSize(window.innerWidth,window.innerHeight);

    }, false);

    console.log("DONE INITIALISING");
  };

  animate(){
      const world = this;
      const player = world.player;
      const camera = world.camera.returnObject();
      requestAnimationFrame( function(){ world.animate(); } );
      
      let delta = this.clock.getDelta();

      //Controls look at the player
      const playerClone = player.returnObject().clone();
      let playerPos = playerClone.position;
      playerPos.y += 80; 
      world.controls.target.set( playerPos.x, playerPos.y, playerPos.z );
      // world.controls.target.set( 900, 600, 800);
      // world.controls.target.set( -850, 100, -900 );
      world.controls.update();

      // Enable animation of the player
      player.updateClip(delta);

      // Animate/render the wooden door
      world.door.mixer.update(delta);

      // Detect collision
      world.movePlayer(delta);

      // Endgame
      world.endGame();

      this.renderer.render( world.scene, world.camera.returnObject() );

  }

  startAnimation(){
    const world = this;

    if(this.paused){
      this.paused = false;
      this.clock.start();
      requestAnimationFrame(function(){ world.animate(); });
    }
  }

  stopAnimation(){
    this.paused = true;
    this.clock.stop();
  }

  degreesToRadians(degrees) {
      return degrees * Math.PI / 180;
  }

  createMazeCubes() {
      console.log("CREATE MAZE CUBES");
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

      // Wall texture
      let interior_wall = this.textures.inner_wall.text;

      //Immediately use the texture for material creation
      // let cubeMat = new THREE.MeshBasicMaterial( { map: interior_wall } );
      let cubeMat = new THREE.MeshPhongMaterial( { map: interior_wall } );
  
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
            this.collidableObjects.push(cube);
          }
        }
      }
    // The size of the maze will be how many cubes wide the array is * the width of a cube
    this.mapSize = this.totalCubesWide * this.UNITWIDTH;
  }

  createGround() {
      console.log("CREATE GROUND");
    
      // Grass Texture
      let grass = this.textures.grass.text;
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
      this.scene.add(ground);      

  }

  createPerimWalls() {
      console.log("CREATE PERIMATER WALLS");
      let halfMap = this.mapSize / 2;  // Half the size of the map
      let sign = 1;               // Used to make an amount positive or negative
  
      // Loop through twice, making two perimeter walls at a time
      for (let i = 0; i < 2; i++) {
          let perimGeo = new THREE.PlaneGeometry(this.mapSize, this.UNITHEIGHT);

          // Wall texture
          let outer_wall = this.textures.outer_wall.text;
          // Make the material double sided
          let perimMat = new THREE.MeshBasicMaterial({ map:outer_wall, side: THREE.DoubleSide });
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
          // Used for collision detection
          this.collidableObjects.push(perimWallLR);
          this.collidableObjects.push(perimWallFB);

          // Create front/back wall
          if (i == 1 ) {
            perimWallFB.position.set(this.UNITWIDTH, this.UNITHEIGHT / 2, halfMap * sign);
            this.scene.add(perimWallFB);
          }
          else {
            perimWallFB.position.set(0, this.UNITHEIGHT / 2, halfMap * sign);
            this.scene.add(perimWallFB);
          }
  
          sign = -1; // Swap to negative value
      }
  }

  setupDoor(name,model){

    const world = this;

    // Name
    world.door.name = name;

    // ------------------- Door holder object ----------------------
    world.door.object = new THREE.Object3D();
    world.door.object.position.x = -855;
    world.door.object.position.y = 0;
    world.door.object.position.z = -905;

    // ------------------- Set Door ----------------------
    const root = model.gltf.scene;
    root.scale.set( 100, 90, 50);
    world.door.object.add(root);

    // Dump Door scene onto console
    // console.log(dumpObject(root).join('\n'));
    // ------------------- Animation ----------------------
    world.door.mixer = new THREE.AnimationMixer(root);
    world.door.animations = {};
    world.door.clipActions = {};

   

    // ------------------- Prepare clip animations ----------------------
    model.gltf.animations.forEach( (clip)=>{
      world.door.animations[clip.name] = clip;
    });
    Object.values(world.door.animations).forEach( (clip)=>{
      world.door.clipActions[clip.name] = world.door.mixer.clipAction(clip);
      // Only play once
      world.door.clipActions[clip.name].loop = THREE.LoopOnce;
    })

    // ------------------- Set Texures ----------------------
    // Textures
    let wood = this.textures.wood.text;
    let glass = this.textures.window.text;

    // Meshes
    world.door.doorMesh = root.getObjectByName('Cube.022_1');
    let windowMesh = root.getObjectByName('Cube.022_0');
    let knockerMesh = root.getObjectByName('WoodenKnocker');
    let doorHandleMesh = root.getObjectByName('Plane.023_0');
    
    // Materials
    world.door.doorMesh.material =  new THREE.MeshBasicMaterial({ map: wood, side: THREE.DoubleSide });
    windowMesh.material =  new THREE.MeshBasicMaterial( { map: glass, side: THREE.DoubleSide } );
    knockerMesh.material = new THREE.MeshBasicMaterial( { map: wood, side: THREE.DoubleSide  } );
    doorHandleMesh.material = new THREE.MeshBasicMaterial( { color:"black" } );

    // Door collision
    this.doorCollide()
  }

  doorCollide(){

    const world = this;
    // ------------------- Door collision ----------------------
    let collide = false;
    let doorPos = world.door.object.position.clone();
    doorPos.y += 60;
    // Door direction
    let doorDir = new THREE.Vector3();
    world.door.object.getWorldDirection(doorDir);
    doorDir.normalize();

    // console.log(doorDir);
    // Create a new Raycaster;
    let raycaster = new THREE.Raycaster(doorPos, doorDir);
    let intersects = raycaster.intersectObjects(world.collidablePlayer);
    // Check collision
    if (intersects.length>0) {
      if (intersects[0].distance < PLAYERCOLLISIONDISTANCE) {
          collide =  true;
          console.log("COLLISION!!!");
      }
    }
    
  }

  createOrbitControls(){

    // Objects
    const world = this;
    const camera = world.camera.returnObject();
    const player = world.player;

    // Create orbital controls
    world.controls = new THREE.OrbitControls( camera, world.renderer.domElement );

    // Controls settings
    world.controls.enableDamping = false; // an animation loop is required when either damping or auto-rotation are enabled
    world.controls.dampingFactor = 0.05;
    world.controls.screenSpacePanning = false;
    world.controls.minDistance = 50;
    world.controls.maxDistance = 80;
    world.controls.maxPolarAngle = Math.PI / 2;
  }

  countDownTimer(){
  
    if(time === 0 + "m" + ' ' + 0 + "s") {
      clearTimeout(output)
      document.getElementById("timer").innerHTML = "Timer: " + "0m 0s";
      world.endGame()
    }
    else {
      document.getElementById("timer").innerHTML = "Timer: " + time;
    }
  }

  pauseGame(){
    const world = this;
    const blocker = document.getElementById('blocker');

    document.addEventListener('keydown',(event)=>{
      
      // escape button
      if(event.keyCode == 27){

        if(world.paused){
         world.startAnimation();
         world.controls.enabled = true;
         blocker.style.display = "none";
        //  resume timer
        world.initialiseTimer();

        }else{
          world.stopAnimation();
          world.controls.enabled = false;
          blocker.style.display = "";
          world.pauseTimer();
        }
      }

    },false);
  }

  restartGame(){

    document.addEventListener('keydown',(event)=>{
      if(event.keyCode == 13) {
        location.reload()
      }
    });

  }

  //  This function incorporates collision detetction and player movement
  movePlayer(delta){

    const world = this;
    const player = world.player;
    //const door = world.door;

    

    // Player velocity
    playerVelocity.x -= playerVelocity.x * 10.0 * delta;
    playerVelocity.z -= playerVelocity.z * 10.0 * delta;

    // Player position
    let playerPos = player.returnObject().position.clone();
    playerPos.y += 70;

    // //Door Position
    // let doorPos = world.door.object.position.clone();
    // doorPos.y += 60;



    // if(doorPos.distanceTo(playerPos)<PLAYERCOLLISIONDISTANCE/2){
    //   world.door.clipActions.HingesWings.Movable.ArmatureAction.play();
    // }
    


    // Player direction
    let playerDirection = new THREE.Vector3();
    player.returnObject().getWorldDirection(playerDirection);

    // If player is moving forwards 
    if(player.moveDirection.FORWARD) playerDirection.negate();

    // Create a new Raycaster;
    let raycaster = new THREE.Raycaster(playerPos, playerDirection);

    // blocked variable
    let blocked = false;

    let intersects = raycaster.intersectObjects(world.collidableObjects);
    if (intersects.length>0) {
      if (intersects[0].distance < PLAYERCOLLISIONDISTANCE) {
          blocked =  true;
      }
    }

    if (!world.paused && !blocked && player.moveDirection.FORWARD) {
      playerVelocity.z -= PLAYERSPEED * delta;
      player.clipActions.Walk.play();
     
    }
    if (!world.paused && !blocked && player.moveDirection.BACKWARD) {
      playerVelocity.z += PLAYERSPEED * delta;
      player.clipActions.Walk.play();
    } 
    //Player run
    if (!world.paused && !blocked && player.run == true && player.moveDirection.FORWARD) {
      playerVelocity.z -= PLAYERSPEED * delta;
      player.clipActions.Run.play();
    }
    if (!world.paused && !blocked && player.run == true && player.moveDirection.BACKWARD) {
      playerVelocity.z += PLAYERSPEED * delta;
      player.clipActions.Run.play();
    }
  
  
    // cast left
    playerDirection.set(-1,0,0);
    playerDirection.applyMatrix4(player.returnObject().matrix);
    playerDirection.normalize();
    raycaster = new THREE.Raycaster(playerPos, playerDirection);
    intersects = raycaster.intersectObjects(world.collidableObjects);
    if (intersects.length>0) {
      if (intersects[0].distance < PLAYERCOLLISIONDISTANCE) {
          blocked =  true;
      }
    }
    if (!world.paused && !blocked && player.moveDirection.LEFT) {
      player.gameObject.rotateY(PLAYERSPEED/200 * delta);
    } 

    // cast right
    playerDirection.set(1,0,0);
    playerDirection.applyMatrix4(player.returnObject().matrix);
    playerDirection.normalize();
    let rightRaycaster = new THREE.Raycaster(playerPos, playerDirection);
    let rightIntersects = rightRaycaster.intersectObjects(world.collidableObjects);
    if (rightIntersects.length>0) {
      if (rightIntersects[0].distance < PLAYERCOLLISIONDISTANCE) {
          blocked =  true;
      }
    }
    if (player.moveDirection.RIGHT) {
      player.gameObject.rotateY(-(PLAYERSPEED/200 * delta) );
    }


    // No movement
    if( !( player.moveDirection.FORWARD|| player.moveDirection.BACKWARD 
      || player.moveDirection.LEFT || player.moveDirection.RIGHT)) {
      // No movement key being pressed. Stop movememnt
      playerVelocity.x = 0;
      playerVelocity.z = 0;
      player.clipActions.Walk.stop();
      player.clipActions.Run.stop();
      player.clipActions.Idle.play();
    }

    // Make Movements
    player.gameObject.translateZ(playerVelocity.z * delta);
    player.gameObject.translateX(playerVelocity.x * delta);

  }

  endGame(){
    const player = world.player;
    const door = world.door;

    let playerPos = player.returnObject().position.clone();
    let doorPos = door.object.position.clone();

    let distanceLeft = doorPos.distanceTo(playerPos);

    if(distanceLeft<100){
      door.clipActions["HingesWings.Movable.ArmatureAction"].play();
     if(distanceLeft<30){
        world.stopAnimation();
        world.controls.enabled = false;
        world.pauseTimer();
      }
      
    }

  }

  initialiseTimer(){

    const world = this;
    const timer = document.getElementById("timer");
    const gameOver = document.getElementById("game-over");

    world.timeinterval = setInterval( ()=>{

      world.counter++;
      world.time = convertSeconds(world.timeLeft - world.counter);

      if(world.time === 0 + "m" + ' ' + 0 + "s"){
        clearInterval(world.timeinterval);
        timer.innerHTML = "Timer: " + "0m 0s";
        this.stopAnimation();
        gameOver.style.display = "";
        this.restartGame();
      }else{
        timer.innerHTML = "Timer: "+world.time;
      }

    },1000);
  }

  pauseTimer(){
    const world = this;
    const timer = document.getElementById("timer");
    // Stop Time
    clearInterval(world.timeinterval);
    // Show time left
    timer.innerHTML = "Timer: "+world.time;
  }

  switchCamera(){

    const world = this;
    const camera = world.camera.returnObject();
    const player = world.player;

    const playerClone = player.returnObject().clone();
    let playerPos = playerClone.position;

    document.addEventListener('keydown',(event)=>{
      if(event.keyCode == 81) {

        // Check current camera
        if(world.cameraModes.Back){
          // Switch to wide
          world.cameraModes.Wide = true;
          world.cameraModes.Back = false;
          world.controls.minDistance = 140;
          world.controls.maxDistance = 150;
          world.controls.update();
        }
        else if(world.cameraModes.Wide){
          // Switch camera to back
          world.cameraModes.Wide = false;
          world.cameraModes.Back = true;
          world.controls.minDistance = 50;
          world.controls.maxDistance = 80;
          world.controls.update();
        }
      }
    });
  }

}

// Convert
function convertSeconds(seconds) {

  let min = Math.floor(seconds / 60);
  let sec = seconds % 60;
  return min + "m" + ' ' + sec + "s";

}


// This function helps to dump a scene graph of an object onto the console.
function dumpObject(obj, lines = [], isLast = true, prefix = '') {
  const localPrefix = isLast ? '└─' : '├─';
  lines.push(`${prefix}${prefix ? localPrefix : ''}${obj.name || '*no-name*'} [${obj.type}]`);
  const newPrefix = prefix + (isLast ? '  ' : '│ ');
  const lastNdx = obj.children.length - 1;
  obj.children.forEach((child, ndx) => {
  const isLast = ndx === lastNdx;
  dumpObject(child, lines, isLast, newPrefix);
  });
  return lines;
}