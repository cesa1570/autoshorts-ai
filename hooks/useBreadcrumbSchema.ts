import { useEffect } from 'react';

interface BreadcrumbItem {
    name: string;
    item: string;
}

export const useBreadcrumbSchema = (items: BreadcrumbItem[]) => {
    useEffect(() => {
        // Construct the structured data
        const structuredData = {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": items.map((item, index) => ({
                "@type": "ListItem",
                "position": index + 1,
                "name": item.name,
                "item": item.item.startsWith('http') ? item.item : `https://lazyautocreator.xyz${item.item}`
            }))
        };

        // Create the script element
        const script = document.createElement('script');
        script.type = 'application/ld+json';
        script.text = JSON.stringify(structuredData);

        // Add to head
        document.head.appendChild(script);

        // Cleanup on unmount
        return () => {
            document.head.removeChild(script);
        };
    }, [items]);
};
