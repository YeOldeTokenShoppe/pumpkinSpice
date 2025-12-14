import React, { useState, Suspense, useRef, useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF, useTexture } from '@react-three/drei';

// Preload the candle model to improve performance
useGLTF.preload('/models/singleCandleAnimatedFlamePreview.glb');
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/utilities/firebaseClient';
import * as THREE from 'three';
import { gsap } from 'gsap';
import { ScrambleTextPlugin } from 'gsap/dist/ScrambleTextPlugin';
import { encryptMessage, generateScrambledDisplay } from '@/utilities/encryption';
import { generatePrayer, getRemainingPrayers, PRAYER_PROMPTS } from '@/utilities/aiPrayers';
import { useUser } from '@clerk/nextjs';
// Removed BurningEffect import - no longer needed
import './CompactCandleModal.css';
import { useFirestoreResults } from '@/utilities/useFirestoreResults';
import CandleSnapshotRenderer from './CandleSnapshotRenderer';

// Register GSAP plugin
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrambleTextPlugin);
}

// Language names for display

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
    prayers: [{
      id: 'scalper',
      title: "Scalper's Prayer",
      text: "Oh Lady of Perpetual Profit, bless my lightning fingers and low-latency reflexes. Protect me from fat-fingered orders and grant me the stamina to chase micro-movements without losing my soul. May every scalp be green, and every exit perfectly timed. Amen."
    }, {
      id: 'leverage',
      title: "Leverage Prayer",
      text: "Oh Blessed Virgin of Margin, shield me from the wicked lure of 100x leverage. Guard my trades from sudden liquidation, and deliver me from the temptation of adding 'just a little more.' Grant me the humility to close in profit, and the grace to walk away before the exchange claims my soul. Amen."
    }, {
      id: 'swing',
      title: "Swing Trader's Prayer",
      text: "Oh Lady of Perpetual Profit, grant me patience to ride the waves of volatility, and the wisdom to know when to take profit and when to let it run. Bless my charts, my Fibonacci retracements, and my RSI settings, that I may always enter at the bottom and exit at the top. Amen."
    }, {
      id: 'hodler',
      title: "Hodler's Prayer",
      text: "Oh Glorious Mother of Diamond Hands, let me never succumb to weak paper hands. Guard my seed phrase, strengthen my resolve, and remind me that one day the line shall go up forever. May my wallet survive bear markets, hacks, and exchange collapses, until the moon and beyond. Amen."
    }, {
      id: 'chart',
      title: "Chart Mystic's Prayer",
      text: "Oh Oracle of Eternal Candles, Our Lady of Perpetual Profit, guide my eyes as I read the sacred indicators. Grant me the gift of vision to see wedges before they break, triangles before they tighten, and golden crosses before they shine. Deliver me from false signals, and sanctify my trading view with holy confluence. Amen."
    }]
  },
  es: {
    heading: ['Oración a Nuestra Señora', 'del Beneficio Perpetuo'],
    prayers: [{
      id: 'scalper',
      title: "Oración del Scalper",
      text: "Oh Señora del Beneficio Perpetuo, bendice mis dedos veloces y reflejos de baja latencia. Protégeme de órdenes mal digitadas y dame la resistencia para perseguir micro-movimientos sin perder mi alma. Que cada scalp sea verde y cada salida perfectamente cronometrada. Amén."
    }, {
      id: 'leverage',
      title: "Oración del Apalancamiento",
      text: "Oh Bendita Virgen del Margen, protégeme del malvado señuelo del apalancamiento 100x. Guarda mis operaciones de la liquidación repentina, y líbrame de la tentación de agregar 'solo un poco más'. Dame la humildad para cerrar en ganancias y la gracia para alejarme antes de que el exchange reclame mi alma. Amén."
    }, {
      id: 'swing',
      title: "Oración del Swing Trader",
      text: "Oh Señora del Beneficio Perpetuo, dame paciencia para surfear las olas de volatilidad, y sabiduría para saber cuándo tomar ganancias y cuándo dejarlas correr. Bendice mis gráficos, mis retrocesos de Fibonacci y mi configuración RSI, para que siempre entre en el fondo y salga en la cima. Amén."
    }, {
      id: 'hodler',
      title: "Oración del Hodler",
      text: "Oh Gloriosa Madre de las Manos de Diamante, nunca me dejes sucumbir a las débiles manos de papel. Guarda mi frase semilla, fortalece mi determinación y recuérdame que algún día la línea subirá para siempre. Que mi cartera sobreviva mercados bajistas, hackeos y colapsos de exchanges, hasta la luna y más allá. Amén."
    }, {
      id: 'chart',
      title: "Oración del Místico de Gráficos",
      text: "Oh Oráculo de las Velas Eternas, Nuestra Señora del Beneficio Perpetuo, guía mis ojos mientras leo los indicadores sagrados. Dame el don de ver cuñas antes de que rompan, triángulos antes de que se estrechen y cruces doradas antes de que brillen. Líbrame de señales falsas y santifica mi vista de trading con confluencia sagrada. Amén."
    }]
  },
  pt: {
    heading: ['Oração a Nossa Senhora', 'do Lucro Perpétuo'],
    prayers: [{
      id: 'scalper',
      title: "Oração do Scalper",
      text: "Ó Senhora do Lucro Perpétuo, abençoe meus dedos rápidos e reflexos de baixa latência. Proteja-me de ordens digitadas erradas e me dê resistência para perseguir micro-movimentos sem perder minha alma. Que cada scalp seja verde e cada saída perfeitamente cronometrada. Amém."
    }, {
      id: 'leverage',
      title: "Oração da Alavancagem",
      text: "Ó Bendita Virgem da Margem, proteja-me da tentação maligna de alavancagem 100x. Guarde minhas operações da liquidação repentina e livre-me da tentação de adicionar 'só mais um pouco'. Dê-me humildade para fechar no lucro e a graça de ir embora antes que a exchange reclame minha alma. Amém."
    }, {
      id: 'swing',
      title: "Oração do Swing Trader",
      text: "Ó Senhora do Lucro Perpétuo, dê-me paciência para surfar as ondas de volatilidade e sabedoria para saber quando realizar lucros e quando deixar correr. Abençoe meus gráficos, minhas retrações de Fibonacci e minhas configurações de RSI, para que eu sempre entre no fundo e saia no topo. Amém."
    }, {
      id: 'hodler',
      title: "Oração do Hodler",
      text: "Ó Gloriosa Mãe das Mãos de Diamante, nunca me deixe sucumbir às fracas mãos de papel. Guarde minha seed phrase, fortaleça minha determinação e me lembre que um dia a linha subirá para sempre. Que minha carteira sobreviva a mercados em baixa, hacks e colapsos de exchanges, até a lua e além. Amém."
    }, {
      id: 'chart',
      title: "Oração do Místico dos Gráficos",
      text: "Ó Oráculo das Velas Eternas, Nossa Senhora do Lucro Perpétuo, guie meus olhos enquanto leio os indicadores sagrados. Dê-me o dom de ver cunhas antes que rompam, triângulos antes que apertem e cruzes douradas antes que brilhem. Livre-me de sinais falsos e santifique minha visão de trading com confluência sagrada. Amém."
    }]
  },
  fr: {
    heading: ['Prière à Notre Dame', 'du Profit Perpétuel'],
    prayers: [{
      id: 'scalper',
      title: "Prière du Scalper",
      text: "Ô Dame du Profit Perpétuel, bénis mes doigts rapides et mes réflexes à faible latence. Protège-moi des ordres mal saisis et donne-moi l'endurance pour chasser les micro-mouvements sans perdre mon âme. Que chaque scalp soit vert et chaque sortie parfaitement chronométrée. Amen."
    }, {
      id: 'leverage',
      title: "Prière du Levier",
      text: "Ô Bienheureuse Vierge de la Marge, protège-moi du maléfique appât du levier 100x. Garde mes trades de la liquidation soudaine, et délivre-moi de la tentation d'ajouter 'juste un peu plus'. Accorde-moi l'humilité de clôturer en profit et la grâce de partir avant que l'exchange ne réclame mon âme. Amen."
    }, {
      id: 'swing',
      title: "Prière du Swing Trader",
      text: "Ô Dame du Profit Perpétuel, accorde-moi la patience de chevaucher les vagues de volatilité, et la sagesse de savoir quand prendre des profits et quand les laisser courir. Bénis mes graphiques, mes retracements de Fibonacci et mes paramètres RSI, pour que j'entre toujours en bas et sorte au sommet. Amen."
    }, {
      id: 'hodler',
      title: "Prière du Hodler",
      text: "Ô Glorieuse Mère des Mains de Diamant, ne me laisse jamais succomber aux faibles mains de papier. Garde ma phrase de récupération, renforce ma détermination et rappelle-moi qu'un jour la ligne montera pour toujours. Que mon portefeuille survive aux marchés baissiers, aux piratages et aux effondrements d'exchanges, jusqu'à la lune et au-delà. Amen."
    }, {
      id: 'chart',
      title: "Prière du Mystique des Graphiques",
      text: "Ô Oracle des Bougies Éternelles, Notre Dame du Profit Perpétuel, guide mes yeux alors que je lis les indicateurs sacrés. Donne-moi le don de voir les biseaux avant qu'ils ne cassent, les triangles avant qu'ils ne se resserrent et les croix dorées avant qu'elles ne brillent. Délivre-moi des faux signaux et sanctifie ma vue de trading avec une confluence sacrée. Amen."
    }]
  },
  zh: {
    heading: ['永恒盈利圣母', '祈祷文'],
    prayers: [{
      id: 'scalper',
      title: "刷单者祈祷",
      text: "永恒盈利圣母啊，请保佑我闪电般的手指和低延迟的反应。保护我免受手滑下单之苦，赐予我追逐微小波动而不失灵魂的耐力。愿每次刷单都是绿色，每次退出都恰到好处。阿门。"
    }, {
      id: 'leverage',
      title: "杠杆祈祷",
      text: "保证金圣母啊，请保护我远离100倍杠杆的邪恶诱惑。保护我的交易免受突然爆仓，让我摆脱'再加一点点'的诱惑。赐予我在盈利时平仓的谦逊，以及在交易所夺走我灵魂之前离开的恩典。阿门。"
    }, {
      id: 'swing',
      title: "波段交易者祈祷",
      text: "永恒盈利圣母啊，赐予我驾驭波动浪潮的耐心，以及知道何时止盈何时持有的智慧。保佑我的图表、斐波那契回撤和RSI设置，让我总是在底部进场，在顶部离场。阿门。"
    }, {
      id: 'hodler',
      title: "囤币者祈祷",
      text: "钻石之手的圣母啊，永远不要让我屈服于软弱的纸手。守护我的助记词，坚定我的决心，提醒我总有一天线会永远向上。愿我的钱包在熊市、黑客攻击和交易所崩溃中幸存，直到月球和更远的地方。阿门。"
    }, {
      id: 'chart',
      title: "图表神秘主义者祈祷",
      text: "永恒K线的先知，永恒盈利圣母啊，在我阅读神圣指标时指引我的双眼。赐予我在楔形突破前看到它们、在三角形收紧前看到它们、在金叉闪耀前看到它们的天赋。让我免受假信号的困扰，用神圣的共振净化我的交易视野。阿门。"
    }]
  },
  hi: {
    heading: ['शाश्वत लाभ की माता', 'की प्रार्थना'],
    prayers: [{
      id: 'scalper',
      title: "स्कैल्पर की प्रार्थना",
      text: "हे शाश्वत लाभ की माता, मेरी बिजली जैसी उंगलियों और कम विलंबता वाले रिफ्लेक्स को आशीर्वाद दें। मुझे गलत ऑर्डर से बचाएं और मुझे अपनी आत्मा खोए बिना सूक्ष्म गतिविधियों का पीछा करने की सहनशक्ति दें। हर स्कैल्प हरा हो और हर निकास पूर्ण रूप से समयबद्ध हो। आमीन।"
    }, {
      id: 'leverage',
      title: "लीवरेज प्रार्थना",
      text: "हे मार्जिन की धन्य कुमारी, मुझे 100x लीवरेज के दुष्ट प्रलोभन से बचाएं। मेरे ट्रेडों को अचानक लिक्विडेशन से बचाएं, और मुझे 'बस थोड़ा और' जोड़ने के प्रलोभन से मुक्त करें। मुझे लाभ में बंद करने की विनम्रता और एक्सचेंज मेरी आत्मा का दावा करने से पहले दूर जाने की कृपा दें। आमीन।"
    }, {
      id: 'swing',
      title: "स्विंग ट्रेडर की प्रार्थना",
      text: "हे शाश्वत लाभ की माता, मुझे अस्थिरता की लहरों की सवारी करने का धैर्य दें, और यह जानने की बुद्धि दें कि कब लाभ लेना है और कब इसे चलने देना है। मेरे चार्ट, मेरे फिबोनाची रिट्रेसमेंट और मेरी RSI सेटिंग्स को आशीर्वाद दें, ताकि मैं हमेशा तल पर प्रवेश करूं और शीर्ष पर निकलूं। आमीन।"
    }, {
      id: 'hodler',
      title: "होडलर की प्रार्थना",
      text: "हे हीरे के हाथों की गौरवशाली माता, मुझे कभी भी कमजोर कागज के हाथों के सामने झुकने न दें। मेरे सीड फ्रेज की रक्षा करें, मेरे संकल्प को मजबूत करें और मुझे याद दिलाएं कि एक दिन रेखा हमेशा के लिए ऊपर जाएगी। मेरा वॉलेट भालू बाजारों, हैक और एक्सचेंज के पतन से बचे, चंद्रमा तक और उससे आगे। आमीन।"
    }, {
      id: 'chart',
      title: "चार्ट रहस्यवादी की प्रार्थना",
      text: "हे शाश्वत मोमबत्तियों के ओरेकल, शाश्वत लाभ की माता, पवित्र संकेतकों को पढ़ते समय मेरी आंखों का मार्गदर्शन करें। मुझे वेजेज को टूटने से पहले देखने, त्रिकोणों को कसने से पहले देखने और गोल्डन क्रॉस को चमकने से पहले देखने का वरदान दें। मुझे झूठे संकेतों से मुक्त करें और पवित्र संगम के साथ मेरे ट्रेडिंग दृष्टिकोण को पवित्र करें। आमीन।"
    }]
  },
  it: {
    heading: ['Preghiera a Nostra Signora', 'del Profitto Perpetuo'],
    prayers: [{
      id: 'scalper',
      title: "Preghiera dello Scalper",
      text: "O Signora del Profitto Perpetuo, benedici le mie dita veloci e i miei riflessi a bassa latenza. Proteggimi dagli ordini sbagliati e dammi la resistenza per inseguire i micro-movimenti senza perdere la mia anima. Che ogni scalp sia verde e ogni uscita perfettamente cronometrata. Amen."
    }, {
      id: 'leverage',
      title: "Preghiera della Leva",
      text: "O Beata Vergine del Margine, proteggimi dalla malvagia tentazione della leva 100x. Custodisci i miei trade dalla liquidazione improvvisa e liberami dalla tentazione di aggiungere 'solo un po' di più'. Concedimi l'umiltà di chiudere in profitto e la grazia di andarmene prima che l'exchange reclami la mia anima. Amen."
    }, {
      id: 'swing',
      title: "Preghiera dello Swing Trader",
      text: "O Signora del Profitto Perpetuo, concedimi la pazienza di cavalcare le onde della volatilità e la saggezza di sapere quando prendere profitto e quando lasciarlo correre. Benedici i miei grafici, i miei ritracciamenti di Fibonacci e le mie impostazioni RSI, affinché io entri sempre sul fondo e esca in cima. Amen."
    }, {
      id: 'hodler',
      title: "Preghiera dell'Hodler",
      text: "O Gloriosa Madre delle Mani di Diamante, non lasciarmi mai soccombere alle deboli mani di carta. Custodisci la mia seed phrase, rafforza la mia determinazione e ricordami che un giorno la linea salirà per sempre. Che il mio portafoglio sopravviva ai mercati orso, agli hack e ai crolli degli exchange, fino alla luna e oltre. Amen."
    }, {
      id: 'chart',
      title: "Preghiera del Mistico dei Grafici",
      text: "O Oracolo delle Candele Eterne, Nostra Signora del Profitto Perpetuo, guida i miei occhi mentre leggo gli indicatori sacri. Dammi il dono di vedere i cunei prima che si rompano, i triangoli prima che si stringano e le croci d'oro prima che brillino. Liberami dai falsi segnali e santifica la mia vista di trading con la sacra confluenza. Amen."
    }]
  }
};

// Get current language prayers (defaults to English)

// Cache for hands overlay image
let cachedHandsImage = null;
let handsImageCallbacks = [];
// 3D Candle Component
function CandlePreview({
  imageUrl,
  message,
  isEncrypted,
  username,
  language = 'en',
  template = null,
  templatePosition = {
    x: 50,
    y: 50
  },
  templateScale = 100,
  templateRotation = 0,
  skinToneAdjustment = 0,
  userImagePosition = {
    x: 50,
    y: 50
  },
  userImageScale = 100,
  userImageRotation = 0,
  candleModel = '/models/singleCandleAnimatedFlame.glb'
}) {
  const {
    scene,
    animations
  } = useGLTF(candleModel);
  const candleRef = useRef();
  const clonedSceneRef = useRef(null);
  const defaultTexture = useTexture('/defaultAvatar.png');
  const mixerRef = useRef(null);
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
      // console.log('Loading user texture from:', imageUrl.substring(0, 50) + '...');
      const loader = new THREE.TextureLoader();

      // Don't add timestamp to data URLs (base64 images)
      const finalUrl = imageUrl.startsWith('data:') ? imageUrl : `${imageUrl}${imageUrl.includes('?') ? '&' : '?'}t=${Date.now()}`;

      // For Clerk images, we need to handle CORS properly
      loader.setCrossOrigin('anonymous');
      loader.load(finalUrl, texture => {
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
        // console.log('User texture loaded successfully with high quality settings');
      }, undefined, error => {
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
          // console.log('User texture loaded via Image fallback');
        };
        img.onerror = () => {
          console.error('Failed to load image even with fallback');
          setUserTexture(null);
        };
        img.src = finalUrl;
      });
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

      // Set up animation mixer for the flame
      if (animations && animations.length > 0) {
        mixerRef.current = new THREE.AnimationMixer(clonedSceneRef.current);
        animations.forEach(clip => {
          const action = mixerRef.current.clipAction(clip);
          action.play();
        });
      }
    }
    return () => {
      if (mixerRef.current) {
        mixerRef.current.stopAllAction();
      }
    };
  }, [scene, animations]);

  // Find Label meshes in the cloned scene
  useEffect(() => {
    if (clonedSceneRef.current) {
      // Reset refs first
      label1MeshRef.current = null;
      label2MeshRef.current = null;
      clonedSceneRef.current.traverse(child => {
        if (child.isMesh) {
          if (child.name === 'Label1' || child.name.includes('Label1')) {
            label1MeshRef.current = child;
            // console.log('Found Label1 mesh in cloned scene:', child.name, child.scale, child.visible);
            // Make sure it's visible
            child.visible = true;
          }
          if (child.name === 'Label2' || child.name.includes('Label2')) {
            label2MeshRef.current = child;
            // console.log('Found Label2 mesh in cloned scene:', child.name);
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
      ctx.fillStyle = '#000000';
      ctx.font = 'bold 42px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif';
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
      const lines = wrapText(displayMessage, canvas.width - 120); // Adjusted for higher res
      const lineHeight = displayMessage.length > 200 ? 60 : 80; // Scaled for higher res
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
    texture.repeat.set(-1, -1); // Flip both X and Y for Label1
    texture.offset.set(1, 1); // Adjust offset after flipping both axes
    texture.flipY = false; // Ensure texture is not flipped vertically

    // Improve texture quality settings
    texture.minFilter = THREE.LinearMipMapLinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.anisotropy = 16; // Maximum anisotropic filtering
    texture.generateMipmaps = true;
    texture.needsUpdate = true;
    setTextTexture(texture);
  }, [message, isEncrypted, language]); // Recreate texture when message, encryption, or language changes

  // Apply text texture to Label1
  useEffect(() => {
    if (label1MeshRef.current && textTexture) {
      // console.log('Applying text to Label1', label1MeshRef.current);

      // Simply apply the texture without modifying geometry
      label1MeshRef.current.material = new THREE.MeshStandardMaterial({
        map: textTexture,
        transparent: true,
        side: THREE.DoubleSide,
        color: 0xffffff
      });
      label1MeshRef.current.material.needsUpdate = true;
      label1MeshRef.current.visible = true;
    }
  }, [textTexture]);

  // Create combined texture with image and username for Label2
  useEffect(() => {
    if (!label2MeshRef.current) return;

    // Generate unique ID for this effect run

    // Debounce to prevent multiple rapid executions
    const timeoutId = setTimeout(() => {
      // Set active flag
      effectActive.current = true;

      // console.log('Effect starting for template:', template === '/images/face.png' ? 'Virgin Mary' : 'Other', 'effectId:', effectId);

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
        // console.log('drawImageWithTemplate called:', {
        //   drawId,
        //   effectId,
        //   hasImg: !!img,
        //   imgSize: img ? {w: img.width, h: img.height} : null,
        //   hasTemplate: !!templateImg, 
        //   hasHands: !!handsImg,
        //   template,
        //   effectActive: effectActive.current
        // });
        // Check if this is likely a Clerk letter avatar (small dimensions)

        // console.log('isLetterAvatar:', isLetterAvatar, 'img dimensions:', img.width, 'x', img.height);

        // Draw the image (leave space at bottom for name)
        const imageHeight = username ? canvas.height * 0.9 : canvas.height;

        // console.log('Template check - templateImg:', !!templateImg);
        if (templateImg) {
          // When template is used, apply positioning

          // Fill with a base color first for areas not covered
          ctx.fillStyle = '#f5f5f5';
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          // FIRST: Draw template image (underneath)
          ctx.drawImage(templateImg, 0, 0, canvas.width, canvas.height);

          // SECOND: Draw user image
          ctx.save();

          // Calculate positioned dimensions - use circle
          const scaleFactor = userImageScale / 100;
          const baseSize = Math.min(canvas.width, canvas.height) * 0.4;

          // console.log('User image dimensions:', {width: img.width, height: img.height, src: img.src?.substring(0, 50)});

          // Fix for tiny images
          const actualWidth = img.width <= 10 ? 200 : img.width;
          const actualHeight = img.height <= 10 ? 200 : img.height;
          const aspectRatio = actualWidth / actualHeight;

          // Circle size
          const circleSize = baseSize * scaleFactor;
          const radius = circleSize / 2;

          // Calculate the image draw size to cover the circle while maintaining aspect ratio
          let drawWidth, drawHeight;
          if (aspectRatio > 1) {
            // Image is wider - fit to height
            drawHeight = circleSize;
            drawWidth = circleSize * aspectRatio;
          } else {
            // Image is taller or square - fit to width
            drawWidth = circleSize;
            drawHeight = circleSize / aspectRatio;
          }

          // Apply rotation
          if (userImageRotation !== 0) {
            const centerX = userImagePosition.x / 100 * canvas.width;
            const centerY = userImagePosition.y / 100 * canvas.height;
            ctx.translate(centerX, centerY);
            ctx.rotate(userImageRotation * Math.PI / 180);
            ctx.translate(-centerX, -centerY);
          }

          // Create circular clipping path
          ctx.save();
          ctx.beginPath();
          const centerX = userImagePosition.x / 100 * canvas.width;
          const centerY = userImagePosition.y / 100 * canvas.height;

          // Compress the Y-axis for cylinder projection
          // Adjust this compression factor based on your cylinder's curvature
          const yCompressionFactor = 0.7; // Start with 0.7, adjust as needed (lower = more compressed)

          // Create an elliptical clipping path (compressed on Y-axis)
          ctx.ellipse(centerX, centerY, radius,
          // X radius (unchanged)
          radius * yCompressionFactor,
          // Y radius (compressed)
          0,
          // rotation
          0,
          // start angle
          Math.PI * 2 // end angle
          );
          ctx.clip();

          // Also compress the drawn image on Y-axis
          ctx.drawImage(img, centerX - drawWidth / 2, centerY - drawHeight * yCompressionFactor / 2, drawWidth, drawHeight * yCompressionFactor);
          ctx.restore();
          ctx.restore();

          // THIRD: Draw hands/feet overlay if provided (on top)
          if (handsImg && handsImg.complete) {
            // console.log('Drawing hands overlay');
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
                if (data[i + 3] > 0) {
                  // Only adjust non-transparent pixels
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
          // console.log('No template path - drawing image to fill canvas');
          // console.log('Drawing non-template image to fill canvas:', canvas.width, 'x', canvas.height);
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
        // console.log('Applying texture to Label2, effectActive:', effectActive.current);
        if (label2MeshRef.current && label2MeshRef.current.material) {
          // Don't dispose textures - just replace
          label2MeshRef.current.material.map = texture;
          label2MeshRef.current.material.needsUpdate = true;
          // Save this texture as the last successful one
          lastTexture.current = texture;
          // console.log('Texture applied successfully');
        } else if (label2MeshRef.current) {
          // console.log('Creating new material with texture');
          label2MeshRef.current.material = new THREE.MeshStandardMaterial({
            map: texture,
            emissive: new THREE.Color(0xff6600),
            emissiveIntensity: 0.15,
            roughness: 0.7,
            metalness: 0.2,
            envMapIntensity: 0.5,
            side: THREE.FrontSide
          });
        }
      };

      // Load and draw the appropriate image
      const img = new Image();
      img.crossOrigin = 'anonymous'; // Enable CORS for external images

      // Handle template loading if one is selected
      if (template) {
        // console.log('Starting template load:', template === '/images/face2.png' ? 'Virgin Mary' : template);
        const templateImg = new Image();
        templateImg.crossOrigin = 'anonymous';

        // Load the main template first
        templateImg.onload = () => {
          // console.log('Template loaded, loading user image next');
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
              handsImg.src = '/images/FeetHands.png';
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
                  handsImg.src = '/images/FeetHands.png';
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
        // console.log('Non-template path');
        img.onload = () => {
          if (effectActive.current) {
            drawImageWithTemplate(img, null, null);
          }
        };
        img.onerror = () => {
          console.error('Failed to load image for non-template path');
        };
        if (currentImageUrl && currentImageUrl !== '/defaultAvatar.png') {
          // console.log('Non-template path: using imageUrl:', currentImageUrl);
          img.src = currentImageUrl;
        } else if (userTexture) {
          // console.log('Non-template path: using userTexture');
          img.src = userTexture.image.src;
        } else if (defaultTexture) {
          // console.log('Non-template path: using defaultTexture');
          img.src = defaultTexture.image.src;
        } else {
          // console.log('Non-template path: no image available, using default');
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

  // Animation frame update for flame
  useFrame((state, delta) => {
    if (mixerRef.current) {
      mixerRef.current.update(delta);
    }
  });

  // Also add OrbitControls to the scene
  return <>
      {clonedSceneRef.current && <primitive ref={candleRef} object={clonedSceneRef.current} scale={[2, 2, 2]} position={[0, -1, 0]} />}
      <OrbitControls enablePan={false} enableZoom={true} minDistance={2} maxDistance={8} minPolarAngle={Math.PI / 3} maxPolarAngle={Math.PI / 2} autoRotate={false} />
    </>;
}

// Preload the candle model
useGLTF.preload('/models/singleCandleAnimatedFlame.glb');

// Available background textures
const BACKGROUND_TEXTURES = [{
  id: 'cyberpunk',
  path: '/cyberpunk.webp',
  name: 'Cyberpunk'
}, {
  id: 'synthwave',
  path: '/synthwave.webp',
  name: 'Synthwave'
}, {
  id: 'gothicTokyo',
  path: '/gothicTokyo.webp',
  name: 'Gothic Tokyo'
}, {
  id: 'neoTokyo',
  path: '/neoTokyo.webp',
  name: 'Neo Tokyo'
}, {
  id: 'aurora',
  path: '/aurora.webp',
  name: 'Aurora'
}, {
  id: 'templeScene',
  path: '/templeScene.webp',
  name: 'Temple Scene'
}];

// Sanitization helper to prevent XSS attacks
const sanitizeInput = (input, maxLength = 500) => {
  if (!input) return '';

  // Convert to string and trim
  let sanitized = String(input).trim();

  // Remove any HTML tags
  sanitized = sanitized.replace(/<[^>]*>/g, '');

  // Remove any script tags and their content
  sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

  // Escape special HTML characters
  sanitized = sanitized.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#x27;').replace(/\//g, '&#x2F;');

  // Remove any potential JavaScript protocols
  sanitized = sanitized.replace(/javascript:/gi, '');
  sanitized = sanitized.replace(/data:text\/html/gi, '');
  sanitized = sanitized.replace(/vbscript:/gi, '');

  // Limit length
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }
  return sanitized;
};

// Unescape for display (converts HTML entities back for safe display)
const unescapeForDisplay = text => {
  if (!text) return '';
  return text.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#x27;/g, "'").replace(/&#x2F;/g, '/');
};
export default function CompactCandleModal({
  isOpen,
  onClose,
  onCandleCreated
}) {
  // console.log('CompactCandleModal render - isOpen:', isOpen);

  // Step tracking for multi-step flow (now 6 steps with background)
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 6; // Step 1: Candle, Step 2: Size/Image, Step 3: Message Type, Step 4: Message, Step 5: Background, Step 6: Review

  // Get top burners for Illumin80 qualification
  const topBurners = useFirestoreResults("burnedAmount");

  // Calculate minimum amount for Illumin80 (8th place)
  const getIllumin80Threshold = () => {
    if (topBurners.length >= 8) {
      return topBurners[7].burnedAmount; // 8th place (0-indexed)
    }
    return null; // Not enough data yet
  };

  // Template configurations
  const templates = [{
    id: null,
    name: 'None',
    preview: '🎯',
    position: {
      x: 50,
      y: 50
    },
    scale: 70,
    rotation: 0,
    userImagePosition: {
      x: 50,
      y: 50
    },
    // Default centered
    userImageScale: 200,
    // Doubled for new base size
    userImageRotation: 0
  }, {
    id: '/images/face2.png',
    name: 'Virgin Mary',
    preview: '👼',
    hasHandsOverlay: true,
    position: {
      x: 67,
      y: 40
    },
    scale: 25,
    rotation: 0,
    userImagePosition: {
      x: 64,
      y: 40
    },
    // User face position for Virgin Mary
    userImageScale: 60,
    // Fixed scale value
    userImageRotation: 0
  }, {
    id: '/images/saint2.png',
    name: 'Saint2',
    preview: '/images/saint2.png',
    position: {
      x: 50,
      y: 55
    },
    scale: 30,
    rotation: 0,
    userImagePosition: {
      x: 50,
      y: 23
    },
    // Adjusted for saint template
    userImageScale: 85,
    // Doubled for new base size
    userImageRotation: 0
  }];

  // Apply default template (Virgin Mary) settings on component mount
  useEffect(() => {
    const virginMaryTemplate = templates.find(t => t.id === '/images/face2.png');
    if (virginMaryTemplate) {
      setUserImagePosition(virginMaryTemplate.userImagePosition);
      setUserImageScale(virginMaryTemplate.userImageScale);
      setUserImageRotation(virginMaryTemplate.userImageRotation);
    }
  }, []); // Only run once on mount

  const {
    user,
    isSignedIn
  } = useUser();
  const [selectedPrayer, setSelectedPrayer] = useState(null);
  const [currentLanguage, setCurrentLanguage] = useState(getUserLanguage());
  const [formData, setFormData] = useState({
    messageType: '',
    // 'petition', 'confession', or 'praise'
    candleType: 'votive',
    // 'ecclesiastical', 'japanese', or 'votive' - default to votive
    candleHeight: 'medium',
    // 'short', 'medium', 'tall' - for ecclesiastical candles
    username: '',
    message: '',
    burnedAmount: '1000',
    allowLikes: false,
    // Default to not allowing likes
    background: 'synthwave' // Default background
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState('/images/face2.png'); // Virgin Mary default
  const [templatePosition, setTemplatePosition] = useState({
    x: 67,
    y: 40
  });
  const [templateScale, setTemplateScale] = useState(25);
  const [templateRotation, setTemplateRotation] = useState(0);
  const [userImagePosition, setUserImagePosition] = useState({
    x: 50,
    y: 35
  }); // Default for Virgin Mary
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
  const [showExitConfirmDialog, setShowExitConfirmDialog] = useState(false); // For exit confirmation
  // Removed isBurning state - no longer using burning effect
  const [showRotateTooltip, setShowRotateTooltip] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [toastMessage, setToastMessage] = useState(''); // For custom toast messages
  const [candleWasCreated, setCandleWasCreated] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [showCandleSnapshot, setShowCandleSnapshot] = useState(false);
  const [savedCandleData, setSavedCandleData] = useState(null);
  const [preloadCandleData, setPreloadCandleData] = useState(null);
  const [readyToCapture, setReadyToCapture] = useState(false);
  const modalContentRef = useRef(null);
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);
  const scrollContainerRef = useRef(null);

  // Preload candle data whenever form changes (for instant snapshot)
  React.useEffect(() => {
    if (formData.username || imagePreview) {
      setPreloadCandleData({
        username: formData.username || 'Anonymous',
        imageUrl: imagePreview || '/defaultAvatar.png',
        message: formData.message,
        burnedAmount: formData.burnedAmount
      });
    }
  }, [formData, imagePreview]);

  // Hide tooltip on canvas interaction

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

  // Debug exit dialog state
  // useEffect(() => {
  //   console.log('showExitConfirmDialog state changed to:', showExitConfirmDialog);
  // }, [showExitConfirmDialog]);

  // Reset form when modal opens and prepopulate with Clerk user data
  useEffect(() => {
    if (isOpen) {
      // Debug: Log the entire Clerk user object to see Discord avatar info
      // console.log('Clerk user object:', user);
      // console.log('User imageUrl:', user?.imageUrl);
      // console.log('User hasImage:', user?.hasImage);
      // console.log('External accounts:', user?.externalAccounts);

      // Get Clerk user image
      let clerkImageUrl = null;

      // Check if user has a valid image (not the default avatar)
      if (user?.hasImage && user?.imageUrl) {
        // console.log('User has custom image from OAuth or upload');
        clerkImageUrl = user.imageUrl;
      } else if (user?.imageUrl && !user?.imageUrl.includes('gravatar')) {
        // Sometimes Clerk uses gravatar for default avatars
        // console.log('Using user imageUrl (non-gravatar)');
        clerkImageUrl = user.imageUrl;
      }

      // If still no image, try to get from external accounts
      if (!clerkImageUrl && user?.externalAccounts && user.externalAccounts.length > 0) {
        // console.log('Checking external accounts for avatar...');
        const discordAccount = user.externalAccounts.find(account => account.provider === 'discord' || account.provider === 'oauth_discord');
        if (discordAccount) {
          // console.log('Discord account found:', discordAccount);
          // Try different possible properties
          clerkImageUrl = discordAccount.imageUrl || discordAccount.avatarUrl || discordAccount.picture || discordAccount.avatar_url || null;
          if (clerkImageUrl) {
            // console.log('Using Discord avatar:', clerkImageUrl);
          }
        }
      }

      // console.log('Final clerkImageUrl:', clerkImageUrl);

      setFormData({
        messageType: '',
        candleType: 'votive',
        // Reset to default votive
        username: '',
        message: '',
        burnedAmount: '1000',
        allowLikes: false
      });
      setCurrentStep(1);
      setSelectedPrayer(null);
      // Don't clear imageFile if we already have one (preserve across template changes)
      if (!imageFile && !imagePreview) {
        setImageFile(null);
        // Set Clerk profile image as preview if available
        setImagePreview(clerkImageUrl);
      }
      setSelectedTemplate('/images/face2.png'); // Reset to Virgin Mary default
      setTemplatePosition({
        x: 67,
        y: 40
      });
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

  // Helper function to get byte length of a string
  const getByteLength = str => {
    return new TextEncoder().encode(str).length;
  };
  const handleInputChange = e => {
    const {
      name,
      value
    } = e.target;

    // Input validation and sanitization
    let sanitizedValue = value;
    if (name === 'username') {
      // Limit username length and remove dangerous characters
      sanitizedValue = value.slice(0, 50) // Max 50 characters
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
  const selectTemplate = template => {
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
  const handleImageChange = e => {
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
    return new Promise(resolve => {
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
          const imgX = userImgPosition.x / 100 * canvas.width - imgWidth / 2;
          const imgY = userImgPosition.y / 100 * canvas.height - imgHeight / 2;

          // Apply rotation if needed
          if (userImgRotation !== 0) {
            const centerX = userImgPosition.x / 100 * canvas.width;
            const centerY = userImgPosition.y / 100 * canvas.height;
            ctx.translate(centerX, centerY);
            ctx.rotate(userImgRotation * Math.PI / 180);
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
                if (data[i + 3] > 0) {
                  // Only adjust non-transparent pixels
                  // Convert RGB to HSL
                  const r = data[i] / 255;
                  const g = data[i + 1] / 255;
                  const b = data[i + 2] / 255;
                  const max = Math.max(r, g, b);
                  const min = Math.min(r, g, b);
                  let h,
                    s,
                    l = (max + min) / 2;
                  if (max !== min) {
                    const d = max - min;
                    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
                    switch (max) {
                      case r:
                        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
                        break;
                      case g:
                        h = ((b - r) / d + 2) / 6;
                        break;
                      case b:
                        h = ((r - g) / d + 4) / 6;
                        break;
                    }

                    // Adjust hue based on skinTone
                    h = h + skinTone / 300; // Subtle hue shift
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
                        if (t < 1 / 6) return p + (q - p) * 6 * t;
                        if (t < 1 / 2) return q;
                        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
                        return p;
                      };
                      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
                      const p = 2 * l - q;
                      r2 = hue2rgb(p, q, h + 1 / 3);
                      g2 = hue2rgb(p, q, h);
                      b2 = hue2rgb(p, q, h - 1 / 3);
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
        handsImg.src = '/images/FeetHands.png';
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
      setFormData(prev => ({
        ...prev,
        message: result.prayer
      }));
      setSelectedPrayer(null); // Mark as custom
      setRemainingPrayers(result.remaining);
      if (result.fromCache) {
        // Optional: show that it came from cache
        // console.log('Prayer served from cache');
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
    // console.log('uploadImage called - user:', user);
    // console.log('imageFile:', imageFile);
    // console.log('imagePreview:', imagePreview);
    let finalImageUrl = null;

    // Get base image URL
    if (imageFile) {
      // Only apply templates for votive candles
      if (selectedTemplate && formData.candleType === 'votive') {
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
      if (selectedTemplate && formData.candleType === 'votive') {
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

    // If no image was processed but we have a Clerk image, use it
    if (!finalImageUrl && user?.imageUrl) {
      // console.log('Using Clerk user image as fallback:', user.imageUrl);
      finalImageUrl = user.imageUrl;
    }

    // console.log('uploadImage returning:', finalImageUrl);
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
          // console.log('Captured image data:', imageData ? 'Success' : 'Failed');
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

  const handleSubmit = e => {
    // console.log('handleSubmit called');
    e.preventDefault();
    e.stopPropagation();

    // Don't submit if we're showing other dialogs
    if (showPasswordDialog) {
      // console.log('Password dialog is showing, returning');
      return;
    }

    // Validate and sanitize fields
    const trimmedUsername = sanitizeInput(formData.username, 50).trim();
    let trimmedMessage = sanitizeInput(formData.message, 500).trim();

    // Ensure message doesn't exceed 500 bytes (fallback safety check)
    if (getByteLength(trimmedMessage) > 500) {
      trimmedMessage = truncateToBytes(trimmedMessage, 500);
      // Update form data to reflect truncation
      setFormData(prev => ({
        ...prev,
        message: trimmedMessage
      }));
    }
    if (!formData.messageType) {
      setError('Please select a message type');
      return;
    }
    if (!formData.candleType) {
      setError('Please select a candle type');
      return;
    }
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
    if (getByteLength(trimmedMessage) > 500) {
      setError('Message must be less than 500 bytes');
      return;
    }

    // Default burnedAmount to 1000 if not set
    if (!formData.burnedAmount || formData.burnedAmount === '0') {
      formData.burnedAmount = '1000';
    }

    // Capture the candle image before showing dialog
    captureCandle();

    // Show confirmation dialog instead of immediately saving
    // console.log('Setting showConfirmDialog to true');
    setShowConfirmDialog(true);
    // console.log('showConfirmDialog state will be:', true);
  };
  const handleConfirmedSave = async e => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    // console.log('handleConfirmedSave called');

    // Capture the candle image first
    captureCandle();

    // Small delay to ensure image is captured
    await new Promise(resolve => setTimeout(resolve, 100));
    setShowConfirmDialog(false);

    // Get sanitized values
    const trimmedUsername = sanitizeInput(formData.username, 50).trim();
    const trimmedMessage = sanitizeInput(formData.message, 500).trim();
    // console.log('Form data:', { trimmedUsername, trimmedMessage, formData });

    // No burning effect - proceed directly to saving

    setIsSubmitting(true);
    setError('');
    try {
      // console.log('Starting save process...');
      // Upload image or use Clerk profile image
      const imageUrl = await uploadImage();
      // console.log('Image uploaded:', imageUrl);

      let docData;
      if (isEncrypted && encryptionPassword) {
        // Encrypt the message before saving
        const encryptedData = await encryptMessage(trimmedMessage, encryptionPassword);
        docData = {
          messageType: formData.messageType,
          candleType: formData.candleType,
          candleHeight: formData.candleHeight || 'medium',
          username: trimmedUsername,
          // Who the candle is dedicated to
          createdBy: user?.id,
          // Who actually created the candle
          createdByUsername: user?.username || user?.firstName || user?.fullName,
          encrypted: encryptedData.encrypted,
          salt: encryptedData.salt,
          iv: encryptedData.iv,
          isEncrypted: true,
          burnedAmount: parseInt(formData.burnedAmount) || 1000,
          image: imageUrl,
          background: formData.background || 'synthwave',
          staked: false,
          createdAt: serverTimestamp()
        };
      } else {
        // Save unencrypted message
        docData = {
          messageType: formData.messageType,
          candleType: formData.candleType,
          candleHeight: formData.candleHeight || 'medium',
          username: trimmedUsername,
          // Who the candle is dedicated to
          createdBy: user?.id,
          // Who actually created the candle
          createdByUsername: user?.username || user?.firstName || user?.fullName,
          message: trimmedMessage,
          burnedAmount: parseInt(formData.burnedAmount) || 1000,
          image: imageUrl,
          background: formData.background || 'synthwave',
          staked: false,
          createdAt: serverTimestamp()
        };
      }

      // console.log('Attempting to save to Firestore with data:', docData);
      const docRef = await addDoc(collection(db, 'candles'), docData);
      // console.log('Candle saved successfully with ID:', docRef.id);

      // Mark that candle was successfully created
      setCandleWasCreated(true);

      // Skip the toaster - the polaroid will be the success feedback
      // setToastMessage('🕯️ Your candle has been lit successfully! ✨');
      // setShowSuccessToast(true);
      // setTimeout(() => setShowSuccessToast(false), 3000);

      // Save candle data for snapshot BEFORE clearing form
      setSavedCandleData({
        username: formData.username || 'Anonymous',
        imageUrl: imageUrl,
        message: formData.message,
        burnedAmount: docData.burnedAmount,
        candleType: formData.candleType,
        candleHeight: formData.candleHeight || 'medium',
        background: formData.background || 'synthwave'
      });

      // Clear the form immediately after saving data
      setFormData({
        messageType: '',
        candleType: 'votive',
        // Reset to default votive
        username: '',
        message: '',
        burnedAmount: 1000,
        allowLikes: false
      });
      setCurrentStep(1);
      setImageFile(null);
      setImagePreview(null);
      setSelectedTemplate('/images/face2.png'); // Reset to Virgin Mary default

      // Show the candle snapshot
      setShowCandleSnapshot(true);

      // Close the modal so the polaroid shows after
      onClose();
      if (onCandleCreated) {
        onCandleCreated({
          ...docData,
          id: docRef.id,
          createdAt: new Date()
        });
      }

      // Candle successfully created and snapshot will be shown
    } catch (err) {
      console.error('Error creating candle:', err);
      console.error('Error details:', err.message, err.code);
      setError(`Failed to create candle: ${err.message || 'Please try again.'}`);
      setCandleWasCreated(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Function to render step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        // Candle Type Selection
        return <div style={{
          padding: '20px',
          textAlign: 'center'
        }}>
            <h2 style={{
            fontSize: '24px',
            marginBottom: '10px',
            color: '#ffd700',
            fontWeight: 'bold'
          }}>Choose Your Candle</h2>
            <p style={{
            fontSize: '14px',
            color: 'rgba(255, 255, 255, 0.7)',
            marginBottom: '30px'
          }}>Select the style for your offering</p>
            
            <div className="candle-selection-container" style={{
            display: 'flex',
            gap: '20px',
            justifyContent: 'center',
            flexWrap: 'wrap',
            maxWidth: '800px',
            margin: '0 auto'
          }}>
              {[{
              value: 'votive',
              label: 'Votive',
              description: 'Classic prayer candle',
              image: '/votiveCandlePreview.webp'
            }, {
              value: 'japanese',
              label: 'Japanese',
              description: 'Minimalist zen style',
              image: '/japaneseCandlePreview.webp'
            }, {
              value: 'ecclesiastical',
              label: 'Classic',
              description: 'Traditional church candle',
              image: '/EcclesiasticalMediumPreview.webp'
            }].map(type => <button key={type.value} className="candle-type-button" onClick={() => {
              setFormData(prev => ({
                ...prev,
                candleType: type.value
              }));
              // Force Canvas remount when switching to votive
              if (type.value === 'votive') {
                setCanvasKey(prev => prev + 1);
              }
              // Don't auto-advance - let user click Next when ready
            }} style={{
              padding: '20px',
              width: '200px',
              background: formData.candleType === type.value ? 'linear-gradient(135deg, rgba(255, 215, 0, 0.3), rgba(255, 215, 0, 0.2))' : 'linear-gradient(135deg, rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.3))',
              border: formData.candleType === type.value ? '2px solid #ffd700' : '1px solid rgba(255, 215, 0, 0.3)',
              borderRadius: '12px',
              color: '#fff',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '15px'
            }} onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-5px)';
              e.currentTarget.style.boxShadow = '0 10px 30px rgba(255, 215, 0, 0.3)';
            }} onMouseLeave={e => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}>
                  {/* Image Preview */}
                  <div style={{
                width: '160px',
                height: '120px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '8px',
                overflow: 'hidden',
                backgroundColor: 'rgba(0, 0, 0, 0.2)'
              }}>
                    <img src={type.image} alt={type.label} style={{
                  width: type.value === 'ecclesiastical' || type.value === 'japanese' ? '120%' : '100%',
                  height: type.value === 'ecclesiastical' || type.value === 'japanese' ? '120%' : '100%',
                  objectFit: 'contain'
                }} />
                  </div>
                  
                  <div>
                    <div style={{
                  fontSize: '18px',
                  fontWeight: 'bold',
                  marginBottom: '5px'
                }}>
                      {type.label}
                    </div>
                    <div style={{
                  fontSize: '12px',
                  color: 'rgba(255, 255, 255, 0.7)'
                }}>
                      {type.description}
                    </div>
                  </div>
                </button>)}
            </div>
          </div>;
      case 2:
        // Size/Image Customization
        // console.log('Rendering case 2');
        return <div style={{
          padding: '20px'
        }}>
            <h3 style={{
            fontSize: '20px',
            marginBottom: '20px',
            color: '#ffd700',
            textAlign: 'center'
          }}>Personalize Your Candle</h3>
            
            {/* Show image upload option for votive candles */}
            {formData.candleType === 'votive' ? <div style={{
            marginBottom: '20px'
          }}>
                <label style={{
              display: 'block',
              padding: '12px',
              borderRadius: '8px',
              backgroundColor: 'rgba(0, 0, 0, 0.3)',
              border: '1px solid rgba(255, 215, 0, 0.3)',
              cursor: 'pointer',
              textAlign: 'center',
              transition: 'all 0.2s ease'
            }}>
                  <input type="file" accept="image/jpeg,image/jpg,image/png,image/webp" onChange={handleImageChange} style={{
                display: 'none'
              }} />
                  <span style={{
                color: imageFile ? '#00ff00' : 'rgba(255, 215, 0, 0.8)',
                fontWeight: '600',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}>
                    {imageFile ? <>✅ Image Uploaded</> : <>📷 {imagePreview ? 'Change' : 'Add'} Your Image</>}
                  </span>
                </label>
                
                {/* Show preview if image uploaded */}
                {imagePreview && <div className="image-preview-container" style={{
              marginTop: '10px',
              textAlign: 'center'
            }}>
                    <img src={imagePreview} alt="Preview" style={{
                maxWidth: '100px',
                maxHeight: '100px',
                borderRadius: '8px',
                border: '1px solid rgba(255, 215, 0, 0.3)'
              }} />
                  </div>}
                
                {/* Template Gallery for Votive */}
                {(imageFile || imagePreview) && <div style={{
              marginTop: '15px',
              marginBottom: '10px'
            }}>
                    <div style={{
                color: 'rgba(255, 215, 0, 0.9)',
                fontSize: '12px',
                marginBottom: '8px',
                fontWeight: 'bold',
                textTransform: 'uppercase',
                letterSpacing: '1px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                      Select Template Style
                      <span style={{
                  fontSize: '10px',
                  opacity: 0.7,
                  fontWeight: 'normal'
                }}>← swipe →</span>
                    </div>
                    <div className="template-gallery" style={{
                display: 'flex',
                gap: '8px',
                overflowX: 'auto',
                padding: '8px 4px',
                WebkitOverflowScrolling: 'touch',
                scrollbarWidth: 'none',
                msOverflowStyle: 'none'
              }}>
                      {templates.map(template => <button key={template.id} type="button" onClick={() => selectTemplate(template)} style={{
                  minWidth: '80px',
                  width: '80px',
                  height: '90px',
                  padding: '4px',
                  backgroundColor: selectedTemplate === template.id ? 'rgba(255, 102, 0, 0.3)' : 'rgba(0, 0, 0, 0.5)',
                  border: selectedTemplate === template.id ? '2px solid #ff6600' : '1px solid rgba(255, 215, 0, 0.2)',
                  borderRadius: '8px',
                  color: selectedTemplate === template.id ? '#ff6600' : 'rgba(255, 255, 255, 0.9)',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '2px',
                  transition: 'all 0.3s ease',
                  flexShrink: 0,
                  transform: selectedTemplate === template.id ? 'scale(1.02)' : 'scale(1)'
                }}>
                          {template.id ? <img src={template.id} alt={template.name} style={{
                    width: '60px',
                    height: '60px',
                    objectFit: 'cover',
                    borderRadius: '4px',
                    marginTop: '2px'
                  }} /> : <div style={{
                    fontSize: '32px',
                    height: '60px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>{template.preview}</div>}
                          <div style={{
                    fontSize: '10px',
                    fontWeight: selectedTemplate === template.id ? 'bold' : 'normal',
                    opacity: selectedTemplate === template.id ? 1 : 0.8,
                    lineHeight: '1.2',
                    textAlign: 'center',
                    padding: '0 2px',
                    marginBottom: '2px',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    width: '100%'
                  }}>
                            {template.name}
                          </div>
                        </button>)}
                    </div>
                  </div>}

                {/* Image Position Controls - Collapsible Panel */}
                {(imageFile || imagePreview) && selectedTemplate && <>
                    <button type="button" onClick={() => setShowPositionControls(!showPositionControls)} style={{
                width: '100%',
                padding: '8px',
                marginTop: '10px',
                backgroundColor: showPositionControls ? 'rgba(255, 102, 0, 0.3)' : 'rgba(255, 102, 0, 0.1)',
                border: '1px solid rgba(255, 102, 0, 0.4)',
                borderRadius: '6px',
                color: showPositionControls ? '#ff6600' : 'rgba(255, 255, 255, 0.8)',
                cursor: 'pointer',
                fontSize: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                transition: 'all 0.3s ease'
              }}>
                      {showPositionControls ? '▼' : '▶'} Adjust Image Position
                    </button>
                    
                    <div style={{
                maxHeight: showPositionControls ? '250px' : '0',
                overflow: 'hidden',
                transition: 'all 0.3s ease',
                marginTop: showPositionControls ? '10px' : '0'
              }}>
                      <div style={{
                  padding: '12px',
                  backgroundColor: 'rgba(0, 0, 0, 0.3)',
                  border: '1px solid rgba(255, 102, 0, 0.2)',
                  borderRadius: '8px'
                }}>
                        <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '8px'
                  }}>
                          {/* X Position */}
                          <div>
                            <label style={{
                        fontSize: '11px',
                        color: 'rgba(255, 255, 255, 0.6)',
                        marginBottom: '2px',
                        display: 'block'
                      }}>
                              X: {userImagePosition.x.toFixed(0)}%
                            </label>
                            <input type="range" min="0" max="100" value={userImagePosition.x} onChange={e => setUserImagePosition({
                        ...userImagePosition,
                        x: parseFloat(e.target.value)
                      })} style={{
                        width: '100%',
                        height: '4px',
                        background: 'linear-gradient(to right, rgba(255, 102, 0, 0.3) 0%, #ff6600 100%)',
                        outline: 'none',
                        cursor: 'pointer'
                      }} />
                          </div>
                          
                          {/* Y Position */}
                          <div>
                            <label style={{
                        fontSize: '11px',
                        color: 'rgba(255, 255, 255, 0.6)',
                        marginBottom: '2px',
                        display: 'block'
                      }}>
                              Y: {userImagePosition.y.toFixed(0)}%
                            </label>
                            <input type="range" min="25" max="75" value={userImagePosition.y} onChange={e => setUserImagePosition({
                        ...userImagePosition,
                        y: parseFloat(e.target.value)
                      })} style={{
                        width: '100%',
                        height: '4px',
                        background: 'linear-gradient(to right, rgba(255, 102, 0, 0.3) 0%, #ff6600 100%)',
                        outline: 'none',
                        cursor: 'pointer'
                      }} />
                          </div>
                          
                          {/* Size */}
                          <div>
                            <label style={{
                        fontSize: '11px',
                        color: 'rgba(255, 255, 255, 0.6)',
                        marginBottom: '2px',
                        display: 'block'
                      }}>
                              Size: {userImageScale}%
                            </label>
                            <input type="range" min="50" max="150" value={userImageScale} onChange={e => setUserImageScale(parseFloat(e.target.value))} style={{
                        width: '100%',
                        height: '4px',
                        background: 'linear-gradient(to right, rgba(255, 102, 0, 0.3) 0%, #ff6600 100%)',
                        outline: 'none',
                        cursor: 'pointer'
                      }} />
                          </div>
                        </div>
                        
                        {/* Skin Tone Adjustment - Only for Virgin Mary */}
                        {selectedTemplate === '/images/face2.png' && <div style={{
                    marginTop: '8px',
                    padding: '8px',
                    backgroundColor: 'rgba(255, 215, 0, 0.05)',
                    borderRadius: '6px'
                  }}>
                            <label style={{
                      fontSize: '11px',
                      color: 'rgba(255, 255, 255, 0.6)',
                      marginBottom: '2px',
                      display: 'block'
                    }}>
                              Skin Tone: {skinToneAdjustment > 0 ? '+' : ''}{skinToneAdjustment}
                            </label>
                            <input type="range" min="-100" max="100" value={skinToneAdjustment} onChange={e => setSkinToneAdjustment(parseFloat(e.target.value))} style={{
                      width: '100%',
                      height: '4px',
                      background: 'linear-gradient(to right, #663300 0%, #ffdbac 50%, #ffe0bd 100%)',
                      outline: 'none',
                      cursor: 'pointer'
                    }} />
                          </div>}
                      </div>
                    </div>
                  </>}
              </div> : formData.candleType === 'ecclesiastical' ?
          // Height selection for ecclesiastical candles
          <div>
                <div style={{
              marginBottom: '20px'
            }}>
                  <label style={{
                display: 'block',
                marginBottom: '15px',
                fontSize: '16px',
                color: 'rgba(255, 215, 0, 0.9)',
                fontWeight: 'bold',
                textAlign: 'center'
              }}>
                    Choose Candle Height
                  </label>
                  
                  <div style={{
                display: 'flex',
                gap: '10px',
                padding: '0 10px',
                width: '100%',
                justifyContent: 'space-between'
              }}>
                    {[{
                  value: 'short',
                  label: 'Short',
                  description: 'Compact & intimate',
                  image: '/EcclesiasticalShortPreview.webp'
                }, {
                  value: 'medium',
                  label: 'Medium',
                  description: 'Classic proportions',
                  image: '/EcclesiasticalMediumPreview.webp'
                }, {
                  value: 'tall',
                  label: 'Tall',
                  description: 'Grand & stately',
                  image: '/EcclesiasticalTallPreview.webp'
                }].map(height => <button key={height.value} onClick={() => {
                  setFormData(prev => ({
                    ...prev,
                    candleHeight: height.value
                  }));
                }} style={{
                  flex: 1,
                  padding: '12px 8px',
                  background: formData.candleHeight === height.value ? 'linear-gradient(135deg, rgba(255, 215, 0, 0.3), rgba(255, 215, 0, 0.2))' : 'linear-gradient(135deg, rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.3))',
                  border: formData.candleHeight === height.value ? '2px solid #ffd700' : '1px solid rgba(255, 215, 0, 0.3)',
                  borderRadius: '8px',
                  color: '#fff',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px',
                  minWidth: '0',
                  boxShadow: formData.candleHeight === height.value ? '0 4px 15px rgba(255, 215, 0, 0.3)' : 'none'
                }}>
                        <div style={{
                    fontSize: '16px',
                    fontWeight: 'bold',
                    color: formData.candleHeight === height.value ? '#ffd700' : '#fff'
                  }}>
                          {height.label}
                        </div>
                        <div style={{
                    fontSize: '10px',
                    color: 'rgba(255, 255, 255, 0.7)',
                    textAlign: 'center',
                    lineHeight: '1.2'
                  }}>
                          {height.description}
                        </div>
                      </button>)}
                  </div>
                </div>
              </div> :
          // Height selection for Japanese candles
          <div>
                <div style={{
              marginBottom: '20px'
            }}>
                  <label style={{
                display: 'block',
                marginBottom: '15px',
                fontSize: '16px',
                color: 'rgba(255, 215, 0, 0.9)',
                fontWeight: 'bold',
                textAlign: 'center'
              }}>
                    Choose Candle Height
                  </label>
                  
                  <div style={{
                display: 'flex',
                gap: '10px',
                padding: '0 10px',
                width: '100%',
                justifyContent: 'space-between'
              }}>
                    {[{
                  value: 'short',
                  label: 'Short',
                  description: 'Intimate minimalism',
                  image: '/JapaneseShortPreview.webp'
                }, {
                  value: 'medium',
                  label: 'Medium',
                  description: 'Balanced harmony',
                  image: '/JapaneseMediumPreview.webp'
                }, {
                  value: 'tall',
                  label: 'Tall',
                  description: 'Zen elegance',
                  image: '/JapaneseTallPreview.webp'
                }].map(height => <button key={height.value} onClick={() => {
                  setFormData(prev => ({
                    ...prev,
                    candleHeight: height.value
                  }));
                }} style={{
                  flex: 1,
                  padding: '12px 8px',
                  background: formData.candleHeight === height.value ? 'linear-gradient(135deg, rgba(255, 215, 0, 0.3), rgba(255, 215, 0, 0.2))' : 'linear-gradient(135deg, rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.3))',
                  border: formData.candleHeight === height.value ? '2px solid #ffd700' : '1px solid rgba(255, 215, 0, 0.3)',
                  borderRadius: '8px',
                  color: '#fff',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px',
                  minWidth: '0',
                  boxShadow: formData.candleHeight === height.value ? '0 4px 15px rgba(255, 215, 0, 0.3)' : 'none'
                }}>
                        <div style={{
                    fontSize: '16px',
                    fontWeight: 'bold',
                    color: formData.candleHeight === height.value ? '#ffd700' : '#fff'
                  }}>
                          {height.label}
                        </div>
                        <div style={{
                    fontSize: '10px',
                    color: 'rgba(255, 255, 255, 0.7)',
                    textAlign: 'center',
                    lineHeight: '1.2'
                  }}>
                          {height.description}
                        </div>
                      </button>)}
                  </div>
                </div>
              </div>}
          </div>;
      case 3:
        // Message Type Selection
        return <div style={{
          padding: '20px',
          textAlign: 'center'
        }}>
            <h2 style={{
            fontSize: '20px',
            marginBottom: '8px',
            color: '#ffd700',
            fontWeight: 'bold'
          }}>What type of message?</h2>
            <p style={{
            fontSize: '12px',
            color: 'rgba(255, 255, 255, 0.7)',
            marginBottom: '20px'
          }}>Choose the intention for your candle</p>
            
            <div style={{
            display: 'flex',
            gap: '10px',
            width: '100%',
            justifyContent: 'space-between'
          }}>
              {[{
              value: 'petition',
              label: 'Petition',
              emoji: '🙏',
              description: 'Ask for intercession'
            }, {
              value: 'confession',
              label: 'Confession',
              emoji: '💭',
              description: 'Unburden heart'
            }, {
              value: 'praise',
              label: 'Thanks',
              emoji: '✨',
              description: 'Show gratitude'
            }].map(type => <button key={type.value} onClick={() => {
              setFormData(prev => ({
                ...prev,
                messageType: type.value
              }));
              // Don't auto-advance - let user click Next when ready
            }} style={{
              flex: 1,
              padding: '15px 8px',
              background: formData.messageType === type.value ? 'linear-gradient(135deg, rgba(255, 215, 0, 0.3), rgba(255, 215, 0, 0.2))' : 'linear-gradient(135deg, rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.3))',
              border: formData.messageType === type.value ? '2px solid #ffd700' : '1px solid rgba(255, 215, 0, 0.3)',
              borderRadius: '8px',
              color: '#fff',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '6px',
              minWidth: '0',
              boxShadow: formData.messageType === type.value ? '0 4px 15px rgba(255, 215, 0, 0.3)' : 'none'
            }}>
                  <div style={{
                fontSize: '24px',
                lineHeight: '1'
              }}>
                    {type.emoji}
                  </div>
                  <div style={{
                fontSize: '14px',
                fontWeight: 'bold',
                color: formData.messageType === type.value ? '#ffd700' : '#fff'
              }}>
                    {type.label}
                  </div>
                  <div style={{
                fontSize: '10px',
                color: 'rgba(255, 255, 255, 0.6)',
                lineHeight: '1.2'
              }}>
                    {type.description}
                  </div>
                </button>)}
            </div>
          </div>;
      case 4:
        // Message/Prayer
        // console.log('Rendering case 4');
        return <div style={{
          padding: '20px'
        }}>
            {/* Name field */}
            <div style={{
            marginBottom: '20px'
          }}>
              <label style={{
              display: 'block',
              marginBottom: '8px',
              fontSize: '14px',
              color: 'rgba(255, 255, 255, 0.8)'
            }}>
                Dedication Name
              </label>
              <input type="text" value={formData.username} onChange={e => {
              const sanitized = sanitizeInput(e.target.value, 50);
              setFormData(prev => ({
                ...prev,
                username: sanitized
              }));
            }} placeholder="On behalf of..." maxLength={50} style={{
              width: '100%',
              padding: '12px',
              borderRadius: '8px',
              backgroundColor: 'rgba(0, 0, 0, 0.3)',
              border: '1px solid rgba(255, 215, 0, 0.3)',
              color: '#fff',
              fontSize: '14px'
            }} />
            </div>
            
            
            {/* Combined Language and Prayer Selection for Petitions */}
            {formData.messageType === 'petition' && <div style={{
            display: 'flex',
            gap: '8px',
            marginBottom: '10px'
          }}>
              <select value={currentLanguage} onChange={e => {
              setCurrentLanguage(e.target.value);
              setSelectedPrayer(null);
            }} style={{
              width: '80px',
              padding: '8px',
              borderRadius: '6px',
              backgroundColor: 'rgba(0, 0, 0, 0.3)',
              border: '1px solid rgba(255, 215, 0, 0.3)',
              color: '#fff',
              fontSize: '12px',
              cursor: 'pointer'
            }}>
                <option value="en">EN</option>
                <option value="es">ES</option>
                <option value="pt">PT</option>
                <option value="fr">FR</option>
                <option value="zh">中文</option>
                <option value="hi">हिं</option>
                <option value="it">IT</option>
              </select>
              <select value={selectedPrayer || ''} onChange={e => {
              const value = e.target.value;
              if (value === '') {
                setSelectedPrayer(null);
              } else {
                const prayers = PRAYERS_BY_LANGUAGE[currentLanguage]?.prayers || PRAYERS_BY_LANGUAGE.en.prayers;
                const prayer = prayers.find(p => p.id === value);
                if (prayer) {
                  setSelectedPrayer(value);
                  setFormData(prev => ({
                    ...prev,
                    message: prayer.text
                  }));
                }
              }
            }} style={{
              flex: 1,
              padding: '8px',
              borderRadius: '6px',
              backgroundColor: 'rgba(0, 0, 0, 0.3)',
              border: '1px solid rgba(255, 215, 0, 0.3)',
              color: '#fff',
              fontSize: '12px',
              cursor: 'pointer'
            }}>
                <option value="">Select prayer template (optional)...</option>
                {(PRAYERS_BY_LANGUAGE[currentLanguage]?.prayers || PRAYERS_BY_LANGUAGE.en.prayers).map(prayer => <option key={prayer.id} value={prayer.id}>
                    {prayer.title}
                  </option>)}
              </select>
            </div>}

            <div style={{
            marginBottom: '10px'
          }}>
              <label style={{
              display: 'block',
              marginBottom: '5px',
              fontSize: '12px',
              color: 'rgba(255, 255, 255, 0.8)'
            }}>
                Your Message
              </label>
              <textarea ref={textareaRef} value={scrambledDisplay || formData.message} onChange={e => {
              if (!isEncrypted) {
                const newValue = sanitizeInput(e.target.value, 500);
                setFormData(prev => ({
                  ...prev,
                  message: newValue
                }));

                // If user edits a pre-selected prayer, deselect it
                if (selectedPrayer) {
                  const currentPrayers = PRAYERS_BY_LANGUAGE[currentLanguage]?.prayers || PRAYERS_BY_LANGUAGE.en.prayers;
                  const selectedPrayerText = currentPrayers.find(p => p.id === selectedPrayer)?.text;
                  if (selectedPrayerText && newValue !== selectedPrayerText) {
                    setSelectedPrayer(null);
                  }
                }
              }
            }} placeholder={selectedPrayer ? 'Edit the selected prayer or write your own...' : formData.messageType === 'petition' ? 'What do you seek... or select a prayer above' : formData.messageType === 'confession' ? 'What weighs on your heart...' : 'What are you grateful for...'} maxLength={500} style={{
              width: '100%',
              minHeight: '150px',
              padding: '12px',
              borderRadius: '8px',
              backgroundColor: 'rgba(0, 0, 0, 0.3)',
              border: '1px solid rgba(255, 215, 0, 0.3)',
              color: '#fff',
              fontSize: '14px',
              resize: 'vertical'
            }} />
              <div style={{
              marginTop: '5px',
              fontSize: '11px',
              color: 'rgba(255, 255, 255, 0.5)',
              textAlign: 'right'
            }}>
                {formData.message.length}/500 characters
              </div>
            </div>
          </div>;
      case 5:
        // Background Selection
        const scrollLeft = () => {
          if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollBy({
              left: -220,
              behavior: 'smooth'
            });
          }
        };
        const scrollRight = () => {
          if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollBy({
              left: 220,
              behavior: 'smooth'
            });
          }
        };
        return <div style={{
          padding: '20px 10px'
        }}>
            <h3 style={{
            fontSize: '18px',
            marginBottom: '15px',
            color: '#ffd700',
            textAlign: 'center'
          }}>Choose Your Sacred Space</h3>
            
            <div style={{
            position: 'relative'
          }}>
              {/* Left Arrow */}
              <button onClick={scrollLeft} style={{
              position: 'absolute',
              left: '-5px',
              top: '50%',
              transform: 'translateY(-50%)',
              width: '30px',
              height: '60px',
              background: 'linear-gradient(90deg, rgba(0,0,0,0.8), transparent)',
              border: 'none',
              borderRadius: '0 8px 8px 0',
              color: '#ffd700',
              fontSize: '20px',
              cursor: 'pointer',
              zIndex: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 0
            }}>
                ‹
              </button>
              
              {/* Right Arrow */}
              <button onClick={scrollRight} style={{
              position: 'absolute',
              right: '-5px',
              top: '50%',
              transform: 'translateY(-50%)',
              width: '30px',
              height: '60px',
              background: 'linear-gradient(-90deg, rgba(0,0,0,0.8), transparent)',
              border: 'none',
              borderRadius: '8px 0 0 8px',
              color: '#ffd700',
              fontSize: '20px',
              cursor: 'pointer',
              zIndex: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 0
            }}>
                ›
              </button>
              
              <div ref={scrollContainerRef} style={{
              display: 'flex',
              overflowX: 'auto',
              gap: '12px',
              padding: '10px 0',
              WebkitOverflowScrolling: 'touch',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              WebkitScrollbar: {
                display: 'none'
              }
            }}>
                {BACKGROUND_TEXTURES.map(bg => <button key={bg.id} onClick={() => setFormData(prev => ({
                ...prev,
                background: bg.id
              }))} style={{
                position: 'relative',
                padding: '0',
                background: 'none',
                border: formData.background === bg.id ? '3px solid #ffd700' : '2px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '10px',
                cursor: 'pointer',
                overflow: 'hidden',
                flexShrink: 0,
                width: '200px',
                height: '112px',
                transition: 'all 0.3s ease',
                transform: formData.background === bg.id ? 'scale(1.05)' : 'scale(1)'
              }}>
                    <img src={bg.path} alt={bg.name} style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  opacity: formData.background === bg.id ? 1 : 0.7
                }} />
                    <div style={{
                  position: 'absolute',
                  bottom: '0',
                  left: '0',
                  right: '0',
                  background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, transparent 100%)',
                  padding: '8px',
                  color: '#fff',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  textAlign: 'center'
                }}>
                      {bg.name}
                      {formData.background === bg.id && <span style={{
                    display: 'block',
                    marginTop: '3px',
                    color: '#ffd700',
                    fontSize: '10px'
                  }}>✓ Selected</span>}
                    </div>
                  </button>)}
              </div>
            </div>
          </div>;
      case 6:
        // Review & Submit
        return <div style={{
          padding: '12px'
        }}>
            <div style={{
            backgroundColor: 'rgba(0, 0, 0, 0.3)',
            borderRadius: '8px',
            padding: '12px',
            marginBottom: '10px'
          }}>
              <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '10px',
              marginBottom: '10px'
            }}>
                <div>
                  <label style={{
                  color: 'rgba(255, 255, 255, 0.6)',
                  fontSize: '10px'
                }}>Type</label>
                  <div style={{
                  color: '#fff',
                  fontSize: '13px',
                  marginTop: '2px'
                }}>
                    {formData.messageType === 'petition' && '🙏 Petition'}
                    {formData.messageType === 'confession' && '💭 Confession'}
                    {formData.messageType === 'praise' && '✨ Praise'}
                  </div>
                </div>
                
                <div>
                  <label style={{
                  color: 'rgba(255, 255, 255, 0.6)',
                  fontSize: '10px'
                }}>Style</label>
                  <div style={{
                  color: '#fff',
                  fontSize: '13px',
                  marginTop: '2px'
                }}>
                    {formData.candleType === 'ecclesiastical' && '⛪ Classic'}
                    {formData.candleType === 'japanese' && '🏮 Japanese'}
                    {formData.candleType === 'votive' && '🕯️ Votive'}
                  </div>
                </div>
              </div>
              
              <div style={{
              marginBottom: '10px'
            }}>
                <label style={{
                color: 'rgba(255, 255, 255, 0.6)',
                fontSize: '10px'
              }}>Creator</label>
                <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginTop: '3px'
              }}>
                  <div style={{
                  width: '30px',
                  height: '30px',
                  borderRadius: '50%',
                  border: '1px solid rgba(255, 215, 0, 0.5)',
                  overflow: 'hidden',
                  flexShrink: 0,
                  background: 'rgba(255, 215, 0, 0.1)'
                }}>
                    <img src={imagePreview || user?.imageUrl || '/defaultAvatar.png'} alt="Profile" style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover'
                  }} onError={e => {
                    e.target.src = '/defaultAvatar.png';
                  }} />
                  </div>
                  <div style={{
                  color: '#fff',
                  fontSize: '13px'
                }}>
                    {user?.username || user?.firstName || user?.fullName || 'You'}
                  </div>
                  <label style={{
                  marginLeft: 'auto',
                  fontSize: '10px',
                  color: 'rgba(255, 215, 0, 0.8)',
                  cursor: 'pointer',
                  textDecoration: 'underline'
                }}>
                    <input ref={fileInputRef} type="file" accept="image/jpeg,image/jpg,image/png,image/webp" onChange={handleImageChange} style={{
                    display: 'none'
                  }} />
                    Change
                  </label>
                </div>
              </div>
              
              <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '10px',
              marginBottom: '10px'
            }}>
                <div>
                  <label style={{
                  color: 'rgba(255, 255, 255, 0.6)',
                  fontSize: '10px'
                }}>Dedicated To</label>
                  <div style={{
                  color: '#fff',
                  fontSize: '13px',
                  marginTop: '2px'
                }}>
                    {unescapeForDisplay(formData.username) || 'Anonymous'}
                  </div>
                </div>
                
                <div>
                  <label style={{
                  color: 'rgba(255, 255, 255, 0.6)',
                  fontSize: '10px'
                }}>Background</label>
                  <div style={{
                  color: '#fff',
                  fontSize: '13px',
                  marginTop: '2px'
                }}>
                    {BACKGROUND_TEXTURES.find(bg => bg.id === formData.background)?.name || 'Synthwave'}
                  </div>
                </div>
              </div>
              
              <div>
                <label style={{
                color: 'rgba(255, 255, 255, 0.6)',
                fontSize: '10px'
              }}>Message</label>
                <div style={{
                color: '#fff',
                fontSize: '12px',
                marginTop: '3px',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                maxHeight: '60px',
                overflowY: 'auto',
                padding: '4px',
                backgroundColor: 'rgba(0, 0, 0, 0.2)',
                borderRadius: '4px'
              }}>
                  {unescapeForDisplay(formData.message) || 'No message'}
                </div>
              </div>
              
              {/* Offering Amount Input */}
              <div style={{
              marginTop: '10px'
            }}>
                <label style={{
                color: 'rgba(255, 255, 255, 0.6)',
                fontSize: '10px',
                display: 'block',
                marginBottom: '4px'
              }}>Candle Offering (RL80)</label>
                <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                  <button type="button" onClick={() => {
                  const currentValue = parseInt(formData.burnedAmount) || 0;
                  const newValue = Math.max(1000, currentValue - 1000);
                  setFormData(prev => ({
                    ...prev,
                    burnedAmount: newValue.toString()
                  }));
                }} style={{
                  width: '28px',
                  height: '28px',
                  background: 'rgba(255, 215, 0, 0.2)',
                  border: '1px solid rgba(255, 215, 0, 0.3)',
                  borderRadius: '4px',
                  color: 'rgba(255, 215, 0, 0.8)',
                  cursor: 'pointer',
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                    −
                  </button>
                  <input type="number" value={formData.burnedAmount} onChange={e => {
                  const value = e.target.value;
                  // Only allow numbers
                  const numericValue = value.replace(/\D/g, '');
                  // Limit to reasonable max (1 trillion) and min (1000)
                  if (numericValue === '') {
                    setFormData(prev => ({
                      ...prev,
                      burnedAmount: '1000'
                    }));
                  } else if (parseInt(numericValue) >= 1000 && parseInt(numericValue) <= 1000000000000) {
                    setFormData(prev => ({
                      ...prev,
                      burnedAmount: numericValue
                    }));
                  }
                }} style={{
                  flex: 1,
                  padding: '6px',
                  borderRadius: '4px',
                  backgroundColor: 'rgba(0, 0, 0, 0.3)',
                  border: '1px solid rgba(255, 215, 0, 0.3)',
                  color: '#ffd700',
                  fontSize: '12px',
                  textAlign: 'center',
                  fontWeight: 'bold'
                }} min="1000" />
                  <button type="button" onClick={() => {
                  const currentValue = parseInt(formData.burnedAmount) || 0;
                  const newValue = currentValue + 1000;
                  setFormData(prev => ({
                    ...prev,
                    burnedAmount: newValue.toString()
                  }));
                }} style={{
                  width: '28px',
                  height: '28px',
                  background: 'rgba(255, 215, 0, 0.2)',
                  border: '1px solid rgba(255, 215, 0, 0.3)',
                  borderRadius: '4px',
                  color: 'rgba(255, 215, 0, 0.8)',
                  cursor: 'pointer',
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                    +
                  </button>
                </div>
              </div>
            </div>
          </div>;
      default:
        return null;
    }
  };

  // Navigation handlers
  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };
  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Create portal for exit dialog
  const ExitDialog = () => {
    if (!showExitConfirmDialog) return null;
    return ReactDOM.createPortal(<div style={{
      position: 'fixed',
      top: '0px',
      left: '0px',
      width: '100vw',
      height: '100vh',
      backgroundColor: 'rgba(0, 0, 0, 0.9)',
      zIndex: 999999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
        <div style={{
        background: 'linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%)',
        border: '2px solid rgba(255, 102, 0, 0.5)',
        borderRadius: '16px',
        padding: '32px',
        width: '90%',
        maxWidth: '420px',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.8)',
        color: 'white'
      }}>
          <h3 style={{
          color: '#ff6600',
          margin: '0 0 20px 0',
          fontSize: '24px',
          textAlign: 'center'
        }}>
            ⚠️ Unsaved Changes
          </h3>
          
          <p style={{
          color: 'rgba(255, 255, 255, 0.9)',
          fontSize: '15px',
          lineHeight: '1.6',
          marginBottom: '24px',
          textAlign: 'center'
        }}>
            You have unsaved changes. Are you sure you want to close without saving your candle?
          </p>
          
          <div style={{
          display: 'flex',
          gap: '12px',
          justifyContent: 'center'
        }}>
            <button onClick={() => {
            // console.log('Continue editing clicked');
            setShowExitConfirmDialog(false);
          }} style={{
            padding: '12px 24px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            border: 'none',
            borderRadius: '8px',
            color: '#fff',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 'bold',
            flex: 1
          }}>
              Continue Editing
            </button>
            <button onClick={() => {
            // console.log('Discard clicked');
            setShowExitConfirmDialog(false);
            onClose();
          }} style={{
            padding: '12px 24px',
            background: 'rgba(255, 255, 255, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            borderRadius: '8px',
            color: 'rgba(255, 255, 255, 0.8)',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500',
            flex: 1
          }}>
              Discard Changes
            </button>
          </div>
        </div>
      </div>, document.body);
  };
  return <>
      <ExitDialog />
      
      {/* Hidden Preload Renderer - Start loading when user is on final steps */}
      {isOpen && currentStep >= 5 && formData.candleType && formData.background && <div style={{
      position: 'fixed',
      top: '-9999px',
      left: '-9999px',
      width: '1px',
      height: '1px',
      pointerEvents: 'none',
      visibility: 'hidden'
    }}>
          <CandleSnapshotRenderer isVisible={true} userData={{
        username: formData.username || 'Anonymous',
        imageUrl: imagePreview,
        candleType: formData.candleType,
        candleHeight: formData.candleHeight || 'medium',
        background: formData.background || 'synthwave'
      }} preloadOnly={true} />
        </div>}
      
      {/* Candle Snapshot Renderer - Shows polaroid AFTER modal closes */}
      {!isOpen && showCandleSnapshot && savedCandleData && <div style={{
      position: 'relative',
      zIndex: 100000
    }} onClick={e => {
      // If user clicks outside the polaroid action buttons, dismiss
      if (!e.target.closest('.action-button')) {
        // console.log('User dismissed polaroid');
        setShowCandleSnapshot(false);
        setSavedCandleData(null);
      }
    }}>
          {/* {console.log('Rendering CandleSnapshotRenderer wrapper, isOpen:', isOpen, 'showCandleSnapshot:', showCandleSnapshot, 'savedCandleData:', savedCandleData)} */}
          <CandleSnapshotRenderer isVisible={true} userData={savedCandleData} instantCapture={false} onComplete={imageData => {}} />
        </div>}
      
      {/* Success toaster removed - polaroid snapshot provides the success feedback */}
      
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
      
      {!isOpen ? null : !isSignedIn ? <div style={{
      position: 'fixed',
      top: '0',
      left: '0',
      width: '100vw',
      height: '100vh',
      backgroundColor: 'rgba(0, 0, 0, 0.9)',
      zIndex: 999999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
          <div style={{
        background: 'linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%)',
        border: '2px solid rgba(255, 102, 0, 0.5)',
        borderRadius: '16px',
        padding: '32px',
        width: '90%',
        maxWidth: '420px',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.8)',
        color: 'white',
        textAlign: 'center'
      }}>
            <h3 style={{
          color: '#ff6600',
          fontSize: '24px',
          marginBottom: '20px'
        }}>
              🕯️ Sign In Required
            </h3>
            <p style={{
          color: 'rgba(255, 255, 255, 0.8)',
          fontSize: '16px',
          lineHeight: '1.5',
          marginBottom: '20px'
        }}>
              Please sign in to create and light your candle. Your profile will be used to identify your candle in the display.
            </p>
            <button onClick={onClose} style={{
          padding: '12px 24px',
          background: 'linear-gradient(135deg, #ff6600 0%, #ff3300 100%)',
          border: 'none',
          borderRadius: '8px',
          color: '#fff',
          cursor: 'pointer',
          fontSize: '16px',
          fontWeight: 'bold'
        }}>
              Close
            </button>
          </div>
        </div> : <>
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
        
        @keyframes subtle-glow {
          0%, 100% {
            filter: drop-shadow(0 20px 40px rgba(0, 0, 0, 0.5)) brightness(1);
          }
          50% {
            filter: drop-shadow(0 25px 50px rgba(255, 170, 0, 0.3)) brightness(1.1);
          }
        }
      `}</style>
      
      <div className="compact-modal-overlay" onClick={e => {
        // Only close if clicking directly on the overlay (not on modal content)
        if (e.target === e.currentTarget) {
          // Don't close if any dialog is open
          if (showPasswordDialog || showConfirmDialog) {
            return;
          }

          // Check if the click is near the modal edges (might be accidental during rotation)
          const modalContent = modalContentRef.current;
          if (modalContent) {
            const rect = modalContent.getBoundingClientRect();
            const margin = 150; // Large tolerance around the modal (150px)

            // If click is within margin of modal, ignore it
            if (e.clientX >= rect.left - margin && e.clientX <= rect.right + margin && e.clientY >= rect.top - margin && e.clientY <= rect.bottom + margin) {
              return; // Too close to modal, likely accidental while rotating the 3D model
            }
          }

          // Check if candle was already created or if there's unsaved data
          if (candleWasCreated) {
            // Candle was created, just close
            onClose();
          } else {
            // Check if user has entered any data
            const hasUnsavedData = formData.username.trim() || formData.message.trim() || imageFile;
            if (hasUnsavedData) {
              // Show custom confirmation dialog
              setShowExitConfirmDialog(true);
            } else {
              // No data entered, just close
              onClose();
            }
          }
        }
      }}>
      <div className="compact-modal-content" ref={modalContentRef} onClick={e => e.stopPropagation()}>
        <button className="compact-modal-close" onClick={() => {
            // console.log('Close button clicked');
            // console.log('candleWasCreated:', candleWasCreated);
            // console.log('formData:', formData);

            // Check if candle was created
            if (candleWasCreated) {
              onClose();
            } else {
              // Check if user has entered any data
              const hasUnsavedData = formData.username.trim() || formData.message.trim() || imageFile;
              // console.log('hasUnsavedData:', hasUnsavedData);
              if (hasUnsavedData) {
                // Show custom confirmation dialog
                // console.log('Setting showExitConfirmDialog to true');
                setShowExitConfirmDialog(true);
              } else {
                // No data entered, just close
                onClose();
              }
            }
          }}>×</button>
        
        <div className="compact-modal-layout">
          {/* Left side - 3D Preview */}
          <div className={`compact-candle-preview ${currentStep === 4 ? 'message-step' : ''}`}>
            <div className="preview-label">Your Candle Preview</div>
            {/* Conditionally show Canvas for votive (with overlay) or static image for others */}
            <div style={{
                width: '100%',
                height: 'calc(100% - 40px)',
                // Account for the preview-label height
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: currentStep >= 5 ? 'none' : 'radial-gradient(circle at center, rgba(255, 170, 0, 0.03), transparent)',
                borderRadius: '12px',
                position: 'relative',
                overflow: 'hidden'
              }}>
              {/* Background Image - shows in steps 5 and 6 */}
              {currentStep >= 5 && formData.background && <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  zIndex: 0
                }}>
                  <img src={BACKGROUND_TEXTURES.find(bg => bg.id === formData.background)?.path || '/synthwave.webp'} alt="Background" style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    opacity: 0.4
                  }} />
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'radial-gradient(circle at center, transparent 20%, rgba(0,0,0,0.6) 100%)',
                    pointerEvents: 'none'
                  }} />
                </div>}
              {formData.candleType === 'votive' && (currentStep === 2 || imagePreview) ?
                // Show 3D Canvas for votive when in Step 2 or when image is uploaded
                <Canvas key={`votive-canvas-${canvasKey}`} camera={{
                  position: [0, 2, 7],
                  fov: 45
                }} style={{
                  background: 'transparent',
                  position: 'relative',
                  zIndex: 1
                }} dpr={1} gl={{
                  antialias: false,
                  alpha: true,
                  powerPreference: "low-power",
                  preserveDrawingBuffer: false
                }}>
                  <ambientLight intensity={1} />
                  {/* <directionalLight 
                    position={[0, 5, 3]} 
                    intensity={3.8} 
                    castShadow 
                   /> */}
                  <pointLight position={[0, 3, 2]} intensity={0.5} color="#ffaa00" />
                  <Suspense fallback={null}>
                    <CandlePreview imageUrl={imagePreview || '/defaultAvatar.png'} message={formData.message} isEncrypted={false} username={formData.username} language={currentLanguage} template={selectedTemplate} templatePosition={templatePosition} templateScale={templateScale} templateRotation={templateRotation} skinToneAdjustment={skinToneAdjustment} userImagePosition={userImagePosition} userImageScale={userImageScale} userImageRotation={userImageRotation} candleModel='/models/singleCandleAnimatedFlamePreview.glb' />
                  </Suspense>
                  <OrbitControls enablePan={false} enableZoom={true} minDistance={2} maxDistance={8} minPolarAngle={Math.PI / 3} maxPolarAngle={Math.PI / 2}
                  // autoRotate={true}
                  // autoRotateSpeed={1}
                  />
                </Canvas> :
                // Show static image for Japanese and Ecclesiastical
                <img src={formData.candleType === 'ecclesiastical' ? formData.candleHeight === 'short' ? '/EcclesiasticalShortPreview.webp' : formData.candleHeight === 'tall' ? '/EcclesiasticalTallPreview.webp' : '/EcclesiasticalMediumPreview.webp' : formData.candleType === 'japanese' ? formData.candleHeight === 'short' ? '/JapaneseShortPreview.webp' : formData.candleHeight === 'tall' ? '/JapaneseTallPreview.webp' : '/JapaneseMediumPreview.webp' : '/votiveCandlePreview.webp'} alt={`${formData.candleType} candle`} style={{
                  width: 'auto',
                  height: '100%',
                  maxWidth: '100%',
                  objectFit: 'contain',
                  filter: 'drop-shadow(0 20px 40px rgba(0, 0, 0, 0.5))',
                  animation: 'subtle-glow 3s ease-in-out infinite',
                  transform: 'scale(1.4)'
                }} />}
                
                {/* Optional: Add candle info overlay */}
                {formData.username && <div style={{
                  position: 'absolute',
                  bottom: '20px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  textAlign: 'center',
                  color: '#ffd700',
                  textShadow: '0 2px 4px rgba(0, 0, 0, 0.5)'
                }}>
                    <div style={{
                    fontSize: '14px',
                    fontWeight: 'bold'
                  }}>
                      {formData.username}
                    </div>
                    {formData.messageType && <div style={{
                    fontSize: '12px',
                    marginTop: '5px',
                    opacity: 0.8
                  }}>
                        {formData.messageType === 'petition' && '🙏 Petition'}
                        {formData.messageType === 'confession' && '💭 Confession'}
                        {formData.messageType === 'praise' && '✨ Praise'}
                      </div>}
                  </div>}
              </div>
          </div>

          {/* Right side - Form */}
          <div className={`compact-form-section ${currentStep === 4 ? 'message-step' : ''}`}>
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '8px'
              }}>
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
            </div>
            
            {/* Step Progress Indicator */}
            <div className="step-indicator" style={{
                display: 'flex',
                justifyContent: 'center',
                marginBottom: '10px',
                gap: '8px'
              }}>
              {[1, 2, 3, 4, 5].map(step => <div key={step} style={{
                  width: '40px',
                  height: '4px',
                  backgroundColor: currentStep >= step ? '#ffd700' : 'rgba(255, 215, 0, 0.2)',
                  borderRadius: '2px',
                  transition: 'background-color 0.3s ease'
                }} />)}
            </div>

            {/* Step Content */}
            <div style={{
                paddingBottom: '100px'
              }}>
              {renderStepContent()}
            </div>
            
            {/* Navigation Buttons */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '20px',
                paddingBottom: 'max(40px, env(safe-area-inset-bottom, 40px))',
                borderTop: '1px solid rgba(255, 215, 0, 0.2)',
                position: 'fixed',
                bottom: 0,
                left: 0,
                right: 0,
                background: 'linear-gradient(to top, rgba(10, 10, 10, 1), rgba(10, 10, 10, 0.98))',
                zIndex: 100,
                backdropFilter: 'blur(10px)'
              }}>
              <button onClick={handlePrev} style={{
                  padding: '10px 20px',
                  background: currentStep === 1 ? 'transparent' : 'linear-gradient(135deg, rgba(255, 215, 0, 0.2), rgba(255, 237, 78, 0.2))',
                  border: '1px solid rgba(255, 215, 0, 0.4)',
                  borderRadius: '8px',
                  color: currentStep === 1 ? 'rgba(255, 255, 255, 0.3)' : '#ffd700',
                  cursor: currentStep === 1 ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  opacity: currentStep === 1 ? 0.5 : 1
                }} disabled={currentStep === 1}>
                Back
              </button>
              
              {currentStep < 6 ? <button onClick={handleNext} style={{
                  padding: '10px 30px',
                  background: 'linear-gradient(135deg, #ffd700, #ffed4e)',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#000',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  boxShadow: '0 4px 15px rgba(255, 215, 0, 0.3)'
                }} disabled={currentStep === 1 && !formData.candleType || currentStep === 3 && !formData.messageType}>
                  Next
                </button> : <button onClick={handleConfirmedSave} style={{
                  padding: '10px 30px',
                  background: 'linear-gradient(135deg, #ff6b35, #ff9558)',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  boxShadow: '0 4px 15px rgba(255, 107, 53, 0.4)'
                }} disabled={isSubmitting || !formData.messageType || !formData.candleType || !formData.username.trim()}>
                  {isSubmitting ? 'Lighting...' : 'Light Candle 🔥'}
                </button>}
            </div>
            
            {error && <div className="compact-error">{error}</div>}
            
            <form onSubmit={handleSubmit} style={{
                display: 'none'
              }}>
              {/* Row 1: Username and Amount */}
              <div className="compact-form-group" style={{
                  display: 'flex',
                  gap: '10px',
                  marginBottom: '12px'
                }}>
                {/* Username - Left */}
                <input type="text" name="username" value={formData.username} onChange={handleInputChange} onKeyDown={e => {
                    // Prevent Enter key from submitting form
                    if (e.key === 'Enter') {
                      e.preventDefault();
                    }
                  }} placeholder="Name (on behalf of)" maxLength={50} required style={{
                    flex: '1',
                    padding: '10px',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(0, 0, 0, 0.3)',
                    border: '1px solid rgba(255, 215, 0, 0.3)',
                    color: '#fff',
                    fontSize: '14px'
                  }} />
                
                {/* Amount - Right */}
                <div style={{
                    flex: '1.5',
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
                  
                  {/* Illumin80 Info - Always visible */}
                  <div style={{
                      position: 'relative',
                      display: 'inline-block',
                      marginLeft: '5px'
                    }}>
                    <span style={{
                        fontSize: '12px',
                        cursor: 'help',
                        color: '#9ca3af',
                        fontWeight: 'bold'
                      }} title={`Illumin80: Exclusive status for top 8 burners${getIllumin80Threshold() ? ` (currently ${getIllumin80Threshold().toLocaleString()}+ RL80)` : '. Leaderboard loading...'}`}>
                      ℹ️
                    </span>
                  </div>
                  
                  {/* Qualification Status - Only show crown when qualified */}
                  {(() => {
                      const threshold = getIllumin80Threshold();
                      const currentAmount = parseInt(formData.burnedAmount) || 0;
                      if (!threshold || !currentAmount || currentAmount === 0) return null;
                      // Only show icon if they qualify
                      if (!wouldQualify) return null;
                      return <div style={{
                        position: 'relative',
                        display: 'inline-block',
                        marginLeft: '5px'
                      }}>
                        <span style={{
                          fontSize: '12px',
                          cursor: 'help',
                          color: '#10b981',
                          fontWeight: 'bold'
                        }} title={`✅ Qualifies for Illumin80! Your ${currentAmount.toLocaleString()} RL80 meets the top 8 threshold of ${threshold.toLocaleString()}`}>
                          👑
                        </span>
                      </div>;
                    })()}
                  <input type="text" name="burnedAmount" value={formData.burnedAmount} onChange={e => {
                      const value = e.target.value;
                      const numericValue = value.replace(/[^0-9]/g, '');
                      if (numericValue === '') {
                        setFormData(prev => ({
                          ...prev,
                          burnedAmount: ''
                        }));
                        return;
                      }
                      const parsed = parseInt(numericValue, 10);
                      if (parsed <= 999999999999999) {
                        setFormData(prev => ({
                          ...prev,
                          burnedAmount: parsed
                        }));
                      }
                    }} placeholder="1000" required style={{
                      flex: '1',
                      background: 'transparent',
                      border: 'none',
                      color: '#fff',
                      fontSize: '14px',
                      outline: 'none',
                      textAlign: 'right'
                    }} />
                  <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '2px'
                    }}>
                    <button type="button" onClick={() => {
                        const currentValue = parseInt(formData.burnedAmount) || 0;
                        const newValue = currentValue + 1000;
                        if (newValue <= 999999999999999) {
                          setFormData(prev => ({
                            ...prev,
                            burnedAmount: newValue
                          }));
                        }
                      }} style={{
                        background: 'rgba(255, 215, 0, 0.2)',
                        border: 'none',
                        borderRadius: '3px',
                        color: 'rgba(255, 215, 0, 0.8)',
                        cursor: 'pointer',
                        padding: '0 4px',
                        fontSize: '10px',
                        lineHeight: '1',
                        height: '12px'
                      }}>
                      ▲
                    </button>
                    <button type="button" onClick={() => {
                        const currentValue = parseInt(formData.burnedAmount) || 0;
                        const newValue = Math.max(0, currentValue - 1000);
                        setFormData(prev => ({
                          ...prev,
                          burnedAmount: newValue || ''
                        }));
                      }} style={{
                        background: 'rgba(255, 215, 0, 0.2)',
                        border: 'none',
                        borderRadius: '3px',
                        color: 'rgba(255, 215, 0, 0.8)',
                        cursor: 'pointer',
                        padding: '0 4px',
                        fontSize: '10px',
                        lineHeight: '1',
                        height: '12px'
                      }}>
                      ▼
                    </button>
                  </div>
                </div>
              </div>

              {/* Illumin80 Explanation */}
              {(() => {
                  const threshold = getIllumin80Threshold();
                  const currentAmount = parseInt(formData.burnedAmount) || 0;
                  return <div style={{
                    margin: '12px 0',
                    padding: '10px 12px',
                    backgroundColor: 'rgba(212, 175, 55, 0.05)',
                    border: '1px solid rgba(212, 175, 55, 0.2)',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: 'rgba(255, 255, 255, 0.8)',
                    lineHeight: '1.4'
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      marginBottom: '4px'
                    }}>
                      <span style={{
                        color: '#d4af37',
                        fontSize: '14px'
                      }}>✨</span>
                      <strong style={{
                        color: '#d4af37'
                      }}>Illumin80 Status</strong>
                    </div>
                    <p style={{
                      margin: 0,
                      fontSize: '11px'
                    }}>
                      The top 8 burners earn exclusive Illumin80 status with special privileges and recognition. 
                      {threshold ? <>
                          <br />
                          <span style={{
                          color: '#fbbf24'
                        }}>Current threshold: {threshold.toLocaleString()} RL80</span>
                          {currentAmount > 0 && currentAmount >= threshold && <span style={{
                          color: '#10b981',
                          fontWeight: 'bold'
                        }}> - You qualify! 👑</span>}
                        </> : <>
                          <br />
                          <span style={{
                          color: '#9ca3af'
                        }}>Loading current threshold...</span>
                        </>}
                    </p>
                  </div>;
                })()}

              {/* AI Generation Panel */}
              {showAIPanel && <div style={{
                  margin: '15px 0',
                  padding: '15px',
                  background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
                  borderRadius: '12px',
                  border: '1px solid rgba(102, 126, 234, 0.3)'
                }}>
                  <div style={{
                    marginBottom: '12px'
                  }}>
                    <label style={{
                      fontSize: '13px',
                      color: '#fff',
                      marginBottom: '8px',
                      display: 'block'
                    }}>
                      Describe what you want to pray for:
                    </label>
                    <div style={{
                      display: 'flex',
                      gap: '8px'
                    }}>
                      <input type="text" value={aiPrompt} onChange={e => setAiPrompt(e.target.value)} placeholder="e.g., 'surviving a bear market' or 'finding the next moonshot'" disabled={isGenerating || remainingPrayers === 0} onKeyDown={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          if (!isGenerating && remainingPrayers > 0) {
                            handleAIGenerate();
                          }
                        }
                      }} style={{
                        flex: 1,
                        padding: '8px 12px',
                        borderRadius: '8px',
                        backgroundColor: 'rgba(0, 0, 0, 0.3)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        color: '#fff',
                        fontSize: '14px'
                      }} />
                      <button type="button" onClick={() => handleAIGenerate()} disabled={isGenerating || remainingPrayers === 0} style={{
                        padding: '8px 20px',
                        borderRadius: '8px',
                        backgroundColor: isGenerating ? '#666' : '#667eea',
                        color: '#fff',
                        border: 'none',
                        cursor: isGenerating || remainingPrayers === 0 ? 'not-allowed' : 'pointer',
                        fontSize: '14px',
                        fontWeight: 'bold',
                        minWidth: '100px'
                      }}>
                        {isGenerating ? '🤖 Generating...' : '🤖 Generate'}
                      </button>
                    </div>
                  </div>

                  {/* Quick prompt buttons */}
                  <div style={{
                    marginTop: '12px'
                  }}>
                    <label style={{
                      fontSize: '11px',
                      color: 'rgba(255, 255, 255, 0.7)',
                      marginBottom: '6px',
                      display: 'block'
                    }}>
                      Quick prayers:
                    </label>
                    <div style={{
                      display: 'flex',
                      gap: '6px',
                      flexWrap: 'wrap'
                    }}>
                      <button type="button" onClick={() => handleAIGenerate(PRAYER_PROMPTS.diamondHands)} disabled={isGenerating || remainingPrayers === 0} style={{
                        padding: '4px 10px',
                        fontSize: '12px',
                        borderRadius: '15px',
                        backgroundColor: 'rgba(102, 126, 234, 0.2)',
                        border: '1px solid rgba(102, 126, 234, 0.4)',
                        color: '#fff',
                        cursor: isGenerating || remainingPrayers === 0 ? 'not-allowed' : 'pointer'
                      }}>
                        💎 Diamond Hands
                      </button>
                      <button type="button" onClick={() => handleAIGenerate(PRAYER_PROMPTS.findGems)} disabled={isGenerating || remainingPrayers === 0} style={{
                        padding: '4px 10px',
                        fontSize: '12px',
                        borderRadius: '15px',
                        backgroundColor: 'rgba(102, 126, 234, 0.2)',
                        border: '1px solid rgba(102, 126, 234, 0.4)',
                        color: '#fff',
                        cursor: isGenerating || remainingPrayers === 0 ? 'not-allowed' : 'pointer'
                      }}>
                        💎 Find 100x
                      </button>
                      <button type="button" onClick={() => handleAIGenerate(PRAYER_PROMPTS.bullRun)} disabled={isGenerating || remainingPrayers === 0} style={{
                        padding: '4px 10px',
                        fontSize: '12px',
                        borderRadius: '15px',
                        backgroundColor: 'rgba(102, 126, 234, 0.2)',
                        border: '1px solid rgba(102, 126, 234, 0.4)',
                        color: '#fff',
                        cursor: isGenerating || remainingPrayers === 0 ? 'not-allowed' : 'pointer'
                      }}>
                        🚀 Bull Run
                      </button>
                      <button type="button" onClick={() => handleAIGenerate(PRAYER_PROMPTS.bearMarket)} disabled={isGenerating || remainingPrayers === 0} style={{
                        padding: '4px 10px',
                        fontSize: '12px',
                        borderRadius: '15px',
                        backgroundColor: 'rgba(102, 126, 234, 0.2)',
                        border: '1px solid rgba(102, 126, 234, 0.4)',
                        color: '#fff',
                        cursor: isGenerating || remainingPrayers === 0 ? 'not-allowed' : 'pointer'
                      }}>
                        🐻 Bear Market
                      </button>
                      <button type="button" onClick={() => handleAIGenerate(PRAYER_PROMPTS.avoidLiquidation)} disabled={isGenerating || remainingPrayers === 0} style={{
                        padding: '4px 10px',
                        fontSize: '12px',
                        borderRadius: '15px',
                        backgroundColor: 'rgba(102, 126, 234, 0.2)',
                        border: '1px solid rgba(102, 126, 234, 0.4)',
                        color: '#fff',
                        cursor: isGenerating || remainingPrayers === 0 ? 'not-allowed' : 'pointer'
                      }}>
                        🔥 No Liquidation
                      </button>
                      <button type="button" onClick={() => handleAIGenerate(PRAYER_PROMPTS.rugpull)} disabled={isGenerating || remainingPrayers === 0} style={{
                        padding: '4px 10px',
                        fontSize: '12px',
                        borderRadius: '15px',
                        backgroundColor: 'rgba(102, 126, 234, 0.2)',
                        border: '1px solid rgba(102, 126, 234, 0.4)',
                        color: '#fff',
                        cursor: isGenerating || remainingPrayers === 0 ? 'not-allowed' : 'pointer'
                      }}>
                        🏃 Avoid Rugs
                      </button>
                    </div>
                  </div>

                  {remainingPrayers === 0 && <div style={{
                    marginTop: '10px',
                    padding: '8px',
                    backgroundColor: 'rgba(255, 102, 0, 0.2)',
                    borderRadius: '6px',
                    fontSize: '12px',
                    color: '#ff6600',
                    textAlign: 'center'
                  }}>
                      Daily limit reached. Try again tomorrow!
                    </div>}
                </div>}

              {/* Row 2: Prayer Template and AI Generator */}
              <div className="compact-form-group" style={{
                  display: 'flex',
                  gap: '10px',
                  marginBottom: '12px'
                }}>
                {/* Prayer Template Dropdown - Left */}
                <select value={selectedPrayer || ''} onChange={e => {
                    const value = e.target.value;
                    if (value === '') {
                      setSelectedPrayer(null);
                      // Don't clear message when deselecting
                    } else {
                      const prayers = PRAYERS_BY_LANGUAGE[currentLanguage]?.prayers || PRAYERS_BY_LANGUAGE.en.prayers;
                      const prayer = prayers.find(p => p.id === value);
                      if (prayer) {
                        setSelectedPrayer(value);
                        setFormData(prev => ({
                          ...prev,
                          message: prayer.text
                        }));
                      }
                    }
                  }} style={{
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
                  }}>
                      <option value="">Preset Prayers</option>
                      {(PRAYERS_BY_LANGUAGE[currentLanguage]?.prayers || PRAYERS_BY_LANGUAGE.en.prayers).map(prayer => <option key={prayer.id} value={prayer.id}>
                            {currentLanguage === 'es' ? prayer.id === 'scalper' ? '⚡ Scalper' : prayer.id === 'leverage' ? '📊 Apalancado' : prayer.id === 'swing' ? '🌊 Swing' : prayer.id === 'hodler' ? '💎 Holdear' : prayer.id === 'chart' ? '📈 Gráficos' : prayer.title : currentLanguage === 'pt' ? prayer.id === 'scalper' ? '⚡ Scalper' : prayer.id === 'leverage' ? '📊 Alavancagem' : prayer.id === 'swing' ? '🌊 Swing' : prayer.id === 'hodler' ? '💎 Holder' : prayer.id === 'chart' ? '📈 Gráficos' : prayer.title : currentLanguage === 'fr' ? prayer.id === 'scalper' ? '⚡ Scalper' : prayer.id === 'leverage' ? '📊 Levier' : prayer.id === 'swing' ? '🌊 Swing' : prayer.id === 'hodler' ? '💎 Hodler' : prayer.id === 'chart' ? '📈 Graphiques' : prayer.title : currentLanguage === 'it' ? prayer.id === 'scalper' ? '⚡ Scalper' : prayer.id === 'leverage' ? '📊 Leva' : prayer.id === 'swing' ? '🌊 Swing' : prayer.id === 'hodler' ? '💎 Hodler' : prayer.id === 'chart' ? '📈 Grafici' : prayer.title : currentLanguage === 'zh' ? prayer.id === 'scalper' ? '⚡ 刷单' : prayer.id === 'leverage' ? '📊 杠杆' : prayer.id === 'swing' ? '🌊 波段' : prayer.id === 'hodler' ? '💎 囤币' : prayer.id === 'chart' ? '📈 图表' : prayer.title : currentLanguage === 'hi' ? prayer.id === 'scalper' ? '⚡ स्कैल्पर' : prayer.id === 'leverage' ? '📊 लीवरेज' : prayer.id === 'swing' ? '🌊 स्विंग' : prayer.id === 'hodler' ? '💎 होडलर' : prayer.id === 'chart' ? '📈 चार्ट' : prayer.title : prayer.id === 'scalper' ? '⚡ Scalper\'s Prayer' : prayer.id === 'leverage' ? '📊 Leverage Prayer' : prayer.id === 'swing' ? '🌊 Swing Trader\'s Prayer' : prayer.id === 'hodler' ? '💎 Hodler\'s Prayer' : prayer.id === 'chart' ? '📈 Chart Mystic\'s Prayer' : prayer.title}
                          </option>)}
                    </select>
                    
                
                {/* AI Button - Right */}
                <button type="button" onClick={() => setShowAIPanel(!showAIPanel)} title="AI Prayer Generator" style={{
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
                  }} onMouseOver={e => e.currentTarget.style.transform = 'scale(1.05)'} onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}>
                  🤖 AI Prayer
                </button>
              </div>
                  
              {/* Row 3: Message Textarea */}
              <div className="compact-form-group message-group">
                <textarea ref={textareaRef} name="message" value={formData.message} onChange={e => {
                    let newValue = e.target.value;

                    // Enforce 500-byte limit
                    if (getByteLength(newValue) > 500) {
                      newValue = truncateToBytes(newValue, 500);
                      // Update the textarea value to show truncated text
                      e.target.value = newValue;
                    }

                    // Create modified event with truncated value
                    const modifiedEvent = {
                      ...e,
                      target: {
                        ...e.target,
                        value: newValue,
                        name: 'message'
                      }
                    };
                    handleInputChange(modifiedEvent);
                    // If user edits a pre-made prayer, mark as custom
                    const currentPrayers = PRAYERS_BY_LANGUAGE[currentLanguage]?.prayers || PRAYERS_BY_LANGUAGE.en.prayers;
                    if (selectedPrayer && currentPrayers.find(p => p.id === selectedPrayer)?.text !== newValue) {
                      setSelectedPrayer(null);
                    }
                  }} placeholder={selectedPrayer ? "Edit the selected prayer or write your own..." : "Write your message, prayer, wish, or dedication (max 500 bytes)"} rows={2} maxLength={500} required disabled={isEncrypted} onKeyDown={e => {
                    // Prevent Enter key from submitting form in textarea
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      // Allow Shift+Enter for new lines
                      if (e.shiftKey) {
                        return;
                      }
                    }
                  }} style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    padding: '10px',
                    paddingRight: '50px',
                    // Make room for char counter
                    borderRadius: '8px',
                    backgroundColor: 'rgba(0, 0, 0, 0.3)',
                    border: '1px solid rgba(255, 215, 0, 0.3)',
                    color: '#fff',
                    fontSize: '14px',
                    resize: 'vertical',
                    minHeight: '80px',
                    maxHeight: '150px'
                  }} />
                <span className="compact-char-count" style={{
                    position: 'absolute',
                    bottom: '12px',
                    right: '12px',
                    fontSize: '11px',
                    color: 'rgba(255, 215, 0, 0.5)',
                    pointerEvents: 'none'
                  }}>{getByteLength(formData.message)}/500 bytes</span>
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
                    backgroundColor: imageFile || imagePreview ? 'rgba(0, 255, 0, 0.1)' : 'rgba(255, 102, 0, 0.1)',
                    border: imageFile || imagePreview ? '1px solid rgba(0, 255, 0, 0.3)' : '1px solid rgba(255, 215, 0, 0.3)',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    margin: 0,
                    transition: 'all 0.2s ease',
                    position: 'relative'
                  }} onMouseEnter={e => {
                    e.currentTarget.style.transform = 'scale(1.02)';
                  }} onMouseLeave={e => {
                    e.currentTarget.style.transform = 'scale(1)';
                  }}>
                  <input ref={fileInputRef} type="file" accept="image/jpeg,image/jpg,image/png,image/webp" onChange={handleImageChange} className="compact-file-input" />
                  <span style={{
                      color: imageFile || imagePreview ? '#00ff00' : 'rgba(255, 215, 0, 0.8)',
                      fontWeight: '600',
                      fontSize: '14px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}>
                    {imageFile ? <>📷 Custom</> : imagePreview && !imageFile ? <>👤 Image</> : <>📷 Add Image</>}
                  </span>
                </label>
                
              </div>

              {/* Template Gallery - Show if image selected and votive candle */}
              {(imageFile || imagePreview) && formData.candleType === 'votive' && <div style={{
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
                    {templates.map(template => <button key={template.id || 'none'} type="button" onClick={() => selectTemplate(template)} style={{
                      minWidth: '80px',
                      height: '80px',
                      padding: '8px',
                      backgroundColor: selectedTemplate === template.id ? 'rgba(255, 102, 0, 0.3)' : 'rgba(0, 0, 0, 0.5)',
                      border: selectedTemplate === template.id ? '3px solid #ff6600' : '2px solid rgba(255, 215, 0, 0.2)',
                      borderRadius: '12px',
                      color: selectedTemplate === template.id ? '#ff6600' : 'rgba(255, 255, 255, 0.9)',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px',
                      transition: 'all 0.3s ease',
                      flexShrink: 0,
                      transform: selectedTemplate === template.id ? 'scale(1.05)' : 'scale(1)'
                    }} onMouseEnter={e => {
                      if (selectedTemplate !== template.id) {
                        e.target.style.transform = 'scale(1.05)';
                        e.target.style.backgroundColor = 'rgba(255, 102, 0, 0.2)';
                      }
                    }} onMouseLeave={e => {
                      if (selectedTemplate !== template.id) {
                        e.target.style.transform = 'scale(1)';
                        e.target.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
                      }
                    }}>
                        {template.id ? <img src={template.id} alt={template.name} style={{
                        width: '50px',
                        height: '50px',
                        objectFit: 'cover',
                        borderRadius: '8px',
                        marginBottom: '4px'
                      }} /> : <div style={{
                        fontSize: '28px',
                        marginBottom: '4px'
                      }}>{template.preview}</div>}
                        <div style={{
                        fontSize: '11px',
                        fontWeight: selectedTemplate === template.id ? 'bold' : 'normal',
                        opacity: selectedTemplate === template.id ? 1 : 0.8
                      }}>
                          {template.name}
                        </div>
                      </button>)}
                  </div>
                </div>}

              {/* User Image Position Controls - Compact Version */}
              {(imageFile || imagePreview) && selectedTemplate && formData.candleType === 'votive' && <div style={{
                  marginBottom: '12px',
                  padding: '8px',
                  backgroundColor: 'rgba(255, 102, 0, 0.05)',
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 102, 0, 0.2)'
                }}>
                  <button type="button" onClick={() => setShowPositionControls(!showPositionControls)} style={{
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
                  }}>
                    {showPositionControls ? '▼' : '▶'} Adjust Your Image
                  </button>
                  
                  {showPositionControls && selectedTemplate && <>
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
                          <input type="range" min="0" max="100" value={userImagePosition.x} onChange={e => setUserImagePosition({
                          ...userImagePosition,
                          x: parseFloat(e.target.value)
                        })} style={{
                          width: '100%',
                          height: '16px',
                          accentColor: '#ff6600'
                        }} />
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
                          <input type="range" min="25" max="75" value={userImagePosition.y} onChange={e => setUserImagePosition({
                          ...userImagePosition,
                          y: parseFloat(e.target.value)
                        })} style={{
                          width: '100%',
                          height: '16px',
                          accentColor: '#ff6600'
                        }} />
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
                          <input type="range" min="50" max="150" value={userImageScale} onChange={e => setUserImageScale(parseFloat(e.target.value))} style={{
                          width: '100%',
                          height: '16px',
                          accentColor: '#ff6600'
                        }} />
                        </div>
                          
                      </div>
                      
                      {/* Skin Tone Adjustment - Only for Virgin Mary template */}
                      {selectedTemplate === '/images/face2.png' && <div style={{
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
                            <span style={{
                          fontSize: '10px',
                          color: 'rgba(255, 255, 255, 0.5)'
                        }}>Light</span>
                            <input type="range" min="-100" max="100" value={skinToneAdjustment} onChange={e => setSkinToneAdjustment(parseFloat(e.target.value))} style={{
                          flex: 1,
                          height: '16px',
                          accentColor: '#ff6600'
                        }} />
                            <span style={{
                          fontSize: '10px',
                          color: 'rgba(255, 255, 255, 0.5)'
                        }}>Dark</span>
                          </div>
                        </div>}
                    </>}
                </div>}
              
              {/* Submit Buttons Row - More compact */}
              <div className="compact-form-actions" style={{
                  display: 'flex',
                  gap: '10px',
                  marginTop: '16px'
                }}>
                <button type="button" onClick={onClose} className="compact-btn-cancel" disabled={isSubmitting} style={{
                    flex: 1,
                    padding: '12px',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '8px',
                    color: 'rgba(255, 255, 255, 0.8)',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500',
                    transition: 'all 0.2s ease'
                  }}>
                  Cancel
                </button>
                <button type="submit" className="compact-btn-submit" disabled={isSubmitting || !formData.username.trim() || !formData.message.trim()} title={!formData.username.trim() || !formData.message.trim() ? 'Please fill in all required fields' : 'Review and light your candle'} style={{
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
                  }}>
                  {isSubmitting ? <span>Creating...</span> : <span>🕯️ Light Candle</span>}
                </button>
              </div>


              {/* Confirmation Dialog moved outside - see end of component */}

              {error && <div className="compact-error">{error}</div>}

            </form>
          </div>
        </div>
      </div>
    </div>
        </>}
    </>;
}