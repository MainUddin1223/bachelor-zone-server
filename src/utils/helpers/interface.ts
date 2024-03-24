export interface IPaginationPayload {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: string;
}

export interface IPaginationValue {
  skip: number;
  take: number;
  orderBy: any;
  page: number;
}
export interface IMeta {
  page?: number;
  size?: number;
  total?: number;
  totalPage?: number;
}
export interface IApiResponse<T> {
  statusCode: number;
  success: boolean;
  message?: string | null;
  meta?: IMeta;
  data?: T | null;
}
export interface IFilterOption {
  search?: string | undefined;
  min_price?: number | undefined;
  max_price?: number | undefined;
}
