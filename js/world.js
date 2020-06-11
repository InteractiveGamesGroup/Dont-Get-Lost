
// VARIABLES USED TO MOVE PLAYER
// Velocity vector for the player
let playerVelocity = new THREE.Vector3();
let playerRotation = 0;
// How fast the player will move
let PLAYERSPEED = 900.0;

const PLAYERCOLLISIONDISTANCE = 35; //distance of collision of the player from object


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
      // this.clock = new THREE.Clock(false);
      // ------------------- Load assets(models, textures etc.) ----------------------
      const world = this;
      this.textures = {
          inner_wall: { url:'/assets/textures/wall.jpg'},
          outer_wall: { url:'/assets/textures/wall.jpg'},
          grass: {url:'/assets/textures/grass.jpg'}
      }
      this.models = {
          soldier: {url:'/assets/models/SoldierModel.gltf'}
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

      // ------------------- Create the player ----------------------
      this.player;
      this.collidableObjects = []; // An array of collidable objects

      // ------------------- Game Counter ----------------------
      this.counter = 0;
      this.timeLeft = 300;

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
      // this.scene.fog = new THREE.FogExp2(0xcccccc, 0.0030);
      this.scene.fog = new THREE.Fog( 0xcce0ff);
      // ------------------- Set Camera settings ----------------------
      this.camera = new Camera();

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
      // Second Ambience light
      let ambienceLight = new THREE.AmbientLight( 0x404040 ); // soft white light
      this.scene.add( ambienceLight  );

      // ------------------- Create World ----------------------
      const world = this;
      // Create the world
      world.createMazeCubes();
      world.createGround();
      world.createPerimWalls();

      // Create the player
      this.player = new Player("Soldier",world.models.soldier);
      // this.player.addComponent(world.camera.returnObject());
      world.scene.add(this.player.returnObject());
      this.player.listenForMovement();
      // Play idle clip when game begins
      this.player.clipActions.Idle.play();

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
    // world.installPointerLock();
    // world.createPointerLockControls();
    // world.installPointerLockControls();
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
      playerPos.y += 70;      
      world.controls.target.set( playerPos.x, playerPos.y, playerPos.z );
      world.controls.update();


      // // Enable animation of the player
      player.updateClip(delta);

      // Detect collision
      this.movePlayer(delta);
        // playerVelocity.x -= playerVelocity.x * 10.0 * delta;
        // playerVelocity.z -= playerVelocity.z * 10.0 * delta;
          
        // if (player.moveDirection.FORWARD) {
        //   playerVelocity.z -= PLAYERSPEED * delta;
        //   player.clipActions.Walk.play();
        // } 
        // if (player.moveDirection.BACKWARD) {
        //   playerVelocity.z += PLAYERSPEED * delta;
        //   player.clipActions.Walk.play();
        // } 
        // if (player.moveDirection.LEFT) {
        //   // playerVelocity.x -= PLAYERSPEED * delta;
        //   player.gameObject.rotateY(PLAYERSPEED/200 * delta);
        //   // player.clipActions.Walk.play();
        // } 
        // if (player.moveDirection.RIGHT) {
        //   // playerVelocity.x += PLAYERSPEED * delta;
        //   player.gameObject.rotateY(-(PLAYERSPEED/200 * delta) );
        //   player.clipActions.Walk.play();

        // }
        // if( !( player.moveDirection.FORWARD|| player.moveDirection.BACKWARD 
        //   || player.moveDirection.LEFT || player.moveDirection.RIGHT)) {
        //   // No movement key being pressed. Stop movememnt
        //   playerVelocity.x = 0;
        //   playerVelocity.z = 0;
        //   player.clipActions.Walk.stop();
        // }

        // player.gameObject.translateX(playerVelocity.x * delta);
        // player.gameObject.translateZ(playerVelocity.z * delta);
        // world.controls.getObject().translateX(playerVelocity.x * delta);
        // world.controls.getObject().translateZ(playerVelocity.z * delta);
      
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
          perimWallFB.position.set(0, this.UNITHEIGHT / 2, halfMap * sign);
          this.scene.add(perimWallFB);
  
          sign = -1; // Swap to negative value
      }
  }

  addMouseControl(){
    const player = this.player.returnObject();
    const camera = this.camera.returnObject();
    const world = this;

    let x = camera.position.x;
    let y = camera.position.y;
    let z = camera.position.z;

    
    document.addEventListener('mousemove', function(event) {
      event.preventDefault();
      
      // console.log(event.movementX);
      // console.log(event.movementY);

      let newX = 2 *event.movementX/window.innerWidth -1;
      let newY = -2 *event.movementY/window.innerHeight +1;

      let temp_point3D = new THREE.Vector3(newX,newY,0);
      

      let viewProjectionInverse = camera.projectionMatrixInverse;
      
      let point3D = temp_point3D.applyMatrix3(viewProjectionInverse);
     

      camera.position.x = point3D.x;
      camera.position.y = point3D.y;
      camera.position.z = point3D.z;
      console.log(point3D.x);
      



    }, false);
  }

  removeMouseControl(){
    const camera = this.camera.returnObject();
    console.log("remove mouse control");
    document.addEventListener( 'mousemove', function(event){
      event.preventDefault();
      camera.rotation.x = 0;
      camera.rotation.y = 0;
      camera.rotation.z = 0;
    }, false );
  }
  
  installPointerLock(){
    const blocker = document.getElementById('blocker');
    const world = this;

    document.onclick = function(){
  
      PL.requestPointerLock(this.canvas,function(){
        console.log("POINTER LOCK");
        blocker.style.display = "none";
        // world.addMouseControl();
        world.startAnimation();
        world.initialiseTimer();

      },function(){
        console.log("POINTER UNLOCK");
        blocker.style.display = "";
        // world.removeMouseControl();
        world.stopAnimation();
      }, function() {
        alert('Error: Pointer Lock request Failed');
      });
  
    }
  }

  createPointerLockControls(){
    const world = this;
    const camera = world.camera.returnObject();
    world.controls = new THREE.PointerLockControls(camera);
    world.scene.add(world.controls.getObject());
  }

  installPointerLockControls(){

    const world = this;

    // Request Pointer Lock
    document.onclick = function () {
      world.canvas.requestPointerLock();
    }

    // if pointer is locked
    document.addEventListener('pointerlockchange', ()=>{

      if (document.pointerLockElement === world.canvas) {
        world.controls.enabled = true;
        console.log("POINTER LOCK");
        blocker.style.display = "none";
        // world.addMouseControl();
        world.startAnimation();
        world.initialiseTimer();
        
      
      } else {
        console.log("POINTER UNLOCK");
        world.controls.enabled = false;
        blocker.style.display = "";
        // world.removeMouseControl();
        world.stopAnimation();
      }

    }, false); 
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

        }else{
          world.stopAnimation();
          world.controls.enabled = false;
          blocker.style.display = "";
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

    // Player velocity
    playerVelocity.x -= playerVelocity.x * 10.0 * delta;
    playerVelocity.z -= playerVelocity.z * 10.0 * delta;

    // Player position
    let playerPos = player.returnObject().position.clone();
    playerPos.y += 60;

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
      player.clipActions.Idle.play();
    }

    // Make Movements
    player.gameObject.translateZ(playerVelocity.z * delta);
    player.gameObject.translateX(playerVelocity.x * delta);

  }

  collisionDetectionOLD(){
    const world = this;
    const player = world.player;

    // Player position
    let playerPos = player.returnObject().position.clone();
    playerPos.y += 60;

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

    // if blocked is false allow player to move forward



    // cast left
    playerDirection.set(-1,0,0);
    playerDirection.applyMatrix4(player.returnObject().matrix);
    playerDirection.normalize();
    let leftRaycaster = new THREE.Raycaster(playerPos, playerDirection);
    let leftIntersects = leftRaycaster.intersectObjects(world.collidableObjects);
    for (var i = 0; i < leftIntersects.length; i++) {
      if (leftIntersects[i].distance < PLAYERCOLLISIONDISTANCE) {
          blocked =  true;
      }
    }

    // cast right
    playerDirection.set(1,0,0);
    playerDirection.applyMatrix4(player.returnObject().matrix);
    playerDirection.normalize();
    let rightRaycaster = new THREE.Raycaster(playerPos, playerDirection);
    let rightIntersects = rightRaycaster.intersectObjects(world.collidableObjects);
    for (var i = 0; i < rightIntersects.length; i++) {
      if (rightIntersects[i].distance < PLAYERCOLLISIONDISTANCE) {
          blocked =  true;
      }
    }
    
    return blocked;
  }

  detectCollision(){

    const world = this;
    const player = world.player;
    const playerObject = player.returnObject();

    //The rotation matrix to apply to our direction vector
    // Undefined by default to indicate ray should coming from front
    var rotationMatrix;
    // Get direction of player
    // let playerDirection = playerObject.getWorldDirection(new THREE.Vector3(0, 0, 0)).clone();
    let playerDirection = new THREE.Vector3();
    playerObject.getWorldDirection(playerDirection);
  
    // Check which direction we're moving
    // Flip matrix to that direction so that we can reposition the ray
    if (player.moveDirection.BACKWARD) {
        console.log("BACK");
        rotationMatrix = new THREE.Matrix4();
        rotationMatrix.makeRotationY(world.degreesToRadians(180));
    }
    else if (player.moveDirection.LEFT) {
        rotationMatrix = new THREE.Matrix4();
        rotationMatrix.makeRotationY(world.degreesToRadians(90));
    }
    else if (player.moveDirection.RIGHT) {
        rotationMatrix = new THREE.Matrix4();
        rotationMatrix.makeRotationY(world.degreesToRadians(270));
    }
  
    // Player is moving forward, no rotation matrix needed
    if (rotationMatrix !== undefined) {
      console.log("FRONT");
      playerDirection.applyMatrix4(rotationMatrix);
    }
  // Apply ray to player camera
  let rayCaster = new THREE.Raycaster(playerObject.position, playerDirection);

  // If our ray hit a collidable object, return true
  if (world.rayIntersect(rayCaster, PLAYERCOLLISIONDISTANCE)) {
      return true;
  } else {
      return false;
  }
  }

  rayIntersect(ray, distance) {
    const world = this;
    let intersects = ray.intersectObjects(world.collidableObjects);

    for (var i = 0; i < intersects.length; i++) {
        if (intersects[i].distance < distance) {
            return true;
        }
    }
    return false;
  }

  initialiseTimer(){

    const world = this;
    const timer = document.getElementById("timer");
    const gameOver = document.getElementById("game-over");

    const timeinterval = setInterval(()=>{

      world.counter++;
      let time = convertSeconds(world.timeLeft - world.counter);

      if(time === 0 + "m" + ' ' + 0 + "s"){
        clearInterval(timeinterval);
        timer.innerHTML = "Timer: " + "0m 0s";
        this.stopAnimation();
        gameOver.style.display = "";
        this.restartGame();
      }else{
        timer.innerHTML = "Timer: "+time;
      }

    },1000);
  }

}

function convertSeconds(seconds) {

  let min = Math.floor(seconds / 60);
  let sec = seconds % 60;
  return min + "m" + ' ' + sec + "s";

}