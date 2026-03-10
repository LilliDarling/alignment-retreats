export interface HeroSearchData {
  categories: string[];
  locations: string[];
  months: { value: string; label: string }[];
}

export interface MapRetreat {
  id: string;
  slug: string;
  title: string;
  category: string;
  location: string;
  duration: string;
  price: number;
  currency: string;
  image: string;
  coordinates: { lat: number; lng: number };
}