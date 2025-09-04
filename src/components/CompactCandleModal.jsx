import React, { useState, Suspense, useRef, useEffect } from 'react';
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

// 3D Candle Component
function CandlePreview({ imageUrl, message, isEncrypted, username, language = 'en' }) {
  const { scene } = useGLTF('/models/singleCandleAnimatedFlame.glb');
  const candleRef = useRef();
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
          setUserTexture(null);
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
  
  // Find Label meshes once when scene loads
  useEffect(() => {
    if (scene) {
      // Reset refs first
      label1MeshRef.current = null;
      label2MeshRef.current = null;
      
      scene.traverse((child) => {
        if (child.isMesh) {
          if (child.name === 'Label1' || child.name.includes('Label1')) {
            label1MeshRef.current = child;
            console.log('Found Label1 mesh:', child.name);
          }
          if (child.name === 'Label2' || child.name.includes('Label2')) {
            label2MeshRef.current = child;
            console.log('Found Label2 mesh:', child.name);
          }
        }
      });
    }
  }, [scene]); // Re-find labels when scene changes
  
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
    
    // Fill white background
    ctx.fillStyle = '#ffffff';
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
  }, [message, isEncrypted]); // Recreate texture when message or encryption changes
  
  // Apply text texture to Label1
  useEffect(() => {
    if (label1MeshRef.current && textTexture) {
      console.log('Applying text to Label1');
      
      if (label1MeshRef.current.material) {
        label1MeshRef.current.material.map = textTexture;
        label1MeshRef.current.material.needsUpdate = true;
      } else {
        label1MeshRef.current.material = new THREE.MeshStandardMaterial({
          map: textTexture,
          emissive: new THREE.Color(0xffffff),
          emissiveIntensity: 0.05,
          roughness: 0.9,
          metalness: 0,
        });
      }
    }
  }, [textTexture]);
  
  // Create combined texture with image and username for Label2
  useEffect(() => {
    if (label2MeshRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = 1024;
      canvas.height = 1024;
      const ctx = canvas.getContext('2d');
      
      // Fill background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Function to draw image and username
      const drawImageWithName = (img) => {
        // Draw the image (leave space at bottom for name)
        const imageHeight = username ? canvas.height * 0.9 : canvas.height;
        ctx.drawImage(img, 0, 0, canvas.width, imageHeight);
        
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
        if (label2MeshRef.current.material) {
          label2MeshRef.current.material.map = texture;
          label2MeshRef.current.material.needsUpdate = true;
        } else {
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
      img.onload = () => drawImageWithName(img);
      
      if (userTexture) {
        // Use user texture's image source
        img.src = userTexture.image.src;
      } else if (defaultTexture) {
        // Use default texture's image source
        img.src = defaultTexture.image.src;
      }
    }
  }, [userTexture, defaultTexture, username]);
  
  // Removed auto-rotation - user can control with OrbitControls
  
  return (
    <primitive 
      ref={candleRef}
      object={scene.clone()} 
      scale={[2, 2, 2]}
      position={[0, -2, 0]}
    />
  );
}

export default function CompactCandleModal({ isOpen, onClose, onCandleCreated }) {
  const [selectedPrayer, setSelectedPrayer] = useState(null);
  const [currentLanguage, setCurrentLanguage] = useState(getUserLanguage());
  const [formData, setFormData] = useState({
    username: '',
    message: '',
    burnedAmount: '',
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [isEncrypted, setIsEncrypted] = useState(false);
  const [encryptionPassword, setEncryptionPassword] = useState('');
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [scrambledDisplay, setScrambledDisplay] = useState('');
  const [canvasKey, setCanvasKey] = useState(0);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);
  
  // AI Prayer Generation states
  const [isGenerating, setIsGenerating] = useState(false);
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [remainingPrayers, setRemainingPrayers] = useState(10);
  
  // Helper function to format numbers with commas
  const formatNumberWithCommas = (num) => {
    if (!num && num !== 0) return '';
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };
  
  // Helper function to parse formatted numbers
  const parseFormattedNumber = (str) => {
    if (!str) return 0;
    const cleaned = str.replace(/[^0-9]/g, '');
    return parseInt(cleaned) || 0;
  };
  
  // Handle amount input changes
  const handleAmountChange = (e) => {
    const rawValue = e.target.value;
    const numericValue = parseFormattedNumber(rawValue);
    
    // Limit to reasonable maximum (e.g., 999 trillion)
    if (numericValue <= 999999999999999) {
      setFormData(prev => ({
        ...prev,
        burnedAmount: numericValue || ''
      }));
    }
  };
  
  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData({
        username: '',
        message: '',
        burnedAmount: '',
      });
      setSelectedPrayer(null);
      setImageFile(null);
      setImagePreview(null);
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
      
      // Clear the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      // Check remaining AI prayers
      setRemainingPrayers(getRemainingPrayers());
    }
  }, [isOpen]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Reset encryption state when message is manually changed
    if (name === 'message' && isEncrypted) {
      setIsEncrypted(false);
      setEncryptionPassword('');
      setScrambledDisplay('');
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
      if (file.size > 5 * 1024 * 1024) {
        setError('Image must be less than 5MB');
        return;
      }

      setImageFile(file);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
      setError('');
    }
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
    if (!imageFile) return null;

    const timestamp = Date.now();
    const fileName = `candles/${timestamp}_${imageFile.name}`;
    const storageRef = ref(storage, fileName);
    
    const snapshot = await uploadBytes(storageRef, imageFile);
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    return downloadURL;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Don't submit if we're showing other dialogs
    if (showPasswordDialog) {
      return;
    }
    
    // Validate fields
    if (!formData.username.trim()) {
      setError('Please enter a dedication name');
      return;
    }

    if (!formData.message.trim()) {
      setError('Please enter a message or select a prayer');
      return;
    }
    
    // Show confirmation dialog instead of immediately saving
    setShowConfirmDialog(true);
  };
  
  const handleConfirmedSave = async () => {
    setShowConfirmDialog(false);

    setIsSubmitting(true);
    setError('');

    try {
      let imageUrl = null;
      if (imageFile) {
        imageUrl = await uploadImage();
      }

      let docData;
      
      if (isEncrypted && encryptionPassword) {
        // Encrypt the message before saving
        const encryptedData = await encryptMessage(formData.message, encryptionPassword);
        docData = {
          username: formData.username,
          encrypted: encryptedData.encrypted,
          salt: encryptedData.salt,
          iv: encryptedData.iv,
          isEncrypted: true,
          burnedAmount: parseInt(formData.burnedAmount) || 1000,
          image: imageUrl,
          staked: false,
          createdAt: serverTimestamp()
        };
      } else {
        // Save unencrypted message
        docData = {
          username: formData.username,
          message: formData.message,
          burnedAmount: parseInt(formData.burnedAmount) || 1000,
          image: imageUrl,
          staked: false,
          createdAt: serverTimestamp()
        };
      }

      const docRef = await addDoc(collection(db, 'results'), docData);

      if (onCandleCreated) {
        onCandleCreated({
          ...docData,
          id: docRef.id,
          createdAt: new Date()
        });
      }

      // Reset form
      setFormData({
        username: '',
        message: '',
        burnedAmount: 1000,
      });
      setImageFile(null);
      setImagePreview(null);
      
      onClose();
    } catch (err) {
      console.error('Error creating candle:', err);
      setError('Failed to create candle. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="compact-modal-overlay" 
      onMouseDown={(e) => {
        // Only mark as potential close if clicking directly on overlay
        if (e.target === e.currentTarget) {
          e.currentTarget.dataset.shouldClose = 'true';
        }
      }}
      onMouseUp={(e) => {
        // Only close if both mousedown and mouseup happened on the overlay
        if (e.target === e.currentTarget && e.currentTarget.dataset.shouldClose === 'true') {
          // Don't close if any dialog is open
          if (showPasswordDialog || showConfirmDialog) {
            return;
          }
          // Ask for confirmation if there's unsaved data
          if (formData.username.trim() || formData.message.trim() || imageFile) {
            if (window.confirm('Are you sure you want to close? Your candle data will be lost.')) {
              onClose();
            }
          } else {
            onClose();
          }
        }
        // Clean up the data attribute
        delete e.currentTarget.dataset.shouldClose;
      }}
      onClick={(e) => {
        // Prevent any click propagation issues
        if (e.target !== e.currentTarget) {
          e.stopPropagation();
        }
      }}>
      <div className="compact-modal-content" onClick={e => e.stopPropagation()}>
        <button className="compact-modal-close" onClick={onClose}>×</button>
        
        <div className="compact-modal-layout">
          {/* Left side - 3D Preview */}
          <div className="compact-candle-preview">
            <div className="preview-label">Your Candle Preview</div>
            <div className="canvas-container">
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <h2>Get Lit with RL80</h2>
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
              <div className="compact-form-group">
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
                />
              </div>

              {/* Prayer Selector */}
              <div className="compact-prayer-selector">
                <label>Choose a prayer or write your own:</label>
                <div className="prayer-buttons">
                  {(PRAYERS_BY_LANGUAGE[currentLanguage]?.prayers || PRAYERS_BY_LANGUAGE.en.prayers).map((prayer) => (
                    <button
                      key={prayer.id}
                      type="button"
                      className={`prayer-btn ${selectedPrayer === prayer.id ? 'active' : ''}`}
                      onClick={() => {
                        setSelectedPrayer(prayer.id);
                        setFormData(prev => ({ ...prev, message: prayer.text }));
                      }}
                      title={prayer.text}
                    >
                      {currentLanguage === 'es' ? 
                        (prayer.id === 'scalper' ? 'Scalper' :
                         prayer.id === 'leverage' ? 'Apalancado' :
                         prayer.id === 'swing' ? 'Swing' :
                         prayer.id === 'hodler' ? 'Holdear' :
                         prayer.id === 'chart' ? 'Gráficos' : prayer.title) :
                       currentLanguage === 'pt' ?
                        (prayer.id === 'scalper' ? 'Scalper' :
                         prayer.id === 'leverage' ? 'Alavancagem' :
                         prayer.id === 'swing' ? 'Swing' :
                         prayer.id === 'hodler' ? 'Holder' :
                         prayer.id === 'chart' ? 'Gráficos' : prayer.title) :
                       currentLanguage === 'fr' ?
                        (prayer.id === 'scalper' ? 'Scalper' :
                         prayer.id === 'leverage' ? 'Levier' :
                         prayer.id === 'swing' ? 'Swing' :
                         prayer.id === 'hodler' ? 'Hodler' :
                         prayer.id === 'chart' ? 'Graphiques' : prayer.title) :
                       currentLanguage === 'it' ?
                        (prayer.id === 'scalper' ? 'Scalper' :
                         prayer.id === 'leverage' ? 'Leva' :
                         prayer.id === 'swing' ? 'Swing' :
                         prayer.id === 'hodler' ? 'Hodler' :
                         prayer.id === 'chart' ? 'Grafici' : prayer.title) :
                       currentLanguage === 'zh' ?
                        (prayer.id === 'scalper' ? '刷单' :
                         prayer.id === 'leverage' ? '杠杆' :
                         prayer.id === 'swing' ? '波段' :
                         prayer.id === 'hodler' ? '囤币' :
                         prayer.id === 'chart' ? '图表' : prayer.title) :
                       currentLanguage === 'hi' ?
                        (prayer.id === 'scalper' ? 'स्कैल्पर' :
                         prayer.id === 'leverage' ? 'लीवरेज' :
                         prayer.id === 'swing' ? 'स्विंग' :
                         prayer.id === 'hodler' ? 'होडलर' :
                         prayer.id === 'chart' ? 'चार्ट' : prayer.title) :
                        (prayer.id === 'scalper' ? 'Scalper' :
                         prayer.id === 'leverage' ? 'Leverage' :
                         prayer.id === 'swing' ? 'Swing' :
                         prayer.id === 'hodler' ? 'Hodler' :
                         prayer.id === 'chart' ? 'Chart' : prayer.title)}
                    </button>
                  ))}
                  <button
                    type="button"
                    className={`prayer-btn ${selectedPrayer === null ? 'active' : ''}`}
                    onClick={() => {
                      setSelectedPrayer(null);
                      setFormData(prev => ({ ...prev, message: '' }));
                    }}
                  >
                    Custom
                  </button>
                </div>
              </div>

              {/* AI Prayer Generator Button */}
              <div style={{ textAlign: 'center', margin: '10px 0' }}>
                <button
                  type="button"
                  onClick={() => setShowAIPanel(!showAIPanel)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '20px',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: '#fff',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    boxShadow: '0 2px 10px rgba(102, 126, 234, 0.4)',
                    transition: 'transform 0.2s',
                  }}
                  onMouseOver={(e) => e.target.style.transform = 'scale(1.05)'}
                  onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
                >
                  ✨ AI Prayer Generator ({remainingPrayers} left today)
                </button>
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

              <div className="compact-form-group message-group">
                <div className="message-input-wrapper">
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
                    placeholder={selectedPrayer ? "Edit the prayer or write your own..." : "Write a prayer, wish, dedication, or confession"}
                    rows={3}
                    maxLength={400}
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
                  />
                  <span className="compact-char-count">{formData.message.length}/400</span>
                </div>
                <div className="message-controls" style={{ 
                  display: 'flex', 
                  flexWrap: 'wrap', 
                  gap: '10px',
                  alignItems: 'flex-end',
                  marginTop: '10px'
                }}>
                  <div style={{ display: 'flex', flexDirection: 'column', flex: '0 0 auto' }}>
                    <label style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.7)', marginBottom: '4px' }}>
                      RL80 tokens to burn
                    </label>
                    <input
                      type="text"
                      name="burnedAmount"
                      value={formatNumberWithCommas(formData.burnedAmount)}
                      onChange={handleAmountChange}
                      onKeyDown={(e) => {
                        // Prevent Enter key from submitting form
                        if (e.key === 'Enter') {
                          e.preventDefault();
                        }
                      }}
                      placeholder="Choose amount"
                      className="amount-input"
                      style={{
                        padding: '8px 12px',
                        borderRadius: '4px',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        backgroundColor: 'rgba(0, 0, 0, 0.3)',
                        color: '#fff',
                        fontSize: '14px',
                        width: '140px'
                      }}
                    />
                  </div>
                  <button
                    type="button"
                    className={`encrypt-button ${isEncrypted ? 'is-encrypted' : ''}`}
                    onClick={toggleEncryption}
                    disabled={!formData.message.trim()}
                    style={{ flex: '0 0 auto' }}
                  >
                    <span className="encrypt-text">{isEncrypted ? 'DECRYPT' : 'ENCRYPT?'}</span>
                  </button>
                  {isEncrypted && (
                    <div className="message-status" style={{ flex: '0 0 auto' }}>
                      <span className="encrypted-badge">ENCRYPTED</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="compact-form-group">
                <label className="compact-file-label" style={{
                  backgroundColor: imageFile ? 'rgba(0, 255, 0, 0.1)' : 'rgba(255, 102, 0, 0.1)',
                  border: imageFile ? '1px solid rgba(0, 255, 0, 0.3)' : '1px solid rgba(255, 102, 0, 0.3)',
                  cursor: 'pointer'
                }}>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="compact-file-input"
                  />
                  <span style={{ 
                    color: imageFile ? '#00ff00' : '#ff6600',
                    fontWeight: imageFile ? 'normal' : 'bold'
                  }}>
                    {imageFile ? '✓ Image Added' : '📷 Add Image (Recommended)'}
                  </span>
                </label>
              </div>

              {/* Password Dialog for Encryption - moved outside confirmation dialog */}
              {showPasswordDialog && (
                <div className="encryption-password-dialog" onClick={(e) => e.stopPropagation()}>
                  <div className="password-dialog-content">
                    <h3>Set Encryption Password</h3>
                    <p>Others will need this password to read your message</p>
                    <input
                      type="password"
                      value={encryptionPassword}
                      onChange={(e) => setEncryptionPassword(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          e.stopPropagation();
                          if (encryptionPassword && encryptionPassword.length >= 4) {
                            handleEncryptWithPassword();
                          }
                        }
                      }}
                      placeholder="Enter password (min 4 characters)"
                      minLength={4}
                      autoFocus
                    />
                    <div className="password-dialog-actions">
                      <button
                        type="button"
                        onClick={() => {
                          setShowPasswordDialog(false);
                          setEncryptionPassword('');
                        }}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleEncryptWithPassword}
                        disabled={!encryptionPassword || encryptionPassword.length < 4}
                      >
                        Encrypt Message
                      </button>
                    </div>
                  </div>
                </div>
              )}

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
                      <p><strong>Name:</strong> {formData.username}</p>
                      <p><strong>Amount:</strong> {formatNumberWithCommas(formData.burnedAmount)}</p>
                      <p><strong>Message:</strong> {formData.message.substring(0, 50)}{formData.message.length > 50 ? '...' : ''}</p>
                      {isEncrypted && <p className="encryption-notice">🔒 This message will be encrypted</p>}
                      <p style={{ 
                        color: imageFile ? 'inherit' : '#ff6600',
                        fontWeight: imageFile ? 'normal' : 'bold'
                      }}>
                        <strong>Image:</strong> {imageFile ? '✓ Attached' : '⚠️ No image attached (using default)'}
                      </p>
                    </div>
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

              <div className="compact-form-actions">
                <button 
                  type="button" 
                  onClick={onClose} 
                  className="compact-btn-cancel"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="compact-btn-submit"
                  disabled={isSubmitting || !formData.username.trim() || !formData.message.trim()}
                  title={!formData.username.trim() || !formData.message.trim() ? 'Please fill in all required fields' : 'Review and light your candle'}
                >
                  {isSubmitting ? (
                    <span>Creating...</span>
                  ) : (
                    <span>🕯️ Review & Light</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}