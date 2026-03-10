export const RETREAT_TYPES = [
  "yoga",
  "meditation",
  "breathwork",
  "psychedelic",
  "wellness",
  "spiritual",
  "silent",
  "plant medicine",
  "detox",
  "fitness",
  "creative",
  "other",
] as const;

export const TEAM_NEEDS_OPTIONS = [
  { id: "venue", label: "Venue / Location" },
  { id: "cohost", label: "Co-Host" },
  { id: "chef", label: "Chef / Catering" },
  { id: "photographer", label: "Photographer / Videographer" },
  { id: "yoga_instructor", label: "Yoga Instructor" },
  { id: "sound_healer", label: "Sound Healer" },
  { id: "massage", label: "Massage Therapist" },
  { id: "other", label: "Other Staff" },
] as const;

export type TeamNeedId = (typeof TEAM_NEEDS_OPTIONS)[number]["id"];

export interface LookingFor {
  needs: TeamNeedId[];
  notes: Partial<Record<TeamNeedId, string>>;
}

export interface RetreatFormData {
  title: string;
  description: string;
  retreat_type: string;
  start_date: string;
  end_date: string;
  property_id: string | null;
  custom_venue_name: string;
  location_details: string;
  max_attendees: number | null;
  price_per_person: number | null;
  what_you_offer: string;
  what_to_bring: string;
  sample_itinerary: string;
  main_image: string | null;
  gallery_images: string[];
  gallery_videos: string[];
  allow_donations: boolean;
  looking_for: LookingFor;
}

export const TIME_BLOCKS = ["Morning", "Midday", "Afternoon", "Evening"] as const;

export interface ScheduleBlock {
  time: string;
  description: string;
}

export interface ScheduleDay {
  title: string;
  subtitle: string;
  blocks: ScheduleBlock[];
  outcome: string;
}

export function createEmptyDay(dayNumber: number): ScheduleDay {
  return {
    title: `Day ${dayNumber}`,
    subtitle: "",
    blocks: TIME_BLOCKS.map((time) => ({ time, description: "" })),
    outcome: "",
  };
}

export function parseItinerary(raw: string): ScheduleDay[] | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0 && "blocks" in parsed[0]) {
      return parsed as ScheduleDay[];
    }
  } catch {
    // Not JSON — legacy freeform text
  }
  return null;
}

export function serializeItinerary(days: ScheduleDay[]): string {
  return JSON.stringify(days);
}

export interface VenueOption {
  id: string;
  name: string;
  location: string | null;
  capacity: number | null;
  description: string | null;
}
