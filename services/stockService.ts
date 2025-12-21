
export interface StockMedia {
    id: string;
    url: string; // Direct MP4
    description: string;
    category: string;
    thumbnailUrl?: string; // Optional
}

export const MOCK_STOCK_VIDEOS: StockMedia[] = [
    {
        id: 'stock-office',
        category: 'Business',
        url: 'https://cdn.pixabay.com/video/2016/02/29/2340-157269921_large.mp4',
        description: "Meeting and planning in an office environment."
    },
    {
        id: 'stock-nature',
        category: 'Nature',
        url: 'https://cdn.pixabay.com/video/2024/03/12/203923-922675870_large.mp4',
        description: "Grass field with wind and flowers."
    },
    {
        id: 'stock-cyberpunk',
        category: 'Technology',
        url: 'https://cdn.pixabay.com/video/2024/03/02/202718-918779955_large.mp4',
        description: "Futuristic cyberpunk city loop."
    },
    {
        id: 'stock-city',
        category: 'City',
        url: 'https://cdn.pixabay.com/video/2018/02/19/14385-256955049_large.mp4',
        description: "Saigon landscape and urban travel."
    }
];

export const searchStockVideo = async (query: string): Promise<StockMedia[]> => {
    // Simulate delay
    await new Promise(r => setTimeout(r, 600));

    const lowerQ = query.toLowerCase();

    if (!query) return MOCK_STOCK_VIDEOS;

    return MOCK_STOCK_VIDEOS.filter(v =>
        v.category.toLowerCase().includes(lowerQ) ||
        v.description.toLowerCase().includes(lowerQ)
    );
};
