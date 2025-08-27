export declare const ROLES_KEY = "roles";
export type AppRole = 'ADMIN' | 'STUDENT';
export declare const Roles: (...roles: AppRole[]) => import("@nestjs/common").CustomDecorator<string>;
