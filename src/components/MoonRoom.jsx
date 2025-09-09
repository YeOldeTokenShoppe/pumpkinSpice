import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import { OrbitControls, useGLTF } from "@react-three/drei";
import Ammo from "ammojs3";
import styles from "../../public/MoonRoom.module.css";

const MoonLamps = ({
  scene,
  physicsWorld,
  lunarTexture,
  envMap,
  addPhysicsMesh,
  AmmoLib,
}) => {
  const moonPositions = [
    { x: 0, y: 10, z: 0 },
    { x: -5, y: 7, z: -3 },
    { x: 7, y: 12, z: 5 },
    { x: -10, y: 8, z: 10 },
    { x: 10, y: 15, z: -10 },
  ];

  useEffect(() => {
    if (!physicsWorld) return; // Wait until physicsWorld is ready

    moonPositions.forEach((pos) => {
      const geometry = new THREE.SphereGeometry(2, 32, 32);
      const material = new THREE.MeshPhongMaterial({
        map: lunarTexture,
        envMap: envMap,
        shininess: 50,
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(pos.x, pos.y, pos.z);
      mesh.castShadow = true;

      // Add physics
      const shape = new AmmoLib.btSphereShape(2);
      addPhysicsMesh(mesh, shape, 1, physicsWorld);

      // Add to scene
      scene.add(mesh);
    });
  }, [
    scene,
    physicsWorld,
    lunarTexture,
    envMap,
    addPhysicsMesh,
    AmmoLib,
  ]);

  return null;
};

const Floor = ({ scene, physicsWorld, addPhysicsMesh, AmmoLib }) => {
  useEffect(() => {
    if (!physicsWorld) return; // Wait until physicsWorld is ready

    const geometry = new THREE.BoxGeometry(50, 1, 50);
    const material = new THREE.MeshPhongMaterial({ color: 0x888888 });
    const floor = new THREE.Mesh(geometry, material);
    floor.receiveShadow = true;
    floor.position.set(0, -0.5, 0);

    const shape = new AmmoLib.btBoxShape(new AmmoLib.btVector3(25, 0.5, 25));
    addPhysicsMesh(floor, shape, 0, physicsWorld);

    scene.add(floor);
  }, [scene, physicsWorld, addPhysicsMesh, AmmoLib]);

  return null;
};

const ArmChair = ({ scene }) => {
  const { scene: chairScene } = useGLTF("/models/DunkTank4.glb");
  useEffect(() => {
    chairScene.scale.set(10, 10, 10);
    scene.add(chairScene);
  }, [scene, chairScene]);

  return null;
};

const PhysicsUpdater = ({ physicsWorld, rigidBodies, tmpTrans }) => {
  useFrame(() => {
    if (!physicsWorld) return; // Wait until physicsWorld is ready

    const deltaTime = 1 / 60;

    // Step the physics simulation
    physicsWorld.stepSimulation(deltaTime, 10);

    // Update physics objects
    rigidBodies.current.forEach((body) => {
      const objAmmo = body.userData.physicsBody;
      const ms = objAmmo.getMotionState();
      if (ms) {
        ms.getWorldTransform(tmpTrans.current);
        const p = tmpTrans.current.getOrigin();
        const q = tmpTrans.current.getRotation();
        body.position.set(p.x(), p.y(), p.z());
        body.quaternion.set(q.x(), q.y(), q.z(), q.w());
      }
    });
  });

  return null;
};

const MoonRoom = () => {
  const [physicsWorld, setPhysicsWorld] = useState(null);
  const [ammoReady, setAmmoReady] = useState(false);
  const [AmmoLib, setAmmoLib] = useState(null);
  const rigidBodies = useRef([]);
  const tmpTrans = useRef(null);
  const sceneRef = useRef(new THREE.Scene());

  // Use useLoader from react-three-fiber to properly load textures with error handling
  const [lunarTexture, setLunarTexture] = useState(null);
  const [envMap, setEnvMap] = useState(null);
  const [texturesLoaded, setTexturesLoaded] = useState(false);

  useEffect(() => {
    // Load lunar texture
    const textureLoader = new THREE.TextureLoader();
    textureLoader.load(
      "/lunar_color.jpg",
      (texture) => {
        setLunarTexture(texture);
        console.log("Lunar texture loaded successfully");

        // Load environment map after lunar texture loads
        const cubeTextureLoader = new THREE.CubeTextureLoader();
        cubeTextureLoader.setPath("/textures/env/").load(
          // ["px.jpg", "nx.jpg", "py.jpg", "ny.jpg", "pz.jpg", "nz.jpg"],
          (envTexture) => {
            setEnvMap(envTexture);
            setTexturesLoaded(true);
            console.log("Environment map loaded successfully");
          },
          undefined,
          (error) => {
            console.error("Error loading environment map:", error);
          }
        );
      },
      undefined, // Progress callback (optional)
      (error) => {
        console.error("Error loading lunar texture:", error);
      }
    );
  }, []);

  const addPhysicsMesh = (mesh, shape, mass, physicsWorld) => {
    if (!AmmoLib) return;
    
    const transform = new AmmoLib.btTransform();
    transform.setIdentity();

    const position = mesh.position;
    transform.setOrigin(new AmmoLib.btVector3(position.x, position.y, position.z));

    const quaternion = mesh.quaternion;
    transform.setRotation(
      new AmmoLib.btQuaternion(
        quaternion.x,
        quaternion.y,
        quaternion.z,
        quaternion.w
      )
    );

    const motionState = new AmmoLib.btDefaultMotionState(transform);
    const localInertia = new AmmoLib.btVector3(0, 0, 0);
    shape.calculateLocalInertia(mass, localInertia);

    const rbInfo = new AmmoLib.btRigidBodyConstructionInfo(
      mass,
      motionState,
      shape,
      localInertia
    );
    const body = new AmmoLib.btRigidBody(rbInfo);

    physicsWorld.addRigidBody(body); // Ensure physicsWorld is defined here
    rigidBodies.current.push(mesh);
    mesh.userData.physicsBody = body;
  };

  useEffect(() => {
    const setupPhysicsWorld = async () => {
      // Initialize Ammo.js
      const AmmoInstance = await Ammo();
      setAmmoLib(AmmoInstance);
      
      // Create tmpTrans after Ammo is loaded
      tmpTrans.current = new AmmoInstance.btTransform();
      
      const collisionConfig = new AmmoInstance.btDefaultCollisionConfiguration();
      const dispatcher = new AmmoInstance.btCollisionDispatcher(collisionConfig);
      const broadphase = new AmmoInstance.btDbvtBroadphase();
      const solver = new AmmoInstance.btSequentialImpulseConstraintSolver();
      const world = new AmmoInstance.btDiscreteDynamicsWorld(
        dispatcher,
        broadphase,
        solver,
        collisionConfig
      );
      world.setGravity(new AmmoInstance.btVector3(0, -10, 0));
      setPhysicsWorld(world);
      setAmmoReady(true);
    };

    setupPhysicsWorld();

    return () => {
      if (physicsWorld && AmmoLib) {
        AmmoLib.destroy(physicsWorld);
      }
    };
  }, []);

  if (!physicsWorld || !texturesLoaded || !ammoReady || !AmmoLib) return null; // Wait for physics, textures, and Ammo

  return (
    <div className={styles.moonRoom}>
      <Canvas shadows>
        <ambientLight intensity={0.5} />
        <OrbitControls enableDamping maxPolarAngle={(Math.PI / 2) * 0.9} />
        <PhysicsUpdater
          physicsWorld={physicsWorld}
          rigidBodies={rigidBodies}
          tmpTrans={tmpTrans}
        />
        <MoonLamps
          scene={sceneRef.current}
          physicsWorld={physicsWorld}
          addPhysicsMesh={addPhysicsMesh}
          lunarTexture={lunarTexture}
          envMap={envMap}
          AmmoLib={AmmoLib}
        />
        <Floor
          scene={sceneRef.current}
          physicsWorld={physicsWorld}
          addPhysicsMesh={addPhysicsMesh}
          AmmoLib={AmmoLib}
        />
        <ArmChair scene={sceneRef.current} />
      </Canvas>
    </div>
  );
};

export default MoonRoom;
