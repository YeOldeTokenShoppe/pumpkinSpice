// Compatibility patch for Three.js BufferGeometryUtils
// This file re-exports all functions from the original module
// and adds the deprecated mergeBufferGeometries as an alias

// Import all exports from the original BufferGeometryUtils
export * from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import * as OriginalBufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';

// Add the deprecated function name as an alias
// In Three.js 0.164.1, the function should be mergeBufferGeometries
// But we'll add both names to be safe
export const mergeBufferGeometries = OriginalBufferGeometryUtils.mergeBufferGeometries || OriginalBufferGeometryUtils.mergeGeometries || function(...args) {
  console.warn('mergeBufferGeometries is not available in this version of Three.js');
  return null;
};

// Also add mergeGeometries if it doesn't exist
export const mergeGeometries = OriginalBufferGeometryUtils.mergeGeometries || OriginalBufferGeometryUtils.mergeBufferGeometries;