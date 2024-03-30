export interface ICreateTeam {
  name: string;
  leader_id: number;
  address_id: number;
}

export interface IClaimUser {
  id: number;
  balance: number;
  teamId: number;
  addressId: number;
}

export interface IListedExpenses {
  product_name: string;
  quantity: string;
  amount: number;
  date?: Date;
}
export interface AggregatedOrder {
  team_id: number;
  team_name: string;
  leaderName: string;
  leaderPhoneNumber: string;
  status: string;
  address?: string;
  order_count: number;
  due_boxes: number;
}
