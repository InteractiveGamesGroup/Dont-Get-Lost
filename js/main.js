"use strict";

// ######################## Global variables ########################

// Standard three.js requirements.
let canvas,camera, scene, renderer;

// Used to create the Maze
const UNITWIDTH = 90; // Width of a cubes in the maze
const UNITHEIGHT = 200; // Height of the cubes in the maze

// Create cubes variables
let totalCubesWide = 0; // How many cubes wide the maze will be
let collidableObjects = []; // An array of collidable objects used later

// Create Ground variable
let mapSize;    // The width/depth of the maze

/* 
    These variables are used to store our controller and 
    controlsEnabled is used to keep track of the controller state.
*/
let pointerControls;
let pointerControlsEnabled = false;

// HTML elements to be changed
let blocker


/* 
    Player variables.
*/
let player;
let playerHead;
let root ; // player model 
let mixer; // Used for animation
let playerWalk;
let playerIdle;
// Flags to determine which direction the player is moving
let moveForward = false;
let moveBackward = false;
let moveLeft = false;
let moveRight = false;
let preventTPose = true;
// Velocity vector for the player
let playerVelocity = new THREE.Vector3();
let playerRotation = 0;
// How fast the player will move
let PLAYERSPEED = 600.0;

// Used for keeping track of animation
let clock;

// Loading manager
const manager = new THREE.LoadingManager();
manager.onLoad = init;
// Progress Bar
let progressbarElem ;
manager.onProgress = (url, itemsLoaded, itemsTotal) => {
  progressbarElem.style.width = `${itemsLoaded / itemsTotal * 100 | 0}%`;
};

/**
 *  The render function draws the scene.
 */
function render() {
    renderer.render(scene, camera);
}

/*
  This function is used to setup the game.
  i.e load up neccessary models,and variables;
*/
function setupGame(){
  // HTML Element that contains the progress bar
  progressbarElem = document.querySelector('#progressbar');

  // HTML Element that contains the blocker(instructions)
  blocker = document.getElementById('blocker');

  // Load the player model
  loadPlayerModel();
}

/*
  The GLTF file itself (passed into the function as the variable gltf) has two parts to it, 
  the scene inside the file (gltf.scene), and the animations (gltf.animations). 
*/
function loadPlayerModel() {
  

  const modelUrl = 'resources/SoldierModel.gltf'
  function callback(gltf){

    root = gltf.scene;
    root.scale.set( 15, 15, 15 );			   
    root.position.x = 0;				    
    root.position.y = -25;				    
    root.position.z = -20;
    // Add soldier root to scene
    // scene.add(root);
    // camera.add(root);
    
    player = root.getObjectByName("Character");
    playerHead = root.getObjectByName("mixamorigHeadTop_End");
     

    // Animation
    mixer = new THREE.AnimationMixer(root);

    //("Idle" animation) soldier is just idle.
    playerIdle = mixer.clipAction(gltf.animations[0]);
    playerIdle.play();

    // ("Walk" animation) soldier walks but does not change position
    playerWalk = mixer.clipAction(gltf.animations[3]);
      
      
    // Dump soldier model scenegraph
    // console.log(dumpObject(root).join('\n'));
  }


  let loader = new THREE.GLTFLoader(manager);
  try{
      loader.load(modelUrl,callback);
  }catch(e){
      connsole.log(e);
      console.log("Error loading model from " + modelURL);
  }


  // loader.load(
  //   'resources/Soldier.glb',

  //   function(gltf) {
    
  //     soldier = gltf.scene;
  //     soldier.scale.set( 15, 15, 15 );			   
  //     soldier.position.x = 0;				    
  //     soldier.position.y = -25;				    
  //     soldier.position.z = -20;

  //     // soldier = gltf.scene.getObjectByName("Scene");
  //     // console.log(soldier);
      
  //     mixer = new THREE.AnimationMixer(soldier);

  //     // maximum of four animation clips with indices 0,1,2,3

  //     // ("Idle" animation) soldier is just idle.
  //     // let idleAction = mixer.clipAction(gltf.animations[0]);
  //     // idleAction.play();
  //     playerIdle = mixer.clipAction(gltf.animations[0]);
  //     playerIdle.play();
      

  //     // ("Run" animation) soldeir runs but does not change position
  //     //let runAction = mixer.clipAction(gltf.animations[1]);
  //     //runAction.play()

  //     // ("TPose" animation) this is the default animation when no animations are enabled.
  //     //let TposeAction = mixer.clipAction(gltf.animations[2]);
  //     //TposeAction.play()

  //     // ("Walk" animation) soldier walks but does not change position
  //     // let walkAction = mixer.clipAction(gltf.animations[3]);
  //     // walkAction.play();
  //     playerWalk = mixer.clipAction(gltf.animations[3]);
  
  //     // Add soldier to scene
  //     // scene.add(soldier);

  //     // Add soldier to the camera
  //     camera.add(soldier);
      
  //   },

  //   undefined,

  //   function(error) {
  //     console.error(error);
  //   }

  // );
}

/* ---------------------------- CREATE THE WORLD ------------------

/**
 * This function is called by the init() method to create the world. 
 */

function createWorld(){

    // Create the scene where everything will go
    scene = new THREE.Scene();

    //background of the scene
    scene.background = new THREE.Color( '#87ceeb' );

    // Add some fog for effects
    //scene.fog = new THREE.FogExp2(0xcccccc, 0.0030);
    scene.fog = new THREE.Fog( 0xcce0ff);

    // ------------------- Set renderer settings ----------------------
    
    renderer.setClearColor(scene.fog.color);
    renderer.shadowMap.enabled = true;
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);

    // ------------------- Set Camera settings ----------------------
    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 2000);
    camera.position.x = 0;
    camera.position.y = 30; // Height the camera will be looking from
    camera.position.z = 70; 

    // ------------------- Set Global scene Light settings ----------------------
    addLights();

    //------------------- Create the scene's visible objects ----------------------

    // Add the walls(cubes) of the maze
    createMazeCubes();
    createGround();
    createPerimWalls();


    // add player to the world
    // scene.add(root);
    camera.add(root);

    
    //------------------- Extra functionalities ----------------------

    // Listen for if the window changes sizes and adjust
    window.addEventListener('resize', onWindowResize, false);

}

/* ---------------------------- CREATEWORLD() HELPER FUNCTIONS ------------------

/*
    These functions allow us to easily convert between degrees and radians.
*/
function degreesToRadians(degrees) {
    return degrees * Math.PI / 180;
}
function radiansToDegrees(radians) {
    return radians * 180 / Math.PI;
}
/*
    This function is called whenever our event listener hears that a resize event was fired. 
    This happens whenever the user adjusts the size of the window. 
    If this happens, we want to make sure that the image stays proportional 
    and can be seen in the entire window.
*/
function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
  
    renderer.setSize(window.innerWidth, window.innerHeight);
}

/*
This function is a simple function that groups the 
creation of our lights and adds them to the scene.
*/
function addLights() {
    let lightOne = new THREE.DirectionalLight(0xffffff,3);
    lightOne.position.set(200, 200, 200);
    lightOne.castShadow = true;
    
    lightOne.shadow.mapSize.width = 1024;
    lightOne.shadow.mapSize.height = 512;
      
    lightOne.shadow.camera.near = 100;
		lightOne.shadow.camera.far = 1200;
    scene.add(lightOne);

    // Add a second light with half the intensity
    let lightTwo = new THREE.DirectionalLight(0xffffff, .5);
    lightTwo.position.set(1, -1, -1);
    lightTwo.castShadow = true;
    scene.add(lightTwo);
}

/*
    This function allows us to place 1’s where cubes are and 0’s where empty space is.
*/
function createMazeCubes() {
    // Maze wall mapping, assuming even square
    // 1's are cubes, 0's are empty space
    let map = [
      [0, 0, 1, 0, 1, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 0, ],
      [0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 0, ],
      [0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 1, 1, 1, 1, 1, 0, 1, 1, 0, 0, ],
      [0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, ],
      [0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, ],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, ],
      [1, 1, 1, 0, 1, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, ],
      [0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 1, 0, 1, 0, 0, 1, 0, 0, 0, 0, ],
      [0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, ],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, ],
      [0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 1, 0, 1, ],
      [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 1, 0, 0, ],
      [0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 1, 0, 1, 0, 1, 0, 0, 1, 1, 1, ],
      [0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, ],
      [0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 1, 1, 1, 0, 1, 0, 0, 0, 0, 0, ],
      [1, 1, 1, 0, 1, 1, 1, 1, 0, 1, 0, 1, 1, 0, 1, 0, 0, 0, 0, 0, ],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, ],
      [1, 1, 1, 0, 0, 0, 0, 0, 0, 1, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, ],
      [0, 0, 1, 0, 1, 1, 1, 1, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, ],
      [0, 0, 1, 1, 1, 0, 0, 0, 0, 1, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, ]
    ];
  
    // wall details
    let cubeGeo = new THREE.BoxGeometry(UNITWIDTH, UNITHEIGHT, UNITWIDTH);
    // let cubeMat = new THREE.MeshPhongMaterial({
    //   color: 0xff0000,
    // });
   //Here we are loading a texture
   let texture = new THREE.TextureLoader().load( 'textures/wall.jpg' );

   //Immediately use the texture for material creation
   let cubeMat = new THREE.MeshBasicMaterial( { map: texture } );
 
    // Keep cubes within boundry walls
    let widthOffset = UNITWIDTH / 2;
    // Put the bottom of the cube at y = 0
    let heightOffset = UNITHEIGHT / 2;
    
    // See how wide the map is by seeing how long the first array is
    totalCubesWide = map[0].length;
  
    // Place walls where 1`s are
    for (let i = 0; i < totalCubesWide; i++) {
      for (let j = 0; j < map[i].length; j++) {
        // If a 1 is found, add a cube at the corresponding position
        if (map[i][j]) {
          // Make the cube
          let cube = new THREE.Mesh(cubeGeo, cubeMat);
          // Set the cube position
          cube.position.z = (i - totalCubesWide / 2) * UNITWIDTH + widthOffset;
          cube.position.y = heightOffset;
          cube.position.x = (j - totalCubesWide / 2) * UNITWIDTH + widthOffset;
          // Add the cube
          scene.add(cube);
          // Used later for collision detection
          collidableObjects.push(cube);
        }
      }
    }
      // The size of the maze will be how many cubes wide the array is * the width of a cube
      mapSize = totalCubesWide * UNITWIDTH;
  }

/*
    This function allows us to use the calculated mapSize variable 
    to set the dimensions of the ground plane.
*/
function createGround() {
    // Create ground geometry and material
    // let groundGeo = new THREE.PlaneGeometry(mapSize, mapSize);
    // let groundMat = new THREE.MeshPhongMaterial({ color: 0xA0522D, side: THREE.DoubleSide});
   
    let groundTex = new THREE.TextureLoader().load( "textures/grasslight-big.jpg" );
	  let groundGeo = new THREE.PlaneBufferGeometry( mapSize, mapSize );
		let groundMat = new THREE.MeshPhongMaterial( { color: 0xffffff, map: groundTex } );

    let ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = degreesToRadians(-90);
    ground.position.set(0, 1, 0);
    ground.material.map.repeat.set( 10,10 );
		ground.material.map.wrapS = THREE.RepeatWrapping;
		ground.material.map.wrapT = THREE.RepeatWrapping;
		ground.material.map.encoding = THREE.sRGBEncoding;
	
		// note that because the ground does not cast a shadow, .castShadow is left false
		ground.receiveShadow = true;
//     ground.position.set(0, 1, 0);
//     // Rotate the place to ground level
//     ground.rotation.x = degreesToRadians(-90);
//     ground.receiveShadow = true;
    scene.add(ground);

}

/*
    This function allows us to add perimeter walls to box everything in.
    It uses a loop to make two planes (our walls) at a time, 
    using the mapSize variable we calculated in createGround() to determine how wide they should be.
*/
function createPerimWalls() {
    let halfMap = mapSize / 2;  // Half the size of the map
    let sign = 1;               // Used to make an amount positive or negative

    // Loop through twice, making two perimeter walls at a time
    for (let i = 0; i < 2; i++) {
        let perimGeo = new THREE.PlaneGeometry(mapSize, UNITHEIGHT);
        // Make the material double sided
        let perimMat = new THREE.MeshPhongMaterial({ color: 0x464646, side: THREE.DoubleSide });
        // Make two walls
        let perimWallLR = new THREE.Mesh(perimGeo, perimMat);
        let perimWallFB = new THREE.Mesh(perimGeo, perimMat);

        // Create left/right wall
        perimWallLR.position.set(halfMap * sign, UNITHEIGHT / 2, 0);
        perimWallLR.rotation.y = degreesToRadians(90);
        scene.add(perimWallLR);
        // Used later for collision detection
        collidableObjects.push(perimWallLR);
        // Create front/back wall
        perimWallFB.position.set(0, UNITHEIGHT / 2, halfMap * sign);
        scene.add(perimWallFB);

        // Used later for collision detection
        collidableObjects.push(perimWallFB);

        sign = -1; // Swap to negative value
    }
}

/* ---------------------------- MOUSE(CONTROLL) AND ANIMATION SUPPORT ------------------

/*
    This function will also call the render() function. 
    The requestAnimationFrame() function is used to constantly update our renderer. 
*/
function animate() {

    render();
    // Keep updating the renderer
    requestAnimationFrame(animate);
    // // Get the change in time between frames
    let delta = clock.getDelta();

    // // Enable animation of the player
    if (mixer) {
      mixer.update(delta);
    }

    // Moves the player i.e the camera
    movePlayer(delta);

}
/*

*/
function movePlayer(delta) {
    // Gradual slowdown
    playerVelocity.x -= playerVelocity.x * 10.0 * delta;
    playerVelocity.z -= playerVelocity.z * 10.0 * delta;
  
    if (moveForward) {
      playerVelocity.z -= PLAYERSPEED * delta;
      // playerIdle.stop();
      playerWalk.play();
      //soldier.translateZ -= PLAYERSPEED * delta;
    } 
    if (moveBackward) {
      playerVelocity.z += PLAYERSPEED * delta;
      // playerIdle.stop();
      playerWalk.play();
    } 
    if (moveLeft) {
      playerVelocity.x -= PLAYERSPEED * delta;
      // playerRotation += PLAYERSPEED/10 * delta;
      // playerIdle.stop();
      playerWalk.play();
      //soldier.translateX -= PLAYERSPEED * delta;
    } 
    if (moveRight) {
      playerVelocity.x += PLAYERSPEED * delta;
      // playerIdle.stop();
      playerWalk.play();
    }
    if( !( moveForward || moveBackward || moveLeft || moveRight)) {
      // No movement key being pressed. Stop movememnt
      playerVelocity.x = 0;
      playerVelocity.z = 0;
      
      // Stop player from walking
      playerWalk.stop();
      playerIdle.play();
    }

    // if(!(moveLeft || moveRight)){
    //   // No left/right movement detected. Stop Movement.
    //   playerRotation = 0;
    // }
    pointerControls.getObject().translateX(playerVelocity.x * delta);
    pointerControls.getObject().translateZ(playerVelocity.z * delta);
    // pointerControls.getObject().rotateY(playerRotation * delta);
    // player.rotateZ(playerRotation * delta);

    // player.translateX(playerVelocity.x * delta);
    // player.translateZ(playerVelocity.z * delta);
  }

/*
    The game uses THREE.PointerLockControls to let the user freely 
    move around the scene generated in the game.
*/

function installPointerLockControls(){
    
    pointerControls = new THREE.PointerLockControls(camera);
    scene.add(pointerControls.getObject());
    // player.add(pointerControls.getObject());
    
}

/*
    This function listens for when a mouse click happens. 
    After the click, our rendered game (in the container element) tries to get control of the mouse.
*/
function getPointerLock() {
    document.onclick = function () {
      canvas.requestPointerLock();
    }
    document.addEventListener('pointerlockchange', lockChange, false); 
}

/*
    This function needs to either disable or enable the controls and blocker element. 
*/
function lockChange() {
    // Turn on controls
    if (document.pointerLockElement === canvas) {
        // Hide blocker and instructions
        blocker.style.display = "none";
        pointerControls.enabled = true;
    // Turn off the controls
    } else {
        // Display the blocker and instruction
        blocker.style.display = "";
        pointerControls.enabled = false;
    }
}

/*
    This function is what will be flipping our direction states. 
*/
function listenForPlayerMovement() {
    
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
      default:
        prevent = false;
    }
  };

  // Add event listeners for when movement keys are pressed and released
  document.addEventListener('keydown', onKeyDown, false);
  document.addEventListener('keyup', onKeyUp, false);
}

/*----------------------------- INITIALIZATION ----------------------------------------

/**
 *  This function is called by the loading manager so it will run after the
 *  models have loaded.  It creates the renderer, canvas, and scene objects,
 *  calls createWorld() to add objects to the scene, and renders the
 *  initial view of the scene.  If an error occurs, it is reported.
 */
function init(){
  // Hide the loading bar
  const loadingElem = document.querySelector('#loading');
  loadingElem.style.display = 'none';

    try{
        canvas = document.getElementById("glcanvas");
        // Set render settings
        renderer = new THREE.WebGLRenderer({
            canvas: canvas,
            antialias: true,
            alpha:false
        });
        
    }catch(e){
        document.getElementById("message").innerHTML="<b>Sorry, an error occurred:<br>" +
                e + "</b>";
        return;
    }

    clock = new THREE.Clock();
    listenForPlayerMovement();


    getPointerLock();
    createWorld();
    installPointerLockControls();
    animate();
}


/*----------------------------- SOME HELPER FUNCTIONS ----------------------------------------*/

/*
    This function helps to dump a scene graph of an object onto the console.
*/
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
