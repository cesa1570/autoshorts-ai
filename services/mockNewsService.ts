import { NewsItem } from '../types';

export const MOCK_TRENDS_TH: NewsItem[] = [
    {
        id: 'trend-1',
        headline: 'Digital Wallet 10000 บาท',
        summary: 'อัปเดตล่าสุดโครงการ Digital Wallet 10,000 บาท เงื่อนไขและวันลงทะเบียน',
        category: 'Politics/Economy',
        popularity: '2M+ search',
        source: 'Google Trends',
        date: 'Today',
        url: 'https://trends.google.com/trends/trendingsearches/daily?geo=TH'
    },
    {
        id: 'trend-2',
        headline: 'หวยลาววันนี้',
        summary: 'ตรวจผลสลากกินแบ่งรัฐบาลลาว งวดล่าสุด เลขเด็ดงวดนี้',
        category: 'Entertainment',
        popularity: '500K+ search',
        source: 'Google Trends',
        date: 'Today',
        url: 'https://trends.google.com/trends/trendingsearches/daily?geo=TH'
    },
    {
        id: 'trend-3',
        headline: 'ราคาทองวันนี้',
        summary: 'ราคาทองคำแท่งและทองรูปพรรณวันนี้ ปรับขึ้นลงกี่บาท',
        category: 'Economy',
        popularity: '200K+ search',
        source: 'Google Trends',
        date: 'Today',
        url: 'https://trends.google.com/trends/trendingsearches/daily?geo=TH'
    },
    {
        id: 'trend-4',
        headline: 'พายุเข้าไทย',
        summary: 'กรมอุตุฯ เตือนพายุลูกใหม่ จ่อเข้าไทย ฝนตกหนักหลายพื้นที่',
        category: 'Weather',
        popularity: '100K+ search',
        source: 'Google Trends',
        date: 'Today',
        url: 'https://trends.google.com/trends/trendingsearches/daily?geo=TH'
    },
    {
        id: 'trend-5',
        headline: 'iPhone 16 pro max',
        summary: 'ข่าวลือสเปค iPhone 16 Pro Max กำหนดการเปิดตัวและราคาคาดการณ์',
        category: 'Technology',
        popularity: '50K+ search',
        source: 'Google Trends',
        date: 'Today',
        url: 'https://trends.google.com/trends/trendingsearches/daily?geo=TH'
    },
    {
        id: 'trend-6',
        headline: 'หุ้นไทยวันนี้',
        summary: 'สรุปภาวะตลาดหุ้นไทยวันนี้ SET Index ปิดบวกหรือลบ',
        category: 'Business',
        popularity: '20K+ search',
        source: 'Google Trends',
        date: 'Today',
        url: 'https://trends.google.com/trends/trendingsearches/daily?geo=TH'
    },
    {
        id: 'trend-7',
        headline: 'การค้นพบดาวเคราะห์ใหม่',
        summary: 'นักดาราศาสตร์ค้นพบดาวเคราะห์คล้ายโลกดวงใหม่ ในระบบดาวใกล้เคียง',
        category: 'Science',
        popularity: '15K+ search',
        source: 'Google Trends',
        date: 'Today',
        url: 'https://trends.google.com/trends/trendingsearches/daily?geo=TH'
    },
    {
        id: 'trend-8',
        headline: 'โควิดสายพันธุ์ใหม่',
        summary: 'กรมควบคุมโรคเฝ้าระวังโควิดสายพันธุ์ใหม่ ระบาดง่ายกว่าเดิม',
        category: 'Health',
        popularity: '40K+ search',
        source: 'Google Trends',
        date: 'Today',
        url: 'https://trends.google.com/trends/trendingsearches/daily?geo=TH'
    }
];

export const MOCK_TRENDS_GLOBAL: NewsItem[] = [
    {
        id: 'trend-g-1',
        headline: 'AI Technology Trends 2025',
        summary: 'Top searching AI trends for the upcoming year including Agents and Video Gen.',
        category: 'Technology',
        popularity: '5M+ search',
        source: 'Google Trends',
        date: 'Today',
        url: 'https://trends.google.com/trends/trendingsearches/daily?geo=US'
    },
    {
        id: 'trend-g-2',
        headline: 'Crypto Market Update',
        summary: 'Bitcoin price surge analysis and future market predictions.',
        category: 'Business',
        popularity: '1M+ search',
        source: 'Google Trends',
        date: 'Today',
        url: 'https://trends.google.com/trends/trendingsearches/daily?geo=US'
    },
    {
        id: 'trend-g-3',
        headline: 'New Space Mission',
        summary: 'NASA announces new timeline for Mars exploration mission.',
        category: 'Science',
        popularity: '500K+ search',
        source: 'Google Trends',
        date: 'Today',
        url: 'https://trends.google.com/trends/trendingsearches/daily?geo=US'
    }
];

export const fetchMockTrends = async (region: 'thailand' | 'global', category: string = 'All'): Promise<NewsItem[]> => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 800));
    let data = region === 'thailand' ? MOCK_TRENDS_TH : MOCK_TRENDS_GLOBAL;

    if (category !== 'All') {
        const lowerCat = category.toLowerCase();
        data = data.filter(item => {
            // Map UI categories to Mock Data categories loosely
            // e.g. 'Business' matches 'Economy', 'Business'
            if (lowerCat === 'business') return item.category.toLowerCase().includes('business') || item.category.toLowerCase().includes('economy');
            return item.category.toLowerCase().includes(lowerCat);
        });
    }
    return data;
};
