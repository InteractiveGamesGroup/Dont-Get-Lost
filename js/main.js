
// ######################## Global variables ########################

let UNITWIDTH = 90; // Width of a cubes in the maze
let UNITHEIGHT = 45; // Height of the cubes in the maze

let camera, scene, renderer;

// Create cubes variables
let totalCubesWide = 0; // How many cubes wide the maze will be
let collidableObjects = []; // An array of collidable objects used later

// Create Ground variable
let mapSize;    // The width/depth of the maze

/* 
    The controls is used to store our controller and 
    is used controlsEnabled to keep track of the controller state.
*/
let controls;
let controlsEnabled = false;

// HTML elements to be changed
let blocker = document.getElementById('blocker');

/* 
    These variables are used for the player movement
*/


// Flags to determine which direction the player is moving
let moveForward = false;
let moveBackward = false;
let moveLeft = false;
let moveRight = false;

// Velocity vector for the player
let playerVelocity = new THREE.Vector3();

// How fast the player will move
let PLAYERSPEED = 800.0;

let clock;

// Get the pointer lock state
getPointerLock();
init();
animate();




// ######################## Initialisation function ########################

function init() {

    /* We use these to keep track of the change in time (delta) it takes to render new frames. 
    We also use listenForPlayerMovement(), which gathers user input.
    */
    clock = new THREE.Clock();
    listenForPlayerMovement();


    // Create the scene where everything will go
    scene = new THREE.Scene();

    // Add some fog for effects
    scene.fog = new THREE.FogExp2(0xcccccc, 0.0015);

    // Set render settings
    renderer = new THREE.WebGLRenderer();
    renderer.setClearColor(scene.fog.color);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);

    // Get the HTML container and connect renderer to it
    let container = document.getElementById('container');
    container.appendChild(renderer.domElement);

    // Set camera position and view details
    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 2000);
    camera.position.y = 20; // Height the camera will be looking from
    camera.position.x = 0;
    camera.position.z = 0;

    // Add the camera
    scene.add(camera);

    // Connect camera with the pointerlockcontrolls
    controls = new THREE.PointerLockControls(camera);
    scene.add(controls.getObject());

    // Add the walls(cubes) of the maze
    createMazeCubes();
    createGround();
    createPerimWalls();

    // Add lights to the scene
    addLights();

    // Listen for if the window changes sizes and adjust
    window.addEventListener('resize', onWindowResize, false);

}

// ######################## Helper Functions ########################


/*
This function will add a simple cube to our scene. 
*/
function createMazeCubesOLD() {

    // Make the shape of the cube that is UNITWIDTH wide/deep, and UNITHEIGHT tall
    let cubeGeo = new THREE.BoxGeometry(UNITWIDTH, UNITHEIGHT, UNITWIDTH);
    // Make the material of the cube and set it to blue
    let cubeMat = new THREE.MeshPhongMaterial({
      color: 0xFF0000,
    });
    
    // Combine the geometry and material to make the cube
    let cube = new THREE.Mesh(cubeGeo, cubeMat);
  
    // Add the cube to the scene
    scene.add(cube);
  
    // Update the cube's position
    cube.position.y = UNITHEIGHT / 2;
    cube.position.x = 0;
    cube.position.z = -100;
    // rotate the cube by 30 degrees
    cube.rotation.y = degreesToRadians(30);
  }

  /*
    This function is a simple function that groups the 
    creation of our lights and adds them to the scene.
   */
  function addLights() {
    let lightOne = new THREE.DirectionalLight(0xffffff);
    lightOne.position.set(1, 1, 1);
    scene.add(lightOne);
  
    // Add a second light with half the intensity
    let lightTwo = new THREE.DirectionalLight(0xffffff, .5);
    lightTwo.position.set(1, -1, -1);
    scene.add(lightTwo);
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
    This function will also call the render() function. 
    The requestAnimationFrame() function is used to constantly update our renderer. 
    Later on, we'll use these functions to update our renderer with cool animations 
    like moving around the maze.
   */
function animate() {
    render();
    // Keep updating the renderer
    requestAnimationFrame(animate);
    // Get the change in time between frames
    var delta = clock.getDelta();
    animatePlayer(delta);
}
function render() {
    renderer.render(scene, camera);
}


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
    This is an updated version of createMazeCubes above.
    It allows us to place 1’s where cubes are and 0’s where empty space is.
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
    let cubeMat = new THREE.MeshPhongMaterial({
      color: 0xff0000,
    });
  
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
      let groundGeo = new THREE.PlaneGeometry(mapSize, mapSize);
      let groundMat = new THREE.MeshPhongMaterial({ color: 0xA0522D, side: THREE.DoubleSide});
  
      let ground = new THREE.Mesh(groundGeo, groundMat);
      ground.position.set(0, 1, 0);
      // Rotate the place to ground level
      ground.rotation.x = degreesToRadians(90);
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

/*
    This function listens for when a mouse click happens. 
    After the click, our rendered game (in the container element) tries to get control of the mouse.

*/

function getPointerLock() {
    document.onclick = function () {
      container.requestPointerLock();
    }
    document.addEventListener('pointerlockchange', lockChange, false); 
  }

  /*
    This function needs to either disable or enable the controls and blocker element. 

*/

  function lockChange() {
    // Turn on controls
    if (document.pointerLockElement === container) {
        // Hide blocker and instructions
        blocker.style.display = "none";
        controls.enabled = true;
    // Turn off the controls
    } else {
      // Display the blocker and instruction
        blocker.style.display = "";
        controls.enabled = false;
    }
}

/*
    This function is what will be flipping our direction states. 

*/

function listenForPlayerMovement() {
    
    // A key has been pressed
    var onKeyDown = function(event) {

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
    var onKeyUp = function(event) {

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


/*



*/

function animatePlayer(delta) {
    // Gradual slowdown
    playerVelocity.x -= playerVelocity.x * 10.0 * delta;
    playerVelocity.z -= playerVelocity.z * 10.0 * delta;
  
    if (moveForward) {
      playerVelocity.z -= PLAYERSPEED * delta;
    } 
    if (moveBackward) {
      playerVelocity.z += PLAYERSPEED * delta;
    } 
    if (moveLeft) {
      playerVelocity.x -= PLAYERSPEED * delta;
    } 
    if (moveRight) {
      playerVelocity.x += PLAYERSPEED * delta;
    }
    if( !( moveForward || moveBackward || moveLeft ||moveRight)) {
      // No movement key being pressed. Stop movememnt
      playerVelocity.x = 0;
      playerVelocity.z = 0;
    }
    controls.getObject().translateX(playerVelocity.x * delta);
    controls.getObject().translateZ(playerVelocity.z * delta);
  }


