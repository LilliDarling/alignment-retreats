/**
 * User Migration Script
 *
 * Creates users in new Supabase instance with their original UUIDs.
 * No emails are sent during migration.
 *
 * Usage:
 *   1. Add users to the `users` array below
 *   2. Set environment variables: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 *   3. Run: npx ts-node scripts/migrate-users.ts
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.SUPABASE_URL || ''
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing required environment variables:')
  console.error('  SUPABASE_URL')
  console.error('  SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

interface LovableUser {
  id: string
  display_name: string | null
  email_data: {
    email: string
    email_verified: boolean
    confirmation_sent_at: string | null
    confirmed_at: string | null
  }
  phone_data: null
  created_at: string
  updated_at: string
  last_sign_in_at: string | null
  is_sso_user: boolean
  is_anonymous: boolean
  deleted_at: string | null
  providers: string[]
}

const users: LovableUser[] = [
  // Add users here
]

interface MigrationResults {
  success: number
  failed: number
  skipped: number
  errors: Array<{ email: string; error: string }>
}

async function migrateUsers(): Promise<MigrationResults> {
  console.log(`Starting migration of ${users.length} users\n`)

  const results: MigrationResults = {
    success: 0,
    failed: 0,
    skipped: 0,
    errors: []
  }

  for (const user of users) {
    const {email} = user.email_data

    if (user.deleted_at || user.is_anonymous) {
      console.log(`[SKIP] ${email} (deleted or anonymous)`)
      results.skipped++
      continue
    }

    try {
      const { error } = await supabase.auth.admin.createUser({
        id: user.id,
        email: email,
        email_confirm: user.email_data.email_verified,
        user_metadata: {
          display_name: user.display_name,
          migrated_from_lovable: true,
          original_created_at: user.created_at,
          user_type: 'attendee'
        },
      })

      if (error) {
        if (error.message.includes('already been registered')) {
          console.log(`[SKIP] ${email} (already exists)`)
          results.skipped++
        } else {
          console.log(`[FAIL] ${email} - ${error.message}`)
          results.failed++
          results.errors.push({ email, error: error.message })
        }
      } else {
        console.log(`[OK]   ${email}`)
        results.success++
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error'
      console.log(`[FAIL] ${email} - ${errorMsg}`)
      results.failed++
      results.errors.push({ email, error: errorMsg })
    }

    await new Promise(resolve => setTimeout(resolve, 100))
  }

  return results
}

function printResults(results: MigrationResults): void {
  console.log('\n--- Migration Complete ---')
  console.log(`Success: ${results.success}`)
  console.log(`Skipped: ${results.skipped}`)
  console.log(`Failed:  ${results.failed}`)

  if (results.errors.length > 0) {
    console.log('\nFailed users:')
    results.errors.forEach(e => console.log(`  ${e.email}: ${e.error}`))
  }
}

migrateUsers().then(printResults)
