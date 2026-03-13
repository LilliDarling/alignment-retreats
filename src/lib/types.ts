export interface SiteConfig {
  name: string;
  tagline: string;
  description: string;
  url: string;
  email: string;
  social: {
    instagram: string;
    facebook: string;
    linkedin: string;
  };
  videoUrl: string;
  parentOrg: {
    name: string;
    url: string;
  };
}

export interface FAQ {
  question: string;
  answer: string;
}

export interface Retreat {
  id: string;
  slug: string;
  title: string;
  category: string;
  description: string;
  longDescription?: string;
  location: string;
  venue?: string;
  duration: string;
  startDate: string;
  endDate: string;
  price: number;
  ticketPrice?: number;
  currency: string;
  spotsTotal?: number;
  spotsLeft?: number;
  image: string;
  galleryImages?: string[];
  galleryVideos?: string[];
  hostId?: string;
  sampleItinerary?: string;
  amenities?: string[];
  teamMembers?: {
    role: string;
    userId: string;
    name: string | null;
    description: string | null;
    profilePhoto: string | null;
  }[];
  property?: {
    id: string;
    name: string;
    location: string | null;
    description: string | null;
    capacity: number | null;
    photos: string[];
    videos: string[];
    property_features: string[];
    property_type: string;
  } | null;
}

export interface ItineraryDay {
  day: number;
  title: string;
  theme?: string;
  activities: {
    time: string;
    description: string;
  }[];
  outcome?: string;
}
export interface Venue {
  id: string;
  slug: string;
  name: string;
  location: string;
  country: string;
  description: string;
  longDescription?: string;
  image: string;
  gallery?: string[];
  amenities: string[];
  capacity?: number;
  priceRange?: string;
  tags?: string[];
}

export interface Testimonial {
  id: string;
  quote: string;
  author: string;
  location: string;
  retreat?: string;
  rating: number;
  image?: string;
}
