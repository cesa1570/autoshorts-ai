import { ScriptData, GeneratorMode, NewsItem, SocialPostData } from '../types';

// Check if mock mode is enabled
export const isMockMode = (): boolean => {
    return localStorage.getItem('mock_mode') === 'true';
};

export const setMockMode = (enabled: boolean) => {
    localStorage.setItem('mock_mode', enabled ? 'true' : 'false');
};

// Simulate delay like real API
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Mock Script Data
const MOCK_SCRIPTS: Record<GeneratorMode, ScriptData> = {
    [GeneratorMode.MYSTERY]: {
        title: 'ปริศนาบ้านร้างกลางป่า',
        seoTitle: '😱 ปริศนาบ้านร้างกลางป่า ที่ไม่มีใครกล้าเข้าใกล้!',
        description: 'เรื่องลึกลับที่คุณต้องรู้',
        longDescription: 'บ้านร้างหลังนี้มีประวัติศาสตร์อันน่าสะพรึงกลัว ไม่มีใครกล้าเข้าไปตั้งแต่ปี 1970...',
        hashtags: ['#horror', '#mystery', '#ปริศนา', '#ผี', '#บ้านร้าง', '#shorts'],
        seoKeywords: 'horror, mystery, haunted house, ghost story',
        scenes: [
            { id: 1, visual_prompt: 'Abandoned house in dark forest, foggy atmosphere', voiceover: 'ในป่าลึกแห่งหนึ่ง มีบ้านร้างที่ไม่มีใครกล้าเข้าใกล้มานานกว่า 50 ปี', duration_est: 5 },
            { id: 2, visual_prompt: 'Creepy interior of abandoned house, dusty furniture', voiceover: 'ข้างในมืดสนิท เฟอร์นิเจอร์เก่าๆ ปกคลุมด้วยฝุ่นหนา', duration_est: 5 },
            { id: 3, visual_prompt: 'Mysterious figure in window, ghostly silhouette', voiceover: 'แต่ทุกคืน ชาวบ้านเห็นเงาประหลาดที่หน้าต่าง...', duration_est: 5 },
        ]
    },
    [GeneratorMode.FACTS]: {
        title: '5 ความจริงที่คุณไม่เคยรู้',
        seoTitle: '🧠 5 ความจริงสุดทึ่งที่คุณไม่เคยรู้มาก่อน!',
        description: 'ข้อเท็จจริงที่น่าทึ่ง',
        longDescription: 'รวม 5 ข้อเท็จจริงสุดน่าทึ่งที่จะทำให้คุณประหลาดใจ...',
        hashtags: ['#facts', '#amazing', '#ความรู้', '#น่าทึ่ง', '#shorts'],
        seoKeywords: 'facts, amazing facts, did you know, knowledge',
        scenes: [
            { id: 1, visual_prompt: 'Brain illustration with lightning, vibrant colors', voiceover: 'รู้หรือไม่ว่า สมองของคุณผลิตไฟฟ้าได้พอที่จะเปิดหลอดไฟเล็กๆ ได้', duration_est: 5 },
            { id: 2, visual_prompt: 'Space and galaxies, cosmic scale illustration', voiceover: 'และในจักรวาล มีดาวมากกว่าเม็ดทรายบนโลกทั้งหมด', duration_est: 5 },
            { id: 3, visual_prompt: 'Mind blown effect, explosion of knowledge', voiceover: 'สุดท้าย DNA ของคุณยาวพอที่จะเดินทางไปดวงอาทิตย์และกลับมาได้ 600 รอบ!', duration_est: 5 },
        ]
    },
    [GeneratorMode.NEWS]: {
        title: 'ข่าวด่วนวันนี้',
        seoTitle: '📰 ข่าวด่วน! สิ่งที่คุณต้องรู้วันนี้',
        description: 'อัพเดทข่าวสาร',
        longDescription: 'รวมข่าวสำคัญประจำวันที่คุณต้องรู้ อัพเดทล่าสุด ครบทุกเรื่อง...',
        hashtags: ['#news', '#breaking', '#ข่าวด่วน', '#อัพเดท', '#shorts'],
        seoKeywords: 'news, breaking news, today, update',
        scenes: [
            { id: 1, visual_prompt: 'Breaking news graphic, urgent, red alert style', voiceover: 'ข่าวด่วน! วันนี้มีเหตุการณ์สำคัญที่คุณต้องรู้', duration_est: 5 },
            { id: 2, visual_prompt: 'News desk, professional setting, modern newsroom', voiceover: 'ผู้เชี่ยวชาญวิเคราะห์ว่าสถานการณ์นี้จะส่งผลกระทบอย่างไร', duration_est: 5 },
            { id: 3, visual_prompt: 'Social media reactions, trending hashtags', voiceover: 'ติดตามความคืบหน้าได้ที่ช่องของเรา กด subscribe!', duration_est: 5 },
        ]
    },
    [GeneratorMode.CRIME]: {
        title: 'คดีฆาตกรรมปริศนา',
        seoTitle: '🔪 คดีฆาตกรรมที่ตำรวจยังหาคำตอบไม่ได้!',
        description: 'เรื่องจริงที่น่าสะพรึง',
        longDescription: 'คดีฆาตกรรมที่มีหลักฐานมากมาย แต่กลับไม่สามารถจับตัวฆาตกรได้...',
        hashtags: ['#truecrime', '#murder', '#คดีฆาตกรรม', '#อาชญากรรม', '#shorts'],
        seoKeywords: 'true crime, murder, criminal case',
        scenes: [
            { id: 1, visual_prompt: 'Crime scene tape, dark alley, noir style', voiceover: 'คืนนั้นเกิดเหตุฆาตกรรมที่ไม่มีใครคาดคิด', duration_est: 5 },
            { id: 2, visual_prompt: 'Evidence markers, investigation scene', voiceover: 'หลักฐานถูกพบมากมาย แต่ก็สับสน', duration_est: 5 },
            { id: 3, visual_prompt: 'Silhouette of mysterious figure, suspense', voiceover: 'จนถึงวันนี้ ฆาตกรยังลอยนวล...', duration_est: 5 },
        ]
    },
};

// Mock generate script
export const mockGenerateScript = async (topic: string, mode: GeneratorMode): Promise<ScriptData> => {
    await delay(2000);
    const baseScript = MOCK_SCRIPTS[mode] || MOCK_SCRIPTS[GeneratorMode.FACTS];
    return {
        ...baseScript,
        title: topic || baseScript.title,
        seoTitle: `🔥 ${topic || baseScript.title} - ที่คุณต้องรู้!`,
    };
};

// Mock generate image (returns placeholder)
export const mockGenerateImage = async (prompt: string): Promise<string> => {
    await delay(1500);
    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1920;
    const ctx = canvas.getContext('2d')!;

    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#1e1b4b');
    gradient.addColorStop(0.5, '#312e81');
    gradient.addColorStop(1, '#1e1b4b');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#a855f7';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('MOCK MODE', canvas.width / 2, canvas.height / 2 - 50);
    ctx.fillStyle = '#ffffff';
    ctx.font = '32px Arial';
    ctx.fillText(prompt.slice(0, 30) + '...', canvas.width / 2, canvas.height / 2 + 30);

    return canvas.toDataURL('image/png');
};

// Mock generate voiceover (returns silence)
export const mockGenerateVoiceover = async (): Promise<string> => {
    await delay(1000);
    return 'UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=';
};

// Mock trending news
export const mockFetchTrendingNews = async (): Promise<NewsItem[]> => {
    await delay(1000);
    return [
        { id: '1', headline: '[MOCK] เทคโนโลยี AI ก้าวหน้าอย่างรวดเร็ว', summary: 'AI พัฒนาไปอย่างก้าวกระโดด...', category: 'Tech', popularity: 'High' },
        { id: '2', headline: '[MOCK] ค้นพบดาวเคราะห์ใหม่ในจักรวาล', summary: 'นักวิทยาศาสตร์ค้นพบ...', category: 'Science', popularity: 'Medium' },
        { id: '3', headline: '[MOCK] เศรษฐกิจโลกเติบโตต่อเนื่อง', summary: 'รายงานล่าสุดระบุว่า...', category: 'Finance', popularity: 'High' },
    ];
};

// Mock social post
export const mockGenerateSocialPost = async (topic: string): Promise<SocialPostData> => {
    await delay(1500);
    return {
        caption: `[MOCK] ${topic}\n\nนี่คือ mock content สำหรับทดสอบ!\n\n#mock #test #autoshorts`,
        hashtags: ['#mock', '#test', '#autoshorts', '#demo'],
        image_prompt: 'Social media post mockup, vibrant colors, engaging design',
    };
};

// Mock viral score
export const mockPredictViralScore = async () => {
    await delay(1000);
    return {
        score: Math.floor(Math.random() * 40) + 60,
        reasoning: '[MOCK] หัวข้อนี้มีศักยภาพ viral สูงเพราะเป็นเรื่องที่คนสนใจ',
        suggestions: ['เพิ่ม hook ที่แรงขึ้นในช่วงแรก', 'ใช้ thumbnail ที่ดึงดูด', 'โพสต์ในช่วง 18:00-21:00'],
        bestTimeToPost: '19:00 น.',
    };
};
