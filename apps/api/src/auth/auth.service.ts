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

    async login(username: string, passwordPlain: string) {
        //Step 1 confirm user exists
        const user = await
            this.usersService.findByUsername(username);
        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
        }

        //step 2 we check if the password maches the hashed version 
        const isPasswordValid = await
            bcrypt.compare(passwordPlain, user.password);
        if (!isPasswordValid) {
            throw new UnauthorizedException('Invalid credentials');
        };

        //step 3 we generate the JSON web tokens "ID card"
        const payload = { sub: user.id, username: user.username };
        return {
            access_token: await
                this.jwtService.signAsync(payload),
        };
    }


}
