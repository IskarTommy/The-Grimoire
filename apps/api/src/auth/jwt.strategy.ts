import { ExtractJwt, Strategy } from "passport-jwt";
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from "@nestjs/common";

@Injectable()
export class JwtStrategy extends
    PassportStrategy(Strategy) {
    constructor() {
        super({
            // Tell it where to look for the ID card (in the Authorization)
            jwtFromRequest:
                ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            // This MUST match the secret in the auth.module.ts!
            secretOrKey: process.env.JWT_SECRET || 'super-secret-fallback-key',
        });
    }

    // We call this function if the sign in succeeds.
    // It checks the "ID Card" to make sure it's valid
    async validate(payload: any) {
        return {
            userId: payload.sub, username:
                payload.username
        };
    }
}