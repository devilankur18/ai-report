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

export interface PlatformData {
  name: string;
  standing: string;
  points: number;
  citation: string;
}

export interface CheckData {
  label: string;
  status: string;
  value: string;
  points: number;
}

export interface Channel {
  id: string;
  name: string;
  weight: number;
  channel_percentage_score: number;
  evidence_screenshot: string;
  queries?: QueryData[];
  metrics?: MetricData[];
  platforms?: PlatformData[];
  checks?: CheckData[];
}

export interface HistoricalRun {
  date: string;
  overall_score: number;
}

export interface TreatmentPillar {
  pillar: string;
  description: string;
}

export interface ReportSchema {
  report_metadata: ReportMetadata;
  overall_score: number;
  discoverability_tier: string;
  diagnostic_summary: string;
  historical_runs: HistoricalRun[];
  channels: Channel[];
  treatment_plan: TreatmentPillar[];
}
