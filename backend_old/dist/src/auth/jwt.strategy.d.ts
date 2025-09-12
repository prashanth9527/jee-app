import { Strategy } from 'passport-jwt';
import { UsersService } from '../users/users.service';
import { SessionService } from './session.service';
declare const JwtStrategy_base: new (...args: any[]) => Strategy;
export declare class JwtStrategy extends JwtStrategy_base {
    private readonly usersService;
    private readonly sessionService;
    constructor(usersService: UsersService, sessionService: SessionService);
    validate(payload: {
        sub: string;
        email: string;
        sessionId?: string;
    }): Promise<{
        id: string;
        email: string;
        fullName: string;
        role: import(".prisma/client").$Enums.UserRole;
        sessionId: string | undefined;
    } | null>;
}
export {};
