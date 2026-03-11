export interface VenuePreview {
  id: string;
  name: string;
  location: string | null;
  capacity: number | null;
  image: string;
}

export interface VenueListItem {
  id: string;
  name: string;
  location: string | null;
  property_type: string;
  capacity: number | null;
  amenities: string[];
  description: string | null;
  image: string;
  property_features: string[];
}

export interface VenueDetail {
  id: string;
  name: string;
  location: string | null;
  property_type: string;
  amenities: string[];
  description: string | null;
  photos: string[];
  videos: string[];
  property_features: string[];
  capacity: number | null;
  contact_name: string | null;
  contact_email: string | null;
  instagram_handle: string | null;
  tiktok_handle: string | null;
  status?: string;
}