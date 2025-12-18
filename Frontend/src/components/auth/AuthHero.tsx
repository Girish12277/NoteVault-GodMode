import { useQuery } from '@tanstack/react-query';
import { contentApi } from '@/lib/api/content';

interface StatItem {
    value: string;
    label: string;
}

interface AuthHeroProps {
    title?: string;
    subtitle?: string;
    stats?: StatItem[];
}

export function AuthHero({
    title: defaultTitle,
    subtitle: defaultSubtitle,
    stats: defaultStats
}: AuthHeroProps) {
    const { data: content } = useQuery({
        queryKey: ['content', 'auth-hero'],
        queryFn: () => contentApi.get('auth-hero'),
        staleTime: 0, // Always fetch fresh on mount for admin updates
        refetchOnWindowFocus: true,
    });

    // Priority: Dynamic Content > Props > Hardcoded Defaults
    const title = content?.title || defaultTitle || "Study Smarter";
    const subtitle = content?.subtitle || defaultSubtitle || "India's largest marketplace for quality academic notes.";
    const stats = content?.stats || defaultStats || [
        { value: "10k+", label: "Notes" },
        { value: "500+", label: "Universities" },
        { value: "50k+", label: "Students" },
        { value: "24h", label: "Refunds" }
    ];

    // Style Calculation
    const hasImage = !!content?.backgroundImage;
    const gradientStyle = content?.gradient || 'linear-gradient(135deg, #3b82f6 0%, #f97316 100%)'; // Default Blue-Orange

    // If image exists, make the gradient semi-transparent (overlay)
    // If no image, use the gradient as solid background
    // We achieve this by layering. 

    return (
        <div className="hidden lg:block relative flex-1 bg-muted overflow-hidden">
            {/* Dynamic Background Layout */}
            <div className="absolute inset-0 z-0">
                {/* Layer 1: Image */}
                {hasImage && (
                    <div
                        className="absolute inset-0 z-0 bg-cover bg-center transition-all duration-1000"
                        style={{ backgroundImage: `url(${content!.backgroundImage})` }}
                    />
                )}
                {/* Layer 2: Gradient Overlay */}
                <div
                    className={`absolute inset-0 z-10 transition-all duration-500 ${hasImage ? 'opacity-90 mix-blend-multiply' : 'opacity-100'}`}
                    style={{ background: gradientStyle }}
                />
            </div>

            <div className="absolute inset-0 z-20 flex items-center justify-center p-8">
                <div className="max-w-md text-center text-primary-foreground">
                    <h2 className="font-display text-4xl font-bold mb-4 tracking-tight animate-in fade-in slide-in-from-bottom-4 duration-700 drop-shadow-md">
                        {title}
                    </h2>
                    <p className="text-lg text-primary-foreground/90 leading-relaxed animate-in fade-in slide-in-from-bottom-5 duration-700 delay-100 drop-shadow-sm font-medium">
                        {subtitle}
                    </p>

                    <div className="mt-12 grid grid-cols-2 gap-6 text-left animate-in fade-in slide-in-from-bottom-6 duration-700 delay-200">
                        {stats.map((stat, index) => (
                            <div
                                key={index}
                                className="group rounded-lg bg-white/10 p-3 backdrop-blur-md transition-all hover:bg-white/20 hover:scale-[1.02] border border-white/10 shadow-lg"
                            >
                                <div
                                    className="text-xl font-bold truncate transition-colors text-white"
                                    title={stat.value}
                                >
                                    {stat.value}
                                </div>
                                <div className="text-sm text-white/80 group-hover:text-white transition-colors">
                                    {stat.label}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
