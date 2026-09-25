import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';


@Injectable()
export class AuthService {
    constructor(
        private usersService: UsersService,
        private jwtService: JwtService,
    ) { }

    async login(identifier: string, passwordPlain: string) {
        // Step 1: confirm user exists by username or email
        const user = await this.usersService.findByIdentifier(identifier);
        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
        }

        // Step 2: check if the password matches the hashed version 
        const isPasswordValid = await bcrypt.compare(passwordPlain, user.password);
        if (!isPasswordValid) {
            throw new UnauthorizedException('Invalid credentials');
        }

        // Step 3: generate the JSON web token and return safe user profile
        const payload = { sub: user.id, username: user.username };
        return {
            access_token: await this.jwtService.signAsync(payload),
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
            },
        };
    }


}
