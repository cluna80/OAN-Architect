export interface EntityStats {
  strength: number;
  agility: number;
  stamina: number;
  skill: number;
}

export interface EntityBrainData {
  node_id: string;
  entity_id: string;
  name: string;
  type: string;
  stats: EntityStats;
  confidence: number;
  win_rate: number;
  wins: number;
  losses: number;
  experience: number;
  summary: string;
}

export interface MatchResult {
  score_a: number;
  score_b: number;
  winner: number;
}

export interface Relationship {
  trust_level: number;
  interactions: number;
  wins_against: number;
  losses_against: number;
  win_rate: number;
}
