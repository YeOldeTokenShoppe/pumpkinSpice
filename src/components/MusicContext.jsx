

// import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
// import { storage } from "@/utilities/firebaseClient";
// import { ref as storageRefUtil, getDownloadURL } from "firebase/storage";

// // Create the music context
// export const MusicContext = createContext();

// // Custom hook to use the music context
// export const useMusic = () => {
//   const context = useContext(MusicContext);
//   if (!context) {
//     throw new Error('useMusic must be used within a MusicProvider');
//   }
//   return context;
// };

// // Track lists
// const non80sTracks = [
//   { name: "Lifetimes", path: "audio/192k/07-lifetimes.m4a", bpm: 135 },
//   { name: "Magnetic - Tunde Adebimpe", path: "audio/320k/01-magnetic.m4a", bpm: 130 },
//   { name: "Rocket Man - Steven Drozd", path: "audio/320k/rocket-man---steven-drozd.m4a", bpm: 75 }
// ];

// const eightyTracks = [
//   { name: "For Those About To Rock - AC/DC", path: "audio/320k/for-those-about-to-rock-ac-dc.m4a", bpm: 75 },
//   { name: "Dirty Cash - The Adventures of Stevie V", path: "audio/320k/dirty-cash.m4a", bpm: 100 },
//   { name: "Intergalactic - Beastie Boys", path: "audio/320k/intergalactic-beastie-boys.m4a", bpm: 108 },
//   { name: "Good Life - Inner City", path: "audio/320k/good-life-inner-city.m4a", bpm: 120 },
//   { name: "Like A Prayer - Madonna", path: "audio/320k/like-a-prayer-madonna.m4a", bpm: 85 },
//   { name: "99 Luftballoons - Nena", path: "audio/320k/99-luftballoons-nena.m4a", bpm: 85 },
//   { name: "Sweet Dreams - Eurythmics", path: "audio/320k/sweet-dreams-eurythmics.m4a", bpm: 85 }
// ];

// // Music Provider component
// export const MusicProvider = ({ children }) => {
//   const [showSpotify, setShowSpotify] = useState(false);
//   const [currentTrack, setCurrentTrack] = useState(null);
//   const [isPlaying, setIsPlaying] = useState(false);
//   const [volume, setVolume] = useState(0.2);
//   const [trackProgress, setTrackProgress] = useState(0);
//   const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
//   const [is80sMode, setIs80sMode] = useState(false);
//   const [currentTrackUrl, setCurrentTrackUrl] = useState('');
//   const [currentTrackPath, setCurrentTrackPath] = useState(''); // Add path tracking
//   const [currentTrackBPM, setCurrentTrackBPM] = useState(100); // Add BPM tracking
//   const [currentTrackShader, setCurrentTrackShader] = useState(null); // Add shader tracking
//   const audioRef = React.useRef(null);
//   const [audioElement, setAudioElement] = useState(null);
//   const [isLoadingTrack, setIsLoadingTrack] = useState(false);
  
  
//   // Load and play track function
//   const loadTrack = useCallback(async (index, shouldAutoPlay = false) => {
//     const playlist = is80sMode ? eightyTracks : non80sTracks;
    
//     if (index < 0 || index >= playlist.length) return;
    
//     setIsLoadingTrack(true);
    
//     try {
//       const trackRef = storageRefUtil(storage, playlist[index].path);
//       const url = await getDownloadURL(trackRef);
      
//       if (audioRef.current) {
//         audioRef.current.src = url;
//         audioRef.current.load();
        
//         await new Promise((resolve) => {
//           const handleCanPlay = () => {
//             audioRef.current.removeEventListener('canplaythrough', handleCanPlay);
//             resolve();
//           };
//           audioRef.current.addEventListener('canplaythrough', handleCanPlay);
//         });
        
//         setCurrentTrackIndex(index);
//         setCurrentTrackBPM(playlist[index].bpm || 100);
//         setCurrentTrack(playlist[index]);
//         setIsLoadingTrack(false);
        
//         if (shouldAutoPlay) {
//           audioRef.current.play().then(() => {
//             setIsPlaying(true);
//           }).catch(e => console.log('Auto-play blocked:', e));
//         }
//       }
//     } catch (error) {
//       console.error('Error loading track:', error);
//       setIsLoadingTrack(false);
//     }
//   }, [is80sMode, setCurrentTrackBPM]);
  
//   // Play/Pause functions
//   const play = useCallback(() => {
//     if (audioRef.current) {
//       // If no track loaded, load the first track
//       if (!audioRef.current.src) {
//         loadTrack(0, true);
//       } else {
//         audioRef.current.play().then(() => {
//           setIsPlaying(true);
//         }).catch(e => console.log('Play blocked:', e));
//       }
//     }
//   }, [loadTrack]);
  
//   const pause = useCallback(() => {
//     if (audioRef.current) {
//       audioRef.current.pause();
//       setIsPlaying(false);
//     }
//   }, []);
  
//   // Next track function
//   const nextTrack = useCallback(() => {
//     const playlist = is80sMode ? eightyTracks : non80sTracks;
//     const nextIndex = (currentTrackIndex + 1) % playlist.length;
//     const wasPlaying = audioRef.current && !audioRef.current.paused;
//     loadTrack(nextIndex, wasPlaying);
//   }, [currentTrackIndex, is80sMode, loadTrack]);
  
//   // Previous track function
//   const prevTrack = useCallback(() => {
//     const playlist = is80sMode ? eightyTracks : non80sTracks;
//     const prevIndex = (currentTrackIndex - 1 + playlist.length) % playlist.length;
//     const wasPlaying = audioRef.current && !audioRef.current.paused;
//     loadTrack(prevIndex, wasPlaying);
//   }, [currentTrackIndex, is80sMode, loadTrack]);
  
  
//   // Initialize audio element once
//   useEffect(() => {
//     const audio = new Audio();
//     audio.volume = volume;
//     audio.crossOrigin = "anonymous";
//     audio.preload = "auto";
//     audioRef.current = audio;
//     setAudioElement(audio);
    
//     // Add event listeners
//     audio.addEventListener('ended', () => {
//       setIsPlaying(false);
//     });
    
//     return () => {
//       audio.pause();
//       audio.src = '';
//     };
//   }, []);
  
//   // Update volume when it changes
//   useEffect(() => {
//     if (audioRef.current) {
//       audioRef.current.volume = volume;
//     }
//   }, [volume]);
  
//   // Removed restoration logic - now handled by MusicManager component
  

//   const value = {
//     showSpotify,
//     setShowSpotify,
//     currentTrack,
//     setCurrentTrack,
//     isPlaying,
//     setIsPlaying,
//     volume,
//     setVolume,
//     trackProgress,
//     setTrackProgress,
//     currentTrackIndex,
//     setCurrentTrackIndex,
//     is80sMode,
//     setIs80sMode,
//     currentTrackUrl,
//     setCurrentTrackUrl,
//     currentTrackPath,
//     setCurrentTrackPath,
//     currentTrackBPM,
//     setCurrentTrackBPM,
//     currentTrackShader,
//     setCurrentTrackShader,
//     audioElement: audioRef.current,
//     audioRef,
//     // New methods for direct control
//     loadTrack,
//     play,
//     pause,
//     nextTrack,
//     prevTrack,
//     isLoadingTrack,
//     non80sTracks,
//     eightyTracks,
//   };
  
//   return (
//     <MusicContext.Provider value={value}>
//       {children}
//     </MusicContext.Provider>
//   );
// };