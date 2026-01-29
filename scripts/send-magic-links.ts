/**
 * Magic Link Sender - Post-Migration User Access
 *
 * Sends magic link emails to migrated users so they can access the new site.
 * Run this only after migration is complete and are ready to launch.
 *
 * Usage:
 *   1. Ensure the users array matches migrate-users.ts
 *   2. Set environment variables: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SITE_URL
 *   3. Run: npx ts-node scripts/send-magic-links.ts
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.SUPABASE_URL || ''
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const SITE_URL = process.env.SITE_URL || ''

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !SITE_URL) {
  console.error('Missing required environment variables:')
  console.error('  SUPABASE_URL')
  console.error('  SUPABASE_SERVICE_ROLE_KEY')
  console.error('  SITE_URL')
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
  // Add users here (same list as migrate-users.ts)
]

interface SendResults {
  sent: number
  failed: number
  errors: Array<{ email: string; error: string }>
}

async function sendMagicLinks(): Promise<SendResults> {
  console.log(`Sending magic links to ${users.length} users`)
  console.log(`Redirect URL: ${SITE_URL}\n`)

  const results: SendResults = {
    sent: 0,
    failed: 0,
    errors: []
  }

  for (const user of users) {
    const {email} = user.email_data

    if (user.deleted_at || user.is_anonymous) {
      continue
    }

    try {
      const { error } = await supabase.auth.admin.generateLink({
        type: 'magiclink',
        email: email,
        options: {
          redirectTo: SITE_URL
        }
      })

      if (error) {
        console.log(`[FAIL] ${email} - ${error.message}`)
        results.failed++
        results.errors.push({ email, error: error.message })
      } else {
        console.log(`[SENT] ${email}`)
        results.sent++
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error'
      console.log(`[FAIL] ${email} - ${errorMsg}`)
      results.failed++
      results.errors.push({ email, error: errorMsg })
    }

    // Delay to avoid email rate limiting
    await new Promise(resolve => setTimeout(resolve, 500))
  }

  return results
}

function printResults(results: SendResults): void {
  console.log('\n--- Magic Links Complete ---')
  console.log(`Sent:   ${results.sent}`)
  console.log(`Failed: ${results.failed}`)

  if (results.errors.length > 0) {
    console.log('\nFailed emails:')
    results.errors.forEach(e => console.log(`  ${e.email}: ${e.error}`))
  }
}

sendMagicLinks().then(printResults)
