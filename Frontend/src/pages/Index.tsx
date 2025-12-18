import { Layout } from '@/components/layout/Layout';
import { HeroSection } from '@/components/home/HeroSection';
import { CategorySection } from '@/components/home/CategorySection';
import { FeaturedNotes } from '@/components/home/FeaturedNotes';
import { RecommendedNotes } from '@/components/home/RecommendedNotes';
import { MostDownloaded } from '@/components/home/MostDownloaded';
import { NewArrivals } from '@/components/home/NewArrivals';
import { TopRatedNotes } from '@/components/home/TopRatedNotes';
import { HowItWorks } from '@/components/home/HowItWorks';
import { CTASection } from '@/components/home/CTASection';

const Index = () => {
  return (
    <Layout>
      {/* Zone 1: Attention & Trust (The Hook) */}
      <HeroSection />

      {/* Zone 2: Discovery (The Interest) */}
      {/* CategoryFocus - Gateway to specific interests */}
      <CategorySection />

      {/* Featured/Trending - FOMO & Platform Activity */}
      <FeaturedNotes />

      {/* Zone 3: Personalization (The Desire) */}
      {/* Recommended for You - Personal relevance */}
      <RecommendedNotes />

      {/* Top Rated - Quality Proof */}
      <TopRatedNotes />

      {/* Zone 4: Reassurance (The Logic) */}
      {/* How It Works - Trust bridge before deep dive */}
      <HowItWorks />

      {/* Zone 5: Deep Browsing / Social Proof */}
      <MostDownloaded />
      <NewArrivals />

      {/* Zone 6: Action (The Close) */}
      <CTASection />
    </Layout>
  );
};

export default Index;