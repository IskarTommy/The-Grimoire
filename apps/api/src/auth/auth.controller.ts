import { Body, Controller, Post, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';

@Controller('auth')
export class AuthController {
    constructor(
        private authService: AuthService,
        private userService: UsersService,
    ) { }

    @Post('register')
    async register(@Body() body: any) {
        //Remember to replace any later with a proper DTO

        return this.userService.createUser(body.username, body.password,
            body.email);
    }

    @HttpCode(HttpStatus.OK)
    @Post('login')
    async login(@Body() body: any) {
        return this.authService.login(body.username, body.password);
    }
}
