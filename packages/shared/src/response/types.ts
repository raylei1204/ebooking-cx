export interface PaginationMeta {
  page: number;
  total: number;
}

export interface ApiSuccessResponse<TData> {
  data: TData;
  meta?: PaginationMeta;
}

export interface ApiErrorBody {
  code: string;
  message: string;
  statusCode: number;
}

export interface ApiErrorResponse {
  error: ApiErrorBody;
}
