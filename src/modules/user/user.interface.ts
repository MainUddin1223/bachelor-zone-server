// Define the types for the expected return structure
export interface TeamLeader {
  name: string;
  phone: string;
}

export interface TeamAddress {
  address: string;
}

export interface TeamDetails {
  id: number;
  name: string;
  member: number;
  leader: TeamLeader;
  address: TeamAddress;
}

export interface Member {
  user: {
    name: string;
    phone: string;
  };
}

export interface OrderUser {
  name: string;
  phone: string;
}

export interface Order {
  status: string;
  delivery_date: Date;
  user: OrderUser;
}

export interface TeamOrderData {
  delivery_date: string;
  status: string;
  order_count: number;
  orderList: { user_name: string; user_phone: string }[];
}

export interface TeamDetailsResponse {
  teamDetails: TeamDetails | null;
  members: Member[];
  result: TeamOrderData[];
}
