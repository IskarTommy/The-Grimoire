import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    UsersModule, // Checking if a user exists.

    JwtModule.register({
      global: true, // Generates tokens anywhere

      secret: process.env.JWT_SECRET || 'super-secret-fallback-key',
      signOptions: { expiresIn: '7d' }, // Tokens only lasts for 7 days
    }),
  ],

  providers: [AuthService],
  controllers: [AuthController],
})
export class AuthModule { }
