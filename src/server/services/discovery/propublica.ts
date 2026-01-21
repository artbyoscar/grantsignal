/**
 * ProPublica 990 API Integration
 *
 * Fetches funder data from ProPublica Nonprofit Explorer API
 * https://projects.propublica.org/nonprofits/api
 */

interface ProPublica990Response {
  organization: {
    name: string
    ein: string
    strein: string
    sub_name: string | null
    city: string
    state: string
    ntee_code: string
    raw_ntee_code: string
    subseccd: number
    has_subseccd: boolean
    have_filings: boolean
    have_pdfs: boolean
    have_extracts: boolean
    latest_object_id: string | null
  }
  filings_with_data: Array<{
    tax_prd: number
    tax_prd_yr: number
    formtype: number
    pdf_url: string
    updated: string
    totrevenue: number
    totfuncexpns: number
    totassetsend: number
    totliabend: number
    totnetassetend: number
    totgftgrntrcvd509: number
    totliabilities: number | null
    gftgrntsrcvd170: number | null
    compnsatncurrofcr: number | null
    othrsalwages: number | null
    payrolltx: number | null
    benifitsmembrs: number | null
    profndraising: number | null
    totfuncexpns_: number | null
    contractrevn: number | null
    totcntrbgfts: number | null
  }>
  filings_without_data: any[]
  data_source: string
  api_version: number
}

interface ScheduleIPart {
  recipient_name: string
  recipient_ein?: string
  recipient_address?: string
  recipient_city?: string
  recipient_state?: string
  recipient_zip?: string
  cash_grant_amt?: number
  purpose?: string
}

interface ScheduleIResponse {
  organization: {
    name: string
    ein: string
  }
  schedule_parts: {
    schedule_i?: {
      [year: string]: ScheduleIPart[]
    }
  }
}

export interface Funder990Data {
  name: string
  ein: string
  city: string
  state: string
  nteeCode: string
  latestFiling?: {
    year: number
    totalRevenue: number
    totalAssets: number
    totalGiving: number
    pdfUrl: string
  }
  historicalFilings: Array<{
    year: number
    totalRevenue: number
    totalAssets: number
    totalGiving: number
    pdfUrl: string
  }>
}

export interface PastGrantee {
  recipientName: string
  recipientEin?: string
  recipientAddress?: string
  city?: string
  state?: string
  zip?: string
  amount: number
  purpose?: string
  year: number
}

/**
 * Fetch funder organization data from ProPublica
 */
export async function fetchFunder990(ein: string): Promise<Funder990Data> {
  // Remove any hyphens from EIN
  const cleanEin = ein.replace(/-/g, '')

  const response = await fetch(
    `https://projects.propublica.org/nonprofits/api/v2/organizations/${cleanEin}.json`
  )

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error(`No 990 data found for EIN: ${ein}`)
    }
    throw new Error(`ProPublica API error: ${response.status} ${response.statusText}`)
  }

  const data: ProPublica990Response = await response.json()

  // Parse filings data
  const historicalFilings = data.filings_with_data
    .slice(0, 10) // Get last 10 years
    .map(filing => ({
      year: filing.tax_prd_yr,
      totalRevenue: filing.totrevenue || 0,
      totalAssets: filing.totassetsend || 0,
      totalGiving: filing.totgftgrntrcvd509 || filing.gftgrntsrcvd170 || 0,
      pdfUrl: filing.pdf_url,
    }))
    .sort((a, b) => b.year - a.year) // Sort by year descending

  const latestFiling = historicalFilings[0]

  return {
    name: data.organization.name,
    ein: data.organization.ein,
    city: data.organization.city,
    state: data.organization.state,
    nteeCode: data.organization.ntee_code,
    latestFiling,
    historicalFilings,
  }
}

/**
 * Fetch historical grantees from Schedule I (Grants to Organizations)
 *
 * Note: ProPublica doesn't have a direct Schedule I endpoint in their public API.
 * This attempts to fetch data from their search page, but is limited.
 * For comprehensive data, consider:
 * 1. PDF parsing of 990 forms
 * 2. Candid/GuideStar API (paid)
 * 3. Manual data entry
 */
export async function fetchFunderFilings(ein: string): Promise<PastGrantee[]> {
  // Remove any hyphens from EIN
  const cleanEin = ein.replace(/-/g, '')

  try {
    // Attempt to fetch from ProPublica's search endpoint
    // This provides limited data but is better than nothing
    const searchResponse = await fetch(
      `https://projects.propublica.org/nonprofits/api/v2/search.json?q=${cleanEin}`
    )

    if (searchResponse.ok) {
      const searchData = await searchResponse.json()

      // ProPublica's search API returns basic info but not detailed Schedule I
      // This is a limitation of the free API
      console.log(`ProPublica search found ${searchData.organizations?.length || 0} results for EIN ${cleanEin}`)
    }

    // For comprehensive Schedule I data, you need to:
    // 1. Parse the PDF 990 forms from filing URLs
    // 2. Use a paid service like Candid API
    // 3. Manually enter grantee data from 990s

    console.log(`Schedule I data requires PDF parsing or paid API for EIN ${cleanEin}`)
    console.log(`Consider using Candid Foundation Directory API or parsing PDF 990s manually`)

    return []
  } catch (error) {
    console.error('Error fetching Schedule I data:', error)
    return []
  }
}

/**
 * Calculate grant size statistics from past grantees
 */
export function calculateGrantSizeStats(grantees: PastGrantee[]) {
  if (grantees.length === 0) {
    return {
      min: null,
      max: null,
      median: null,
      average: null,
    }
  }

  const amounts = grantees
    .map(g => g.amount)
    .filter(a => a > 0)
    .sort((a, b) => a - b)

  if (amounts.length === 0) {
    return {
      min: null,
      max: null,
      median: null,
      average: null,
    }
  }

  const min = amounts[0]
  const max = amounts[amounts.length - 1]
  const median = amounts[Math.floor(amounts.length / 2)]
  const average = amounts.reduce((sum, a) => sum + a, 0) / amounts.length

  return {
    min,
    max,
    median,
    average,
  }
}

/**
 * Extract mission and program areas from NTEE code
 * https://nccs.urban.org/project/national-taxonomy-exempt-entities-ntee-codes
 */
export function parseNTEECode(nteeCode: string): {
  category: string
  subcategory: string
  description: string
} {
  const categoryMap: Record<string, string> = {
    A: 'Arts, Culture & Humanities',
    B: 'Education',
    C: 'Environment',
    D: 'Animal-Related',
    E: 'Health Care',
    F: 'Mental Health & Crisis Intervention',
    G: 'Diseases, Disorders & Medical Disciplines',
    H: 'Medical Research',
    I: 'Crime & Legal-Related',
    J: 'Employment',
    K: 'Food, Agriculture & Nutrition',
    L: 'Housing & Shelter',
    M: 'Public Safety, Disaster Preparedness & Relief',
    N: 'Recreation & Sports',
    O: 'Youth Development',
    P: 'Human Services',
    Q: 'International, Foreign Affairs & National Security',
    R: 'Civil Rights, Social Action & Advocacy',
    S: 'Community Improvement & Capacity Building',
    T: 'Philanthropy, Voluntarism & Grantmaking Foundations',
    U: 'Science & Technology',
    V: 'Social Science',
    W: 'Public & Societal Benefit',
    X: 'Religion-Related',
    Y: 'Mutual & Membership Benefit',
    Z: 'Unknown',
  }

  const code = nteeCode.trim().toUpperCase()
  const categoryLetter = code.charAt(0)
  const category = categoryMap[categoryLetter] || 'Unknown'

  return {
    category,
    subcategory: code.substring(1, 3),
    description: `${category} (${code})`,
  }
}