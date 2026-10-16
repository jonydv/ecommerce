export interface ApiError {
  statusCode: number;
  error: string;
  message: string;
  path: string;
  requestId: string;
  timestamp: string;
}
