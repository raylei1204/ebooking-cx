export interface PaginationMeta {
  page: number;
  total: number;
}

export interface ApiSuccessResponse<TData, TMeta = PaginationMeta> {
  data: TData;
  meta?: TMeta;
}

export interface ApiErrorBody {
  code: string;
  message: string;
  statusCode: number;
}

export interface ApiErrorResponse {
  error: ApiErrorBody;
}
