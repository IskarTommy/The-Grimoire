import {
    Body, Controller, Post, HttpCode, HttpStatus, UseGuards, Get,
    Request,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
    constructor(
        private authService: AuthService,
        private userService: UsersService,
    ) { }

    @Post('register')
    async register(@Body() body: RegisterDto) {
        return this.userService.createUser(body.username, body.password,
            body.email);
    }

    @HttpCode(HttpStatus.OK)
    @Post('login')
    async login(@Body() body: LoginDto) {
        return this.authService.login(body.username,
            body.password);
    }

    //2. Add the bouncer to this specific route!

    @UseGuards(JwtAuthGuard)
    @Get('me')
    getProfile(@Request() req: any) {
        // if they make it past the guard, passport automatically puts their ID card data inside this return statement 
        return req.user;
    }
}
