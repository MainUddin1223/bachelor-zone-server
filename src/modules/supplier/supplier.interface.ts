export interface AggregatedTeam {
  name: string;
  id: number;
  leaderName: string;
  leaderPhone: string;
  pendingOrder: number;
  readyToPickup: number;
}

export interface AggregatedData {
  address: string;
  id: number;
  team: AggregatedTeam[];
}
