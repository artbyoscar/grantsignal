'use client'

import { FitScoreCard } from './fit-score-card'

// Mock data for demonstration
const mockFitScoreData = {
  overallScore: 78,
  missionScore: 85,
  capacityScore: 72,
  geographicScore: 90,
  historicalScore: 45,
  reusableContentPercentage: 68,
  estimatedHours: 16,
  strengths: [
    'Strong mission alignment with climate justice focus',
    'Geographic coverage matches funder priorities',
    'Existing relationship through previous grants'
  ],
  concerns: [
    'Limited capacity for large-scale implementation',
    'First-time applicant to this specific program',
    'Budget exceeds typical grant range'
  ],
  recommendations: [
    'Emphasize your organization\'s track record in similar climate initiatives',
    'Consider partnering with a larger organization to demonstrate capacity',
    'Highlight the reusable content from the 2023 Environmental Justice grant',
    'Schedule a pre-proposal call to discuss budget concerns',
    'Reference your successful partnership with City Green Alliance as capacity evidence'
  ],
  reusableContentDetails: [
    {
      sectionName: 'Organizational Background',
      hasContent: true,
      suggestedSources: [
        {
          documentId: 'doc_001',
          documentName: '2023 Annual Report',
          relevance: 0.92
        },
        {
          documentId: 'doc_002',
          documentName: 'Mission & Vision Statement',
          relevance: 0.88
        }
      ]
    },
    {
      sectionName: 'Project Description',
      hasContent: true,
      suggestedSources: [
        {
          documentId: 'doc_003',
          documentName: 'Climate Justice Initiative Proposal',
          relevance: 0.85
        }
      ]
    },
    {
      sectionName: 'Budget Narrative',
      hasContent: false,
      suggestedSources: []
    },
    {
      sectionName: 'Evaluation Plan',
      hasContent: true,
      suggestedSources: [
        {
          documentId: 'doc_004',
          documentName: 'Program Evaluation Framework 2024',
          relevance: 0.78
        }
      ]
    },
    {
      sectionName: 'Sustainability Plan',
      hasContent: false,
      suggestedSources: []
    }
  ]
}

const mockHighScoreData = {
  ...mockFitScoreData,
  overallScore: 92,
  missionScore: 95,
  capacityScore: 88,
  historicalScore: 90,
  reusableContentPercentage: 85
}

const mockLowScoreData = {
  ...mockFitScoreData,
  overallScore: 42,
  missionScore: 55,
  capacityScore: 38,
  historicalScore: 25,
  reusableContentPercentage: 35
}

/**
 * Example page demonstrating all FitScoreCard variants
 *
 * This file can be used for:
 * - Visual testing during development
 * - Documentation and reference
 * - Storybook-style component showcase
 */
export function FitScoreCardExamples() {
  return (
    <div className="min-h-screen bg-slate-950 p-8">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Fit Score Card Component Examples
          </h1>
          <p className="text-slate-400">
            Demonstration of all three variants with different score ranges
          </p>
        </div>

        {/* Mini Variant Examples */}
        <section className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold text-white mb-2">Mini Variant</h2>
            <p className="text-sm text-slate-400 mb-4">
              Perfect for opportunity cards in grid layouts. Hover to see detailed breakdown.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
              <div className="mb-4">
                <h3 className="text-white font-medium mb-1">
                  Climate Justice Initiative
                </h3>
                <p className="text-sm text-slate-400">Green Future Foundation</p>
                <p className="text-sm text-slate-500 mt-2">Deadline: May 15, 2024</p>
              </div>
              <div className="flex items-center justify-between">
                <FitScoreCard
                  opportunityId="opp_001"
                  variant="mini"
                  initialData={mockFitScoreData}
                />
                <div className="text-right">
                  <p className="text-sm text-slate-400">Award</p>
                  <p className="text-white font-medium">$50K</p>
                </div>
              </div>
            </div>

            <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
              <div className="mb-4">
                <h3 className="text-white font-medium mb-1">
                  Community Health Program
                </h3>
                <p className="text-sm text-slate-400">Health Equity Fund</p>
                <p className="text-sm text-slate-500 mt-2">Deadline: June 1, 2024</p>
              </div>
              <div className="flex items-center justify-between">
                <FitScoreCard
                  opportunityId="opp_002"
                  variant="mini"
                  initialData={mockHighScoreData}
                />
                <div className="text-right">
                  <p className="text-sm text-slate-400">Award</p>
                  <p className="text-white font-medium">$75K</p>
                </div>
              </div>
            </div>

            <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
              <div className="mb-4">
                <h3 className="text-white font-medium mb-1">
                  Arts Education Initiative
                </h3>
                <p className="text-sm text-slate-400">Cultural Arts Foundation</p>
                <p className="text-sm text-slate-500 mt-2">Deadline: July 20, 2024</p>
              </div>
              <div className="flex items-center justify-between">
                <FitScoreCard
                  opportunityId="opp_003"
                  variant="mini"
                  initialData={mockLowScoreData}
                />
                <div className="text-right">
                  <p className="text-sm text-slate-400">Award</p>
                  <p className="text-white font-medium">$25K</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Compact Variant Examples */}
        <section className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold text-white mb-2">Compact Variant</h2>
            <p className="text-sm text-slate-400 mb-4">
              Optimized for table rows and list views with essential metrics at a glance.
            </p>
          </div>

          <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700 bg-slate-900/50">
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">
                    Opportunity
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">
                    Funder
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">
                    Deadline
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">
                    Fit Score
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-slate-700/50">
                  <td className="py-3 px-4 text-sm text-white">
                    Climate Justice Initiative
                  </td>
                  <td className="py-3 px-4 text-sm text-slate-300">
                    Green Future Foundation
                  </td>
                  <td className="py-3 px-4 text-sm text-slate-300">
                    May 15, 2024
                  </td>
                  <td className="py-3 px-4">
                    <FitScoreCard
                      opportunityId="opp_001"
                      variant="compact"
                      initialData={mockFitScoreData}
                    />
                  </td>
                </tr>
                <tr className="border-b border-slate-700/50">
                  <td className="py-3 px-4 text-sm text-white">
                    Community Health Program
                  </td>
                  <td className="py-3 px-4 text-sm text-slate-300">
                    Health Equity Fund
                  </td>
                  <td className="py-3 px-4 text-sm text-slate-300">
                    June 1, 2024
                  </td>
                  <td className="py-3 px-4">
                    <FitScoreCard
                      opportunityId="opp_002"
                      variant="compact"
                      initialData={mockHighScoreData}
                    />
                  </td>
                </tr>
                <tr>
                  <td className="py-3 px-4 text-sm text-white">
                    Arts Education Initiative
                  </td>
                  <td className="py-3 px-4 text-sm text-slate-300">
                    Cultural Arts Foundation
                  </td>
                  <td className="py-3 px-4 text-sm text-slate-300">
                    July 20, 2024
                  </td>
                  <td className="py-3 px-4">
                    <FitScoreCard
                      opportunityId="opp_003"
                      variant="compact"
                      initialData={mockLowScoreData}
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Full Variant Examples */}
        <section className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold text-white mb-2">Full Variant</h2>
            <p className="text-sm text-slate-400 mb-4">
              Comprehensive view with all details, ideal for opportunity detail pages.
            </p>
          </div>

          <div className="space-y-6">
            {/* Good Score Example */}
            <div>
              <h3 className="text-lg font-medium text-white mb-3">
                Good Match (Score: 78)
              </h3>
              <FitScoreCard
                opportunityId="opp_001"
                variant="full"
                initialData={mockFitScoreData}
                onRecalculate={() => console.log('Recalculated good score')}
              />
            </div>

            {/* Excellent Score Example */}
            <div>
              <h3 className="text-lg font-medium text-white mb-3">
                Excellent Match (Score: 92)
              </h3>
              <FitScoreCard
                opportunityId="opp_002"
                variant="full"
                initialData={mockHighScoreData}
                onRecalculate={() => console.log('Recalculated excellent score')}
              />
            </div>

            {/* Poor Score Example */}
            <div>
              <h3 className="text-lg font-medium text-white mb-3">
                Weak Match (Score: 42)
              </h3>
              <FitScoreCard
                opportunityId="opp_003"
                variant="full"
                initialData={mockLowScoreData}
                onRecalculate={() => console.log('Recalculated poor score')}
              />
            </div>
          </div>
        </section>

        {/* Loading States */}
        <section className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold text-white mb-2">Loading States</h2>
            <p className="text-sm text-slate-400 mb-4">
              Skeleton animations shown during score calculation.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
              <div className="mb-4">
                <h3 className="text-white font-medium mb-1">Loading Mini</h3>
              </div>
              <FitScoreCard
                opportunityId="opp_loading_mini"
                variant="mini"
              />
            </div>

            <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
              <div className="mb-4">
                <h3 className="text-white font-medium mb-1">Loading Compact</h3>
              </div>
              <FitScoreCard
                opportunityId="opp_loading_compact"
                variant="compact"
              />
            </div>

            <div className="col-span-full">
              <h3 className="text-white font-medium mb-3">Loading Full</h3>
              <FitScoreCard
                opportunityId="opp_loading_full"
                variant="full"
              />
            </div>
          </div>
        </section>

        {/* Usage Notes */}
        <section className="bg-slate-800 rounded-lg border border-slate-700 p-6">
          <h2 className="text-xl font-semibold text-white mb-3">Usage Notes</h2>
          <div className="space-y-3 text-sm text-slate-300">
            <p>
              <span className="font-medium text-white">Color Coding:</span> Scores are
              color-coded: Green (85+), Blue (70-84), Amber (50-69), Red (&lt;50)
            </p>
            <p>
              <span className="font-medium text-white">Responsive:</span> All variants
              adapt to different screen sizes and container widths
            </p>
            <p>
              <span className="font-medium text-white">Interactive:</span> Mini variant
              shows tooltip on hover, Full variant has expandable sections
            </p>
            <p>
              <span className="font-medium text-white">API Integration:</span> Component
              is ready to connect to api.discovery.getFitScore query endpoint
            </p>
          </div>
        </section>
      </div>
    </div>
  )
}

export default FitScoreCardExamples
