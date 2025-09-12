import { SessionService } from './session.service';
export declare class SessionCleanupService {
    private readonly sessionService;
    private readonly logger;
    constructor(sessionService: SessionService);
    handleSessionCleanup(): Promise<void>;
}
