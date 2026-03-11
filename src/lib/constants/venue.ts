export const PROPERTY_TYPES = [
  { value: "retreat_center", label: "Retreat Center" },
  { value: "venue", label: "Venue / Event Space" },
  { value: "land", label: "Land / Outdoor Space" },
] as const;

export type PropertyType = (typeof PROPERTY_TYPES)[number]["value"];

export const AMENITY_OPTIONS = [
  { id: "wifi", label: "WiFi" },
  { id: "parking", label: "Parking" },
  { id: "kitchen", label: "Full Kitchen" },
  { id: "catering", label: "Catering Available" },
  { id: "accommodation", label: "On-site Accommodation" },
  { id: "camping", label: "Camping / Glamping" },
  { id: "yoga_studio", label: "Yoga Studio" },
  { id: "meditation_room", label: "Meditation Room" },
  { id: "meeting_room", label: "Meeting / Conference Room" },
  { id: "outdoor_space", label: "Outdoor Space" },
  { id: "pool", label: "Swimming Pool" },
  { id: "hot_tub", label: "Hot Tub / Jacuzzi" },
  { id: "sauna", label: "Sauna" },
  { id: "gym", label: "Fitness / Gym" },
  { id: "sound_system", label: "Sound System / AV" },
  { id: "projector", label: "Projector / Screen" },
  { id: "air_conditioning", label: "Air Conditioning" },
  { id: "heating", label: "Heating" },
  { id: "laundry", label: "Laundry" },
  { id: "accessibility", label: "Wheelchair Accessible" },
] as const;

export type AmenityId = (typeof AMENITY_OPTIONS)[number]["id"];

export const FEATURE_OPTIONS = [
  { id: "mountain_views", label: "Mountain Views" },
  { id: "ocean_views", label: "Ocean / Sea Views" },
  { id: "forest_setting", label: "Forest Setting" },
  { id: "beach_access", label: "Beach Access" },
  { id: "river_access", label: "River / Lake Access" },
  { id: "secluded_location", label: "Secluded / Private" },
  { id: "historic_building", label: "Historic / Character Building" },
  { id: "eco_friendly", label: "Eco-Friendly / Sustainable" },
  { id: "solar_powered", label: "Solar / Off-Grid Power" },
  { id: "organic_garden", label: "Organic Garden / Farm" },
  { id: "healing_center", label: "Established Healing Center" },
  { id: "arts_facilities", label: "Arts & Creative Facilities" },
  { id: "ceremony_space", label: "Ceremony / Sacred Space" },
  { id: "fire_pit", label: "Fire Pit / Bonfire Area" },
] as const;

export type FeatureId = (typeof FEATURE_OPTIONS)[number]["id"];

export interface VenueFormData {
  name: string;
  property_type: PropertyType | "";
  description: string;
  location: string;
  capacity: number | null;
  amenities: string[];
  property_features: string[];
  photos: string[];
  videos: string[];
  contact_name: string;
  contact_email: string;
  instagram_handle: string;
  tiktok_handle: string;
}
