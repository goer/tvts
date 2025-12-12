export interface ErrorResponse {
  error: string;
  message: string;
  details?: any;
}

export interface SuccessResponse<T> {
  success: true;
  data: T;
}
