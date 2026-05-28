export interface ReportMetadata {
  report_name: string;
  version: string;
  prepared_for: string;
  practice_specialty: string;
  location: {
    area: string;
    city: string;
  };
  clinic_name: string;
  discovered_clinic_address: string;
  primary_discovered_phone: string;
  state_council_registration: {
    council_name: string;
    registration_number: string;
    registration_date: string;
  };
  audit_date: string;
  last_verified_activity_date: string;
}

export interface Competitor {
  name: string;
  rank: number | string;
  link: string;
}

export interface QueryData {
  query: string;
  rank: string | number;
  points: number;
  top_competitors?: Competitor[];
}

export interface MetricData {
  label: string;
  value: string;
  points: number;
}

export interface PlatformRecommendation {
  name: string;
  rank: number;
  reason_cited: string;
}

export interface PlatformData {
  name: string;
  standing: string;
  recommended_rank?: number | null;
  points: number;
  citation: string;
  credentials_cited?: boolean;
  sentiment_positive?: boolean;
  evidence_screenshot?: string;
  top_recommendations?: PlatformRecommendation[];
}

export interface CheckData {
  label: string;
  status: string;
  value: string;
  points: number;
}

export interface SubCategory {
  label: string;
  score: number;
  max_points: number;
  details: string;
}

export interface SentimentData {
  total_reviews: number;
  average_rating: number;
  review_velocity_per_month: number;
  narrative_success_stories: number;
  points_breakdown?: {
    review_volume_and_rating: number;
    review_velocity: number;
    success_stories: number;
  };
}

export interface Channel {
  id: string;
  name: string;
  weight: number;
  channel_percentage_score: number;
  evidence_screenshot: string;
  sub_categories?: {
    [key: string]: SubCategory;
  };
  queries?: QueryData[];
  metrics?: MetricData[];
  platforms?: PlatformData[];
  checks?: CheckData[];
  completeness_checks?: CheckData[];
  sentiment_data?: SentimentData;
}

export interface HistoricalRun {
  date: string;
  overall_score: number;
}

export interface TreatmentPillar {
  pillar: string;
  description: string;
}

export interface CompetitorCallout {
  primary_competitor: string;
  estimated_market_capture: string;
  reason: string;
}

export interface VisualProofItem {
  label: string;
  path: string;
  description: string;
}

export interface ReportSchema {
  report_metadata: ReportMetadata;
  overall_score: number;
  brand_protection_score?: number;
  discoverability_tier: string;
  diagnostic_summary: string;
  historical_runs?: HistoricalRun[];
  channels: Channel[];
  competitor_callout?: CompetitorCallout;
  treatment_plan: TreatmentPillar[];
  visual_proof_index?: VisualProofItem[];
}

