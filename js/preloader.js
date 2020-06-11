class Preloader{

  constructor(textures,models,options) {

    console.log("LOADING ASSETS");

      // ---------- Loading Manager ----------
      this.manager = new THREE.LoadingManager();
      const progressbarElem = document.querySelector('#progressbar');
      this.manager.onProgress = (url, itemsLoaded, itemsTotal) => {
          progressbarElem.style.width = `${itemsLoaded / itemsTotal * 100 | 0}%`;
      };

      // First load the textures
      this.loadTextures(textures,this.manager);

      // Load the models
      this.loadModels(models,this.manager);

      this.manager.onLoad = options.onComplete;

  }

  loadTextures(textures,manager,){

    const textureLoader = new THREE.TextureLoader(manager);
    for(const texture of Object.values(textures)){
      textureLoader.load(texture.url, (text)=>{
          texture.text = text;
      });
    }
  }

  loadModels(models,manager){

    const modelLoader = new THREE.GLTFLoader(manager);
      for (const model of Object.values(models)) {
          modelLoader.load(model.url, (gltf) => {
            model.gltf = gltf;
          });
      }
  }

}