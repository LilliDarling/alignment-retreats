// Public host profile returned by the get_public_profiles RPC (SECURITY DEFINER, bypasses RLS)
export interface HostProfileData {
  id: string;
  name: string;
  slug: string;
  bio: string | null;
  profile_photo: string | null;
  cover_photo: string | null;
  location: string | null;
  expertise_areas: string[] | null;
  certifications: string[] | null;
  languages: string[] | null;
  years_experience: number | null;
  availability_status: string | null;
  what_i_offer: string | null;
  instagram_handle: string | null;
  tiktok_handle: string | null;
  website_url: string | null;
  portfolio_photos: string[] | null;
  portfolio_videos: string[] | null;
  verified: boolean;
  travel_willing: boolean;
  user_roles: string[];
}

// Full editable profile (own user)
export interface EditableProfile {
  id: string;
  name: string | null;
  slug: string;
  bio: string | null;
  profile_photo: string | null;
  cover_photo: string | null;
  location: string | null;
  expertise_areas: string[] | null;
  certifications: string[] | null;
  languages: string[] | null;
  years_experience: number | null;
  availability_status: string | null;
  what_i_offer: string | null;
  what_im_looking_for: string | null;
  instagram_handle: string | null;
  tiktok_handle: string | null;
  website_url: string | null;
  portfolio_photos: string[] | null;
  portfolio_videos: string[] | null;
  travel_willing: boolean;
  show_in_directory: boolean;
  profile_completed: boolean;
}

// Profile section update payloads
export interface BasicInfoUpdate {
  name: string;
  bio: string | null;
  location: string | null;
  profile_photo: string | null;
  cover_photo: string | null;
}

export interface ProfessionalUpdate {
  expertise_areas: string[];
  certifications: string[];
  languages: string[];
  years_experience: number | null;
}

export interface SocialLinksUpdate {
  instagram_handle: string | null;
  tiktok_handle: string | null;
  website_url: string | null;
}

export interface AboutUpdate {
  what_i_offer: string | null;
  what_im_looking_for: string | null;
  availability_status: string | null;
  travel_willing: boolean;
}

export interface PortfolioUpdate {
  portfolio_photos: string[];
  portfolio_videos: string[];
}
