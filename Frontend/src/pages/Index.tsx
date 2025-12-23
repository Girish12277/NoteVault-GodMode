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
import { SEOHead } from '@/components/seo/SEOHead';
import { OrganizationSchema } from '@/components/seo/OrganizationSchema';

const Index = () => {
  return (
    <Layout>
      <SEOHead
        title="Buy & Sell Academic Notes Online | India's #1 Student Notes Marketplace - NoteVault"
        description="India's largest marketplace for verified academic notes. Buy quality notes for BTech, MBA, MBBS & more. Instant download, 24h refunds. 10,000+ notes from 500+ universities."
        keywords="buy notes online india, academic notes marketplace, college notes, university notes, study material, exam notes, BTech notes, MBA notes, MBBS notes"
        canonical="https://frontend-blue-sigma-18.vercel.app/"
      />
      <OrganizationSchema />

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