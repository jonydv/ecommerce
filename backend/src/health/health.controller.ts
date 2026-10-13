import { Controller, Get } from "@nestjs/common";

export interface HealthResponse{
    status: 'ok';
    uptime: number; //seconds since the process started
    timestamp: string; //ISO 8601
}

@Controller('health')
export class HealthController {
    @Get()
    check(): HealthResponse{
        return {status: 'ok', uptime: Math.round(process.uptime()), timestamp: new Date().toISOString()};
    }
}