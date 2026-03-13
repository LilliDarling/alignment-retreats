import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getOwnRetreat } from "@/lib/queries/retreats";
import RetreatForm from "@/components/retreats/RetreatForm";
import type { LookingFor } from "@/lib/constants/retreat";

interface EditRetreatPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: EditRetreatPageProps) {
  const { id } = await params;
  const retreat = await getOwnRetreat(id);
  if (!retreat) return { title: "Retreat Not Found" };
  return { title: `Edit: ${retreat.title} | Alignment Retreats` };
}

export default async function EditRetreatPage({
  params,
}: EditRetreatPageProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { id } = await params;
  const retreat = await getOwnRetreat(id);
  if (!retreat) notFound();

  return (
    <RetreatForm
      mode="edit"
      retreatId={retreat.id}
      retreatSlug={retreat.slug}
      initialData={{
        title: retreat.title,
        description: retreat.description,
        retreat_type: retreat.retreat_type,
        start_date: retreat.start_date,
        end_date: retreat.end_date,
        property_id: retreat.property_id,
        custom_venue_name: retreat.custom_venue_name,
        location_details: retreat.location_details,
        max_attendees: retreat.max_attendees,
        price_per_person: retreat.price_per_person,
        what_you_offer: retreat.what_you_offer,
        what_to_bring: retreat.what_to_bring,
        sample_itinerary: retreat.sample_itinerary,
        main_image: retreat.main_image,
        gallery_images: retreat.gallery_images,
        gallery_videos: retreat.gallery_videos,
        allow_donations: false,
        looking_for: ((retreat as Record<string, unknown>).looking_for as LookingFor) || { needs: [], notes: {} },
        status: retreat.status,
      }}
    />
  );
}
