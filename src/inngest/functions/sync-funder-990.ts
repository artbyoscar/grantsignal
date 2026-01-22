import { inngest } from '@/inngest/client'
import { db } from '@/lib/prisma'
import {
  fetchFunder990,
  fetchFunderFilings,
  calculateGrantSizeStats,
  parseNTEECode,
} from '@/server/services/discovery/propublica'

/**
 * Sync funder data from ProPublica 990 API
 * Triggered when a funder is created or manually refreshed
 */
export const syncFunder990 = inngest.createFunction(
  {
    id: 'sync-funder-990',
    name: 'Sync Funder 990 Data',
    retries: 2,
  },
  { event: 'funder/sync-990' },
  async ({ event, step }) => {
    const { funderId, ein } = event.data

    if (!ein) {
      console.log(`Funder ${funderId} has no EIN, skipping 990 sync`)
      return { success: false, reason: 'No EIN provided' }
    }

    // Step 1: Fetch 990 data from ProPublica
    const funderData = await step.run('fetch-990-data', async () => {
      console.log(`Fetching 990 data for EIN: ${ein}`)

      try {
        const data = await fetchFunder990(ein)
        console.log(`Successfully fetched 990 data for ${data.name}`)
        return data
      } catch (error) {
        console.error('Failed to fetch 990 data:', error)
        throw error
      }
    })

    // Step 2: Fetch historical grantee data (Schedule I)
    const pastGrantees = await step.run('fetch-schedule-i', async () => {
      console.log(`Fetching Schedule I data for EIN: ${ein}`)

      try {
        const grantees = await fetchFunderFilings(ein)
        console.log(`Found ${grantees.length} past grantees`)
        return grantees
      } catch (error) {
        console.error('Failed to fetch Schedule I data:', error)
        // Don't fail the entire job if Schedule I is unavailable
        return []
      }
    })

    // Step 3: Calculate grant size statistics
    const grantStats = await step.run('calculate-grant-stats', async () => {
      return calculateGrantSizeStats(pastGrantees)
    })

    // Step 4: Parse NTEE code for program areas
    const nteeInfo = await step.run('parse-ntee-code', async () => {
      if (!funderData.nteeCode) return null
      return parseNTEECode(funderData.nteeCode)
    })

    // Step 5: Update funder in database
    await step.run('update-funder', async () => {
      console.log(`Updating funder ${funderId} in database`)

      try {
        await db.funder.update({
          where: { id: funderId },
          data: {
            name: funderData.name,
            city: funderData.city,
            state: funderData.state,
            nteeCode: funderData.nteeCode,
            totalAssets: funderData.latestFiling?.totalAssets,
            totalGiving: funderData.latestFiling?.totalGiving,
            grantSizeMin: grantStats.min,
            grantSizeMax: grantStats.max,
            grantSizeMedian: grantStats.median,
            programAreas: nteeInfo
              ? [nteeInfo.category, nteeInfo.description]
              : undefined,
            historicalData: {
              filings: funderData.historicalFilings,
              lastFiveYears: funderData.historicalFilings.slice(0, 5),
            },
            lastSyncedAt: new Date(),
          },
        })

        console.log(`Successfully updated funder ${funderId}`)
      } catch (error) {
        console.error('Failed to update funder:', error)
        throw error
      }
    })

    // Step 6: Store past grantees
    if (pastGrantees.length > 0) {
      await step.run('store-past-grantees', async () => {
        console.log(`Storing ${pastGrantees.length} past grantees`)

        try {
          // Delete existing past grantees for this funder
          await db.pastGrantee.deleteMany({
            where: { funderId },
          })

          // Insert new past grantees
          await db.pastGrantee.createMany({
            data: pastGrantees.map(grantee => ({
              funderId,
              recipientName: grantee.recipientName,
              recipientEin: grantee.recipientEin,
              amount: grantee.amount,
              purpose: grantee.purpose,
              year: grantee.year,
            })),
          })

          console.log(`Successfully stored ${pastGrantees.length} past grantees`)
        } catch (error) {
          console.error('Failed to store past grantees:', error)
          // Don't fail the entire job
        }
      })
    }

    return {
      success: true,
      funderId,
      ein,
      name: funderData.name,
      totalAssets: funderData.latestFiling?.totalAssets,
      totalGiving: funderData.latestFiling?.totalGiving,
      pastGranteesCount: pastGrantees.length,
      filingsCount: funderData.historicalFilings.length,
    }
  }
)
