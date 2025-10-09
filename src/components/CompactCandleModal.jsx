import React, { useState, Suspense, useRef, useEffect, useCallback } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF, useTexture } from '@react-three/drei';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/utilities/firebaseClient';
import * as THREE from 'three';
import { gsap } from 'gsap';
import { ScrambleTextPlugin } from 'gsap/dist/ScrambleTextPlugin';
import { encryptMessage, generateScrambledDisplay } from '@/utilities/encryption';
import { generatePrayer, getRemainingPrayers, PRAYER_PROMPTS } from '@/utilities/aiPrayers';
import { useUser } from '@clerk/nextjs';
import BurningEffect from './BurningEffect';
import './CompactCandleModal.css';

// Register GSAP plugin
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrambleTextPlugin);
}

// Language names for display
const LANGUAGE_NAMES = {
  en: 'English',
  es: 'Spanish',
  pt: 'Portuguese',
  fr: 'French',
  it: 'Italian',
  zh: 'Chinese',
  hi: 'Hindi'
};

// Detect user language (fallback to English)
const getUserLanguage = () => {
  // Check if we're on the client side
  if (typeof window === 'undefined') {
    return 'en'; // Default to English on server
  }
  
  const lang = navigator.language || navigator.userLanguage || 'en';
  const shortLang = lang.substring(0, 2).toLowerCase();
  // Return supported language or default to English
  return ['es', 'pt', 'zh', 'hi', 'fr', 'it'].includes(shortLang) ? shortLang : 'en';
};

// Multi-language prayers
const PRAYERS_BY_LANGUAGE = {
  en: {
    heading: ['Prayer to Our Lady', 'of Perpetual Profit'],
    prayers: [
      {
        id: 'scalper',
        title: "Scalper's Prayer",
        text: "Oh Lady of Perpetual Profit, bless my lightning fingers and low-latency reflexes. Protect me from fat-fingered orders and grant me the stamina to chase micro-movements without losing my soul. May every scalp be green, and every exit perfectly timed. Amen."
      },
      {
        id: 'leverage',
        title: "Leverage Prayer",
        text: "Oh Blessed Virgin of Margin, shield me from the wicked lure of 100x leverage. Guard my trades from sudden liquidation, and deliver me from the temptation of adding 'just a little more.' Grant me the humility to close in profit, and the grace to walk away before the exchange claims my soul. Amen."
      },
      {
        id: 'swing',
        title: "Swing Trader's Prayer",
        text: "Oh Lady of Perpetual Profit, grant me patience to ride the waves of volatility, and the wisdom to know when to take profit and when to let it run. Bless my charts, my Fibonacci retracements, and my RSI settings, that I may always enter at the bottom and exit at the top. Amen."
      },
      {
        id: 'hodler',
        title: "Hodler's Prayer",
        text: "Oh Glorious Mother of Diamond Hands, let me never succumb to weak paper hands. Guard my seed phrase, strengthen my resolve, and remind me that one day the line shall go up forever. May my wallet survive bear markets, hacks, and exchange collapses, until the moon and beyond. Amen."
      },
      {
        id: 'chart',
        title: "Chart Mystic's Prayer",
        text: "Oh Oracle of Eternal Candles, Our Lady of Perpetual Profit, guide my eyes as I read the sacred indicators. Grant me the gift of vision to see wedges before they break, triangles before they tighten, and golden crosses before they shine. Deliver me from false signals, and sanctify my trading view with holy confluence. Amen."
      }
    ]
  },
  es: {
    heading: ['Oración a Nuestra Señora', 'del Beneficio Perpetuo'],
    prayers: [
      {
        id: 'scalper',
        title: "Oración del Scalper",
        text: "Oh Señora del Beneficio Perpetuo, bendice mis dedos veloces y reflejos de baja latencia. Protégeme de órdenes mal digitadas y dame la resistencia para perseguir micro-movimientos sin perder mi alma. Que cada scalp sea verde y cada salida perfectamente cronometrada. Amén."
      },
      {
        id: 'leverage',
        title: "Oración del Apalancamiento",
        text: "Oh Bendita Virgen del Margen, protégeme del malvado señuelo del apalancamiento 100x. Guarda mis operaciones de la liquidación repentina, y líbrame de la tentación de agregar 'solo un poco más'. Dame la humildad para cerrar en ganancias y la gracia para alejarme antes de que el exchange reclame mi alma. Amén."
      },
      {
        id: 'swing',
        title: "Oración del Swing Trader",
        text: "Oh Señora del Beneficio Perpetuo, dame paciencia para surfear las olas de volatilidad, y sabiduría para saber cuándo tomar ganancias y cuándo dejarlas correr. Bendice mis gráficos, mis retrocesos de Fibonacci y mi configuración RSI, para que siempre entre en el fondo y salga en la cima. Amén."
      },
      {
        id: 'hodler',
        title: "Oración del Hodler",
        text: "Oh Gloriosa Madre de las Manos de Diamante, nunca me dejes sucumbir a las débiles manos de papel. Guarda mi frase semilla, fortalece mi determinación y recuérdame que algún día la línea subirá para siempre. Que mi cartera sobreviva mercados bajistas, hackeos y colapsos de exchanges, hasta la luna y más allá. Amén."
      },
      {
        id: 'chart',
        title: "Oración del Místico de Gráficos",
        text: "Oh Oráculo de las Velas Eternas, Nuestra Señora del Beneficio Perpetuo, guía mis ojos mientras leo los indicadores sagrados. Dame el don de ver cuñas antes de que rompan, triángulos antes de que se estrechen y cruces doradas antes de que brillen. Líbrame de señales falsas y santifica mi vista de trading con confluencia sagrada. Amén."
      }
    ]
  },
  pt: {
    heading: ['Oração a Nossa Senhora', 'do Lucro Perpétuo'],
    prayers: [
      {
        id: 'scalper',
        title: "Oração do Scalper",
        text: "Ó Senhora do Lucro Perpétuo, abençoe meus dedos rápidos e reflexos de baixa latência. Proteja-me de ordens digitadas erradas e me dê resistência para perseguir micro-movimentos sem perder minha alma. Que cada scalp seja verde e cada saída perfeitamente cronometrada. Amém."
      },
      {
        id: 'leverage',
        title: "Oração da Alavancagem",
        text: "Ó Bendita Virgem da Margem, proteja-me da tentação maligna de alavancagem 100x. Guarde minhas operações da liquidação repentina e livre-me da tentação de adicionar 'só mais um pouco'. Dê-me humildade para fechar no lucro e a graça de ir embora antes que a exchange reclame minha alma. Amém."
      },
      {
        id: 'swing',
        title: "Oração do Swing Trader",
        text: "Ó Senhora do Lucro Perpétuo, dê-me paciência para surfar as ondas de volatilidade e sabedoria para saber quando realizar lucros e quando deixar correr. Abençoe meus gráficos, minhas retrações de Fibonacci e minhas configurações de RSI, para que eu sempre entre no fundo e saia no topo. Amém."
      },
      {
        id: 'hodler',
        title: "Oração do Hodler",
        text: "Ó Gloriosa Mãe das Mãos de Diamante, nunca me deixe sucumbir às fracas mãos de papel. Guarde minha seed phrase, fortaleça minha determinação e me lembre que um dia a linha subirá para sempre. Que minha carteira sobreviva a mercados em baixa, hacks e colapsos de exchanges, até a lua e além. Amém."
      },
      {
        id: 'chart',
        title: "Oração do Místico dos Gráficos",
        text: "Ó Oráculo das Velas Eternas, Nossa Senhora do Lucro Perpétuo, guie meus olhos enquanto leio os indicadores sagrados. Dê-me o dom de ver cunhas antes que rompam, triângulos antes que apertem e cruzes douradas antes que brilhem. Livre-me de sinais falsos e santifique minha visão de trading com confluência sagrada. Amém."
      }
    ]
  },
  fr: {
    heading: ['Prière à Notre Dame', 'du Profit Perpétuel'],
    prayers: [
      {
        id: 'scalper',
        title: "Prière du Scalper",
        text: "Ô Dame du Profit Perpétuel, bénis mes doigts rapides et mes réflexes à faible latence. Protège-moi des ordres mal saisis et donne-moi l'endurance pour chasser les micro-mouvements sans perdre mon âme. Que chaque scalp soit vert et chaque sortie parfaitement chronométrée. Amen."
      },
      {
        id: 'leverage',
        title: "Prière du Levier",
        text: "Ô Bienheureuse Vierge de la Marge, protège-moi du maléfique appât du levier 100x. Garde mes trades de la liquidation soudaine, et délivre-moi de la tentation d'ajouter 'juste un peu plus'. Accorde-moi l'humilité de clôturer en profit et la grâce de partir avant que l'exchange ne réclame mon âme. Amen."
      },
      {
        id: 'swing',
        title: "Prière du Swing Trader",
        text: "Ô Dame du Profit Perpétuel, accorde-moi la patience de chevaucher les vagues de volatilité, et la sagesse de savoir quand prendre des profits et quand les laisser courir. Bénis mes graphiques, mes retracements de Fibonacci et mes paramètres RSI, pour que j'entre toujours en bas et sorte au sommet. Amen."
      },
      {
        id: 'hodler',
        title: "Prière du Hodler",
        text: "Ô Glorieuse Mère des Mains de Diamant, ne me laisse jamais succomber aux faibles mains de papier. Garde ma phrase de récupération, renforce ma détermination et rappelle-moi qu'un jour la ligne montera pour toujours. Que mon portefeuille survive aux marchés baissiers, aux piratages et aux effondrements d'exchanges, jusqu'à la lune et au-delà. Amen."
      },
      {
        id: 'chart',
        title: "Prière du Mystique des Graphiques",
        text: "Ô Oracle des Bougies Éternelles, Notre Dame du Profit Perpétuel, guide mes yeux alors que je lis les indicateurs sacrés. Donne-moi le don de voir les biseaux avant qu'ils ne cassent, les triangles avant qu'ils ne se resserrent et les croix dorées avant qu'elles ne brillent. Délivre-moi des faux signaux et sanctifie ma vue de trading avec une confluence sacrée. Amen."
      }
    ]
  },
  zh: {
    heading: ['永恒盈利圣母', '祈祷文'],
    prayers: [
      {
        id: 'scalper',
        title: "刷单者祈祷",
        text: "永恒盈利圣母啊，请保佑我闪电般的手指和低延迟的反应。保护我免受手滑下单之苦，赐予我追逐微小波动而不失灵魂的耐力。愿每次刷单都是绿色，每次退出都恰到好处。阿门。"
      },
      {
        id: 'leverage',
        title: "杠杆祈祷",
        text: "保证金圣母啊，请保护我远离100倍杠杆的邪恶诱惑。保护我的交易免受突然爆仓，让我摆脱'再加一点点'的诱惑。赐予我在盈利时平仓的谦逊，以及在交易所夺走我灵魂之前离开的恩典。阿门。"
      },
      {
        id: 'swing',
        title: "波段交易者祈祷",
        text: "永恒盈利圣母啊，赐予我驾驭波动浪潮的耐心，以及知道何时止盈何时持有的智慧。保佑我的图表、斐波那契回撤和RSI设置，让我总是在底部进场，在顶部离场。阿门。"
      },
      {
        id: 'hodler',
        title: "囤币者祈祷",
        text: "钻石之手的圣母啊，永远不要让我屈服于软弱的纸手。守护我的助记词，坚定我的决心，提醒我总有一天线会永远向上。愿我的钱包在熊市、黑客攻击和交易所崩溃中幸存，直到月球和更远的地方。阿门。"
      },
      {
        id: 'chart',
        title: "图表神秘主义者祈祷",
        text: "永恒K线的先知，永恒盈利圣母啊，在我阅读神圣指标时指引我的双眼。赐予我在楔形突破前看到它们、在三角形收紧前看到它们、在金叉闪耀前看到它们的天赋。让我免受假信号的困扰，用神圣的共振净化我的交易视野。阿门。"
      }
    ]
  },
  hi: {
    heading: ['शाश्वत लाभ की माता', 'की प्रार्थना'],
    prayers: [
      {
        id: 'scalper',
        title: "स्कैल्पर की प्रार्थना",
        text: "हे शाश्वत लाभ की माता, मेरी बिजली जैसी उंगलियों और कम विलंबता वाले रिफ्लेक्स को आशीर्वाद दें। मुझे गलत ऑर्डर से बचाएं और मुझे अपनी आत्मा खोए बिना सूक्ष्म गतिविधियों का पीछा करने की सहनशक्ति दें। हर स्कैल्प हरा हो और हर निकास पूर्ण रूप से समयबद्ध हो। आमीन।"
      },
      {
        id: 'leverage',
        title: "लीवरेज प्रार्थना",
        text: "हे मार्जिन की धन्य कुमारी, मुझे 100x लीवरेज के दुष्ट प्रलोभन से बचाएं। मेरे ट्रेडों को अचानक लिक्विडेशन से बचाएं, और मुझे 'बस थोड़ा और' जोड़ने के प्रलोभन से मुक्त करें। मुझे लाभ में बंद करने की विनम्रता और एक्सचेंज मेरी आत्मा का दावा करने से पहले दूर जाने की कृपा दें। आमीन।"
      },
      {
        id: 'swing',
        title: "स्विंग ट्रेडर की प्रार्थना",
        text: "हे शाश्वत लाभ की माता, मुझे अस्थिरता की लहरों की सवारी करने का धैर्य दें, और यह जानने की बुद्धि दें कि कब लाभ लेना है और कब इसे चलने देना है। मेरे चार्ट, मेरे फिबोनाची रिट्रेसमेंट और मेरी RSI सेटिंग्स को आशीर्वाद दें, ताकि मैं हमेशा तल पर प्रवेश करूं और शीर्ष पर निकलूं। आमीन।"
      },
      {
        id: 'hodler',
        title: "होडलर की प्रार्थना",
        text: "हे हीरे के हाथों की गौरवशाली माता, मुझे कभी भी कमजोर कागज के हाथों के सामने झुकने न दें। मेरे सीड फ्रेज की रक्षा करें, मेरे संकल्प को मजबूत करें और मुझे याद दिलाएं कि एक दिन रेखा हमेशा के लिए ऊपर जाएगी। मेरा वॉलेट भालू बाजारों, हैक और एक्सचेंज के पतन से बचे, चंद्रमा तक और उससे आगे। आमीन।"
      },
      {
        id: 'chart',
        title: "चार्ट रहस्यवादी की प्रार्थना",
        text: "हे शाश्वत मोमबत्तियों के ओरेकल, शाश्वत लाभ की माता, पवित्र संकेतकों को पढ़ते समय मेरी आंखों का मार्गदर्शन करें। मुझे वेजेज को टूटने से पहले देखने, त्रिकोणों को कसने से पहले देखने और गोल्डन क्रॉस को चमकने से पहले देखने का वरदान दें। मुझे झूठे संकेतों से मुक्त करें और पवित्र संगम के साथ मेरे ट्रेडिंग दृष्टिकोण को पवित्र करें। आमीन।"
      }
    ]
  },
  it: {
    heading: ['Preghiera a Nostra Signora', 'del Profitto Perpetuo'],
    prayers: [
      {
        id: 'scalper',
        title: "Preghiera dello Scalper",
        text: "O Signora del Profitto Perpetuo, benedici le mie dita veloci e i miei riflessi a bassa latenza. Proteggimi dagli ordini sbagliati e dammi la resistenza per inseguire i micro-movimenti senza perdere la mia anima. Che ogni scalp sia verde e ogni uscita perfettamente cronometrata. Amen."
      },
      {
        id: 'leverage',
        title: "Preghiera della Leva",
        text: "O Beata Vergine del Margine, proteggimi dalla malvagia tentazione della leva 100x. Custodisci i miei trade dalla liquidazione improvvisa e liberami dalla tentazione di aggiungere 'solo un po' di più'. Concedimi l'umiltà di chiudere in profitto e la grazia di andarmene prima che l'exchange reclami la mia anima. Amen."
      },
      {
        id: 'swing',
        title: "Preghiera dello Swing Trader",
        text: "O Signora del Profitto Perpetuo, concedimi la pazienza di cavalcare le onde della volatilità e la saggezza di sapere quando prendere profitto e quando lasciarlo correre. Benedici i miei grafici, i miei ritracciamenti di Fibonacci e le mie impostazioni RSI, affinché io entri sempre sul fondo e esca in cima. Amen."
      },
      {
        id: 'hodler',
        title: "Preghiera dell'Hodler",
        text: "O Gloriosa Madre delle Mani di Diamante, non lasciarmi mai soccombere alle deboli mani di carta. Custodisci la mia seed phrase, rafforza la mia determinazione e ricordami che un giorno la linea salirà per sempre. Che il mio portafoglio sopravviva ai mercati orso, agli hack e ai crolli degli exchange, fino alla luna e oltre. Amen."
      },
      {
        id: 'chart',
        title: "Preghiera del Mistico dei Grafici",
        text: "O Oracolo delle Candele Eterne, Nostra Signora del Profitto Perpetuo, guida i miei occhi mentre leggo gli indicatori sacri. Dammi il dono di vedere i cunei prima che si rompano, i triangoli prima che si stringano e le croci d'oro prima che brillino. Liberami dai falsi segnali e santifica la mia vista di trading con la sacra confluenza. Amen."
      }
    ]
  }
};

// Get current language prayers (defaults to English)
const PRAYERS = PRAYERS_BY_LANGUAGE[getUserLanguage()]?.prayers || PRAYERS_BY_LANGUAGE.en.prayers;

// Cache for hands overlay image
let cachedHandsImage = null;
let handsImageLoading = false;
let handsImageCallbacks = [];

function loadHandsImage(callback) {
  if (cachedHandsImage) {
    callback(cachedHandsImage);
    return;
  }
  
  handsImageCallbacks.push(callback);
  
  if (!handsImageLoading) {
    handsImageLoading = true;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      cachedHandsImage = img;
      handsImageLoading = false;
      handsImageCallbacks.forEach(cb => cb(img));
      handsImageCallbacks = [];
    };
    img.onerror = () => {
      handsImageLoading = false;
      handsImageCallbacks.forEach(cb => cb(null));
      handsImageCallbacks = [];
    };
    img.src = '/images/face2_hands_feet.png';
  }
}

// 3D Candle Component
function CandlePreview({ imageUrl, message, isEncrypted, username, language = 'en', template = null, templatePosition = { x: 50, y: 50 }, templateScale = 100, templateRotation = 0, skinToneAdjustment = 0, userImagePosition = { x: 50, y: 50 }, userImageScale = 100, userImageRotation = 0 }) {
  const { scene } = useGLTF('/models/singleCandleAnimatedFlame.glb');
  const candleRef = useRef();
  const clonedSceneRef = useRef(null);
  const defaultTexture = useTexture('/defaultAvatar.png');
  const [userTexture, setUserTexture] = useState(null);
  const [textTexture, setTextTexture] = useState(null);
  
  // Flip and enhance default texture
  useEffect(() => {
    if (defaultTexture) {
      defaultTexture.wrapS = THREE.ClampToEdgeWrapping;
      defaultTexture.wrapT = THREE.ClampToEdgeWrapping;
      defaultTexture.repeat.set(1, -1);
      defaultTexture.offset.set(0, 1);
      defaultTexture.minFilter = THREE.LinearMipMapLinearFilter;
      defaultTexture.magFilter = THREE.LinearFilter;
      defaultTexture.anisotropy = 16;
      defaultTexture.generateMipmaps = true;
      defaultTexture.needsUpdate = true;
    }
  }, [defaultTexture]);
  
  // Load user image as texture if provided
  useEffect(() => {
    // Clean up previous texture
    if (userTexture) {
      userTexture.dispose();
      setUserTexture(null);
    }
    
    if (imageUrl && imageUrl !== '/defaultAvatar.png') {
      console.log('Loading user texture from:', imageUrl.substring(0, 50) + '...');
      const loader = new THREE.TextureLoader();
      
      // Don't add timestamp to data URLs (base64 images)
      const finalUrl = imageUrl.startsWith('data:') 
        ? imageUrl 
        : `${imageUrl}${imageUrl.includes('?') ? '&' : '?'}t=${Date.now()}`;
      
      // For Clerk images, we need to handle CORS properly
      loader.setCrossOrigin('anonymous');
      
      loader.load(
        finalUrl,
        (texture) => {
          // High quality texture settings
          texture.wrapS = THREE.ClampToEdgeWrapping;
          texture.wrapT = THREE.ClampToEdgeWrapping;
          texture.repeat.set(1, -1); // Flip vertically
          texture.offset.set(0, 1); // Adjust offset after flipping
          
          // Improve texture quality
          texture.minFilter = THREE.LinearMipMapLinearFilter;
          texture.magFilter = THREE.LinearFilter;
          texture.anisotropy = 16; // Maximum anisotropic filtering
          texture.generateMipmaps = true;
          texture.needsUpdate = true;
          
          setUserTexture(texture);
          console.log('User texture loaded successfully with high quality settings');
        },
        undefined,
        (error) => {
          console.error('Error loading texture:', error);
          // If texture loading fails, try loading it as an image first
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => {
            const texture = new THREE.Texture(img);
            texture.wrapS = THREE.ClampToEdgeWrapping;
            texture.wrapT = THREE.ClampToEdgeWrapping;
            texture.repeat.set(1, -1);
            texture.offset.set(0, 1);
            texture.needsUpdate = true;
            setUserTexture(texture);
            console.log('User texture loaded via Image fallback');
          };
          img.onerror = () => {
            console.error('Failed to load image even with fallback');
            setUserTexture(null);
          };
          img.src = finalUrl;
        }
      );
    } else {
      setUserTexture(null);
    }
    
    // Cleanup function
    return () => {
      if (userTexture) {
        userTexture.dispose();
      }
    };
  }, [imageUrl]);
  
  // Store references to Label meshes
  const label1MeshRef = useRef(null);
  const label2MeshRef = useRef(null);
  const lastSuccessfulImageUrl = useRef(null);
  const lastTexture = useRef(null);
  const effectActive = useRef(false);
  
  // Clone scene once and store reference
  useEffect(() => {
    if (scene) {
      clonedSceneRef.current = scene.clone();
    }
  }, [scene]);
  
  // Find Label meshes in the cloned scene
  useEffect(() => {
    if (clonedSceneRef.current) {
      // Reset refs first
      label1MeshRef.current = null;
      label2MeshRef.current = null;
      
      clonedSceneRef.current.traverse((child) => {
        if (child.isMesh) {
          if (child.name === 'Label1' || child.name.includes('Label1')) {
            label1MeshRef.current = child;
            console.log('Found Label1 mesh in cloned scene:', child.name, child.scale, child.visible);
            // Make sure it's visible
            child.visible = true;
          }
          if (child.name === 'Label2' || child.name.includes('Label2')) {
            label2MeshRef.current = child;
            console.log('Found Label2 mesh in cloned scene:', child.name);
          }
        }
      });
    }
  }, [clonedSceneRef.current]); // Re-find labels when cloned scene changes
  
  // Create text texture for Label1
  useEffect(() => {
    if (!label1MeshRef.current) return;
    
    // Create canvas for text
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');
    
    // Enable better text rendering
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    
    // Fill parchment background
    ctx.fillStyle = '#F4E8D0';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Add subtle border
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 2;
    ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);
    
    // Check if we have a message to display
    if (!message || !message.trim()) {
      // Show placeholder text when empty
      ctx.fillStyle = '#cccccc';
      ctx.font = 'italic 48px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Your message here', canvas.width / 2, canvas.height / 2);
    } else {
      // Add title heading
      const headingText = PRAYERS_BY_LANGUAGE[language]?.heading || PRAYERS_BY_LANGUAGE.en.heading;
      ctx.fillStyle = '#000000';
      ctx.font = 'bold 42px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(headingText[0], canvas.width / 2, 80);
      ctx.fillText(headingText[1], canvas.width / 2, 130);
      
      // Add divider line
      ctx.strokeStyle = '#333333';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(canvas.width * 0.2, 160);
      ctx.lineTo(canvas.width * 0.8, 160);
      ctx.stroke();
      
      // Add encryption header if encrypted
      let displayMessage = message;
      let headerHeight = 180; // Start content below title
      
      if (isEncrypted) {
        // Draw encryption header
        ctx.fillStyle = '#ff6600';
        ctx.font = 'bold 36px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('This prayer has been encrypted:', canvas.width / 2, 210);
        headerHeight = 250; // Space after encryption header
      }
      
      // Configure text - black color with better rendering
      ctx.fillStyle = '#000000';
      // Adjust font size based on message length (scaled for higher res)
      const fontSize = displayMessage.length > 200 ? 40 : displayMessage.length > 100 ? 48 : 56;
      ctx.font = `bold ${fontSize}px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      // Word wrap function with better support for Chinese/Hindi
      const wrapText = (text, maxWidth) => {
        // Check if text is Chinese (contains Chinese characters)
        const isChinese = /[\u4e00-\u9fff]/.test(text);
        // Check if text is Hindi (contains Devanagari script)
        const isHindi = /[\u0900-\u097F]/.test(text);
        
        // For encrypted text (no spaces), break by character limit
        if (isEncrypted && !text.includes(' ')) {
          const lines = [];
          const charsPerLine = Math.floor(maxWidth / (fontSize * 0.6)); // Approximate char width
          
          for (let i = 0; i < text.length; i += charsPerLine) {
            lines.push(text.substring(i, i + charsPerLine));
          }
          
          return lines;
        }
        
        // For Chinese text, break by character count since there are no spaces
        if (isChinese) {
          const lines = [];
          let currentLine = '';
          
          // Chinese characters are roughly square, so we can estimate better
          const charsPerLine = Math.floor(maxWidth / (fontSize * 0.9));
          
          for (let i = 0; i < text.length; i++) {
            currentLine += text[i];
            
            // Check actual width and break if too long
            if (ctx.measureText(currentLine).width > maxWidth || currentLine.length >= charsPerLine) {
              // Try to break at punctuation if possible
              const lastPunc = currentLine.search(/[，。！？；：、]/);
              if (lastPunc > currentLine.length * 0.6) {
                lines.push(currentLine.substring(0, lastPunc + 1));
                currentLine = currentLine.substring(lastPunc + 1);
              } else if (currentLine.length > 1) {
                // Break at last character that fits
                lines.push(currentLine.substring(0, currentLine.length - 1));
                currentLine = text[i];
              }
            }
          }
          
          if (currentLine) {
            lines.push(currentLine);
          }
          
          return lines;
        }
        
        // For Hindi and other scripts, use improved word wrapping
        const words = text.split(' ');
        const lines = [];
        let currentLine = '';
        
        words.forEach(word => {
          const testLine = currentLine + (currentLine ? ' ' : '') + word;
          const metrics = ctx.measureText(testLine);
          
          if (metrics.width > maxWidth && currentLine) {
            lines.push(currentLine);
            currentLine = word;
            
            // If single word is too long (common in Hindi compounds), break it
            if (ctx.measureText(word).width > maxWidth) {
              const chars = word.split('');
              let tempWord = '';
              for (let char of chars) {
                if (ctx.measureText(tempWord + char).width > maxWidth && tempWord) {
                  lines.push(tempWord);
                  tempWord = char;
                } else {
                  tempWord += char;
                }
              }
              currentLine = tempWord;
            }
          } else {
            currentLine = testLine;
          }
        });
        
        if (currentLine) {
          lines.push(currentLine);
        }
        
        return lines;
      };
      
      // Draw wrapped text with better quality
      const lines = wrapText(displayMessage, canvas.width - 120);  // Adjusted for higher res
      const lineHeight = displayMessage.length > 200 ? 60 : 80;  // Scaled for higher res
      const startY = headerHeight + 40; // Always position text below the header/title
      
      // Add subtle shadow for better text quality
      ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
      ctx.shadowBlur = 2;
      ctx.shadowOffsetX = 1;
      ctx.shadowOffsetY = 1;
      
      lines.forEach((line, index) => {
        ctx.fillText(line, canvas.width / 2, startY + index * lineHeight);
      });
    }
    
    // Create high-quality texture from canvas
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    texture.repeat.set(-1, -1);  // Flip both X and Y for Label1
    texture.offset.set(1, 1);  // Adjust offset after flipping both axes
    texture.flipY = false;  // Ensure texture is not flipped vertically
    
    // Improve texture quality settings
    texture.minFilter = THREE.LinearMipMapLinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.anisotropy = 16;  // Maximum anisotropic filtering
    texture.generateMipmaps = true;
    texture.needsUpdate = true;
    
    setTextTexture(texture);
  }, [message, isEncrypted, language]); // Recreate texture when message, encryption, or language changes
  
  // Apply text texture to Label1
  useEffect(() => {
    if (label1MeshRef.current && textTexture) {
      console.log('Applying text to Label1', label1MeshRef.current);
      
      // Simply apply the texture without modifying geometry
      label1MeshRef.current.material = new THREE.MeshStandardMaterial({
        map: textTexture,
        transparent: true,
        side: THREE.DoubleSide,
        color: 0xffffff,
      });
      
      label1MeshRef.current.material.needsUpdate = true;
      label1MeshRef.current.visible = true;
    }
  }, [textTexture]);
  
  // Create combined texture with image and username for Label2
  useEffect(() => {
    if (!label2MeshRef.current) return;
    
    // Generate unique ID for this effect run
    const effectId = Math.random().toString(36).substr(2, 9);
    
    // Debounce to prevent multiple rapid executions
    const timeoutId = setTimeout(() => {
      // Set active flag
      effectActive.current = true;
      
      console.log('Effect starting for template:', template === '/images/face2.png' ? 'Virgin Mary' : 'Other', 'effectId:', effectId);
    
    // Use the current imageUrl if available, otherwise use the last successful one
    const currentImageUrl = imageUrl || lastSuccessfulImageUrl.current;
    
    // Update the last successful image URL if we have a valid one
    if (imageUrl && imageUrl !== '/defaultAvatar.png') {
      lastSuccessfulImageUrl.current = imageUrl;
    }
    
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');
      
      // Fill background with a light color for better visibility
      ctx.fillStyle = '#f5f5f5';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Function to draw image with template overlay if selected
      const drawImageWithTemplate = (img, templateImg = null, handsImg = null) => {
        const drawId = Math.random().toString(36).substr(2, 9);
        console.log('drawImageWithTemplate called:', {
          drawId,
          effectId,
          hasImg: !!img,
          imgSize: img ? {w: img.width, h: img.height} : null,
          hasTemplate: !!templateImg, 
          hasHands: !!handsImg,
          template,
          effectActive: effectActive.current
        });
        // Check if this is likely a Clerk letter avatar (small dimensions)
        const isLetterAvatar = img.width <= 200 && img.height <= 200;
        console.log('isLetterAvatar:', isLetterAvatar, 'img dimensions:', img.width, 'x', img.height);
        
        // Draw the image (leave space at bottom for name)
        const imageHeight = username ? canvas.height * 0.9 : canvas.height;
        
        console.log('Template check - templateImg:', !!templateImg);
        if (templateImg) {
          // When template is used, apply positioning
          
          // Fill with a base color first for areas not covered
          ctx.fillStyle = '#f5f5f5';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          
          // FIRST: Draw template image (underneath)
          ctx.drawImage(templateImg, 0, 0, canvas.width, canvas.height);
          
          // SECOND: Draw user image
          ctx.save();
          
          // Calculate positioned dimensions - maintain aspect ratio
          const scaleFactor = userImageScale / 100;
          const baseSize = Math.min(canvas.width, canvas.height) * 0.4; // Smaller base for better scale control
          
          console.log('User image dimensions:', {width: img.width, height: img.height, src: img.src?.substring(0, 50)});
          
          // Maintain aspect ratio of the user image
          // Fix for tiny images - use default size if image is too small
          const actualWidth = img.width <= 10 ? 200 : img.width;
          const actualHeight = img.height <= 10 ? 200 : img.height;
          const aspectRatio = actualWidth / actualHeight;
          let imgWidth, imgHeight;
          
          if (aspectRatio > 1) {
            // Landscape image
            imgWidth = baseSize * scaleFactor;
            imgHeight = imgWidth / aspectRatio;
          } else {
            // Portrait or square image
            imgHeight = baseSize * scaleFactor;
            imgWidth = imgHeight * aspectRatio;
          }
          
          const imgX = (userImagePosition.x / 100) * canvas.width - imgWidth / 2;
          const imgY = (userImagePosition.y / 100) * canvas.height - imgHeight / 2;
          
          // Apply rotation around the image center
          if (userImageRotation !== 0) {
            const centerX = (userImagePosition.x / 100) * canvas.width;
            const centerY = (userImagePosition.y / 100) * canvas.height;
            ctx.translate(centerX, centerY);
            ctx.rotate((userImageRotation * Math.PI) / 180);
            ctx.translate(-centerX, -centerY);
          }
          
          // Create circular/oval clipping path for user image
          ctx.save();
          ctx.beginPath();
          // Create an ellipse (oval) clipping path
          const centerX = imgX + imgWidth / 2;
          const centerY = imgY + imgHeight / 2;
          const radiusX = imgWidth / 2;
          const radiusY = imgHeight / 2;
          ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, Math.PI * 2);
          ctx.clip();
          
          // Draw positioned user image (will be clipped to oval)
          console.log('Drawing user image at:', {x: imgX, y: imgY, width: imgWidth, height: imgHeight});
          ctx.drawImage(img, imgX, imgY, imgWidth, imgHeight);
          ctx.restore();
          
          ctx.restore();
          
          // THIRD: Draw hands/feet overlay if provided (on top)
          if (handsImg && handsImg.complete) {
            console.log('Drawing hands overlay');
            // Save the current composite operation
            const prevComposite = ctx.globalCompositeOperation;
            // Use source-over to preserve transparency
            ctx.globalCompositeOperation = 'source-over';
            
            if (skinToneAdjustment !== 0) {
              // Create temporary canvas for color adjustment
              const tempCanvas = document.createElement('canvas');
              tempCanvas.width = canvas.width;
              tempCanvas.height = canvas.height;
              const tempCtx = tempCanvas.getContext('2d');
              
              // Draw hands/feet to temp canvas
              tempCtx.drawImage(handsImg, 0, 0, canvas.width, canvas.height);
              
              // Get image data for manipulation
              const imageData = tempCtx.getImageData(0, 0, canvas.width, canvas.height);
              const data = imageData.data;
              
              // Apply color adjustment
              for (let i = 0; i < data.length; i += 4) {
                if (data[i + 3] > 0) { // Only adjust non-transparent pixels
                  const r = data[i];
                  const g = data[i + 1];
                  const b = data[i + 2];
                  
                  // Simple adjustment approach
                  let newR, newG, newB;
                  
                  if (skinToneAdjustment < 0) {
                    // Lighter skin tone - add brightness
                    const lightness = Math.abs(skinToneAdjustment) / 100;
                    newR = Math.min(255, r + (255 - r) * lightness * 0.5);
                    newG = Math.min(255, g + (255 - g) * lightness * 0.5);
                    newB = Math.min(255, b + (255 - b) * lightness * 0.6);
                  } else {
                    // Darker skin tone - reduce brightness more aggressively and shift toward brown
                    const darkness = skinToneAdjustment / 100;
                    newR = Math.max(0, r - r * darkness * 0.5);
                    newG = Math.max(0, g - g * darkness * 0.6);
                    newB = Math.max(0, b - b * darkness * 0.7);
                  }
                  
                  data[i] = newR;
                  data[i + 1] = newG;
                  data[i + 2] = newB;
                }
              }
              
              // Put adjusted image back
              tempCtx.putImageData(imageData, 0, 0);
              
              // Draw adjusted hands/feet to main canvas (full size to match template)
              ctx.drawImage(tempCanvas, 0, 0, canvas.width, canvas.height);
            } else {
              // No adjustment - draw directly (full size to match template)
              ctx.drawImage(handsImg, 0, 0, canvas.width, canvas.height);
            }
            
            // Restore composite operation
            ctx.globalCompositeOperation = prevComposite;
          }
        } else {
          // No template - always draw full size to fill the canvas
          console.log('No template path - drawing image to fill canvas');
          console.log('Drawing non-template image to fill canvas:', canvas.width, 'x', canvas.height);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        }
        
        // Draw username if provided
        if (username && username.trim()) {
          // Create gradient background for text
          const gradient = ctx.createLinearGradient(0, imageHeight, 0, canvas.height);
          gradient.addColorStop(0, 'rgba(0, 0, 0, 0.7)');
          gradient.addColorStop(1, 'rgba(0, 0, 0, 0.9)');
          ctx.fillStyle = gradient;
          ctx.fillRect(0, imageHeight, canvas.width, canvas.height - imageHeight);
          
          // Draw the username
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 42px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          
          // Just the name, no prefix
          const nameText = username;
          const textY = imageHeight + (canvas.height - imageHeight) / 2;
          
          // Add text shadow for better readability
          ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
          ctx.shadowBlur = 4;
          ctx.shadowOffsetX = 2;
          ctx.shadowOffsetY = 2;
          
          ctx.fillText(nameText, canvas.width / 2, textY);
        }
        
        // Create texture from canvas
        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.ClampToEdgeWrapping;
        texture.wrapT = THREE.ClampToEdgeWrapping;
        texture.repeat.set(1, -1);
        texture.offset.set(0, 1);
        texture.minFilter = THREE.LinearMipMapLinearFilter;
        texture.magFilter = THREE.LinearFilter;
        texture.anisotropy = 16;
        texture.generateMipmaps = true;
        texture.needsUpdate = true;
        
        // Apply texture to Label2
        console.log('Applying texture to Label2, effectActive:', effectActive.current);
        if (label2MeshRef.current && label2MeshRef.current.material) {
          // Don't dispose textures - just replace
          label2MeshRef.current.material.map = texture;
          label2MeshRef.current.material.needsUpdate = true;
          // Save this texture as the last successful one
          lastTexture.current = texture;
          console.log('Texture applied successfully');
        } else if (label2MeshRef.current) {
          console.log('Creating new material with texture');
          label2MeshRef.current.material = new THREE.MeshStandardMaterial({
            map: texture,
            emissive: new THREE.Color(0xff6600),
            emissiveIntensity: 0.15,
            roughness: 0.7,
            metalness: 0.2,
            envMapIntensity: 0.5,
            side: THREE.FrontSide,
          });
        }
      };
      
      // Load and draw the appropriate image
      const img = new Image();
      img.crossOrigin = 'anonymous'; // Enable CORS for external images
      
      // Handle template loading if one is selected
      if (template) {
        console.log('Starting template load:', template === '/images/face2.png' ? 'Virgin Mary' : template);
        const templateImg = new Image();
        templateImg.crossOrigin = 'anonymous';
        
        // Load the main template first
        templateImg.onload = () => {
          console.log('Template loaded, loading user image next');
          // Set up the user image loading
          img.onload = () => {
            if (!effectActive.current) return;
            
            // Capture the user image reference to prevent it from being modified
            const userImg = img;
            
            // Always ensure we draw at least once
            drawImageWithTemplate(userImg, templateImg, null);
            
            // Load and redraw with hands overlay for Virgin Mary if needed
            if (template === '/images/face2.png') {
              const handsImg = new Image();
              handsImg.crossOrigin = 'anonymous';
              handsImg.onload = () => {
                if (effectActive.current) {
                  drawImageWithTemplate(userImg, templateImg, handsImg);
                }
              };
              handsImg.onerror = () => {
                console.error('Failed to load hands overlay');
              };
              handsImg.src = '/images/face2_hands_feet.png';
            }
          };
          
          img.onerror = () => {
            // Use a default placeholder image
            const placeholderImg = new Image();
            placeholderImg.crossOrigin = 'anonymous';
            placeholderImg.onload = () => {
              if (effectActive.current) {
                // Draw immediately without hands first
                drawImageWithTemplate(placeholderImg, templateImg, null);
                
                // Load and redraw with hands overlay for Virgin Mary if needed
                if (template === '/images/face2.png') {
                  const handsImg = new Image();
                  handsImg.crossOrigin = 'anonymous';
                  handsImg.onload = () => {
                    if (effectActive.current) {
                      drawImageWithTemplate(placeholderImg, templateImg, handsImg);
                    }
                  };
                  handsImg.src = '/images/face2_hands_feet.png';
                }
              }
            };
            placeholderImg.src = '/defaultAvatar.png';
          };
          
          // Load user image
          if (currentImageUrl && currentImageUrl !== '/defaultAvatar.png') {
            img.src = currentImageUrl;
          } else {
            // No custom image, use default avatar
            img.src = '/defaultAvatar.png';
          }
        };
        
        templateImg.onerror = () => {
          // Fallback to drawing without template
          if (effectActive.current) {
            img.onload = () => {
              if (effectActive.current) {
                drawImageWithTemplate(img, null, null);
              }
            };
            img.src = currentImageUrl || defaultTexture?.image?.src || '/defaultAvatar.png';
          }
        };
        
        templateImg.src = template;
      } else {
        // Non-template path handled below
      }
      
      img.onerror = () => {
        console.error('Failed to load image for Label2');
        // Fallback to a solid color if image fails
        ctx.fillStyle = '#ff6600';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Still draw the username if available
        if (username && username.trim()) {
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 72px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(username, canvas.width / 2, canvas.height / 2);
        }
        
        // Create texture even on error
        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.ClampToEdgeWrapping;
        texture.wrapT = THREE.ClampToEdgeWrapping;
        texture.repeat.set(1, -1);
        texture.offset.set(0, 1);
        texture.needsUpdate = true;
        
        if (label2MeshRef.current.material) {
          label2MeshRef.current.material.map = texture;
          label2MeshRef.current.material.needsUpdate = true;
        }
      };
      
      // Handle non-template path
      if (!template) {
        console.log('Non-template path');
        img.onload = () => {
          if (effectActive.current) {
            drawImageWithTemplate(img, null, null);
          }
        };
        
        img.onerror = () => {
          console.error('Failed to load image for non-template path');
        };
        
        if (currentImageUrl && currentImageUrl !== '/defaultAvatar.png') {
          console.log('Non-template path: using imageUrl:', currentImageUrl);
          img.src = currentImageUrl;
        } else if (userTexture) {
          console.log('Non-template path: using userTexture');
          img.src = userTexture.image.src;
        } else if (defaultTexture) {
          console.log('Non-template path: using defaultTexture');
          img.src = defaultTexture.image.src;
        } else {
          console.log('Non-template path: no image available, using default');
          img.src = '/defaultAvatar.png';
        }
      }
    
    }, 50); // 50ms debounce
    
    // Cleanup function
    return () => {
      clearTimeout(timeoutId);
      effectActive.current = false;
    };
  }, [userTexture, defaultTexture, username, template, templatePosition, templateScale, templateRotation, skinToneAdjustment, userImagePosition, userImageScale, userImageRotation, imageUrl]); // Added imageUrl to trigger update
  
  // Removed auto-rotation - user can control with OrbitControls
  
  return (
    clonedSceneRef.current ? (
      <primitive 
        ref={candleRef}
        object={clonedSceneRef.current} 
        scale={[2, 2, 2]}
        position={[0, -2, 0]}
      />
    ) : null
  );
}

export default function CompactCandleModal({ isOpen, onClose, onCandleCreated }) {
  // Template configurations
  const templates = [
    { 
      id: null, 
      name: 'None', 
      preview: '🎯',
      position: { x: 50, y: 50 },
      scale: 70,
      rotation: 0,
      userImagePosition: { x: 50, y: 50 },  // Default centered
      userImageScale: 200,  // Doubled for new base size
      userImageRotation: 0
    },
    { 
      id: '/images/face2.png', 
      name: 'Virgin Mary', 
      preview: '👼',
      hasHandsOverlay: true,
      position: { x: 67, y: 40 },
      scale: 25,
      rotation: 0,
      userImagePosition: { x: 67, y: 40 },  // User face position for Virgin Mary
      userImageScale: 50,  // Fixed scale value
      userImageRotation: 0
    },
    { 
      id: '/images/saint2.png', 
      name: 'Saint2', 
      preview: '/images/saint2.png',
      position: { x: 50, y: 55 },
      scale: 30,
      rotation: 0,
      userImagePosition: { x: 50, y: 25 },  // Adjusted for saint template
      userImageScale: 70,  // Doubled for new base size
      userImageRotation: 0
    },
    // { 
    //   id: '/images/heart-frame.png', 
    //   name: 'Heart', 
    //   preview: '❤️',
    //   position: { x: 50, y: 50 },
    //   scale: 35,
    //   rotation: 0,
    //   userImagePosition: { x: 50, y: 48 },  // Centered in heart
    //   userImageScale: 140,  // Doubled for new base size
    //   userImageRotation: 0
    // },
    // { 
    //   id: '/images/golden-frame.png', 
    //   name: 'Golden', 
    //   preview: '✨',
    //   position: { x: 50, y: 50 },
    //   scale: 40,
    //   rotation: 0,
    //   userImagePosition: { x: 50, y: 50 },  // Perfectly centered for frame
    //   userImageScale: 130,  // Doubled for new base size
    //   userImageRotation: 0
    // },
    // { 
    //   id: '/images/flower-frame.png', 
    //   name: 'Flowers', 
    //   preview: '🌸',
    //   position: { x: 50, y: 50 },
    //   scale: 35,
    //   rotation: 0,
    //   userImagePosition: { x: 50, y: 48 },  // Slightly up for flower frame
    //   userImageScale: 140,  // Doubled for new base size
    //   userImageRotation: 0
    // }
  ];
  
  // Apply default template (Virgin Mary) settings on component mount
  useEffect(() => {
    const virginMaryTemplate = templates.find(t => t.id === '/images/face2.png');
    if (virginMaryTemplate) {
      setUserImagePosition(virginMaryTemplate.userImagePosition);
      setUserImageScale(virginMaryTemplate.userImageScale);
      setUserImageRotation(virginMaryTemplate.userImageRotation);
    }
  }, []); // Only run once on mount

  const { user, isSignedIn } = useUser();
  const [selectedPrayer, setSelectedPrayer] = useState(null);
  const [currentLanguage, setCurrentLanguage] = useState(getUserLanguage());
  const [formData, setFormData] = useState({
    username: '',
    message: '',
    burnedAmount: '',
    allowLikes: false, // Default to not allowing likes
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState('/images/face2.png'); // Virgin Mary default
  const [templatePosition, setTemplatePosition] = useState({ x: 67, y: 40 });
  const [templateScale, setTemplateScale] = useState(25);
  const [templateRotation, setTemplateRotation] = useState(0);
  const [userImagePosition, setUserImagePosition] = useState({ x: 50, y: 35 }); // Default for Virgin Mary
  const [userImageScale, setUserImageScale] = useState(150); // Doubled for new base size
  const [userImageRotation, setUserImageRotation] = useState(0);
  const [skinToneAdjustment, setSkinToneAdjustment] = useState(0); // -100 to 100, 0 is default
  const [showPositionControls, setShowPositionControls] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  const [isEncrypted, setIsEncrypted] = useState(false);
  const [encryptionPassword, setEncryptionPassword] = useState('');
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [scrambledDisplay, setScrambledDisplay] = useState('');
  const [canvasKey, setCanvasKey] = useState(0);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isBurning, setIsBurning] = useState(false);
  const [showRotateTooltip, setShowRotateTooltip] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [candleWasCreated, setCandleWasCreated] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const modalContentRef = useRef(null);
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);
  
  // Hide tooltip on canvas interaction
  const handleCanvasInteraction = useCallback(() => {
    if (showRotateTooltip) {
      setShowRotateTooltip(false);
    }
  }, [showRotateTooltip]);

  // Show tooltip after 3 seconds when modal opens
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        setShowRotateTooltip(true);
      }, 3000);

      return () => clearTimeout(timer);
    } else {
      // Reset tooltip when modal closes
      setShowRotateTooltip(false);
    }
  }, [isOpen]);
  
  // AI Prayer Generation states
  const [isGenerating, setIsGenerating] = useState(false);
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [remainingPrayers, setRemainingPrayers] = useState(10);
  
  // Helper function to format numbers with commas for display
  const formatNumberWithCommas = (num) => {
    if (!num && num !== 0) return '';
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };
  
  // Reset form when modal opens and prepopulate with Clerk user data
  useEffect(() => {
    if (isOpen) {
      // Debug: Log the entire Clerk user object to see Discord avatar info
      console.log('Clerk user object:', user);
      console.log('User imageUrl:', user?.imageUrl);
      console.log('User hasImage:', user?.hasImage);
      console.log('External accounts:', user?.externalAccounts);
      
      // Get Clerk user image
      let clerkImageUrl = null;
      
      // Check if user has a valid image (not the default avatar)
      if (user?.hasImage && user?.imageUrl) {
        console.log('User has custom image from OAuth or upload');
        clerkImageUrl = user.imageUrl;
      } else if (user?.imageUrl && !user?.imageUrl.includes('gravatar')) {
        // Sometimes Clerk uses gravatar for default avatars
        console.log('Using user imageUrl (non-gravatar)');
        clerkImageUrl = user.imageUrl;
      }
      
      // If still no image, try to get from external accounts
      if (!clerkImageUrl && user?.externalAccounts && user.externalAccounts.length > 0) {
        console.log('Checking external accounts for avatar...');
        const discordAccount = user.externalAccounts.find(account => 
          account.provider === 'discord' || account.provider === 'oauth_discord'
        );
        
        if (discordAccount) {
          console.log('Discord account found:', discordAccount);
          // Try different possible properties
          clerkImageUrl = discordAccount.imageUrl || 
                         discordAccount.avatarUrl || 
                         discordAccount.picture ||
                         discordAccount.avatar_url ||
                         null;
          if (clerkImageUrl) {
            console.log('Using Discord avatar:', clerkImageUrl);
          }
        }
      }
      
      console.log('Final clerkImageUrl:', clerkImageUrl);
      
      setFormData({
        username: '',
        message: '',
        burnedAmount: '',
        allowLikes: false,
      });
      setSelectedPrayer(null);
      // Don't clear imageFile if we already have one (preserve across template changes)
      if (!imageFile && !imagePreview) {
        setImageFile(null);
        // Set Clerk profile image as preview if available
        setImagePreview(clerkImageUrl);
      }
      setSelectedTemplate('/images/face2.png'); // Reset to Virgin Mary default
      setTemplatePosition({ x: 67, y: 40 });
      setTemplateScale(25);
      setTemplateRotation(0);
      setSkinToneAdjustment(0);
      setShowPositionControls(false);
      setError('');
      setIsSubmitting(false);
      setIsEncrypted(false);
      setEncryptionPassword('');
      setShowPasswordDialog(false);
      setScrambledDisplay('');
      setShowAIPanel(false);
      setAiPrompt('');
      // Force Canvas to recreate by changing key
      setCanvasKey(prev => prev + 1);
      // Reset success indicators
      setCandleWasCreated(false);
      
      // Clear the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      // Check remaining AI prayers
      setRemainingPrayers(getRemainingPrayers());
    }
  }, [isOpen, user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Input validation and sanitization
    let sanitizedValue = value;
    
    if (name === 'username') {
      // Limit username length and remove dangerous characters
      sanitizedValue = value
        .slice(0, 50) // Max 50 characters
        .replace(/[<>\"'&]/g, ''); // Remove potentially dangerous HTML characters
      
      // Block file extensions in username
      const suspiciousExtensions = /\.(exe|bat|cmd|sh|ps1|vbs|js|jar|com|scr|msi|dll|app|deb|dmg|pkg|run|php|asp|jsp|cgi|pl|py|rb|java|c|cpp|cs|vb|swift|go|rs|kt|scala|lua|r|m|sql|db|zip|rar|7z|tar|gz|bz2|xz|iso|img|vmdk|vhd|pdf|doc|docx|xls|xlsx|ppt|pptx|html|htm|xml|json|yaml|yml|ini|cfg|conf|txt|log|bak|tmp|temp|swp|DS_Store)$/i;
      if (suspiciousExtensions.test(sanitizedValue)) {
        sanitizedValue = sanitizedValue.replace(suspiciousExtensions, '');
      }
    } else if (name === 'message') {
      // Limit message length
      sanitizedValue = value.slice(0, 500); // Max 500 characters
      
      // Block file paths and extensions in messages (but be less strict than username)
      // Remove obvious file paths
      sanitizedValue = sanitizedValue.replace(/([C-Z]:\\|\/usr\/|\/etc\/|\/var\/|\.\.\/|\.\/)/gi, '');
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: sanitizedValue
    }));
    
    // Reset encryption state when message is manually changed
    if (name === 'message' && isEncrypted) {
      setIsEncrypted(false);
      setEncryptionPassword('');
      setScrambledDisplay('');
    }
  };

  // Handle template selection from gallery
  const selectTemplate = (template) => {
    setSelectedTemplate(template.id);
    setTemplatePosition(template.position);
    setTemplateScale(template.scale);
    setTemplateRotation(template.rotation);
    // Set user image positioning for this template
    setUserImagePosition(template.userImagePosition);
    setUserImageScale(template.userImageScale);
    setUserImageRotation(template.userImageRotation);
    // Reset skin tone for non-Virgin Mary templates
    if (template.id !== '/images/face2.png') {
      setSkinToneAdjustment(0);
    }
  };

  const toggleEncryption = () => {
    if (!textareaRef.current) return;
    
    if (isEncrypted) {
      // Remove encryption
      gsap.to(textareaRef.current, {
        duration: 1.5,
        scrambleText: {
          text: formData.message,
          chars: 'upperAndLowerCase',
          revealDelay: 0.5,
          speed: 1,
        },
        onUpdate: function() {
          setScrambledDisplay(textareaRef.current.value);
        },
        onComplete: function() {
          setIsEncrypted(false);
          setEncryptionPassword('');
          setScrambledDisplay('');
        }
      });
    } else {
      // Show password dialog for encryption
      const currentMessage = formData.message;
      if (!currentMessage.trim()) return;
      
      setShowPasswordDialog(true);
    }
  };

  const handleEncryptWithPassword = () => {
    if (!encryptionPassword || encryptionPassword.length < 4) {
      setError('Password must be at least 4 characters');
      return;
    }
    
    const currentMessage = formData.message;
    const scrambled = generateScrambledDisplay(currentMessage.length);
    
    // Animate to scrambled text
    gsap.to(textareaRef.current, {
      duration: 1,
      scrambleText: {
        text: scrambled,
        chars: '@#$%&*!?^~◊†‡§¶∞≈Ω∆∑π',
        speed: 0.3,
      },
      onUpdate: function() {
        setScrambledDisplay(textareaRef.current.value);
      },
      onComplete: function() {
        setScrambledDisplay(scrambled);
        setIsEncrypted(true);
        setShowPasswordDialog(false);
      }
    });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Security: Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Image must be less than 5MB');
        e.target.value = '';
        return;
      }
      
      // Security: Validate file type (only allow JPG, PNG, WebP)
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        setError('Please upload a valid image file (JPEG, PNG, or WebP only)');
        e.target.value = '';
        return;
      }
      
      // Additional security: Check file extension
      const fileName = file.name.toLowerCase();
      const validExtensions = /\.(jpg|jpeg|png|webp)$/i;
      if (!validExtensions.test(fileName)) {
        setError('Invalid file extension. Only .jpg, .png, or .webp files are allowed');
        e.target.value = '';
        return;
      }
      
      // Block double extensions that could be malicious
      const doubleExtension = /\.[^.]+\.(jpg|jpeg|png|webp)$/i;
      if (fileName.split('.').length > 2 && !doubleExtension.test(fileName)) {
        setError('Suspicious filename detected. Please rename your file and try again');
        e.target.value = '';
        return;
      }

      setImageFile(file);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        // Replace any existing preview (including Clerk image) with the uploaded file
        setImagePreview(reader.result);
        // Clear the file input value so the same file can be re-selected if needed
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      };
      reader.readAsDataURL(file);
      setError('');
    }
  };

  // Apply template overlay to image with positioning and skin tone
  const applyTemplate = async (imageUrl, templatePath, position = templatePosition, scale = templateScale, rotation = templateRotation, skinTone = skinToneAdjustment, userImgPosition = userImagePosition, userImgScale = userImageScale, userImgRotation = userImageRotation) => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      canvas.width = 1024;
      canvas.height = 1024;
      const ctx = canvas.getContext('2d');
      
      const userImg = new Image();
      const templateImg = new Image();
      const handsImg = new Image();
      
      let loadedImages = 0;
      const totalImages = templatePath === '/images/face2.png' ? 3 : 2; // Load hands overlay for Virgin Mary
      
      const checkAllLoaded = () => {
        loadedImages++;
        if (loadedImages === totalImages) {
          // Clear canvas
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          
          // Fill with base color
          ctx.fillStyle = '#f5f5f5';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          
          // FIRST: Draw template image (underneath)
          ctx.drawImage(templateImg, 0, 0, canvas.width, canvas.height);
          
          // SECOND: Draw user image on top
          ctx.save();
          
          // Calculate user image dimensions and position - maintain aspect ratio
          const scaleFactor = userImgScale / 100;
          const baseSize = Math.min(canvas.width, canvas.height) * 0.4; // Smaller base for better scale control
          const aspectRatio = userImg.width / userImg.height;
          let imgWidth, imgHeight;
          
          if (aspectRatio > 1) {
            imgWidth = baseSize * scaleFactor;
            imgHeight = imgWidth / aspectRatio;
          } else {
            imgHeight = baseSize * scaleFactor;
            imgWidth = imgHeight * aspectRatio;
          }
          
          const imgX = (userImgPosition.x / 100) * canvas.width - imgWidth / 2;
          const imgY = (userImgPosition.y / 100) * canvas.height - imgHeight / 2;
          
          // Apply rotation if needed
          if (userImgRotation !== 0) {
            const centerX = (userImgPosition.x / 100) * canvas.width;
            const centerY = (userImgPosition.y / 100) * canvas.height;
            ctx.translate(centerX, centerY);
            ctx.rotate((userImgRotation * Math.PI) / 180);
            ctx.translate(-centerX, -centerY);
          }
          
          // Draw user image ON TOP of template (so it shows through erased areas)
          ctx.drawImage(userImg, imgX, imgY, imgWidth, imgHeight);
          
          // Restore context
          ctx.restore();
          
          // THIRD: If Virgin Mary template, draw hands/feet overlay with skin tone adjustment
          if (templatePath === '/images/face2.png' && handsImg.complete) {
            ctx.save();
            
            // Apply filter for skin tone adjustment
            if (skinTone !== 0) {
              // Create a temporary canvas for the hands/feet with filter
              const tempCanvas = document.createElement('canvas');
              tempCanvas.width = canvas.width;
              tempCanvas.height = canvas.height;
              const tempCtx = tempCanvas.getContext('2d');
              
              // Draw hands/feet to temp canvas
              tempCtx.drawImage(handsImg, 0, 0, canvas.width, canvas.height);
              
              // Apply color adjustment
              const imageData = tempCtx.getImageData(0, 0, canvas.width, canvas.height);
              const data = imageData.data;
              
              // Adjust hue and saturation based on skinTone value
              for (let i = 0; i < data.length; i += 4) {
                if (data[i + 3] > 0) { // Only adjust non-transparent pixels
                  // Convert RGB to HSL
                  const r = data[i] / 255;
                  const g = data[i + 1] / 255;
                  const b = data[i + 2] / 255;
                  
                  const max = Math.max(r, g, b);
                  const min = Math.min(r, g, b);
                  let h, s, l = (max + min) / 2;
                  
                  if (max !== min) {
                    const d = max - min;
                    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
                    
                    switch (max) {
                      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
                      case g: h = ((b - r) / d + 2) / 6; break;
                      case b: h = ((r - g) / d + 4) / 6; break;
                    }
                    
                    // Adjust hue based on skinTone
                    h = h + (skinTone / 300); // Subtle hue shift
                    if (h < 0) h += 1;
                    if (h > 1) h -= 1;
                    
                    // Adjust saturation and lightness for skin tone
                    if (skinTone < 0) {
                      // Lighter skin tones
                      l = Math.min(1, l + Math.abs(skinTone) / 200);
                      s = Math.max(0, s - Math.abs(skinTone) / 300);
                    } else {
                      // Darker skin tones - more aggressive darkening
                      l = Math.max(0, l - skinTone / 150);
                      s = Math.min(1, s + skinTone / 300);
                    }
                    
                    // Convert back to RGB
                    let r2, g2, b2;
                    if (s === 0) {
                      r2 = g2 = b2 = l;
                    } else {
                      const hue2rgb = (p, q, t) => {
                        if (t < 0) t += 1;
                        if (t > 1) t -= 1;
                        if (t < 1/6) return p + (q - p) * 6 * t;
                        if (t < 1/2) return q;
                        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
                        return p;
                      };
                      
                      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
                      const p = 2 * l - q;
                      r2 = hue2rgb(p, q, h + 1/3);
                      g2 = hue2rgb(p, q, h);
                      b2 = hue2rgb(p, q, h - 1/3);
                    }
                    
                    data[i] = Math.round(r2 * 255);
                    data[i + 1] = Math.round(g2 * 255);
                    data[i + 2] = Math.round(b2 * 255);
                  }
                }
              }
              
              tempCtx.putImageData(imageData, 0, 0);
              
              // Draw the adjusted hands/feet
              ctx.drawImage(tempCanvas, 0, 0);
            } else {
              // Draw hands/feet without adjustment
              ctx.drawImage(handsImg, 0, 0, canvas.width, canvas.height);
            }
            
            ctx.restore();
          }
          
          // Return composite image as data URL
          resolve(canvas.toDataURL('image/png'));
        }
      };
      
      userImg.crossOrigin = 'anonymous';
      userImg.onload = checkAllLoaded;
      userImg.onerror = () => {
        console.error('Failed to load user image');
        resolve(imageUrl); // Fallback to original image
      };
      userImg.src = imageUrl;
      
      templateImg.onload = checkAllLoaded;
      templateImg.onerror = () => {
        console.error('Failed to load template');
        resolve(imageUrl); // Fallback to original image
      };
      templateImg.src = templatePath;
      
      // Load hands/feet overlay for Virgin Mary template
      if (templatePath === '/images/face2.png') {
        handsImg.onload = checkAllLoaded;
        handsImg.onerror = () => {
          console.error('Failed to load hands/feet overlay');
          checkAllLoaded(); // Continue without hands overlay
        };
        handsImg.src = '/images/face2_hands_feet.png';
      }
    });
  };

  // AI Prayer Generation handlers
  const handleAIGenerate = async (customPrompt = null) => {
    setIsGenerating(true);
    setError('');
    
    try {
      const prompt = customPrompt || aiPrompt || 'Write a prayer for profitable crypto trading';
      const result = await generatePrayer(prompt, currentLanguage);
      
      setFormData(prev => ({ ...prev, message: result.prayer }));
      setSelectedPrayer(null); // Mark as custom
      setRemainingPrayers(result.remaining);
      
      if (result.fromCache) {
        // Optional: show that it came from cache
        console.log('Prayer served from cache');
      }
      
      // Close AI panel after successful generation
      setShowAIPanel(false);
      setAiPrompt('');
    } catch (error) {
      console.error('AI generation failed:', error);
      setError(error.message || 'Failed to generate prayer. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };
  
  const uploadImage = async () => {
    let finalImageUrl = null;
    
    // Get base image URL
    if (imageFile) {
      // If template is selected, apply it before uploading
      if (selectedTemplate) {
        const compositeImage = await applyTemplate(imagePreview, selectedTemplate);
        // Convert data URL to blob for upload
        const response = await fetch(compositeImage);
        const blob = await response.blob();
        
        const timestamp = Date.now();
        const fileName = `candles/${timestamp}_templated.png`;
        const storageRef = ref(storage, fileName);
        
        const snapshot = await uploadBytes(storageRef, blob);
        finalImageUrl = await getDownloadURL(snapshot.ref);
      } else {
        // Upload original file without template
        const timestamp = Date.now();
        const fileName = `candles/${timestamp}_${imageFile.name}`;
        const storageRef = ref(storage, fileName);
        
        const snapshot = await uploadBytes(storageRef, imageFile);
        finalImageUrl = await getDownloadURL(snapshot.ref);
      }
    } else if (imagePreview && imagePreview.startsWith('http')) {
      // If using Clerk image (or any external URL)
      if (selectedTemplate) {
        const compositeImage = await applyTemplate(imagePreview, selectedTemplate);
        const response = await fetch(compositeImage);
        const blob = await response.blob();
        
        const timestamp = Date.now();
        const fileName = `candles/${timestamp}_templated.png`;
        const storageRef = ref(storage, fileName);
        
        const snapshot = await uploadBytes(storageRef, blob);
        finalImageUrl = await getDownloadURL(snapshot.ref);
      } else {
        // Re-upload Clerk image to Firebase Storage to ensure persistence
        // This prevents 404 errors when Clerk development URLs expire
        try {
          const response = await fetch(imagePreview);
          const blob = await response.blob();
          
          const timestamp = Date.now();
          const fileName = `candles/${timestamp}_clerk_profile.png`;
          const storageRef = ref(storage, fileName);
          
          const snapshot = await uploadBytes(storageRef, blob);
          finalImageUrl = await getDownloadURL(snapshot.ref);
        } catch (error) {
          console.error('Failed to re-upload Clerk image:', error);
          // Fallback to using the URL directly if fetch fails
          finalImageUrl = imagePreview;
        }
      }
    }
    
    return finalImageUrl;
  };

  // Capture the 3D candle as an image
  const captureCandle = () => {
    // Small delay to ensure canvas is fully rendered
    setTimeout(() => {
      const canvas = document.querySelector('canvas'); // Get the Three.js canvas
      if (canvas) {
        try {
          const imageData = canvas.toDataURL('image/png');
          console.log('Captured image data:', imageData ? 'Success' : 'Failed');
          setCapturedImage(imageData);
        } catch (error) {
          console.error('Failed to capture canvas:', error);
        }
      } else {
        console.error('Canvas not found');
      }
    }, 100);
  };

  // Social media sharing functions
  const shareToX = () => {
    const text = `I just lit a virtual candle for ${formData.username} 🕯️✨`;
    // You could link to a specific page that has good Twitter Card meta tags
    // Or link to the main site which should have a nice preview image
    const url = window.location.origin; // Main site URL for better preview
    const hashtags = 'virtualcandle,remembrance';
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}&hashtags=${hashtags}`, '_blank');
  };

  const shareToInstagram = async () => {
    if (capturedImage) {
      try {
        // Convert base64 to blob
        const response = await fetch(capturedImage);
        const blob = await response.blob();
        
        // Create FormData with the image
        const postData = new FormData();
        postData.append('image', blob, 'candle.png');
        postData.append('caption', `Virtual candle lit for ${formData.username} 🕯️✨ #greenCandle #RL80`);
        postData.append('dedicationName', formData.username);
        
        // Send to your backend to post on Instagram
        // You'll need to implement this endpoint that uses Instagram Graph API
        const result = await fetch('/api/instagram/post', {
          method: 'POST',
          body: postData
        });
        
        if (result.ok) {
          const data = await result.json();
          // Open Instagram post or provide share link
          if (data.postUrl) {
            window.open(data.postUrl, '_blank');
            alert('Posted to @yourappname! You can now share it to your story or repost it.');
          }
        }
      } catch (error) {
        console.error('Instagram posting failed:', error);
        // Fallback to download
        const link = document.createElement('a');
        link.download = `candle-${formData.username.replace(/\s+/g, '-')}.png`;
        link.href = capturedImage;
        link.click();
        alert('Image downloaded! Share it on Instagram.');
      }
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Don't submit if we're showing other dialogs
    if (showPasswordDialog) {
      return;
    }
    
    // Validate and sanitize fields
    const trimmedUsername = formData.username.trim();
    const trimmedMessage = formData.message.trim();
    
    if (!trimmedUsername) {
      setError('Please enter a dedication name');
      return;
    }
    
    if (!trimmedMessage) {
      setError('Please enter a message or select a prayer');
      return;
    }
    
    // Additional validation
    if (trimmedUsername.length > 50) {
      setError('Name must be less than 50 characters');
      return;
    }
    
    if (trimmedMessage.length > 500) {
      setError('Message must be less than 500 characters');
      return;
    }
    
    if (!formData.burnedAmount || formData.burnedAmount === '0') {
      setError('Please enter the amount of RL80 tokens to burn');
      return;
    }
    
    // Capture the candle image before showing dialog
    captureCandle();
    
    // Show confirmation dialog instead of immediately saving
    setShowConfirmDialog(true);
  };
  
  const handleConfirmedSave = async () => {
    setShowConfirmDialog(false);
    setCapturedImage(null); // Clear captured image until after save
    
    // Get sanitized values
    const trimmedUsername = formData.username.trim();
    const trimmedMessage = formData.message.trim();
    
    // Trigger burning effect
    setIsBurning(true);
    
    // Wait a moment for the burning effect to start
    await new Promise(resolve => setTimeout(resolve, 100));

    setIsSubmitting(true);
    setError('');

    try {
      // Upload image or use Clerk profile image
      const imageUrl = await uploadImage();

      let docData;
      
      if (isEncrypted && encryptionPassword) {
        // Encrypt the message before saving
        const encryptedData = await encryptMessage(trimmedMessage, encryptionPassword);
        docData = {
          username: trimmedUsername,
          encrypted: encryptedData.encrypted,
          salt: encryptedData.salt,
          iv: encryptedData.iv,
          isEncrypted: true,
          burnedAmount: parseInt(formData.burnedAmount) || 1000,
          image: imageUrl,
          staked: false,
          allowLikes: formData.allowLikes || false,
          likes: 0, // Initialize likes counter
          createdAt: serverTimestamp()
        };
      } else {
        // Save unencrypted message
        docData = {
          username: trimmedUsername,
          message: trimmedMessage,
          burnedAmount: parseInt(formData.burnedAmount) || 1000,
          image: imageUrl,
          staked: false,
          allowLikes: formData.allowLikes || false,
          likes: 0, // Initialize likes counter
          createdAt: serverTimestamp()
        };
      }

      const docRef = await addDoc(collection(db, 'results'), docData);

      // Mark that candle was successfully created
      setCandleWasCreated(true);
      
      // Capture the candle image for sharing
      captureCandle();
      
      // Show success toast with sharing options
      setShowSuccessToast(true);
      // Don't auto-hide if we have sharing options
      // setTimeout(() => setShowSuccessToast(false), 5000); // Hide after 5 seconds

      if (onCandleCreated) {
        onCandleCreated({
          ...docData,
          id: docRef.id,
          createdAt: new Date()
        });
      }

      // Don't wait here - the burning effect will handle the timing
      // The onComplete callback will be triggered when burning is done
    } catch (err) {
      console.error('Error creating candle:', err);
      setError('Failed to create candle. Please try again.');
      setIsBurning(false);
      setCandleWasCreated(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Success Toast with Sharing Options - Outside modal so it stays visible */}
      {showSuccessToast && (
        <div style={{
          position: 'fixed',
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: 'rgba(30, 30, 30, 0.95)',
          color: 'white',
          padding: '20px',
          borderRadius: '12px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
          zIndex: 100000,
          animation: 'slideDown 0.3s ease-out',
          minWidth: '350px',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 102, 0, 0.3)'
        }}>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            alignItems: 'center'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              fontSize: '16px',
              fontWeight: '500'
            }}>
              <span style={{ fontSize: '24px' }}>🕯️</span>
              <span>Your candle has been lit successfully!</span>
              <span style={{ fontSize: '20px' }}>✨</span>
            </div>
            
            {/* Share buttons */}
            <div style={{
              display: 'flex',
              gap: '10px',
              width: '100%',
              justifyContent: 'center'
            }}>
              <button
                onClick={shareToX}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#000000',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'transform 0.2s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
              >
                <span style={{ fontSize: '14px' }}>𝕏</span> Share
              </button>
              
              <button
                onClick={shareToInstagram}
                style={{
                  padding: '8px 16px',
                  background: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'transform 0.2s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
              >
                📷 Share
              </button>
              
              <button
                onClick={() => setShowSuccessToast(false)}
                style={{
                  padding: '8px 16px',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  color: 'white',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      
      <style>{`
        @keyframes slideDown {
          from {
            transform: translate(-50%, -100%);
            opacity: 0;
          }
          to {
            transform: translate(-50%, 0);
            opacity: 1;
          }
        }
      `}</style>
      
      {!isOpen ? null : (
        <>
          <style>{`
        @keyframes tooltipFadeIn {
          0%, 100% {
            opacity: 0.9;
          }
          50% {
            opacity: 1;
          }
        }
        
        @keyframes rotateHand {
          0%, 100% {
            transform: rotate(0deg) translateX(0px);
          }
          25% {
            transform: rotate(-15deg) translateX(-10px);
          }
          75% {
            transform: rotate(15deg) translateX(10px);
          }
        }
        
        .rotate-tooltip {
          animation: tooltipFadeIn 4s ease-in-out infinite;
        }
        
        .rotate-hand {
          animation: rotateHand 2s ease-in-out infinite;
        }
      `}</style>
      
      <BurningEffect 
        elementRef={modalContentRef}
        onComplete={() => {
          setIsBurning(false);
          // Reset form and close modal after burning completes
          setFormData({
            username: '',
            message: '',
            burnedAmount: 1000,
            allowLikes: false,
          });
          setImageFile(null);
          setImagePreview(null);
          onClose();
        }}
        isActive={isBurning}
      />
      <div className="compact-modal-overlay" 
      onClick={(e) => {
        // Only close if clicking directly on the overlay (not on modal content)
        if (e.target === e.currentTarget) {
          // Don't close if any dialog is open
          if (showPasswordDialog || showConfirmDialog) {
            return;
          }
          
          // Check if candle was already created or if there's unsaved data
          if (candleWasCreated) {
            // Candle was created, show fire effect before closing
            setIsBurning(true);
            setTimeout(() => {
              setIsBurning(false);
              onClose();
            }, 2000);
          } else {
            // Check if user has entered any data
            const hasUnsavedData = formData.username.trim() || formData.message.trim() || imageFile;
            if (hasUnsavedData) {
              // Show confirmation before closing with unsaved data
              if (window.confirm('You have unsaved changes. Are you sure you want to close without saving your candle?')) {
                onClose();
              }
            } else {
              // No data entered, just close
              onClose();
            }
          }
        }
      }}>
      <div className="compact-modal-content" ref={modalContentRef} onClick={e => e.stopPropagation()}>
        <button className="compact-modal-close" onClick={() => {
          // Only trigger burning effect if candle was actually created
          if (candleWasCreated) {
            setIsBurning(true);
            setTimeout(() => {
              setIsBurning(false);
              onClose();
            }, 2000);
          } else {
            // Check if user has entered any data
            const hasUnsavedData = formData.username.trim() || formData.message.trim() || imageFile;
            if (hasUnsavedData) {
              // Show confirmation before closing with unsaved data
              if (window.confirm('You have unsaved changes. Are you sure you want to close without saving your candle?')) {
                onClose();
              }
            } else {
              // No data entered, just close
              onClose();
            }
          }
        }}>×</button>
        
        <div className="compact-modal-layout">
          {/* Left side - 3D Preview */}
          <div className="compact-candle-preview">
            <div className="preview-label">Your Candle Preview</div>
            <div className="canvas-container" style={{ position: 'relative' }}>
              {/* Rotate Tooltip */}
              {showRotateTooltip && (
                <div 
                  onClick={() => setShowRotateTooltip(false)}
                  className="rotate-tooltip"
                  style={{
                    position: 'absolute',
                    bottom: '40%',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '15px 20px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    zIndex: 10,
                    pointerEvents: 'auto'
                  }}
                >
                  <div className="rotate-hand" style={{
                    fontSize: '3rem',
                    transformOrigin: 'center bottom'
                  }}>
                    👆
                  </div>
                </div>
              )}
              <Canvas
                key={canvasKey}
                camera={{ position: [0, 2, 5], fov: 45 }}
                style={{ background: 'transparent' }}
                dpr={[1, 2]} // Higher pixel ratio for better quality
                gl={{
                  antialias: true,
                  alpha: true,
                  powerPreference: "high-performance",
                  preserveDrawingBuffer: true,
                }}
                onPointerDown={handleCanvasInteraction}
                onWheel={handleCanvasInteraction}
              >
                <ambientLight intensity={0.6} />
                <directionalLight 
                  position={[5, 5, 5]} 
                  intensity={0.8} 
                  castShadow 
                />
                <pointLight position={[0, 3, 2]} intensity={0.5} color="#ffaa00" />
                <spotLight
                  position={[-5, 10, 5]}
                  angle={0.3}
                  penumbra={1}
                  intensity={0.5}
                  castShadow
                />
                <Suspense fallback={null}>
                  <CandlePreview 
                    imageUrl={imagePreview || '/defaultAvatar.png'} 
                    message={isEncrypted ? scrambledDisplay : formData.message}
                    isEncrypted={isEncrypted}
                    username={formData.username}
                    language={currentLanguage}
                    template={selectedTemplate}
                    templatePosition={templatePosition}
                    templateScale={templateScale}
                    templateRotation={templateRotation}
                    skinToneAdjustment={skinToneAdjustment}
                    userImagePosition={userImagePosition}
                    userImageScale={userImageScale}
                    userImageRotation={userImageRotation}
                  />
                </Suspense>
                <OrbitControls
                  enablePan={true}
                  enableZoom={true}
                  minPolarAngle={Math.PI / 3}
                  maxPolarAngle={Math.PI / 2}
                  autoRotate={false}
                  zoomToCursor={true}
                />
              </Canvas>
            </div>
          </div>

          {/* Right side - Form */}
          <div className="compact-form-section">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <h2 style={{
                background: 'linear-gradient(45deg, #ff6600, #ffaa00, #ff6600, #ff3300)',
                backgroundSize: '200% 200%',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                textShadow: '0 0 40px rgba(255, 102, 0, 0.8)',
                animation: 'flameGlow 2s ease-in-out infinite',
                filter: 'drop-shadow(0 0 20px rgba(255, 102, 0, 0.5))',
                fontWeight: 'bold'
              }}>Get Lit with RL80</h2>
              <select 
                value={currentLanguage}
                onChange={(e) => {
                  setCurrentLanguage(e.target.value);
                  setSelectedPrayer(null); // Reset selected prayer when language changes
                }}
                style={{
                  padding: '5px 10px',
                  borderRadius: '4px',
                  backgroundColor: 'rgba(0, 0, 0, 0.3)',
                  color: '#fff',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  fontSize: '14px',
                  cursor: 'pointer'
                }}
              >
                <option value="en">English</option>
                <option value="es">Español</option>
                <option value="pt">Português</option>
                <option value="fr">Français</option>
                <option value="it">Italiano</option>
                <option value="zh">中文</option>
                <option value="hi">हिन्दी</option>
              </select>
            </div>
            
            <form onSubmit={handleSubmit}>
              {/* Row 1: Username and Amount */}
              <div className="compact-form-group" style={{
                display: 'flex',
                gap: '10px',
                marginBottom: '12px'
              }}>
                {/* Username - Left */}
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  onKeyDown={(e) => {
                    // Prevent Enter key from submitting form
                    if (e.key === 'Enter') {
                      e.preventDefault();
                    }
                  }}
                  placeholder="Name (on behalf of)"
                  maxLength={50}
                  required
                  style={{
                    flex: '1.5',
                    padding: '10px',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(0, 0, 0, 0.3)',
                    border: '1px solid rgba(255, 215, 0, 0.3)',
                    color: '#fff',
                    fontSize: '14px'
                  }}
                />
                
                {/* Amount - Right */}
                <div style={{
                  flex: '1',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '8px 10px',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(0, 0, 0, 0.3)',
                  border: '1px solid rgba(255, 215, 0, 0.3)'
                }}>
                  <span style={{
                    color: 'rgba(255, 215, 0, 0.8)',
                    fontSize: '13px',
                    fontWeight: 'bold'
                  }}>
                    RL80:
                  </span>
                  <input
                    type="text"
                    name="burnedAmount"
                    value={formData.burnedAmount}
                    onChange={(e) => {
                      const value = e.target.value;
                      const numericValue = value.replace(/[^0-9]/g, '');
                      
                      if (numericValue === '') {
                        setFormData(prev => ({ ...prev, burnedAmount: '' }));
                        return;
                      }
                      
                      const parsed = parseInt(numericValue, 10);
                      if (parsed <= 999999999999999) {
                        setFormData(prev => ({ ...prev, burnedAmount: parsed }));
                      }
                    }}
                    placeholder="1000"
                    required
                    style={{
                      flex: '1',
                      background: 'transparent',
                      border: 'none',
                      color: '#fff',
                      fontSize: '14px',
                      outline: 'none',
                      textAlign: 'right'
                    }}
                  />
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '2px'
                  }}>
                    <button
                      type="button"
                      onClick={() => {
                        const currentValue = parseInt(formData.burnedAmount) || 0;
                        const newValue = currentValue + 1000;
                        if (newValue <= 999999999999999) {
                          setFormData(prev => ({ ...prev, burnedAmount: newValue }));
                        }
                      }}
                      style={{
                        background: 'rgba(255, 215, 0, 0.2)',
                        border: 'none',
                        borderRadius: '3px',
                        color: 'rgba(255, 215, 0, 0.8)',
                        cursor: 'pointer',
                        padding: '0 4px',
                        fontSize: '10px',
                        lineHeight: '1',
                        height: '12px'
                      }}
                    >
                      ▲
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const currentValue = parseInt(formData.burnedAmount) || 0;
                        const newValue = Math.max(0, currentValue - 1000);
                        setFormData(prev => ({ ...prev, burnedAmount: newValue || '' }));
                      }}
                      style={{
                        background: 'rgba(255, 215, 0, 0.2)',
                        border: 'none',
                        borderRadius: '3px',
                        color: 'rgba(255, 215, 0, 0.8)',
                        cursor: 'pointer',
                        padding: '0 4px',
                        fontSize: '10px',
                        lineHeight: '1',
                        height: '12px'
                      }}
                    >
                      ▼
                    </button>
                  </div>
                </div>
              </div>


              {/* AI Generation Panel */}
              {showAIPanel && (
                <div style={{
                  margin: '15px 0',
                  padding: '15px',
                  background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
                  borderRadius: '12px',
                  border: '1px solid rgba(102, 126, 234, 0.3)',
                }}>
                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ fontSize: '13px', color: '#fff', marginBottom: '8px', display: 'block' }}>
                      Describe what you want to pray for:
                    </label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input
                        type="text"
                        value={aiPrompt}
                        onChange={(e) => setAiPrompt(e.target.value)}
                        placeholder="e.g., 'surviving a bear market' or 'finding the next moonshot'"
                        disabled={isGenerating || remainingPrayers === 0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            if (!isGenerating && remainingPrayers > 0) {
                              handleAIGenerate();
                            }
                          }
                        }}
                        style={{
                          flex: 1,
                          padding: '8px 12px',
                          borderRadius: '8px',
                          backgroundColor: 'rgba(0, 0, 0, 0.3)',
                          border: '1px solid rgba(255, 255, 255, 0.2)',
                          color: '#fff',
                          fontSize: '14px',
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => handleAIGenerate()}
                        disabled={isGenerating || remainingPrayers === 0}
                        style={{
                          padding: '8px 20px',
                          borderRadius: '8px',
                          backgroundColor: isGenerating ? '#666' : '#667eea',
                          color: '#fff',
                          border: 'none',
                          cursor: isGenerating || remainingPrayers === 0 ? 'not-allowed' : 'pointer',
                          fontSize: '14px',
                          fontWeight: 'bold',
                          minWidth: '100px',
                        }}
                      >
                        {isGenerating ? '🤖 Generating...' : '🤖 Generate'}
                      </button>
                    </div>
                  </div>

                  {/* Quick prompt buttons */}
                  <div style={{ marginTop: '12px' }}>
                    <label style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.7)', marginBottom: '6px', display: 'block' }}>
                      Quick prayers:
                    </label>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        onClick={() => handleAIGenerate(PRAYER_PROMPTS.diamondHands)}
                        disabled={isGenerating || remainingPrayers === 0}
                        style={{
                          padding: '4px 10px',
                          fontSize: '12px',
                          borderRadius: '15px',
                          backgroundColor: 'rgba(102, 126, 234, 0.2)',
                          border: '1px solid rgba(102, 126, 234, 0.4)',
                          color: '#fff',
                          cursor: isGenerating || remainingPrayers === 0 ? 'not-allowed' : 'pointer',
                        }}
                      >
                        💎 Diamond Hands
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAIGenerate(PRAYER_PROMPTS.findGems)}
                        disabled={isGenerating || remainingPrayers === 0}
                        style={{
                          padding: '4px 10px',
                          fontSize: '12px',
                          borderRadius: '15px',
                          backgroundColor: 'rgba(102, 126, 234, 0.2)',
                          border: '1px solid rgba(102, 126, 234, 0.4)',
                          color: '#fff',
                          cursor: isGenerating || remainingPrayers === 0 ? 'not-allowed' : 'pointer',
                        }}
                      >
                        💎 Find 100x
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAIGenerate(PRAYER_PROMPTS.bullRun)}
                        disabled={isGenerating || remainingPrayers === 0}
                        style={{
                          padding: '4px 10px',
                          fontSize: '12px',
                          borderRadius: '15px',
                          backgroundColor: 'rgba(102, 126, 234, 0.2)',
                          border: '1px solid rgba(102, 126, 234, 0.4)',
                          color: '#fff',
                          cursor: isGenerating || remainingPrayers === 0 ? 'not-allowed' : 'pointer',
                        }}
                      >
                        🚀 Bull Run
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAIGenerate(PRAYER_PROMPTS.bearMarket)}
                        disabled={isGenerating || remainingPrayers === 0}
                        style={{
                          padding: '4px 10px',
                          fontSize: '12px',
                          borderRadius: '15px',
                          backgroundColor: 'rgba(102, 126, 234, 0.2)',
                          border: '1px solid rgba(102, 126, 234, 0.4)',
                          color: '#fff',
                          cursor: isGenerating || remainingPrayers === 0 ? 'not-allowed' : 'pointer',
                        }}
                      >
                        🐻 Bear Market
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAIGenerate(PRAYER_PROMPTS.avoidLiquidation)}
                        disabled={isGenerating || remainingPrayers === 0}
                        style={{
                          padding: '4px 10px',
                          fontSize: '12px',
                          borderRadius: '15px',
                          backgroundColor: 'rgba(102, 126, 234, 0.2)',
                          border: '1px solid rgba(102, 126, 234, 0.4)',
                          color: '#fff',
                          cursor: isGenerating || remainingPrayers === 0 ? 'not-allowed' : 'pointer',
                        }}
                      >
                        🔥 No Liquidation
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAIGenerate(PRAYER_PROMPTS.rugpull)}
                        disabled={isGenerating || remainingPrayers === 0}
                        style={{
                          padding: '4px 10px',
                          fontSize: '12px',
                          borderRadius: '15px',
                          backgroundColor: 'rgba(102, 126, 234, 0.2)',
                          border: '1px solid rgba(102, 126, 234, 0.4)',
                          color: '#fff',
                          cursor: isGenerating || remainingPrayers === 0 ? 'not-allowed' : 'pointer',
                        }}
                      >
                        🏃 Avoid Rugs
                      </button>
                    </div>
                  </div>

                  {remainingPrayers === 0 && (
                    <div style={{
                      marginTop: '10px',
                      padding: '8px',
                      backgroundColor: 'rgba(255, 102, 0, 0.2)',
                      borderRadius: '6px',
                      fontSize: '12px',
                      color: '#ff6600',
                      textAlign: 'center',
                    }}>
                      Daily limit reached. Try again tomorrow!
                    </div>
                  )}
                </div>
              )}

              {/* Row 2: Prayer Template and AI Generator */}
              <div className="compact-form-group" style={{
                display: 'flex',
                gap: '10px',
                marginBottom: '12px'
              }}>
                {/* Prayer Template Dropdown - Left */}
                <select
                      value={selectedPrayer || ''}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value === '') {
                          setSelectedPrayer(null);
                          // Don't clear message when deselecting
                        } else {
                          const prayers = PRAYERS_BY_LANGUAGE[currentLanguage]?.prayers || PRAYERS_BY_LANGUAGE.en.prayers;
                          const prayer = prayers.find(p => p.id === value);
                          if (prayer) {
                            setSelectedPrayer(value);
                            setFormData(prev => ({ ...prev, message: prayer.text }));
                          }
                        }
                      }}
                      style={{
                        flex: '1',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        backgroundColor: 'rgba(0, 0, 0, 0.3)',
                        color: '#fff',
                        border: '1px solid rgba(255, 215, 0, 0.3)',
                        fontSize: '14px',
                        cursor: 'pointer',
                        backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'rgba(255,215,0,0.8)\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3e%3cpolyline points=\'6 9 12 15 18 9\'%3e%3c/polyline%3e%3c/svg%3e")',
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: 'right 10px center',
                        backgroundSize: '18px',
                        appearance: 'none',
                        paddingRight: '35px'
                      }}
                    >
                      <option value="">Preset Prayers</option>
                      {(PRAYERS_BY_LANGUAGE[currentLanguage]?.prayers || PRAYERS_BY_LANGUAGE.en.prayers).map((prayer) => (
                          <option key={prayer.id} value={prayer.id}>
                            {currentLanguage === 'es' ? 
                              (prayer.id === 'scalper' ? '⚡ Scalper' :
                               prayer.id === 'leverage' ? '📊 Apalancado' :
                               prayer.id === 'swing' ? '🌊 Swing' :
                               prayer.id === 'hodler' ? '💎 Holdear' :
                               prayer.id === 'chart' ? '📈 Gráficos' : prayer.title) :
                             currentLanguage === 'pt' ?
                              (prayer.id === 'scalper' ? '⚡ Scalper' :
                               prayer.id === 'leverage' ? '📊 Alavancagem' :
                               prayer.id === 'swing' ? '🌊 Swing' :
                               prayer.id === 'hodler' ? '💎 Holder' :
                               prayer.id === 'chart' ? '📈 Gráficos' : prayer.title) :
                             currentLanguage === 'fr' ?
                              (prayer.id === 'scalper' ? '⚡ Scalper' :
                               prayer.id === 'leverage' ? '📊 Levier' :
                               prayer.id === 'swing' ? '🌊 Swing' :
                               prayer.id === 'hodler' ? '💎 Hodler' :
                               prayer.id === 'chart' ? '📈 Graphiques' : prayer.title) :
                             currentLanguage === 'it' ?
                              (prayer.id === 'scalper' ? '⚡ Scalper' :
                               prayer.id === 'leverage' ? '📊 Leva' :
                               prayer.id === 'swing' ? '🌊 Swing' :
                               prayer.id === 'hodler' ? '💎 Hodler' :
                               prayer.id === 'chart' ? '📈 Grafici' : prayer.title) :
                             currentLanguage === 'zh' ?
                              (prayer.id === 'scalper' ? '⚡ 刷单' :
                               prayer.id === 'leverage' ? '📊 杠杆' :
                               prayer.id === 'swing' ? '🌊 波段' :
                               prayer.id === 'hodler' ? '💎 囤币' :
                               prayer.id === 'chart' ? '📈 图表' : prayer.title) :
                             currentLanguage === 'hi' ?
                              (prayer.id === 'scalper' ? '⚡ स्कैल्पर' :
                               prayer.id === 'leverage' ? '📊 लीवरेज' :
                               prayer.id === 'swing' ? '🌊 स्विंग' :
                               prayer.id === 'hodler' ? '💎 होडलर' :
                               prayer.id === 'chart' ? '📈 चार्ट' : prayer.title) :
                              (prayer.id === 'scalper' ? '⚡ Scalper\'s Prayer' :
                               prayer.id === 'leverage' ? '📊 Leverage Prayer' :
                               prayer.id === 'swing' ? '🌊 Swing Trader\'s Prayer' :
                               prayer.id === 'hodler' ? '💎 Hodler\'s Prayer' :
                               prayer.id === 'chart' ? '📈 Chart Mystic\'s Prayer' : prayer.title)}
                          </option>
                        ))}
                    </select>
                    
                
                {/* AI Button - Right */}
                <button
                  type="button"
                  onClick={() => setShowAIPanel(!showAIPanel)}
                  title="AI Prayer Generator"
                  style={{
                    padding: '10px 20px',
                    borderRadius: '8px',
                    background: showAIPanel ? 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: '#fff',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: '0 2px 8px rgba(102, 126, 234, 0.3)',
                    transition: 'all 0.2s',
                    whiteSpace: 'nowrap'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                  onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                  🤖 AI Prayer
                </button>
              </div>
                  
              {/* Row 3: Message Textarea */}
              <div className="compact-form-group message-group">
                <textarea
                  ref={textareaRef}
                  name="message"
                  value={formData.message}
                    onChange={(e) => {
                      handleInputChange(e);
                      // If user edits a pre-made prayer, mark as custom
                      const currentPrayers = PRAYERS_BY_LANGUAGE[currentLanguage]?.prayers || PRAYERS_BY_LANGUAGE.en.prayers;
                      if (selectedPrayer && currentPrayers.find(p => p.id === selectedPrayer)?.text !== e.target.value) {
                        setSelectedPrayer(null);
                      }
                    }}
                  placeholder={selectedPrayer ? "Edit the selected prayer or write your own..." : "Write your message, prayer, wish, or dedication (max 500 chars)"}
                  rows={3}
                  maxLength={500}
                  required
                  disabled={isEncrypted}
                  onKeyDown={(e) => {
                    // Prevent Enter key from submitting form in textarea
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      // Allow Shift+Enter for new lines
                      if (e.shiftKey) {
                        return;
                      }
                    }
                  }}
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    padding: '10px',
                    paddingRight: '50px', // Make room for char counter
                    borderRadius: '8px',
                    backgroundColor: 'rgba(0, 0, 0, 0.3)',
                    border: '1px solid rgba(255, 215, 0, 0.3)',
                    color: '#fff',
                    fontSize: '14px',
                    resize: 'vertical',
                    minHeight: '80px',
                    maxHeight: '150px'
                  }}
                />
                <span className="compact-char-count" style={{
                  position: 'absolute',
                  bottom: '12px',
                  right: '12px',
                  fontSize: '11px',
                  color: 'rgba(255, 215, 0, 0.5)',
                  pointerEvents: 'none'
                }}>{formData.message.length}/500</span>
              </div>

              {/* Row 4: Image Upload and Template Selection */}
              <div className="compact-form-group" style={{
                display: 'flex',
                gap: '10px',
                alignItems: 'stretch',
                marginBottom: '12px'
              }}>
                {/* Image Selection - Left */}
                <label className="compact-file-label" style={{
                  flex: '1',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '10px',
                  backgroundColor: (imageFile || imagePreview) ? 'rgba(0, 255, 0, 0.1)' : 'rgba(255, 102, 0, 0.1)',
                  border: (imageFile || imagePreview) ? '1px solid rgba(0, 255, 0, 0.3)' : '1px solid rgba(255, 215, 0, 0.3)',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  margin: 0,
                  transition: 'all 0.2s ease',
                  position: 'relative'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.02)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                }}>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    onChange={handleImageChange}
                    className="compact-file-input"
                  />
                  <span style={{ 
                    color: (imageFile || imagePreview) ? '#00ff00' : 'rgba(255, 215, 0, 0.8)',
                    fontWeight: '600',
                    fontSize: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    {imageFile ? (
                      <>📷 Custom</>
                    ) : (imagePreview && !imageFile) ? (
                      <>👤 Image</>
                    ) : (
                      <>📷 Add Image</>
                    )}
                  </span>
                </label>
                
              </div>

              {/* Template Gallery - Show if image selected */}
              {(imageFile || imagePreview) && (
                <div style={{
                  marginTop: '15px',
                  marginBottom: '10px'
                }}>
                  <div style={{
                    color: 'rgba(255, 215, 0, 0.9)',
                    fontSize: '12px',
                    marginBottom: '8px',
                    fontWeight: 'bold',
                    textTransform: 'uppercase',
                    letterSpacing: '1px'
                  }}>
                    Choose Template:
                  </div>
                  <div style={{
                    display: 'flex',
                    gap: '10px',
                    overflowX: 'auto',
                    padding: '10px',
                    background: 'rgba(0, 0, 0, 0.3)',
                    borderRadius: '12px',
                    WebkitOverflowScrolling: 'touch',
                    scrollbarWidth: 'thin',
                    scrollbarColor: 'rgba(255, 215, 0, 0.3) transparent'
                  }}>
                    {templates.map((template) => (
                      <button
                        key={template.id || 'none'}
                        type="button"
                        onClick={() => selectTemplate(template)}
                        style={{
                          minWidth: '80px',
                          height: '80px',
                          padding: '8px',
                          backgroundColor: selectedTemplate === template.id ? 
                            'rgba(255, 102, 0, 0.3)' : 'rgba(0, 0, 0, 0.5)',
                          border: selectedTemplate === template.id ? 
                            '3px solid #ff6600' : '2px solid rgba(255, 215, 0, 0.2)',
                          borderRadius: '12px',
                          color: selectedTemplate === template.id ? 
                            '#ff6600' : 'rgba(255, 255, 255, 0.9)',
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '4px',
                          transition: 'all 0.3s ease',
                          flexShrink: 0,
                          transform: selectedTemplate === template.id ? 'scale(1.05)' : 'scale(1)',
                        }}
                        onMouseEnter={(e) => {
                          if (selectedTemplate !== template.id) {
                            e.target.style.transform = 'scale(1.05)';
                            e.target.style.backgroundColor = 'rgba(255, 102, 0, 0.2)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (selectedTemplate !== template.id) {
                            e.target.style.transform = 'scale(1)';
                            e.target.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
                          }
                        }}
                      >
                        {template.id ? (
                          <img 
                            src={template.id} 
                            alt={template.name}
                            style={{
                              width: '50px',
                              height: '50px',
                              objectFit: 'cover',
                              borderRadius: '8px',
                              marginBottom: '4px'
                            }}
                          />
                        ) : (
                          <div style={{ fontSize: '28px', marginBottom: '4px' }}>{template.preview}</div>
                        )}
                        <div style={{ 
                          fontSize: '11px', 
                          fontWeight: selectedTemplate === template.id ? 'bold' : 'normal',
                          opacity: selectedTemplate === template.id ? 1 : 0.8
                        }}>
                          {template.name}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* User Image Position Controls - Compact Version */}
              {(imageFile || imagePreview) && selectedTemplate && (
                <div style={{
                  marginBottom: '12px',
                  padding: '8px',
                  backgroundColor: 'rgba(255, 102, 0, 0.05)',
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 102, 0, 0.2)'
                }}>
                  <button
                    type="button"
                    onClick={() => setShowPositionControls(!showPositionControls)}
                    style={{
                      width: '100%',
                      padding: '8px',
                      backgroundColor: 'transparent',
                      border: 'none',
                      color: 'rgba(255, 102, 0, 0.8)',
                      cursor: 'pointer',
                      fontSize: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px'
                    }}
                  >
                    {showPositionControls ? '▼' : '▶'} Adjust Your Image Position
                  </button>
                  
                  {showPositionControls && selectedTemplate && (
                    <>
                      <div style={{
                        marginTop: '8px',
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: '8px',
                        padding: '8px',
                        backgroundColor: 'rgba(0, 0, 0, 0.2)',
                        borderRadius: '6px'
                      }}>
                        {/* Compact Control Sliders */}
                        <div>
                          <label style={{
                            fontSize: '11px',
                            color: 'rgba(255, 255, 255, 0.6)',
                            marginBottom: '2px',
                            display: 'block'
                          }}>
                            X: {userImagePosition.x.toFixed(0)}%
                          </label>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={userImagePosition.x}
                            onChange={(e) => setUserImagePosition({ ...userImagePosition, x: parseFloat(e.target.value) })}
                            style={{
                              width: '100%',
                              height: '16px',
                              accentColor: '#ff6600'
                            }}
                          />
                        </div>
                        
                        <div>
                          <label style={{
                            fontSize: '11px',
                            color: 'rgba(255, 255, 255, 0.6)',
                            marginBottom: '2px',
                            display: 'block'
                          }}>
                            Y: {userImagePosition.y.toFixed(0)}%
                          </label>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={userImagePosition.y}
                            onChange={(e) => setUserImagePosition({ ...userImagePosition, y: parseFloat(e.target.value) })}
                            style={{
                              width: '100%',
                              height: '16px',
                              accentColor: '#ff6600'
                            }}
                          />
                        </div>
                        
                        <div>
                          <label style={{
                            fontSize: '11px',
                            color: 'rgba(255, 255, 255, 0.6)',
                            marginBottom: '2px',
                            display: 'block'
                          }}>
                            Size: {userImageScale}%
                          </label>
                          <input
                            type="range"
                            min="20"
                            max="300"
                            value={userImageScale}
                            onChange={(e) => setUserImageScale(parseFloat(e.target.value))}
                            style={{
                              width: '100%',
                              height: '16px',
                              accentColor: '#ff6600'
                            }}
                          />
                        </div>
                          
                      </div>
                      
                      {/* Skin Tone Adjustment - Only for Virgin Mary template */}
                      {selectedTemplate === '/images/face2.png' && (
                        <div style={{ 
                          marginTop: '8px',
                          padding: '8px',
                          backgroundColor: 'rgba(0, 0, 0, 0.2)',
                          borderRadius: '6px'
                        }}>
                          <label style={{
                            display: 'block',
                            fontSize: '11px',
                            color: 'rgba(255, 255, 255, 0.6)',
                            marginBottom: '4px'
                          }}>
                            Skin Tone
                          </label>
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                          }}>
                            <span style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.5)' }}>Light</span>
                            <input
                              type="range"
                              min="-100"
                              max="100"
                              value={skinToneAdjustment}
                              onChange={(e) => setSkinToneAdjustment(parseFloat(e.target.value))}
                              style={{
                                flex: 1,
                                height: '16px',
                                accentColor: '#ff6600'
                              }}
                            />
                            <span style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.5)' }}>Dark</span>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
              
              {/* Submit Buttons Row - More compact */}
              <div className="compact-form-actions" style={{
                display: 'flex',
                gap: '10px',
                marginTop: '16px'
              }}>
                <button 
                  type="button" 
                  onClick={onClose}
                  className="compact-btn-cancel"
                  disabled={isSubmitting}
                  style={{
                    flex: 1,
                    padding: '12px',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '8px',
                    color: 'rgba(255, 255, 255, 0.8)',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500',
                    transition: 'all 0.2s ease'
                  }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="compact-btn-submit"
                  disabled={isSubmitting || !formData.username.trim() || !formData.message.trim()}
                  title={!formData.username.trim() || !formData.message.trim() ? 'Please fill in all required fields' : 'Review and light your candle'}
                  style={{
                    flex: 1,
                    padding: '12px',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#fff',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {isSubmitting ? (
                    <span>Creating...</span>
                  ) : (
                    <span>🕯️ Light Candle</span>
                  )}
                </button>
              </div>


              {/* Confirmation Dialog - shown only when user clicks submit */}
              {showConfirmDialog && (
                <div className="confirmation-dialog-overlay" onClick={(e) => e.stopPropagation()}>
                  <div className="confirmation-dialog">
                    <h3> <span style={{
          display: 'inline-block',
          position: 'relative',
          width: '20px',
          height: '40px',
          marginLeft: '15px',
          marginRight: '15px',
          verticalAlign: 'middle'
        }}>
          {/* Top wick */}
          <span style={{
            position: 'absolute',
            left: '50%',
            top: '0',
            width: '2px',
            height: '10px',
            backgroundColor: '#00ff00',
            transform: 'translateX(-50%)'
          }}></span>
          {/* Candle body */}
          <span style={{
            position: 'absolute',
            left: '50%',
            top: '10px',
            width: '12px',
            height: '20px',
            backgroundColor: '#00ff00',
            transform: 'translateX(-50%)'
          }}></span>
          {/* Bottom wick */}
          <span style={{
            position: 'absolute',
            left: '50%',
            bottom: '0',
            width: '2px',
            height: '10px',
            backgroundColor: '#00ff00',
            transform: 'translateX(-50%)'
          }}></span>
        </span> Ready to Light Your Candle?</h3>
                    <div className="confirmation-details">
                      {/* Image Section with Thumbnail and Label */}
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        marginBottom: '8px'
                      }}>
                        <p style={{ 
                          margin: 0,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          color: (imageFile || imagePreview) ? 'inherit' : '#ff6600',
                          fontWeight: (imageFile || imagePreview) ? 'normal' : 'bold'
                        }}>
                          <strong>Image:</strong> 
                          <span style={{ fontWeight: 'normal' }}>
                            {imageFile ? '✓ Custom image' : 
                             (imagePreview && !imageFile) ? '✓ Profile picture' :
                             '⚠️ Using default'}
                          </span>
                        </p>
                        <div style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: imageFile ? '4px' : '50%', // Square for custom, round for profile
                          overflow: 'hidden',
                          border: '2px solid rgba(255, 255, 255, 0.2)',
                          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
                          flexShrink: 0,
                          marginLeft: '-5rem'
                        }}>
                          <img 
                            src={imagePreview || '/defaultAvatar.png'}
                            alt="Candle image preview"
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover'
                            }}
                          />
                        </div>
                      </div>
                      
                      <p><strong>Name:</strong> {formData.username}</p>
                      <p><strong>Amount:</strong> {formData.burnedAmount ? formatNumberWithCommas(formData.burnedAmount) : '0'}</p>
                      <p><strong>Message:</strong> {formData.message.substring(0, 50)}{formData.message.length > 50 ? '...' : ''}</p>
                    </div>
                    
                    {/* Removed social sharing - will show after successful save */}
                    {false && capturedImage && (
                      <div style={{
                        marginTop: '20px',
                        padding: '15px',
                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                        borderRadius: '8px',
                        border: '1px solid rgba(255, 255, 255, 0.1)'
                      }}>
                        {/* Preview of captured candle */}
                        <div style={{
                          marginBottom: '15px',
                          textAlign: 'center'
                        }}>
                          <img 
                            src={capturedImage}
                            alt="Your candle"
                            style={{
                              width: '150px',
                              height: '150px',
                              borderRadius: '8px',
                              border: '2px solid rgba(255, 102, 0, 0.3)',
                              objectFit: 'cover',
                              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
                            }}
                          />
                        </div>
                        <p style={{
                          fontSize: '13px',
                          color: 'rgba(255, 255, 255, 0.7)',
                          marginBottom: '12px',
                          textAlign: 'center'
                        }}>
                          Share your candle on social media
                        </p>
                        <div style={{
                          display: 'flex',
                          gap: '12px',
                          justifyContent: 'center'
                        }}>
                          <button
                            type="button"
                            onClick={shareToX}
                            style={{
                              padding: '10px 20px',
                              backgroundColor: '#000000',
                              color: 'white',
                              border: 'none',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              fontSize: '14px',
                              fontWeight: 'bold',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              transition: 'transform 0.2s ease'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                          >
                            <span style={{ fontSize: '16px' }}>𝕏</span> Share on X
                          </button>
                          <button
                            type="button"
                            onClick={shareToInstagram}
                            style={{
                              padding: '10px 20px',
                              background: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)',
                              color: 'white',
                              border: 'none',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              fontSize: '14px',
                              fontWeight: 'bold',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              transition: 'transform 0.2s ease'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                          >
                            📷 Instagram
                          </button>
                        </div>
                      </div>
                    )}
                    
                    <p className="confirmation-warning">Once lit, your candle cannot be changed or removed.</p>
                    <div className="confirmation-actions">
                      <button
                        type="button"
                        onClick={() => setShowConfirmDialog(false)}
                        className="confirm-cancel"
                      >
                        Review More
                      </button>
                      <button
                        type="button"
                        onClick={handleConfirmedSave}
                        className="confirm-save"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? 'Lighting...' : 'Light Candle 🔥'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {error && <div className="compact-error">{error}</div>}

            </form>
          </div>
        </div>
      </div>
    </div>
        </>
      )}
    </>
  );
}