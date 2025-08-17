"use client";
import React, {
  useEffect,
  useState,
  useCallback,
  Suspense,
  useRef,
  memo,
} from "react";
// import { useRouter } from "next/navigation";
// import {
//   Accordion,
//   Avatar,
//   AccordionButton,
//   AccordionIcon,
//   AccordionItem,
//   AccordionPanel,
//   Link,
//   Box,
//   Button,
//   Flex,
//   Heading,
//   Image,
//   Text,
//   Grid,
//   GridItem,
//   Badge,
//   Stat,
//   StatGroup,
//   StatLabel,
//   StatNumber,
//   StatHelpText,
// } from "@chakra-ui/react";
// import AnimatedRadioButtons from "./3DVotiveStand/CyberButtons";

import {
  collection,
  query,
  orderBy,
  onSnapshot,
  getDocs,
} from "firebase/firestore";
import { db, auth } from "@/utilities/firebaseClient";
import dynamic from "next/dynamic";
import { resolveMethod, createThirdwebClient, getContract } from "thirdweb";
import { useReadContract } from "thirdweb/react";
import { defineChain } from "thirdweb/chains";
import { utils, ethers } from "ethers";
// import styled from "styled-components";
// import Candle from "../components/Candle";
import { useUser, useClerk } from "@clerk/nextjs";
import { Canvas } from "@react-three/fiber";
// import { getUserImageUrl, getUsername, createUserData } from "../utilities/clerkHelpers";
import { useMusic } from "@/components/MusicContext";

import ThreeDVotiveStand from "@/components/index";

// import Communion3 from "./Communion3";

import Model from "@/components/Model";
import * as THREE from "three";
import MobileSidePanel from "@/components/MobileSidePanel";
// import SidePanelEnhanced from "./SidePanelEnhanced";



const infuraKey = process.env.NEXT_PUBLIC_INFURA_KEY;
const provider = new ethers.providers.JsonRpcProvider(
  `https://sepolia.infura.io/v3/${infuraKey}`
);

const CLIENT_ID = process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID;

const client = createThirdwebClient({ clientId: CLIENT_ID });

const contract = getContract({
  client: client,
  chain: defineChain(11155111),
  address: "0xde7Cc5B93e0c1A2131c0138d78d0D0a33cc36e42",
});

// const BurnModal = dynamic(() => import("@/components/BurnModal"), {
//   ssr: false,
// });


// Memoize child components with deep comparison for props
const MemoizedThreeDVotiveStand = memo(ThreeDVotiveStand, (prevProps, nextProps) => {
  // Custom comparison to prevent unnecessary re-renders
  return (
    prevProps.isInMarkerView === nextProps.isInMarkerView &&
    prevProps.isMobileView === nextProps.isMobileView &&
    prevProps.isModalOpen === nextProps.isModalOpen &&
    prevProps.is80sMode === nextProps.is80sMode &&
    prevProps.monsterMode === nextProps.monsterMode &&
    prevProps.isConstellationsVisible === nextProps.isConstellationsVisible &&
    prevProps.isMoonShotsEnabled === nextProps.isMoonShotsEnabled &&
    prevProps.userData === nextProps.userData
  );
});

function BurnGallery({
  setComponentLoaded,
  setThreeDSceneLoaded,
  isModalOpen,
  setIsModalOpen,
  is80sMode,
  toggle80sMode,
  synthwaveMode,
  setSynthwaveMode,
  handleIgnition,
  handleReturnFromSynthwave,
  isMobileView: propIsMobileView,
  isDefinitelyPhone,
}) {
  useEffect(() => {
    setComponentLoaded(true);
  }, [setComponentLoaded]);

  // const router = useRouter();
  const { isLoaded, isSignedIn, user } = useUser();
  const { openSignIn } = useClerk();
  const { showSpotify, setShowSpotify } = useMusic();
  const [isBurnModalOpen, setIsBurnModalOpen] = useState(false);
  const [isImageSelectionModalOpen, setIsImageSelectionModalOpen] =
    useState(false);
  const [isResultSaved, setIsResultSaved] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [selectedImage, setSelectedImage] = useState(null);
  const currentUrl = typeof window !== 'undefined' ? window.location.pathname : '/';
  const [burnedAmount, setBurnedAmount] = useState(0);
  const [images, setImages] = useState([]);
  const [isFlameVisible, setIsFlameVisible] = useState(true);
  const [isVisible, setIsVisible] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  const [isChandelierVisible, setIsChandelierVisible] = useState(true);
  const [isInMarkerView, setIsInMarkerView] = useState(false);
  const [currentPath, setCurrentPath] = useState("/");
  const [marginTop, setMarginTop] = useState("17rem");
  const [isLoading, setIsLoading] = useState(true);
  const [isMobileView, setIsMobileView] = useState(false);
  const [currentView, setCurrentView] = useState("main");
  const [tooltipData, setTooltipData] = useState(null);
  const [isTextBoxVisible, setIsTextBoxVisible] = useState(true);
  const [isBuyModalOpen, setIsBuyModalOpen] = useState(false);
  const [isStakeModalOpen, setIsStakeModalOpen] = useState(false);
  const spawnMonsterFunctionRef = useRef(null);
  const [showFloatingViewer, setShowFloatingViewer] = useState(false);
  const [modelRef, setModelRef] = useState(null);
  const [modelCenter, setModelCenter] = useState(new THREE.Vector3());
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [isStatueLoaded, setIsStatueLoaded] = useState(false);
  const [monsterMode, setMonsterMode] = useState(false);
  const [clerkUserData, setClerkUserData] = useState(null);
  const [showUI, setShowUI] = useState(true); // Control UI visibility during transitions
  const [isConstellationsVisible, setIsConstellationsVisible] = useState(false);
  const [isMoonShotsEnabled, setIsMoonShotsEnabled] = useState(false);
  

  const BurnModal = dynamic(() => import("@/components/BurnModal"), {
    ssr: false,
  });
  
  // Reset moon spawn state on component mount
  useEffect(() => {
    window._moonsAlreadySpawned = false;
  }, []);
  const [paginationState, setPaginationState] = useState(null);
  const votiveStandRef = useRef(null);
  const [isCandleViewerVisible, setIsCandleViewerVisible] = useState(false);
  const [activeScene, setActiveScene] = useState('gallery'); // Track current scene




  useEffect(() => {
    // If mobile view is explicitly set via props, use that
    if (propIsMobileView !== undefined) {
      setIsMobileView(propIsMobileView);
      return; // Don't add resize listener if we have explicit mobile state
    }
    
    // Otherwise fall back to local detection
    const checkMobile = () => {
      const mobile = typeof window !== "undefined" && window.innerWidth <= 576;
      setIsMobileView(mobile);
    };

    if (typeof window !== "undefined") {
      checkMobile();
      window.addEventListener("resize", checkMobile);
      return () => {
        window.removeEventListener("resize", checkMobile);
        // Also clean up any firebase listeners, timers, or other resources
      };
    }
  }, [propIsMobileView]);



  

  // useEffect(() => {
  //   if (isChandelierVisible) {
  //     setIsMounted(true);
  //     // Wait a frame before starting fade-in
  //     requestAnimationFrame(() => setIsVisible(true));
  //   } else {
  //     setIsVisible(false);
  //     // Delay unmounting until fade-out completes
  //     const timer = setTimeout(() => setIsMounted(false), 2500); // Match your GSAP duration
  //     return () => clearTimeout(timer);
  //   }
  // }, [isChandelierVisible]);

  const avatarUrl = user ? user.imageUrl || "/defaultAvatar.png" : "/defaultAvatar.png";

  // const handleOpenBurnModal = () => {
  //   if (!user) {
  //     openSignIn({ forceRedirectUrl: currentPath });
  //   } else {
  //     setIsBurnModalOpen(true);
  //     router.push("/gallery?burnModal=open", undefined, { shallow: true });
  //   }
  // };

  // const handleOpenImageSelectionModal = () =>
  //   setIsImageSelectionModalOpen(true);
  // const handleCloseImageSelectionModal = () =>
  //   setIsImageSelectionModalOpen(false);

  // useEffect(() => {
  //   if (isBurnModalOpen && router.query.burnModal !== "open") {
  //     router.push("/gallery?burnModal=open", undefined, { shallow: true });
  //   } else if (!isBurnModalOpen && router.query.burnModal === "open") {
  //     router.push("/gallery", undefined, { shallow: true });
  //   }
  // }, [isBurnModalOpen, router]);

  // Handler for screen clicks in the mobile model

  // Handler to return to the main view


  // Add toggleMonsterMode function
  const toggleMonsterMode = () => {
    setMonsterMode((prev) => !prev);
  };

  // Add toggleRocketModel function with duplicate prevention
  

  

  // Update user data when Clerk user changes
  useEffect(() => {
    if (isLoaded && isSignedIn && user) {
      setClerkUserData({
        id: user.id,
        username: user.username || user.firstName || 'User',
        imageUrl: user.imageUrl || '/defaultAvatar.png',
        email: user.emailAddresses?.[0]?.emailAddress || ''
      });
    } else {
      setClerkUserData(null);
    }
  }, [isLoaded, isSignedIn, user]);


  // Music player visibility is now controlled by cyberpunk mission control
  // useEffect(() => {
  //   if (is80sMode) {
  //     setShowSpotify(true);
  //   }
  // }, [is80sMode, setShowSpotify]);

  // Update the loading state when both model and statue are loaded
  useEffect(() => {
    // Call setThreeDSceneLoaded when the model is loaded
    if (isModelLoaded && setThreeDSceneLoaded) {
      setThreeDSceneLoaded(true);
    }
  }, [
    isModelLoaded,
    isStatueLoaded,
    monsterMode,
    setThreeDSceneLoaded,
  ]);

  

  return (
    <>
      <div
        style={{
          position: "relative",
          minHeight: "100vh",
          minWidth: "100vw",
          overflow: "hidden",
          backgroundColor: "#131416"
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr",
            gap: 0,
            height: "100%",
            width: "100%",
            overflow: "hidden"
          }}
        >
          <div style={{ gridColumn: "span 1", height: "100%", overflow: "hidden" }}>
            {currentView === "main" ? (
              <>
                <MemoizedThreeDVotiveStand
                  key="votive-stand-main" // Add stable key to prevent remounting
                  ref={votiveStandRef}
                  setIsLoading={setIsModelLoaded}
                isInMarkerView={isInMarkerView}
                isMobileView={isMobileView}
                isModalOpen={isModalOpen}
                setIsModalOpen={setIsModalOpen}
                is80sMode={is80sMode}
                monsterMode={monsterMode}
                userData={clerkUserData}
                setIsStatueLoaded={setIsStatueLoaded}
    
                onPaginationChange={setPaginationState}
                onCandleViewerStateChange={setIsCandleViewerVisible}
                onUIVisibilityChange={setShowUI}
                onSceneChange={setActiveScene}
                />
              </>
            ) : null}
          </div>
        </div>

        {/* Render panels with CSS visibility control to prevent remounting */}
        {isMobileView ? (
          <div
            key="mobile-panel-container"
            style={{
              display: currentView === "main" && showUI ? "block" : "none",
              position: "fixed",
              zIndex: 1000
            }}
          >
            <MobileSidePanel
              key="mobile-side-panel"
              // onButtonClick={handleButtonClick}
              is80sMode={is80sMode}
              toggle80sMode={toggle80sMode}
              monsterMode={monsterMode}
              toggleMonsterMode={toggleMonsterMode}
              showSpotify={showSpotify}
              setShowSpotify={setShowSpotify}
              paginationState={paginationState}
              activeScene={activeScene}
            />
          </div>
        ) : (
          <div
            key="desktop-panel-container"
            style={{
              display: currentView === "main" && showUI ? "block" : "none",
              position: "fixed",
              zIndex: 1000
            }}
          >
            {/* <SidePanelEnhanced
              key="side-panel-enhanced"
              onButtonClick={handleButtonClick}
              is80sMode={is80sMode}
              toggle80sMode={toggle80sMode}
              monsterMode={monsterMode}
              toggleMonsterMode={toggleMonsterMode}
              rocketModelVisible={rocketModelVisible}
              toggleRocketModel={toggleRocketModel}
              toggleConstellationVisibility={toggleConstellationVisibility}
              isConstellationsVisible={isConstellationsVisible}
              toggleMoonShots={toggleMoonShots}
              isMoonShotsEnabled={isMoonShotsEnabled}
              showSpotify={showSpotify}
              setShowSpotify={setShowSpotify}
            /> */}
          </div>
        )}


        {/* {isBurnModalOpen && (
          <BurnModal
            isOpen={isBurnModalOpen}
            onClose={() => setIsBurnModalOpen(false)}
            selectedImage={selectedImage}
            setSelectedImage={setSelectedImage}
            burnedAmount={burnedAmount}
            setBurnedAmount={setBurnedAmount}
            setIsResultSaved={setIsResultSaved}
            setSaveMessage={setSaveMessage}
            isResultSaved={isResultSaved}
            saveMessage={saveMessage}
          />
        )} */}
      </div>
    </>
  );
}

export default BurnGallery;