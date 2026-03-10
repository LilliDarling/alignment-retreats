import type { Metadata } from "next";
import AnnouncementBanner from "@/components/sections/AnnouncementBanner";
import HeroHome from "@/components/sections/HeroHome";
import TrustBar from "@/components/sections/TrustBar";
import CategoryBrowse from "@/components/sections/CategoryBrowse";
import WorldMapLazy from "@/components/sections/WorldMapLazy";
import HowItWorks from "@/components/sections/HowItWorks";
import ValueProp from "@/components/sections/ValueProp";
import FAQSection from "@/components/sections/FAQSection";
import FeaturedRetreats from "@/components/sections/FeaturedRetreats";
import CTABanner from "@/components/sections/CTABanner";
import { getFeaturedRetreats, getHeroSearchData, getMapRetreats } from "@/lib/queries/retreats";

export const metadata: Metadata = {
  title: "Find Your Perfect Retreat | Alignment Retreats",
  description:
    "Discover transformative retreat experiences for alignment, wellness, and personal growth. Browse retreats, connect with hosts, and book your next experience.",
};

export default async function HomePage() {
  const [searchData, mapRetreats, featuredRetreats] = await Promise.all([
    getHeroSearchData(),
    getMapRetreats(),
    getFeaturedRetreats(3),
  ]);

  return (
    <>
      <AnnouncementBanner />
      <HeroHome searchData={searchData} />
      <TrustBar />
      <CategoryBrowse categories={searchData.categories} />
      <FeaturedRetreats retreats={featuredRetreats} />
      <WorldMapLazy retreats={mapRetreats} />
      <HowItWorks />
      <ValueProp />
      <FAQSection />
      <CTABanner />
    </>
  );
}
