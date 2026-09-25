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
        await this.userService.createUser(body.username, body.password, body.email);
        // Automatically issue token and return user profile
        return this.authService.login(body.username, body.password);
    }

    @HttpCode(HttpStatus.OK)
    @Post('login')
    async login(@Body() body: LoginDto) {
        return this.authService.login(body.username, body.password);
    }

    @UseGuards(JwtAuthGuard)
    @Get('me')
    async getProfile(@Request() req: any) {
        const user = await this.userService.findById(req.user.userId);
        return user || req.user;
    }
}
