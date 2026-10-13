export interface HealthResponse {
  status: 'ok';
  uptime: number; // seconds since the process started
  timestamp: string; // ISO 8601
}
