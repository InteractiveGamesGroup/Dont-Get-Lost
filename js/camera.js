class Camera{
  
    constructor(){
      const fov = 60;
      const aspect = window.innerWidth / window.innerHeight;  // the canvas default
      const near = 1;
      // const far = 1500;
      const far = 2000;
      this.camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
      this.camera.position.x = 0;
      this.camera.position.y = 0; // Height the camera will be looking from
      this.camera.position.z = 0;   
    }
  
    returnObject(){
      return this.camera;
    }

    addComponent(component){
      this.camera.add(component);
    }

}