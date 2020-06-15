class Player{
    constructor(name,model) {

        this.name = name;
        this.gameObject = new THREE.Object3D();// Holder
        this.gameObject.position.x = 0;
        this.gameObject.position.y = 0;
        this.gameObject.position.z = -70;

        // ------------------- Set Character ----------------------
        // Root object
        this.root = model.gltf.scene;
        this.root.scale.set( 60, 60, 60 );
        this.addComponent(this.root);
        // Shadows
        this.root.traverse( function ( object ) {

            if ( object.isMesh ) object.castShadow = true;

        } );


        // // Animation
        this.mixer = new THREE.AnimationMixer(this.root);
        this.animations = {};
        this.clipActions = {};
        this.prepareAnimations(model);
        this.prepareClipActions();




        this.PLAYERSPEED = 600.0;
        // Move Directions
        this.moveDirection = {
            FORWARD: false,
            BACKWARD: false,
            LEFT: false,
            RIGHT: false
        };
        this.run = false;

        // Movement vectors
        this.velocity = new THREE.Vector3();
        this.acceleration = new THREE.Vector3(0, -150, 0);
        

        // Listen for player Movement
        this.listenForMovement();
  
    }
  
    addComponent(component){
      this.gameObject.add(component);
    }

    returnObject(){
      return this.gameObject;
    }

    listenForMovement(){
        // Inputs
        const player = this;
        // KEYDOWN
        document.addEventListener('keydown', function(event) {
            switch (event.keyCode) {
                case 38: // up
                case 87: // w
                    player.moveDirection.FORWARD = true;
                    
                    break;
                case 37: // left
                case 65: // a
                    player.moveDirection.LEFT = true;
                    break;
                case 40: // down
                case 83: // s
                    player.moveDirection.BACKWARD = true;
                    break;
                case 39: // right
                case 68: // d
                    player.moveDirection.RIGHT = true;
                    break;
                case 16: // Shift
                    player.run = true;
                    break;
                case 32: // space
                    // player.jump();
                    break;
            }
        },false);

        // KEYUP
        document.addEventListener('keyup', function(event) {
            switch (event.keyCode) {
                case 38: // up
                case 87: // w
                    // player.moveDirection.FORWARD = false;
                    player.moveDirection.FORWARD = false;
                    break;
                case 37: // left
                case 65: // a
                    player.moveDirection.LEFT = false;
                    break;
                case 40: // down
                case 83: // s
                    player.moveDirection.BACKWARD = false;
                    break;
                case 39: // right
                case 68: // d
                    player.moveDirection.RIGHT = false;
                    break;
                case 16: // Shift
                    player.run = false;
                    break;
                case 32: // space
                    break;
            }
        }, false);
    }

    prepareAnimations(model){
        const player = this;
        
        // const animsName = {};
        model.gltf.animations.forEach( (clip)=>{
            player.animations[clip.name] = clip;
        });
        // model.animations = animsName;
    }

    prepareClipActions(){
        const player = this;

        // Object.values(player.animations)

        Object.values(player.animations).forEach( (clip)=>{
            player.clipActions[clip.name] = player.mixer.clipAction(clip);
        });

    }

    updateClip(delta){
        this.mixer.update(delta);
    }

}