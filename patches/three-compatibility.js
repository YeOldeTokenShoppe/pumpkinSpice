// Patch for Three.js compatibility with @splinetool/loader
// This patches the BufferGeometryUtils to add the deprecated mergeBufferGeometries function

const Module = require('module');
const originalRequire = Module.prototype.require;

Module.prototype.require = function(id) {
  const module = originalRequire.apply(this, arguments);
  
  if (id === 'three/examples/jsm/utils/BufferGeometryUtils.js' || 
      id === 'three/examples/jsm/utils/BufferGeometryUtils') {
    if (module.mergeGeometries && !module.mergeBufferGeometries) {
      module.mergeBufferGeometries = module.mergeGeometries;
    }
  }
  
  return module;
};