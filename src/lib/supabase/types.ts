export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      booking_payments: {
        Row: {
          amount_paid: number | null
          booking_id: string
          created_at: string | null
          escrow_id: string | null
          id: string
          payment_status: Database["public"]["Enums"]["payment_status"] | null
          stripe_customer_id: string | null
          stripe_payment_id: string | null
          updated_at: string | null
        }
        Insert: {
          amount_paid?: number | null
          booking_id: string
          created_at?: string | null
          escrow_id?: string | null
          id?: string
          payment_status?: Database["public"]["Enums"]["payment_status"] | null
          stripe_customer_id?: string | null
          stripe_payment_id?: string | null
          updated_at?: string | null
        }
        Update: {
          amount_paid?: number | null
          booking_id?: string
          created_at?: string | null
          escrow_id?: string | null
          id?: string
          payment_status?: Database["public"]["Enums"]["payment_status"] | null
          stripe_customer_id?: string | null
          stripe_payment_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "booking_payments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: true
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_payments_escrow_id_fkey"
            columns: ["escrow_id"]
            isOneToOne: false
            referencedRelation: "escrow_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          attendee_user_id: string
          booking_date: string | null
          id: string
          retreat_id: string
        }
        Insert: {
          attendee_user_id: string
          booking_date?: string | null
          id?: string
          retreat_id: string
        }
        Update: {
          attendee_user_id?: string
          booking_date?: string | null
          id?: string
          retreat_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_attendee_user_id_fkey"
            columns: ["attendee_user_id"]
            isOneToOne: false
            referencedRelation: "make_user_export"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_retreat_id_fkey"
            columns: ["retreat_id"]
            isOneToOne: false
            referencedRelation: "retreats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_retreat_id_fkey"
            columns: ["retreat_id"]
            isOneToOne: false
            referencedRelation: "retreats_public"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_submissions: {
        Row: {
          archived: boolean
          created_at: string | null
          email: string
          id: string
          message: string
          name: string
          read: boolean
          resolved: boolean
          subject: string
          updated_at: string
        }
        Insert: {
          archived?: boolean
          created_at?: string | null
          email: string
          id?: string
          message: string
          name: string
          read?: boolean
          resolved?: boolean
          subject: string
          updated_at?: string
        }
        Update: {
          archived?: boolean
          created_at?: string | null
          email?: string
          id?: string
          message?: string
          name?: string
          read?: boolean
          resolved?: boolean
          subject?: string
          updated_at?: string
        }
        Relationships: []
      }
      escrow_accounts: {
        Row: {
          booking_id: string
          created_at: string
          deposit_released_at: string | null
          final_released_at: string | null
          held_amount: number
          id: string
          platform_fee: number
          refunded_amount: number
          released_amount: number
          status: Database["public"]["Enums"]["escrow_status"]
          stripe_payment_intent_id: string | null
          total_amount: number
          updated_at: string
        }
        Insert: {
          booking_id: string
          created_at?: string
          deposit_released_at?: string | null
          final_released_at?: string | null
          held_amount?: number
          id?: string
          platform_fee?: number
          refunded_amount?: number
          released_amount?: number
          status?: Database["public"]["Enums"]["escrow_status"]
          stripe_payment_intent_id?: string | null
          total_amount: number
          updated_at?: string
        }
        Update: {
          booking_id?: string
          created_at?: string
          deposit_released_at?: string | null
          final_released_at?: string | null
          held_amount?: number
          id?: string
          platform_fee?: number
          refunded_amount?: number
          released_amount?: number
          status?: Database["public"]["Enums"]["escrow_status"]
          stripe_payment_intent_id?: string | null
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "escrow_accounts_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: true
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          body: string
          created_at: string | null
          deleted_for_recipient: boolean | null
          deleted_for_sender: boolean | null
          id: string
          message_type: string | null
          read: boolean | null
          recipient_id: string
          retreat_id: string | null
          sender_id: string
          subject: string
        }
        Insert: {
          body: string
          created_at?: string | null
          deleted_for_recipient?: boolean | null
          deleted_for_sender?: boolean | null
          id?: string
          message_type?: string | null
          read?: boolean | null
          recipient_id: string
          retreat_id?: string | null
          sender_id: string
          subject: string
        }
        Update: {
          body?: string
          created_at?: string | null
          deleted_for_recipient?: boolean | null
          deleted_for_sender?: boolean | null
          id?: string
          message_type?: string | null
          read?: boolean | null
          recipient_id?: string
          retreat_id?: string | null
          sender_id?: string
          subject?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_retreat_id_fkey"
            columns: ["retreat_id"]
            isOneToOne: false
            referencedRelation: "retreats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_retreat_id_fkey"
            columns: ["retreat_id"]
            isOneToOne: false
            referencedRelation: "retreats_public"
            referencedColumns: ["id"]
          },
        ]
      }
      processed_webhook_events: {
        Row: {
          event_id: string
          event_type: string
          processed_at: string
          status: string
        }
        Insert: {
          event_id: string
          event_type: string
          processed_at?: string
          status?: string
        }
        Update: {
          event_id?: string
          event_type?: string
          processed_at?: string
          status?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          availability_status: string | null
          bio: string | null
          certifications: string[] | null
          cover_photo: string | null
          created_at: string | null
          expertise_areas: string[] | null
          id: string
          instagram_handle: string | null
          is_coop_member: boolean | null
          languages: string[] | null
          location: string | null
          name: string | null
          newsletter_opt_in: boolean
          onboarding_completed: Json | null
          portfolio_photos: string[] | null
          portfolio_videos: string[] | null
          profile_completed: boolean | null
          profile_photo: string | null
          rate: number | null
          rate_currency: string | null
          show_in_directory: boolean | null
          slug: string
          tiktok_handle: string | null
          travel_willing: boolean | null
          verified: boolean | null
          website_url: string | null
          what_i_offer: string | null
          what_im_looking_for: string | null
          years_experience: number | null
        }
        Insert: {
          availability_status?: string | null
          bio?: string | null
          certifications?: string[] | null
          cover_photo?: string | null
          created_at?: string | null
          expertise_areas?: string[] | null
          id: string
          instagram_handle?: string | null
          is_coop_member?: boolean | null
          languages?: string[] | null
          location?: string | null
          name?: string | null
          newsletter_opt_in?: boolean
          onboarding_completed?: Json | null
          portfolio_photos?: string[] | null
          portfolio_videos?: string[] | null
          profile_completed?: boolean | null
          profile_photo?: string | null
          rate?: number | null
          rate_currency?: string | null
          show_in_directory?: boolean | null
          slug: string
          tiktok_handle?: string | null
          travel_willing?: boolean | null
          verified?: boolean | null
          website_url?: string | null
          what_i_offer?: string | null
          what_im_looking_for?: string | null
          years_experience?: number | null
        }
        Update: {
          availability_status?: string | null
          bio?: string | null
          certifications?: string[] | null
          cover_photo?: string | null
          created_at?: string | null
          expertise_areas?: string[] | null
          id?: string
          instagram_handle?: string | null
          is_coop_member?: boolean | null
          languages?: string[] | null
          location?: string | null
          name?: string | null
          newsletter_opt_in?: boolean
          onboarding_completed?: Json | null
          portfolio_photos?: string[] | null
          portfolio_videos?: string[] | null
          profile_completed?: boolean | null
          profile_photo?: string | null
          rate?: number | null
          rate_currency?: string | null
          show_in_directory?: boolean | null
          slug?: string
          tiktok_handle?: string | null
          travel_willing?: boolean | null
          verified?: boolean | null
          website_url?: string | null
          what_i_offer?: string | null
          what_im_looking_for?: string | null
          years_experience?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "make_user_export"
            referencedColumns: ["id"]
          },
        ]
      }
      properties: {
        Row: {
          admin_notes: string | null
          amenities: string[] | null
          base_price: number | null
          capacity: number | null
          contact_email: string | null
          contact_name: string | null
          content_description: string | null
          content_status: string | null
          created_at: string | null
          description: string | null
          existing_content_link: string | null
          id: string
          instagram_handle: string | null
          interested_in_residency: boolean | null
          location: string | null
          max_rate: number | null
          min_rate: number | null
          name: string
          owner_user_id: string
          photos: string[] | null
          property_features: string[] | null
          property_type: Database["public"]["Enums"]["property_type"]
          residency_available_dates: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string | null
          tiktok_handle: string | null
          videos: string[] | null
          website: string | null
        }
        Insert: {
          admin_notes?: string | null
          amenities?: string[] | null
          base_price?: number | null
          capacity?: number | null
          contact_email?: string | null
          contact_name?: string | null
          content_description?: string | null
          content_status?: string | null
          created_at?: string | null
          description?: string | null
          existing_content_link?: string | null
          id?: string
          instagram_handle?: string | null
          interested_in_residency?: boolean | null
          location?: string | null
          max_rate?: number | null
          min_rate?: number | null
          name: string
          owner_user_id: string
          photos?: string[] | null
          property_features?: string[] | null
          property_type: Database["public"]["Enums"]["property_type"]
          residency_available_dates?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          tiktok_handle?: string | null
          videos?: string[] | null
          website?: string | null
        }
        Update: {
          admin_notes?: string | null
          amenities?: string[] | null
          base_price?: number | null
          capacity?: number | null
          contact_email?: string | null
          contact_name?: string | null
          content_description?: string | null
          content_status?: string | null
          created_at?: string | null
          description?: string | null
          existing_content_link?: string | null
          id?: string
          instagram_handle?: string | null
          interested_in_residency?: boolean | null
          location?: string | null
          max_rate?: number | null
          min_rate?: number | null
          name?: string
          owner_user_id?: string
          photos?: string[] | null
          property_features?: string[] | null
          property_type?: Database["public"]["Enums"]["property_type"]
          residency_available_dates?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          tiktok_handle?: string | null
          videos?: string[] | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "properties_owner_user_id_fkey"
            columns: ["owner_user_id"]
            isOneToOne: false
            referencedRelation: "make_user_export"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "properties_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "make_user_export"
            referencedColumns: ["id"]
          },
        ]
      }
      retreat_team: {
        Row: {
          agreed: boolean
          agreed_at: string | null
          created_at: string
          description: string | null
          fee_amount: number
          fee_type: string
          id: string
          retreat_id: string
          role: Database["public"]["Enums"]["team_member_role"]
          stripe_account_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          agreed?: boolean
          agreed_at?: string | null
          created_at?: string
          description?: string | null
          fee_amount: number
          fee_type: string
          id?: string
          retreat_id: string
          role: Database["public"]["Enums"]["team_member_role"]
          stripe_account_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          agreed?: boolean
          agreed_at?: string | null
          created_at?: string
          description?: string | null
          fee_amount?: number
          fee_type?: string
          id?: string
          retreat_id?: string
          role?: Database["public"]["Enums"]["team_member_role"]
          stripe_account_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "retreat_team_retreat_id_fkey"
            columns: ["retreat_id"]
            isOneToOne: false
            referencedRelation: "retreats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "retreat_team_retreat_id_fkey"
            columns: ["retreat_id"]
            isOneToOne: false
            referencedRelation: "retreats_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "retreat_team_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "make_user_export"
            referencedColumns: ["id"]
          },
        ]
      }
      retreats: {
        Row: {
          admin_notes: string | null
          allow_donations: boolean | null
          created_at: string | null
          custom_venue_name: string | null
          description: string | null
          end_date: string | null
          expected_attendees: number | null
          gallery_images: string[] | null
          gallery_videos: string[] | null
          host_name: string | null
          host_user_id: string
          id: string
          location: string | null
          location_details: string | null
          looking_for: Json | null
          main_image: string | null
          max_attendees: number | null
          preferred_dates_flexible: boolean | null
          price_per_person: number | null
          property_id: string | null
          retreat_type: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          sample_itinerary: string | null
          slug: string
          start_date: string | null
          status: Database["public"]["Enums"]["retreat_status"] | null
          target_attendees_max: number | null
          target_attendees_min: number | null
          team_budget_total: number | null
          ticket_price: number | null
          title: string
          venue_budget_max: number | null
          venue_budget_min: number | null
          what_to_bring: string | null
          what_you_offer: string | null
          what_you_want: string | null
        }
        Insert: {
          admin_notes?: string | null
          allow_donations?: boolean | null
          created_at?: string | null
          custom_venue_name?: string | null
          description?: string | null
          end_date?: string | null
          expected_attendees?: number | null
          gallery_images?: string[] | null
          gallery_videos?: string[] | null
          host_name?: string | null
          host_user_id: string
          id?: string
          location?: string | null
          location_details?: string | null
          looking_for?: Json | null
          main_image?: string | null
          max_attendees?: number | null
          preferred_dates_flexible?: boolean | null
          price_per_person?: number | null
          property_id?: string | null
          retreat_type?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          sample_itinerary?: string | null
          slug: string
          start_date?: string | null
          status?: Database["public"]["Enums"]["retreat_status"] | null
          target_attendees_max?: number | null
          target_attendees_min?: number | null
          team_budget_total?: number | null
          ticket_price?: number | null
          title: string
          venue_budget_max?: number | null
          venue_budget_min?: number | null
          what_to_bring?: string | null
          what_you_offer?: string | null
          what_you_want?: string | null
        }
        Update: {
          admin_notes?: string | null
          allow_donations?: boolean | null
          created_at?: string | null
          custom_venue_name?: string | null
          description?: string | null
          end_date?: string | null
          expected_attendees?: number | null
          gallery_images?: string[] | null
          gallery_videos?: string[] | null
          host_name?: string | null
          host_user_id?: string
          id?: string
          location?: string | null
          location_details?: string | null
          looking_for?: Json | null
          main_image?: string | null
          max_attendees?: number | null
          preferred_dates_flexible?: boolean | null
          price_per_person?: number | null
          property_id?: string | null
          retreat_type?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          sample_itinerary?: string | null
          slug?: string
          start_date?: string | null
          status?: Database["public"]["Enums"]["retreat_status"] | null
          target_attendees_max?: number | null
          target_attendees_min?: number | null
          team_budget_total?: number | null
          ticket_price?: number | null
          title?: string
          venue_budget_max?: number | null
          venue_budget_min?: number | null
          what_to_bring?: string | null
          what_you_offer?: string | null
          what_you_want?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "retreats_host_user_id_fkey"
            columns: ["host_user_id"]
            isOneToOne: false
            referencedRelation: "make_user_export"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "retreats_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "retreats_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties_public"
            referencedColumns: ["id"]
          },
        ]
      }
      scheduled_payouts: {
        Row: {
          amount: number
          created_at: string
          escrow_id: string
          failure_reason: string | null
          id: string
          payout_type: string
          processed_at: string | null
          recipient_user_id: string
          retreat_team_id: string | null
          scheduled_date: string
          status: Database["public"]["Enums"]["payout_status"]
          stripe_transfer_id: string | null
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          escrow_id: string
          failure_reason?: string | null
          id?: string
          payout_type: string
          processed_at?: string | null
          recipient_user_id: string
          retreat_team_id?: string | null
          scheduled_date: string
          status?: Database["public"]["Enums"]["payout_status"]
          stripe_transfer_id?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          escrow_id?: string
          failure_reason?: string | null
          id?: string
          payout_type?: string
          processed_at?: string | null
          recipient_user_id?: string
          retreat_team_id?: string | null
          scheduled_date?: string
          status?: Database["public"]["Enums"]["payout_status"]
          stripe_transfer_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "scheduled_payouts_escrow_id_fkey"
            columns: ["escrow_id"]
            isOneToOne: false
            referencedRelation: "escrow_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scheduled_payouts_recipient_user_id_fkey"
            columns: ["recipient_user_id"]
            isOneToOne: false
            referencedRelation: "make_user_export"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scheduled_payouts_retreat_team_id_fkey"
            columns: ["retreat_team_id"]
            isOneToOne: false
            referencedRelation: "retreat_team"
            referencedColumns: ["id"]
          },
        ]
      }
      stripe_connected_accounts: {
        Row: {
          account_status: Database["public"]["Enums"]["stripe_account_status"]
          business_type: string | null
          charges_enabled: boolean
          created_at: string
          id: string
          onboarding_complete: boolean
          payouts_enabled: boolean
          stripe_account_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          account_status?: Database["public"]["Enums"]["stripe_account_status"]
          business_type?: string | null
          charges_enabled?: boolean
          created_at?: string
          id?: string
          onboarding_complete?: boolean
          payouts_enabled?: boolean
          stripe_account_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          account_status?: Database["public"]["Enums"]["stripe_account_status"]
          business_type?: string | null
          charges_enabled?: boolean
          created_at?: string
          id?: string
          onboarding_complete?: boolean
          payouts_enabled?: boolean
          stripe_account_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stripe_connected_accounts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "make_user_export"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "make_user_export"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      directory_profiles: {
        Row: {
          availability_status: string | null
          bio: string | null
          expertise_areas: string[] | null
          id: string | null
          location: string | null
          name: string | null
          profile_photo: string | null
          rate: number | null
          rate_currency: string | null
          roles: string[] | null
          verified: boolean | null
          website_url: string | null
          what_i_offer: string | null
          years_experience: number | null
        }
        Insert: {
          availability_status?: string | null
          bio?: string | null
          expertise_areas?: string[] | null
          id?: string | null
          location?: string | null
          name?: string | null
          profile_photo?: string | null
          rate?: number | null
          rate_currency?: string | null
          roles?: never
          verified?: boolean | null
          website_url?: string | null
          what_i_offer?: string | null
          years_experience?: number | null
        }
        Update: {
          availability_status?: string | null
          bio?: string | null
          expertise_areas?: string[] | null
          id?: string | null
          location?: string | null
          name?: string | null
          profile_photo?: string | null
          rate?: number | null
          rate_currency?: string | null
          roles?: never
          verified?: boolean | null
          website_url?: string | null
          what_i_offer?: string | null
          years_experience?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "make_user_export"
            referencedColumns: ["id"]
          },
        ]
      }
      make_user_export: {
        Row: {
          all_roles: string | null
          created_at: string | null
          email: string | null
          id: string | null
          last_active: string | null
          name: string | null
          profile_completed: boolean | null
        }
        Relationships: []
      }
      properties_public: {
        Row: {
          amenities: string[] | null
          capacity: number | null
          description: string | null
          id: string | null
          location: string | null
          name: string | null
          photos: string[] | null
          property_features: string[] | null
          property_type: Database["public"]["Enums"]["property_type"] | null
        }
        Insert: {
          amenities?: string[] | null
          capacity?: number | null
          description?: string | null
          id?: string | null
          location?: string | null
          name?: string | null
          photos?: string[] | null
          property_features?: string[] | null
          property_type?: Database["public"]["Enums"]["property_type"] | null
        }
        Update: {
          amenities?: string[] | null
          capacity?: number | null
          description?: string | null
          id?: string | null
          location?: string | null
          name?: string | null
          photos?: string[] | null
          property_features?: string[] | null
          property_type?: Database["public"]["Enums"]["property_type"] | null
        }
        Relationships: []
      }
      retreats_public: {
        Row: {
          created_at: string | null
          description: string | null
          end_date: string | null
          host_user_id: string | null
          id: string | null
          max_attendees: number | null
          price_per_person: number | null
          property_id: string | null
          retreat_type: string | null
          start_date: string | null
          status: Database["public"]["Enums"]["retreat_status"] | null
          title: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          host_user_id?: never
          id?: string | null
          max_attendees?: number | null
          price_per_person?: number | null
          property_id?: string | null
          retreat_type?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["retreat_status"] | null
          title?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          host_user_id?: never
          id?: string | null
          max_attendees?: number | null
          price_per_person?: number | null
          property_id?: string | null
          retreat_type?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["retreat_status"] | null
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "retreats_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "retreats_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties_public"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      calculate_retreat_team_fees: {
        Args: {
          _num_attendees: number
          _num_nights: number
          _retreat_id: string
        }
        Returns: number
      }
      generate_unique_retreat_slug: {
        Args: { base_title: string }
        Returns: string
      }
      generate_unique_slug: { Args: { base_name: string }; Returns: string }
      get_all_profiles_admin: {
        Args: never
        Returns: {
          created_at: string
          email: string
          id: string
          name: string
          roles: string[]
        }[]
      }
      get_at_risk_retreats: {
        Args: never
        Returns: {
          current_bookings: number
          days_until_start: number
          fill_rate: number
          host_name: string
          host_user_id: string
          max_attendees: number
          retreat_id: string
          revenue_at_risk: number
          start_date: string
          title: string
        }[]
      }
      get_auth_email: { Args: never; Returns: string }
      get_booking_payment_status: {
        Args: { booking_uuid: string }
        Returns: {
          booking_id: string
          is_paid: boolean
          status: string
        }[]
      }
      get_directory_profiles: {
        Args: never
        Returns: {
          bio: string
          cohost_availability: string
          cohost_hourly_rate: number
          cohost_max_rate: number
          cohost_min_rate: number
          cohost_rating: number
          cohost_verified: boolean
          experience_years: number
          expertise_areas: string[]
          host_max_rate: number
          host_min_rate: number
          host_rating: number
          host_verified: boolean
          id: string
          is_verified: boolean
          name: string
          past_collaborations_count: number
          past_retreats_count: number
          portfolio_url: string
          profile_photo: string
          property_base_price: number
          property_capacity: number
          property_location: string
          property_max_rate: number
          property_min_rate: number
          property_name: string
          property_type: string
          roles: string[]
          service_type: string
          skills: string[]
          staff_availability: string
          staff_day_rate: number
          staff_max_rate: number
          staff_min_rate: number
          staff_rating: number
          staff_verified: boolean
        }[]
      }
      get_escrow_summary: {
        Args: never
        Returns: {
          active_escrows: number
          held_in_escrow: number
          pending_release: number
          platform_revenue: number
          total_gbv: number
          total_released: number
        }[]
      }
      get_host_bookings: {
        Args: { host_id: string }
        Returns: {
          attendee_user_id: string
          booking_date: string
          id: string
          retreat_id: string
        }[]
      }
      get_host_performance: {
        Args: never
        Returns: {
          conversion_rate: number
          host_name: string
          host_user_id: string
          total_bookings: number
          total_retreat_views: number
          total_retreats: number
          total_revenue: number
        }[]
      }
      get_host_retreat_bookings: {
        Args: { host_id: string }
        Returns: {
          amount_paid: number
          attendee_user_id: string
          booking_date: string
          id: string
          payment_status: string
          retreat_id: string
        }[]
      }
      get_payout_breakdown: {
        Args: { _booking_id: string }
        Returns: {
          amount: number
          deposit_amount: number
          final_amount: number
          recipient_name: string
          recipient_user_id: string
          retreat_team_id: string
          role: Database["public"]["Enums"]["team_member_role"]
        }[]
      }
      get_profile_email_admin: { Args: { profile_id: string }; Returns: string }
      get_property_locations: {
        Args: { property_ids: string[] }
        Returns: {
          id: string
          location: string
        }[]
      }
      get_public_profile: {
        Args: { profile_id: string }
        Returns: {
          availability_status: string
          bio: string
          certifications: string[]
          cover_photo: string
          expertise_areas: string[]
          id: string
          instagram_handle: string
          languages: string[]
          location: string
          name: string
          portfolio_photos: string[]
          portfolio_videos: string[]
          profile_photo: string
          slug: string
          tiktok_handle: string
          travel_willing: boolean
          verified: boolean
          website_url: string
          what_i_offer: string
          years_experience: number
        }[]
      }
      get_public_profile_by_slug: {
        Args: { profile_slug: string }
        Returns: {
          availability_status: string
          bio: string
          certifications: string[]
          cover_photo: string
          expertise_areas: string[]
          id: string
          instagram_handle: string
          languages: string[]
          location: string
          name: string
          portfolio_photos: string[]
          portfolio_videos: string[]
          profile_photo: string
          slug: string
          tiktok_handle: string
          travel_willing: boolean
          verified: boolean
          website_url: string
          what_i_offer: string
          years_experience: number
        }[]
      }
      get_public_profiles: {
        Args: { profile_ids: string[] }
        Returns: {
          availability_status: string
          bio: string
          certifications: string[]
          cover_photo: string
          expertise_areas: string[]
          id: string
          instagram_handle: string
          languages: string[]
          location: string
          name: string
          portfolio_photos: string[]
          portfolio_videos: string[]
          profile_photo: string
          slug: string
          tiktok_handle: string
          travel_willing: boolean
          verified: boolean
          website_url: string
          what_i_offer: string
          years_experience: number
        }[]
      }
      get_retreat_availability: {
        Args: { retreat_ids: string[] }
        Returns: {
          current_bookings: number
          is_full: boolean
          max_attendees: number
          retreat_id: string
          spots_remaining: number
        }[]
      }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_retreat_host: {
        Args: { _retreat_id: string; _user_id: string }
        Returns: boolean
      }
      is_server_admin: {
        Args: { _server_id: string; _user_id: string }
        Returns: boolean
      }
      is_server_member: {
        Args: { _server_id: string; _user_id: string }
        Returns: boolean
      }
      is_user_verified: { Args: { _user_id: string }; Returns: boolean }
      slugify: { Args: { input: string }; Returns: string }
      user_has_booking_for_retreat: {
        Args: { retreat_uuid: string }
        Returns: boolean
      }
      user_is_retreat_host: { Args: { retreat_uuid: string }; Returns: boolean }
      user_is_retreat_team_member: {
        Args: { retreat_uuid: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "host" | "cohost" | "landowner" | "staff" | "attendee" | "admin"
      escrow_status:
        | "holding"
        | "partial_released"
        | "fully_released"
        | "refunded"
        | "disputed"
      payment_status: "pending" | "completed" | "refunded"
      payout_status:
        | "pending"
        | "scheduled"
        | "processing"
        | "completed"
        | "failed"
        | "cancelled"
      property_type: "land" | "retreat_center" | "venue"
      retreat_status:
        | "draft"
        | "published"
        | "full"
        | "completed"
        | "cancelled"
        | "pending_review"
        | "approved"
      server_role: "owner" | "admin" | "member"
      stripe_account_status:
        | "pending"
        | "onboarding"
        | "active"
        | "restricted"
        | "disabled"
      team_member_role:
        | "host"
        | "cohost"
        | "venue"
        | "chef"
        | "staff"
        | "other"
        | "photographer"
        | "yoga_instructor"
        | "sound_healer"
        | "massage"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["host", "cohost", "landowner", "staff", "attendee", "admin"],
      escrow_status: [
        "holding",
        "partial_released",
        "fully_released",
        "refunded",
        "disputed",
      ],
      payment_status: ["pending", "completed", "refunded"],
      payout_status: [
        "pending",
        "scheduled",
        "processing",
        "completed",
        "failed",
        "cancelled",
      ],
      property_type: ["land", "retreat_center", "venue"],
      retreat_status: [
        "draft",
        "published",
        "full",
        "completed",
        "cancelled",
        "pending_review",
        "approved",
      ],
      server_role: ["owner", "admin", "member"],
      stripe_account_status: [
        "pending",
        "onboarding",
        "active",
        "restricted",
        "disabled",
      ],
      team_member_role: [
        "host",
        "cohost",
        "venue",
        "chef",
        "staff",
        "other",
        "photographer",
        "yoga_instructor",
        "sound_healer",
        "massage",
      ],
    },
  },
} as const
