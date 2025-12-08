import React, { useState, useEffect, useRef } from "react";
import {
  Play,
  RotateCcw,
  Shield,
  Brain,
  Terminal,
  MessageSquare,
  Eye,
  Moon,
  Zap,
  Ghost,
  Skull,
  Search,
  Lock,
  User,
  Loader2,
  Sparkles,
  Image as ImageIcon,
  Heart,
  Save,
  FileText,
  BookOpen,
  Menu,
  X,
  Home,
  LogOut,
  History,
  Trash2,
  Check,
  XCircle,
  Clock,
  ArrowRight,
  PenTool,
  Lightbulb,
  Edit3,
  Plus,
  Globe,
  Target,
  Folder,
  FolderOpen,
  Users,
} from "lucide-react";

// --- API Configuration ---
const apiKey = "";

// --- 類型定義 ---
type Attribute = "courage" | "sanity";
type Genre =
  | "horror"
  | "fantasy"
  | "school"
  | "cyberpunk"
  | "romance"
  | "custom";

interface Choice {
  text: string;
  effect?: {
    attr: Attribute;
    val: number;
  };
}

interface Scene {
  id?: string;
  text: string;
  iconKeyword: string;
  visualPrompt: string;
  imageUrl?: string;
  choices: Choice[];
  isEnding?: boolean;
  endingType?: "good" | "bad" | "neutral";
  // 新增：AI 回傳的新角色或更新的角色外觀
  newCharacterRegistry?: Record<string, string>;
}

interface CustomStorySetup {
  genre: string;
  theme: string;
  protagonist: string;
  world: string;
  opening: string;
}

interface GameStateData {
  currentScene: Scene;
  history: string[];
  stats: { courage: number; sanity: number };
  genre: Genre;
  turnCount: number;
  timestamp: number;
  customSetup?: CustomStorySetup;
  // 新增：角色外觀註冊表 { "主角": "black hair, hoodie", "神秘人": "red dress" }
  characterRegistry: Record<string, string>;
}

interface AdventureLog {
  id: string;
  timestamp: number;
  genre: Genre;
  endingTitle: string;
  stats: { courage: number; sanity: number };
  turnCount: number;
  analysis: string;
}

const MAX_SAVE_SLOTS = 3;

// --- 風格設定與開場白 ---
const GENRES: Record<
  Genre,
  { label: string; icon: React.ReactNode; color: string; desc: string }
> = {
  horror: {
    label: "驚悚懸疑",
    icon: <Ghost />,
    color: "text-red-400",
    desc: "在未知的恐懼中尋找真相...",
  },
  fantasy: {
    label: "奇幻冒險",
    icon: <Shield />,
    color: "text-yellow-400",
    desc: "劍與魔法的世界，命運的召喚...",
  },
  school: {
    label: "青春校園",
    icon: <BookOpen />,
    color: "text-green-400",
    desc: "考試、社團與青澀的戀愛...",
  },
  cyberpunk: {
    label: "賽博龐克",
    icon: <Terminal />,
    color: "text-cyan-400",
    desc: "高科技低生活的霓虹都市...",
  },
  romance: {
    label: "都市愛情",
    icon: <Heart />,
    color: "text-pink-400",
    desc: "在繁忙都市中遇見那個他/她...",
  },
  custom: {
    label: "故事架構師",
    icon: <PenTool />,
    color: "text-orange-400",
    desc: "自定義類型、主角與世界觀...",
  },
};

// 預設劇本 (新增 protagonistVisual)
interface PresetSetup extends CustomStorySetup {
  protagonistVisual: string; // 用於鎖定圖片生成的一致性
}

const PRESET_SETUPS: Record<Exclude<Genre, "custom">, PresetSetup> = {
  horror: {
    genre: "心理驚悚、超自然懸疑",
    theme: "恐懼與救贖",
    protagonist: "神經質的獨居大學生",
    protagonistVisual:
      "young asian male, messy black hair, pale skin, dark circles under eyes, wearing pajamas, scared expression",
    world: "現代都市的陰暗面，流傳著午夜詛咒",
    opening:
      "凌晨 2:14。你在一陣冷汗中驚醒，房間裡死寂一片。手機螢幕忽明忽暗地閃爍著，顯示著一則來自未知號碼的訊息：\n「別靠近窗戶。」",
  },
  fantasy: {
    genre: "正統奇幻、劍與魔法",
    theme: "勇氣與命運",
    protagonist: "擁有解讀古文字天賦的新人探險家",
    protagonistVisual:
      "young adventurer, brown leather armor, holding a glowing magical map, blonde hair, determination",
    world: "魔力枯竭的艾爾德利亞大陸",
    opening:
      "你站在古老的遺跡前，手中的地圖發出微弱的光芒。傳說中的「星辰水晶」就沉睡在這座被遺忘的神殿深處。",
  },
  school: {
    genre: "日系校園、青春喜劇",
    theme: "青春與夢想",
    protagonist: "總是壓線到校的高中生",
    protagonistVisual:
      "japanese high school student, school uniform, messy hair, toast in mouth, running pose, anime style",
    world: "私立銀杏學園，充滿個性的名校",
    opening:
      "開學典禮的鐘聲剛剛響起，你叼著吐司在走廊上狂奔。轉角處，一個身影突然出現，眼看就要撞上了！",
  },
  cyberpunk: {
    genre: "賽博龐克、科幻",
    theme: "高科技與低生活",
    protagonist: "負債累累的底層駭客",
    protagonistVisual:
      "cyberpunk hacker, cybernetic arm, neon glowing jacket, futuristic glasses, rain soaked, dark alley",
    world: "2077年的新東京，霓虹燈下的貧民窟",
    opening:
      "雨水沖刷著霓虹燈牌。你作為一名賞金駭客，剛剛收到了一份加密委託：潛入「荒坂塔」的底層伺服器。",
  },
  romance: {
    genre: "都會愛情、治癒系",
    theme: "尋找靈魂伴侶",
    protagonist: "渴望浪漫的上班族",
    protagonistVisual:
      "young woman, office casual wear, long brown hair, sitting in a cafe, holding a coffee cup, soft warm lighting",
    world: "現代繁忙大都會",
    opening:
      "這家咖啡廳是你唯一的避風港。正當你享受拿鐵時，一位氣質非凡的陌生人坐在了你的對面，微笑著看著你。",
  },
};

const INSPIRATION_SEEDS: { label: string; data: CustomStorySetup }[] = [
  {
    label: "異世界轉生",
    data: {
      genre: "日系輕小說、奇幻、搞笑",
      theme: "成長、冒險",
      protagonist: "30歲社畜，有點膽小但吐槽役",
      world: "充滿魔法但每個人都需要考證照才能施法的官僚世界",
      opening: "被卡車撞到後，我發現自己轉生到了異世界公務員的面試現場...",
    },
  },
  {
    label: "末日生存",
    data: {
      genre: "末日、黑暗、生存",
      theme: "人性的考驗、犧牲",
      protagonist: "退役軍醫，帶著一隻黃金獵犬",
      world: "喪屍病毒爆發後的第10年，資源極度匱乏",
      opening:
        "無線電在沈默了三個月後，突然傳來了求救訊號，座標就在我原本以為已經淪陷的舊城區...",
    },
  },
  {
    label: "賽博懸疑",
    data: {
      genre: "科幻、懸疑、黑色電影",
      theme: "真相、科技倫理",
      protagonist: "因為義肢故障而負債累累的私家偵探",
      world: "下雨的霓虹都市，人類意識可以上傳雲端",
      opening:
        "一位沒有臉孔的仿生人走進了我的事務所，丟下了一顆存有我已故搭擋記憶的晶片...",
    },
  },
];

// 預設開場 Scene
const START_SCENES: Partial<Record<Genre, Scene>> = {
  horror: {
    text: PRESET_SETUPS.horror.opening,
    iconKeyword: "Moon",
    visualPrompt: "Dark bedroom, horror style",
    choices: [],
    imageUrl: "",
  },
  fantasy: {
    text: PRESET_SETUPS.fantasy.opening,
    iconKeyword: "Shield",
    visualPrompt: "Fantasy ruins, magical",
    choices: [],
    imageUrl: "",
  },
  school: {
    text: PRESET_SETUPS.school.opening,
    iconKeyword: "User",
    visualPrompt: "Anime school hallway, bright",
    choices: [],
    imageUrl: "",
  },
  cyberpunk: {
    text: PRESET_SETUPS.cyberpunk.opening,
    iconKeyword: "Zap",
    visualPrompt: "Cyberpunk city, neon rain",
    choices: [],
    imageUrl: "",
  },
  romance: {
    text: PRESET_SETUPS.romance.opening,
    iconKeyword: "Heart",
    visualPrompt: "Cozy cafe, warm lighting",
    choices: [],
    imageUrl: "",
  },
};

const iconMap: Record<string, React.ReactNode> = {
  Moon: <Moon size={64} className="text-blue-400" />,
  Eye: <Eye size={64} className="text-red-400" />,
  MessageSquare: <MessageSquare size={64} className="text-green-400" />,
  Zap: <Zap size={64} className="text-yellow-400" />,
  Shield: <Shield size={64} className="text-purple-400" />,
  Heart: <Heart size={64} className="text-pink-400" />,
  Brain: <Brain size={64} className="text-red-600" />,
  Ghost: <Ghost size={64} className="text-slate-400" />,
  Skull: <Skull size={64} className="text-red-800" />,
  Search: <Search size={64} className="text-cyan-400" />,
  Lock: <Lock size={64} className="text-orange-400" />,
  User: <User size={64} className="text-indigo-400" />,
  BookOpen: <BookOpen size={64} className="text-green-400" />,
  PenTool: <PenTool size={64} className="text-orange-400" />,
};

// --- API 呼叫函數 ---

async function generateNextScene(
  history: string[],
  lastChoice: string,
  stats: { courage: number; sanity: number },
  genre: Genre,
  turnCount: number,
  characterRegistry: Record<string, string>, // 傳入目前的角色外觀庫
  customSetup?: CustomStorySetup
): Promise<Scene> {
  let pacingInstruction = "";
  if (turnCount < 5) {
    pacingInstruction =
      "當前為故事【前期】。請專注於鋪陳氣氛、介紹謎團，讓玩家探索世界。";
  } else if (turnCount < 10) {
    pacingInstruction =
      "當前為故事【中期】。衝突升溫，危機感加重。請給予玩家更艱難的抉擇。";
  } else {
    pacingInstruction =
      "當前為故事【後期/結局階段】。請引導故事走向高潮與結局。";
  }

  let styleInstruction = "";
  if (customSetup) {
    styleInstruction = `
      **【風格規範】**：
      - 作品類型：${customSetup.genre}
      - 圖片生成指令(VisualPrompt) 必須嚴格反映此風格。
      `;
  }

  const systemPrompt = `
    你是一個互動式文字冒險遊戲的引擎「StoryOS」。
    目前的遊戲風格是：【${GENRES[genre].label}】。
    ${styleInstruction}
    
    **【角色一致性系統 (Character Consistency)】(非常重要)**
    目前的角色視覺資料庫 (Character Registry)：${JSON.stringify(
      characterRegistry
    )}
    
    請生成下一段劇情。
    
    規則：
    1. **劇情生成**：字數約 50-80 字。
    2. **角色管理**：
       - 如果劇情中出現了**新角色**，請在 "newCharacterRegistry" 中定義他們的外觀 (英文 Tag 格式，如 "tall man, scar on face, black suit")。
       - 如果是**舊角色**，請沿用資料庫中的特徵。
    3. **圖片生成 (VisualPrompt)**：
       - **必須**使用 Character Registry 中的描述來描繪在場的角色。
       - 格式範例: "Cinematic shot, [Scene Environment], [Character Visual Tags from Registry], [Current Action]"。
       - 確保風格統一。
    4. **生存機制**：如果「勇氣」或「理智」<= 0，強制壞結局。
    
    回傳 JSON：
    {
      "text": "...",
      "iconKeyword": "Moon",
      "visualPrompt": "...",
      "newCharacterRegistry": { "Name": "visual description" }, // 若有新角色或外觀變化請放在這
      "isEnding": boolean,
      "endingType": "good" | "bad" | "neutral" | null,
      "choices": [ { "text": "...", "effect": { "attr": "courage" | "sanity", "val": 數值 } } ]
    }
  `;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: systemPrompt }] }],
          generationConfig: { responseMimeType: "application/json" },
        }),
      }
    );

    const data = await response.json();
    return JSON.parse(data.candidates[0].content.parts[0].text);
  } catch (error) {
    console.error("Text Gen Error:", error);
    return {
      text: "訊號干擾... (AI 連線錯誤，請檢查網路或稍後再試)",
      iconKeyword: "Zap",
      visualPrompt: "Static noise screen, glitch art",
      isEnding: false,
      choices: [{ text: "嘗試重新連線", effect: { attr: "sanity", val: 0 } }],
    };
  }
}

async function generateCustomStart(setup: CustomStorySetup): Promise<Scene> {
  const systemPrompt = `
    你是一個互動式文字冒險遊戲的引擎「StoryOS」。
    玩家提供了一個【完整的故事架構】：
    1. **作品類型**：${setup.genre}
    2. **核心主題**：${setup.theme}
    3. **主角設定**：${setup.protagonist}
    4. **世界觀**：${setup.world}
    5. **開場情境**：${setup.opening}
    
    請生成開場數據。
    
    **【關鍵任務：角色視覺定義】**
    請根據主角設定，提煉出一段英文的視覺描述 (Visual Tags)，例如 "young man, messy hair, school uniform"，並放入 "newCharacterRegistry" 的 "Main Character" 欄位中。這將用於後續所有圖片生成，確保長相一致。
    
    回傳 JSON：
    {
      "iconKeyword": "...",
      "visualPrompt": "...", // 必須包含主角的視覺描述
      "newCharacterRegistry": { "Main Character": "visual description tags..." },
      "choices": [ { "text": "...", "effect": { "attr": "courage" | "sanity", "val": 數值 } } ]
    }
  `;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: systemPrompt }] }],
          generationConfig: { responseMimeType: "application/json" },
        }),
      }
    );

    const data = await response.json();
    const result = JSON.parse(data.candidates[0].content.parts[0].text);
    return { text: setup.opening, ...result, isEnding: false };
  } catch (error) {
    console.error("Custom Start Error:", error);
    return {
      text: setup.opening,
      iconKeyword: "PenTool",
      visualPrompt: "Abstract mystery",
      choices: [
        {
          text: "繼續冒險 (AI 輔助失敗，使用預設選項)",
          effect: { attr: "courage", val: 0 },
        },
        { text: "觀察四周", effect: { attr: "sanity", val: 0 } },
      ],
    };
  }
}

async function generateImage(prompt: string): Promise<string | null> {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-generate-001:predict?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          instances: [{ prompt: prompt + ", high quality, 8k, masterpiece" }],
          parameters: { sampleCount: 1, aspectRatio: "16:9" },
        }),
      }
    );
    if (!response.ok) return null;
    const data = await response.json();
    if (data.predictions && data.predictions[0]) {
      return `data:image/png;base64,${data.predictions[0].bytesBase64Encoded}`;
    }
    return null;
  } catch (error) {
    return null;
  }
}

async function generateAnalysis(
  history: string[],
  stats: { courage: number; sanity: number },
  genre: Genre
) {
  const systemPrompt = `請根據玩家在【${
    GENRES[genre].label
  }】故事中的經歷：${history.join(" -> ")} 和最終數值(勇氣${
    stats.courage
  }, 理智${stats.sanity})，寫一段 50 字的結局評價與心理分析。`;
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: systemPrompt }] }],
        }),
      }
    );
    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
  } catch (e) {
    return "數據分析失敗。";
  }
}

const Typewriter = ({
  text,
  speed = 30,
  onComplete,
}: {
  text: string;
  speed?: number;
  onComplete?: () => void;
}) => {
  const [displayedText, setDisplayedText] = useState("");
  const hasCompletedRef = useRef(false);
  useEffect(() => {
    setDisplayedText("");
    hasCompletedRef.current = false;
    let i = 0;
    const intervalId = setInterval(() => {
      if (i < text.length) {
        setDisplayedText((prev) => text.substring(0, i + 1));
        i++;
      } else {
        clearInterval(intervalId);
        if (!hasCompletedRef.current) {
          hasCompletedRef.current = true;
          if (onComplete) onComplete();
        }
      }
    }, speed);
    return () => clearInterval(intervalId);
  }, [text, speed]);
  return (
    <div className="whitespace-pre-wrap leading-relaxed">{displayedText}</div>
  );
};

const StatBar = ({
  label,
  value,
  color,
  icon: Icon,
}: {
  label: string;
  value: number;
  color: string;
  icon: any;
}) => (
  <div className="flex flex-col gap-1 w-24 sm:w-32">
    <div className="flex justify-between text-xs text-slate-400">
      <div className="flex items-center gap-1">
        <Icon
          size={12}
          className={
            value < 30 ? "animate-pulse text-red-500" : "text-slate-400"
          }
        />
        <span>{label}</span>
      </div>
      <span>{value}/100</span>
    </div>
    <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden border border-slate-700">
      <div
        className={`h-full transition-all duration-500 ease-out ${color} ${
          value < 30 ? "bg-red-500" : ""
        }`}
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      ></div>
    </div>
  </div>
);

// --- 主應用程式 ---
export default function App() {
  const [gameState, setGameState] = useState<
    "genre_select" | "start" | "playing" | "end" | "archives" | "load_save"
  >("genre_select");
  const [selectedGenre, setSelectedGenre] = useState<Genre>("horror");
  const [currentScene, setCurrentScene] = useState<Scene>(
    START_SCENES["horror"]!
  );
  const [history, setHistory] = useState<string[]>([]);
  const [stats, setStats] = useState({ courage: 50, sanity: 80 });
  const [turnCount, setTurnCount] = useState(1);
  const [textCompleted, setTextCompleted] = useState(false);
  const [customSetup, setCustomSetup] = useState<CustomStorySetup>({
    genre: "",
    theme: "",
    protagonist: "",
    world: "",
    opening: "",
  });
  const [characterRegistry, setCharacterRegistry] = useState<
    Record<string, string>
  >({});

  // UI States
  const [isTextLoading, setIsTextLoading] = useState(false);
  const [isImageLoading, setIsImageLoading] = useState(false);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [exitConfirm, setExitConfirm] = useState(false);
  const [showSaveSlots, setShowSaveSlots] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  // Data Persistence (Multi-slot)
  const [saveSlots, setSaveSlots] = useState<(GameStateData | null)[]>([
    null,
    null,
    null,
  ]);
  const [adventureLogs, setAdventureLogs] = useState<AdventureLog[]>([]);

  useEffect(() => {
    // 讀取多個存檔
    const loadedSlots = [];
    for (let i = 0; i < MAX_SAVE_SLOTS; i++) {
      const saveStr = localStorage.getItem(`story_save_${i}`);
      loadedSlots.push(saveStr ? JSON.parse(saveStr) : null);
    }
    setSaveSlots(loadedSlots);

    // 檢查回憶錄
    const logs = localStorage.getItem("story_logs");
    if (logs) {
      setAdventureLogs(JSON.parse(logs));
    }
  }, [gameState, showMenu]);

  // --- 遊戲邏輯 ---

  const handleGenreSelect = (genre: Genre) => {
    setSelectedGenre(genre);
    if (genre !== "custom" && START_SCENES[genre]) {
      setCurrentScene(START_SCENES[genre]!);
      setCustomSetup(PRESET_SETUPS[genre]);
      // 預設劇本初始化角色視覺
      if (PRESET_SETUPS[genre]) {
        setCharacterRegistry({
          "Main Character": PRESET_SETUPS[genre].protagonistVisual!,
        });
      }
    } else {
      setCustomSetup({
        genre: "",
        theme: "",
        protagonist: "",
        world: "",
        opening: "",
      });
      setCharacterRegistry({});
    }
    setGameState("start");
  };

  const handleCustomSetupChange = (
    field: keyof CustomStorySetup,
    value: string
  ) => {
    setCustomSetup((prev) => ({ ...prev, [field]: value }));
  };

  const handleStart = async () => {
    setStats({ courage: 50, sanity: 80 });
    setHistory([]);
    setTurnCount(1);

    if (selectedGenre === "custom") {
      if (!customSetup.opening.trim() || !customSetup.genre.trim()) {
        alert("請至少輸入「類型」與「開場情境」！");
        return;
      }
      setIsTextLoading(true);
      setGameState("playing");

      const customScene = await generateCustomStart(customSetup);

      // 更新場景並儲存新生成的角色外觀
      setCurrentScene(customScene);
      if (customScene.newCharacterRegistry) {
        setCharacterRegistry((prev) => ({
          ...prev,
          ...customScene.newCharacterRegistry,
        }));
      }

      setIsTextLoading(false);
      handleImageGeneration(customScene);
      return;
    }

    setGameState("playing");
    setTextCompleted(false);
    setAnalysis(null);
    if (!currentScene.imageUrl) handleImageGeneration(currentScene);
  };

  const handleImageGeneration = async (scene: Scene) => {
    setIsImageLoading(true);
    const imgUrl = await generateImage(scene.visualPrompt);
    if (imgUrl) {
      setCurrentScene((prev) => ({ ...prev, imageUrl: imgUrl }));
    }
    setIsImageLoading(false);
  };

  const handleChoice = async (choice: Choice) => {
    let newStats = { ...stats };
    const newTurnCount = turnCount + 1;
    setTurnCount(newTurnCount);

    if (choice.effect) {
      newStats = {
        ...stats,
        [choice.effect.attr]: Math.min(
          100,
          Math.max(0, stats[choice.effect.attr] + choice.effect.val)
        ),
      };
      setStats(newStats);
    }
    const newHistory = [...history, currentScene.text, `選擇: ${choice.text}`];
    setHistory(newHistory);

    setIsTextLoading(true);
    setTextCompleted(false);
    setCurrentScene((prev) => ({ ...prev, imageUrl: undefined }));

    const nextSceneData = await generateNextScene(
      newHistory,
      choice.text,
      newStats,
      selectedGenre,
      newTurnCount,
      characterRegistry, // 傳入目前的角色資料庫
      customSetup
    );

    // 更新角色資料庫
    if (nextSceneData.newCharacterRegistry) {
      setCharacterRegistry((prev) => ({
        ...prev,
        ...nextSceneData.newCharacterRegistry,
      }));
    }

    setCurrentScene(nextSceneData);
    setIsTextLoading(false);
    handleImageGeneration(nextSceneData);

    if (nextSceneData.isEnding) {
      setGameState("end");
      const analysisText = await generateAnalysis(
        newHistory,
        newStats,
        selectedGenre
      );
      setAnalysis(analysisText);
      saveToArchives(
        selectedGenre,
        nextSceneData.text.split("\n")[0],
        newStats,
        newTurnCount,
        analysisText || "無評價"
      );
    }
  };

  // --- 存檔系統 (Slot Based) ---

  const saveGameToSlot = (slotIndex: number) => {
    const saveData: GameStateData = {
      currentScene,
      history,
      stats,
      genre: selectedGenre,
      turnCount,
      timestamp: Date.now(),
      customSetup,
      characterRegistry, // 存檔也要記得存角色庫
    };
    localStorage.setItem(`story_save_${slotIndex}`, JSON.stringify(saveData));

    // Update local state immediately
    const newSlots = [...saveSlots];
    newSlots[slotIndex] = saveData;
    setSaveSlots(newSlots);

    if (isExiting) {
      setSaveMessage(`進度已儲存，正在返回主畫面...`);
      setTimeout(() => {
        setSaveMessage(null);
        exitToTitle();
      }, 1500);
    } else {
      setSaveMessage(`進度已儲存至 欄位 ${slotIndex + 1}！`);
      setTimeout(() => setSaveMessage(null), 2000);
      setShowSaveSlots(false);
    }
  };

  const loadGameFromSlot = (slotIndex: number) => {
    const saved = localStorage.getItem(`story_save_${slotIndex}`);
    if (saved) {
      const data: GameStateData = JSON.parse(saved);
      setSelectedGenre(data.genre);
      setCurrentScene(data.currentScene);
      setHistory(data.history);
      setStats(data.stats);
      setTurnCount(data.turnCount || 1);
      if (data.customSetup) setCustomSetup(data.customSetup);
      if (data.characterRegistry) setCharacterRegistry(data.characterRegistry);

      setGameState("playing");
      setTextCompleted(true);
      setAnalysis(null);
    }
  };

  const deleteSaveSlot = (slotIndex: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`確定要刪除 存檔 ${slotIndex + 1} 嗎？`)) {
      localStorage.removeItem(`story_save_${slotIndex}`);
      const newSlots = [...saveSlots];
      newSlots[slotIndex] = null;
      setSaveSlots(newSlots);
    }
  };

  // --- 回憶錄邏輯 ---
  const saveToArchives = (
    genre: Genre,
    endingTitle: string,
    finalStats: { courage: number; sanity: number },
    finalTurnCount: number,
    analysis: string
  ) => {
    const newLog: AdventureLog = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 5), // Ensure unique ID
      timestamp: Date.now(),
      genre,
      endingTitle,
      stats: finalStats,
      turnCount: finalTurnCount,
      analysis,
    };

    const existingLogsStr = localStorage.getItem("story_logs");
    const existingLogs: AdventureLog[] = existingLogsStr
      ? JSON.parse(existingLogsStr)
      : [];
    const newLogs = [newLog, ...existingLogs];
    localStorage.setItem("story_logs", JSON.stringify(newLogs));
    setAdventureLogs(newLogs);
  };

  const clearArchives = () => {
    if (window.confirm("確定要清空所有回憶錄嗎？")) {
      setAdventureLogs([]);
      localStorage.removeItem("story_logs");
    }
  };

  const exitToTitle = () => {
    setGameState("genre_select");
    setShowMenu(false);
    setExitConfirm(false);
    setShowSaveSlots(false);
    setIsExiting(false);
  };

  const formatDate = (ts: number) => {
    return new Date(ts).toLocaleString("zh-TW", {
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-cyan-900 flex flex-col items-center justify-center p-4">
      {/* 頂部狀態欄 */}
      {(gameState === "playing" || gameState === "end") && (
        <div className="fixed top-0 left-0 w-full bg-slate-900/90 backdrop-blur-md border-b border-slate-800 p-2 sm:p-3 flex justify-between items-center z-30 px-4 sm:px-6 max-w-5xl mx-auto right-0 rounded-b-xl shadow-lg transition-transform duration-300">
          <div className="flex items-center gap-2">
            <span
              className={`text-xs font-mono tracking-wider px-2 py-1 rounded border ${GENRES[selectedGenre].color} border-current bg-opacity-10 hidden sm:inline-block`}
            >
              {GENRES[selectedGenre].label}
            </span>
            <span className={`sm:hidden ${GENRES[selectedGenre].color}`}>
              {GENRES[selectedGenre].icon}
            </span>
            {gameState === "playing" && (
              <span className="flex items-center gap-1 text-xs text-slate-400 font-mono ml-2 bg-slate-800/50 px-2 py-1 rounded-full">
                <Clock size={12} /> TURN {turnCount}
              </span>
            )}
          </div>

          <div className="flex gap-4 sm:gap-6 items-center">
            <StatBar
              label="勇氣"
              value={stats.courage}
              color="bg-purple-500"
              icon={Shield}
            />
            <StatBar
              label="理智"
              value={stats.sanity}
              color="bg-green-500"
              icon={Brain}
            />

            <button
              onClick={() => {
                setShowMenu(true);
                setExitConfirm(false);
                setShowSaveSlots(false);
                setIsExiting(false);
              }}
              className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-white"
            >
              <Menu size={20} />
            </button>
          </div>
        </div>
      )}

      {/* 選單 Overlay (含存檔欄位選擇) */}
      {showMenu && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-sm flex items-center justify-center animate-fade-in px-4">
          <div className="bg-slate-900 border border-slate-700 p-6 sm:p-8 rounded-2xl shadow-2xl max-w-md w-full relative">
            <button
              onClick={() => setShowMenu(false)}
              className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors"
            >
              <X size={24} />
            </button>

            <h3 className="text-xl font-bold text-center mb-6 text-cyan-400 tracking-widest">
              {showSaveSlots
                ? isExiting
                  ? "SAVE & EXIT"
                  : "SELECT SLOT"
                : "PAUSE MENU"}
            </h3>

            {!showSaveSlots ? (
              <div className="space-y-3">
                {!exitConfirm ? (
                  <>
                    <button
                      onClick={() => setShowMenu(false)}
                      className="w-full py-4 flex items-center justify-center gap-3 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors text-lg font-medium"
                    >
                      <Play size={20} className="fill-current" /> 繼續遊戲
                    </button>
                    <div className="h-px bg-slate-700 my-2"></div>
                    <button
                      onClick={() => setExitConfirm(true)}
                      className="w-full py-4 flex items-center justify-center gap-3 bg-slate-800/50 hover:bg-red-900/30 text-slate-400 hover:text-red-400 rounded-lg transition-colors text-lg font-medium"
                    >
                      <LogOut size={20} /> 返回主畫面
                    </button>
                  </>
                ) : (
                  <div className="space-y-3 animate-fade-in-up">
                    <p className="text-center text-slate-300 mb-4">
                      是否要儲存目前的進度？
                    </p>

                    <button
                      onClick={() => {
                        setIsExiting(true);
                        setShowSaveSlots(true);
                      }}
                      className="w-full py-3 flex items-center justify-center gap-2 bg-green-800/50 hover:bg-green-700 text-green-100 rounded-lg transition-colors font-medium"
                    >
                      <Save size={18} /> 儲存並離開
                    </button>

                    <button
                      onClick={exitToTitle}
                      className="w-full py-3 flex items-center justify-center gap-2 bg-red-900/50 hover:bg-red-800 text-red-200 rounded-lg transition-colors font-medium"
                    >
                      <LogOut size={18} /> 不儲存直接離開
                    </button>

                    <button
                      onClick={() => setExitConfirm(false)}
                      className="w-full py-3 flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
                    >
                      <XCircle size={18} /> 取消
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3 animate-fade-in-up">
                {saveSlots.map((slot, idx) => (
                  <button
                    key={idx}
                    onClick={() => saveGameToSlot(idx)}
                    className="w-full p-4 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-cyan-500/50 transition-all text-left group relative"
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-bold text-slate-200 group-hover:text-cyan-300">
                        存檔 {idx + 1}
                      </span>
                      <span className="text-xs text-slate-500 font-mono">
                        {slot ? formatDate(slot.timestamp) : "---"}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 truncate">
                      {slot ? slot.currentScene.text.split("\n")[0] : "空欄位"}
                    </div>
                  </button>
                ))}
                <button
                  onClick={() => {
                    setShowSaveSlots(false);
                    setIsExiting(false);
                  }}
                  className="w-full py-2 flex items-center justify-center gap-2 text-slate-500 hover:text-white transition-colors mt-4"
                >
                  <ArrowRight size={16} className="rotate-180" /> 返回
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 存檔回饋訊息 */}
      {saveMessage && (
        <div className="fixed top-24 z-50 bg-green-600/90 text-white px-6 py-2 rounded-full shadow-lg text-sm font-bold tracking-wide animate-fade-in-up flex items-center gap-2">
          <Save size={16} /> {saveMessage}
        </div>
      )}

      <div className="w-full max-w-2xl mt-8 sm:mt-16 mb-8">
        {/* === 0. 風格選擇畫面 (主選單) === */}
        {gameState === "genre_select" && (
          <div className="text-center space-y-8 animate-fade-in py-8">
            <h1 className="text-4xl sm:text-5xl font-bold text-white mb-2 tracking-tight">
              STORY_OS
            </h1>
            <p className="text-slate-400 mb-6">請選擇你的冒險風格</p>

            {/* 置頂功能按鈕 (Load & Logs) */}
            <div className="flex flex-wrap gap-4 justify-center mb-8 w-full max-w-lg mx-auto px-4">
              <button
                onClick={() => setGameState("load_save")}
                className="flex items-center justify-center gap-2 px-6 py-2 bg-cyan-900/30 hover:bg-cyan-800/50 text-cyan-200 rounded-lg transition-colors border border-cyan-700/50 shadow-md text-sm font-medium"
              >
                <FolderOpen size={16} />
                載入進度 ({saveSlots.filter((s) => s).length})
              </button>
              <button
                onClick={() => setGameState("archives")}
                className="flex items-center justify-center gap-2 px-6 py-2 bg-slate-800/50 hover:bg-slate-700/50 text-slate-400 hover:text-cyan-400 rounded-lg transition-colors border border-slate-700/50 hover:border-cyan-500/30 text-sm font-medium"
              >
                <History size={16} />
                冒險回憶錄 ({adventureLogs.length})
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg mx-auto px-4">
              {(
                Object.entries(GENRES) as [Genre, (typeof GENRES)[Genre]][]
              ).map(([key, data]) => (
                <button
                  key={key}
                  onClick={() => handleGenreSelect(key)}
                  className={`p-4 rounded-xl border border-slate-700 bg-slate-900/50 hover:bg-slate-800 transition-all hover:scale-105 group text-left relative overflow-hidden shadow-lg`}
                >
                  <div
                    className={`absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transform group-hover:scale-150 transition-all ${data.color}`}
                  >
                    {data.icon}
                  </div>
                  <div className={`flex items-center gap-3 mb-2 ${data.color}`}>
                    {data.icon}
                    <span className="font-bold text-lg">{data.label}</span>
                  </div>
                  <p className="text-xs text-slate-400">{data.desc}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* === 載入存檔畫面 (Load Save) === */}
        {gameState === "load_save" && (
          <div className="animate-fade-in p-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-cyan-400 flex items-center gap-2">
                <FolderOpen /> 載入進度
              </h2>
              <button
                onClick={() => setGameState("genre_select")}
                className="p-2 hover:bg-slate-800 rounded-full transition-colors"
              >
                <X size={24} className="text-slate-400" />
              </button>
            </div>

            <div className="grid gap-4">
              {saveSlots.map((slot, idx) => (
                <div
                  key={idx}
                  className={`p-5 rounded-xl border transition-all relative group ${
                    slot
                      ? "bg-slate-900 border-slate-700 hover:border-cyan-500 cursor-pointer"
                      : "bg-slate-900/50 border-slate-800 border-dashed opacity-70"
                  }`}
                  onClick={() => slot && loadGameFromSlot(idx)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-bold text-slate-300">
                        存檔 {idx + 1}
                      </span>
                      {slot && (
                        <span
                          className={`text-xs px-2 py-0.5 rounded border bg-opacity-10 ${
                            GENRES[slot.genre].color
                          } border-current`}
                        >
                          {GENRES[slot.genre].label}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-slate-500 font-mono">
                      {slot ? formatDate(slot.timestamp) : "---"}
                    </span>
                  </div>

                  {slot ? (
                    <>
                      <h3 className="text-lg font-bold text-white mb-3 line-clamp-1 group-hover:text-cyan-300 transition-colors">
                        {slot.currentScene.text.split("\n")[0]}
                      </h3>
                      <div className="flex justify-between items-center text-xs text-slate-400">
                        <div className="flex gap-3">
                          <span className="text-purple-400">
                            勇氣 {slot.stats.courage}
                          </span>
                          <span className="text-green-400">
                            理智 {slot.stats.sanity}
                          </span>
                          <span className="text-slate-500">
                            回合 {slot.turnCount}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={(e) => deleteSaveSlot(idx, e)}
                        className="absolute bottom-4 right-4 p-2 text-slate-600 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                        title="刪除存檔"
                      >
                        <Trash2 size={16} />
                      </button>
                    </>
                  ) : (
                    <div className="h-12 flex items-center justify-center text-slate-600 text-sm">
                      空欄位
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* === 冒險回憶錄畫面 (Archives) === */}
        {gameState === "archives" && (
          <div className="animate-fade-in p-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-cyan-400 flex items-center gap-2">
                <History /> 冒險回憶錄
              </h2>
              <button
                onClick={() => setGameState("genre_select")}
                className="p-2 hover:bg-slate-800 rounded-full transition-colors"
              >
                <X size={24} className="text-slate-400" />
              </button>
            </div>

            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
              {adventureLogs.length === 0 ? (
                <div className="text-center py-20 text-slate-500 border border-dashed border-slate-800 rounded-xl">
                  <Ghost size={48} className="mx-auto mb-4 opacity-20" />
                  <p>
                    還沒有達成任何結局喔！
                    <br />
                    去完成一個故事再來吧。
                  </p>
                </div>
              ) : (
                adventureLogs.map((log) => (
                  <div
                    key={log.id}
                    className="bg-slate-900 border border-slate-800 p-5 rounded-xl hover:border-cyan-900/50 transition-colors"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs px-2 py-0.5 rounded border bg-opacity-10 ${
                            GENRES[log.genre].color
                          } border-current`}
                        >
                          {GENRES[log.genre].label}
                        </span>
                        <span className="text-xs text-slate-500 font-mono">
                          {formatDate(log.timestamp)}
                        </span>
                        <span className="text-xs text-slate-500 font-mono flex items-center gap-1 ml-2">
                          <Clock size={10} /> {log.turnCount || "?"} 回合
                        </span>
                      </div>
                      <div className="flex gap-2 text-xs">
                        <span className="text-purple-400">
                          勇氣 {log.stats.courage}
                        </span>
                        <span className="text-green-400">
                          理智 {log.stats.sanity}
                        </span>
                      </div>
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2">
                      {log.endingTitle}
                    </h3>
                    <div className="bg-slate-950/50 p-3 rounded-lg border border-slate-800/50">
                      <p className="text-sm text-slate-400 italic leading-relaxed">
                        "{log.analysis}"
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {adventureLogs.length > 0 && (
              <div className="mt-6 flex justify-center">
                <button
                  onClick={clearArchives}
                  className="text-xs text-red-500/50 hover:text-red-400 flex items-center gap-1 transition-colors"
                >
                  <Trash2 size={12} /> 清除所有結局記錄
                </button>
              </div>
            )}
          </div>
        )}

        {/* === 1. 開始確認畫面 & 自定義輸入畫面 === */}
        {gameState === "start" && (
          <div className="text-center space-y-8 animate-fade-in py-10">
            {/* 自定義模式 (故事架構師) */}
            {selectedGenre === "custom" ? (
              <div className="max-w-md mx-auto">
                <div className="flex justify-center mb-4">
                  <div
                    className={`w-20 h-20 rounded-full flex items-center justify-center bg-slate-900 border-2 ${GENRES[selectedGenre].color} border-current bg-opacity-20`}
                  >
                    {React.cloneElement(
                      GENRES[selectedGenre].icon as React.ReactElement,
                      { size: 32 }
                    )}
                  </div>
                </div>

                <h2 className="text-xl font-bold text-orange-400 mb-6 flex items-center justify-center gap-2">
                  <Edit3 size={18} /> 故事架構師 (Story Architect)
                </h2>

                <div className="space-y-4 text-left">
                  {/* 1. 類型與風格 */}
                  <div>
                    <label className="text-xs text-slate-400 mb-1 flex items-center gap-1">
                      <Sparkles size={12} /> 1. 作品類型 & 風格
                    </label>
                    <input
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-slate-200 focus:outline-none focus:border-orange-500 transition-colors text-sm"
                      placeholder="例如：熱血少年漫、克蘇魯懸疑、日系純愛..."
                      value={customSetup.genre}
                      onChange={(e) =>
                        handleCustomSetupChange("genre", e.target.value)
                      }
                    />
                  </div>

                  {/* 2. 核心主題 */}
                  <div>
                    <label className="text-xs text-slate-400 mb-1 flex items-center gap-1">
                      <Target size={12} /> 2. 核心主題 (想傳達什麼?)
                    </label>
                    <input
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-slate-200 focus:outline-none focus:border-orange-500 transition-colors text-sm"
                      placeholder="例如：友情與犧牲、尋找自我、對抗命運..."
                      value={customSetup.theme}
                      onChange={(e) =>
                        handleCustomSetupChange("theme", e.target.value)
                      }
                    />
                  </div>

                  {/* 3. 主角設定 */}
                  <div>
                    <label className="text-xs text-slate-400 mb-1 flex items-center gap-1">
                      <User size={12} /> 3. 主角設定 (你是誰?)
                    </label>
                    <input
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-slate-200 focus:outline-none focus:border-orange-500 transition-colors text-sm"
                      placeholder="例如：落魄偵探、有社交恐懼症的高中生、最後的魔法師..."
                      value={customSetup.protagonist}
                      onChange={(e) =>
                        handleCustomSetupChange("protagonist", e.target.value)
                      }
                    />
                  </div>

                  {/* 4. 世界觀 */}
                  <div>
                    <label className="text-xs text-slate-400 mb-1 flex items-center gap-1">
                      <Globe size={12} /> 4. 世界觀 (故事發生在哪?)
                    </label>
                    <input
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-slate-200 focus:outline-none focus:border-orange-500 transition-colors text-sm"
                      placeholder="例如：被 AI 統治的未來、充滿魔物的地下城、只有黑夜的城市..."
                      value={customSetup.world}
                      onChange={(e) =>
                        handleCustomSetupChange("world", e.target.value)
                      }
                    />
                  </div>

                  {/* 5. 開場情境 */}
                  <div>
                    <label className="text-xs text-slate-400 mb-1 flex items-center gap-1">
                      <Play size={12} /> 5. 開場情境 (故事如何開始?)
                    </label>
                    <textarea
                      className="w-full h-24 bg-slate-900 border border-slate-700 rounded-lg p-3 text-slate-200 focus:outline-none focus:border-orange-500 transition-colors resize-none text-sm placeholder:text-slate-600"
                      placeholder="描述故事的第一個畫面或事件... (例如：轉生到異世界、在轉角撞到愛、喪屍爆發的第一天)"
                      value={customSetup.opening}
                      onChange={(e) =>
                        handleCustomSetupChange("opening", e.target.value)
                      }
                    />
                  </div>
                </div>

                {/* 靈感種子 (一鍵填入) */}
                <div className="mt-6 border-t border-slate-800 pt-4">
                  <div className="flex items-center gap-2 text-xs text-slate-500 mb-3 uppercase tracking-wider font-bold">
                    <Lightbulb size={12} /> 缺乏靈感？試試這些模版：
                  </div>
                  <div className="flex flex-col gap-2">
                    {INSPIRATION_SEEDS.map((seed, idx) => (
                      <button
                        key={idx}
                        onClick={() => setCustomSetup(seed.data)}
                        className="text-xs bg-slate-800/30 hover:bg-slate-800 text-slate-400 hover:text-orange-300 border border-slate-800 hover:border-orange-500/30 rounded-lg px-4 py-3 transition-all text-left flex items-center justify-between group"
                      >
                        <span className="line-clamp-1">
                          {seed.label}：{seed.data.opening.substring(0, 15)}...
                        </span>
                        <ArrowRight
                          size={12}
                          className="opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0"
                        />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              // 預設模式 UI 保持不變
              <>
                <div className="flex justify-center mb-6 relative">
                  <div className="w-48 h-48 rounded-full overflow-hidden border-4 border-slate-800 shadow-[0_0_30px_rgba(var(--tw-shadow-color),0.2)] flex items-center justify-center bg-slate-900 relative">
                    {currentScene?.imageUrl ? (
                      <img
                        src={currentScene.imageUrl}
                        alt="Start Scene"
                        className="w-full h-full object-cover animate-fade-in"
                      />
                    ) : (
                      <div className={`${GENRES[selectedGenre].color}`}>
                        {React.cloneElement(
                          GENRES[selectedGenre].icon as React.ReactElement,
                          { size: 80 }
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <h2
                    className={`text-xl font-bold mb-2 ${GENRES[selectedGenre].color}`}
                  >
                    {GENRES[selectedGenre].label}
                  </h2>
                  <p className="text-slate-400 text-lg max-w-md mx-auto">
                    準備好開始你的故事了嗎？
                    <br />
                    所有的文字與畫面都將由 AI 為你即時生成。
                  </p>
                </div>
              </>
            )}

            <div className="pt-4 flex gap-4 justify-center">
              <button
                onClick={() => setGameState("genre_select")}
                className="px-6 py-3 bg-transparent hover:bg-slate-800 text-slate-400 rounded-lg transition-colors"
              >
                返回選擇
              </button>
              <button
                onClick={handleStart}
                // 只有在 custom 模式且開場空白時才 disable
                disabled={
                  selectedGenre === "custom" &&
                  (!customSetup.opening.trim() || !customSetup.genre.trim())
                }
                className={`group relative px-8 py-3 rounded-lg overflow-hidden border transition-all duration-300 ${
                  selectedGenre === "custom"
                    ? "bg-orange-900/50 hover:bg-orange-800 border-orange-700/50 hover:border-orange-500 text-orange-100"
                    : "bg-slate-800 hover:bg-cyan-900 border-slate-700 hover:border-cyan-500 text-cyan-100"
                } ${
                  selectedGenre === "custom" &&
                  (!customSetup.opening.trim() || !customSetup.genre.trim())
                    ? "opacity-50 cursor-not-allowed"
                    : ""
                }`}
              >
                <div className="flex items-center gap-2 font-semibold text-lg">
                  <Play
                    size={20}
                    className="group-hover:translate-x-1 transition-transform"
                  />
                  開始故事
                </div>
              </button>
            </div>
          </div>
        )}

        {/* === 2. 遊戲進行 & 結局 === */}
        {(gameState === "playing" || gameState === "end") && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden transition-all duration-500 relative flex flex-col mt-4">
            {/* 文字 Loading */}
            {isTextLoading && (
              <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm z-50 flex flex-col items-center justify-center text-cyan-400">
                <Loader2 size={48} className="animate-spin mb-4" />
                <p className="font-mono text-sm animate-pulse">
                  {selectedGenre === "custom" && turnCount === 1
                    ? "Analyzing your story structure..."
                    : "Writing next chapter..."}
                </p>
              </div>
            )}

            {/* 視覺區域 */}
            <div className="h-64 sm:h-80 bg-slate-950 flex items-center justify-center border-b border-slate-800 relative overflow-hidden group">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-800/50 to-slate-950 opacity-50"></div>

              <div className="w-full h-full relative flex items-center justify-center">
                {currentScene?.imageUrl ? (
                  <img
                    src={currentScene.imageUrl}
                    alt="Scene"
                    className="w-full h-full object-cover animate-fade-in transition-transform duration-[20s] hover:scale-110"
                  />
                ) : (
                  <div className="z-10 animate-pulse opacity-50 transform scale-110">
                    {iconMap[currentScene?.iconKeyword] ||
                      GENRES[selectedGenre].icon}
                  </div>
                )}

                {isImageLoading && !isTextLoading && (
                  <div className="absolute bottom-4 right-4 bg-black/60 backdrop-blur px-3 py-1 rounded-full flex items-center gap-2 text-xs text-cyan-300 border border-cyan-900/50">
                    <Loader2 size={12} className="animate-spin" />
                    <span>Generating visuals...</span>
                  </div>
                )}
              </div>
            </div>

            {/* 文字區域 */}
            <div className="p-6 sm:p-8 min-h-[180px]">
              {gameState === "playing" ? (
                <div className="text-lg text-slate-300">
                  <Typewriter
                    key={currentScene?.text}
                    text={currentScene?.text || ""}
                    speed={25}
                    onComplete={() => setTextCompleted(true)}
                  />
                  {!textCompleted && !isTextLoading && (
                    <span className="inline-block w-2 h-5 bg-cyan-500 ml-1 animate-pulse"></span>
                  )}
                </div>
              ) : (
                <div className="text-center space-y-6 animate-fade-in-up">
                  <div
                    className={`text-2xl font-bold ${
                      currentScene?.endingType === "good"
                        ? "text-green-400"
                        : currentScene?.endingType === "bad"
                        ? "text-red-400"
                        : "text-yellow-400"
                    }`}
                  >
                    {currentScene?.text.split("\n")[0]}
                  </div>
                  <p className="text-slate-400 whitespace-pre-wrap">
                    {currentScene?.text.split("\n").slice(1).join("\n")}
                  </p>

                  {analysis && (
                    <div className="mt-6 p-4 bg-slate-800/50 rounded-lg border border-slate-700 text-left">
                      <div className="flex items-center gap-2 mb-2 text-cyan-400 font-mono text-sm">
                        <Sparkles size={14} />
                        <span>AI 結局分析</span>
                      </div>
                      <p className="text-sm text-slate-300 italic leading-relaxed">
                        "{analysis}"
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 選項區域 */}
            <div className="p-6 bg-slate-950/50 border-t border-slate-800">
              {gameState === "playing" ? (
                <div
                  className={`space-y-3 transition-opacity duration-500 ${
                    textCompleted && !isTextLoading
                      ? "opacity-100"
                      : "opacity-0 pointer-events-none"
                  }`}
                >
                  {currentScene?.choices && currentScene.choices.length > 0 ? (
                    currentScene.choices.map((choice, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleChoice(choice)}
                        className="w-full text-left p-4 rounded-lg bg-slate-800 hover:bg-slate-700 hover:translate-x-1 transition-all duration-200 border border-slate-700 hover:border-cyan-500/50 group flex justify-between items-center"
                      >
                        <span className="text-slate-200 group-hover:text-cyan-200">
                          {choice.text}
                        </span>
                        {choice.effect && (
                          <div className="flex gap-1 items-center">
                            <span className="text-xs text-slate-500 mr-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              {choice.effect.val > 0 ? "增加" : "減少"}{" "}
                              {choice.effect.attr === "courage"
                                ? "勇氣"
                                : "理智"}
                            </span>
                            <div
                              className={`w-2 h-2 rounded-full ${
                                choice.effect.attr === "courage"
                                  ? "bg-purple-500"
                                  : "bg-green-500"
                              } ${
                                choice.effect.val > 0
                                  ? "opacity-100"
                                  : "opacity-30"
                              }`}
                            ></div>
                          </div>
                        )}
                      </button>
                    ))
                  ) : (
                    <button
                      onClick={() =>
                        handleChoice({
                          text: "繼續",
                          effect: { attr: "courage", val: 0 },
                        })
                      }
                      className="w-full text-center p-4 rounded-lg bg-slate-800 hover:bg-slate-700 hover:translate-y-1 transition-all duration-200 border border-slate-700 hover:border-cyan-500/50 group animate-pulse"
                    >
                      <span className="text-slate-200 group-hover:text-cyan-200 flex items-center justify-center gap-2 font-bold tracking-widest">
                        繼續劇情 <ArrowRight size={18} />
                      </span>
                    </button>
                  )}
                </div>
              ) : (
                <div className="flex justify-center gap-4">
                  <button
                    onClick={() => setGameState("genre_select")}
                    className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors border border-slate-700"
                  >
                    回到主選單
                  </button>
                  <button
                    onClick={handleStart}
                    className="flex items-center gap-2 px-6 py-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg transition-colors font-medium shadow-lg shadow-cyan-900/20"
                  >
                    <RotateCcw size={18} />
                    再玩一次
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
