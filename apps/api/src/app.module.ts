import { Module } from '@nestjs/common';


import { AppService } from './app.service';
import { AppController } from './app.controller';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { LibraryModule } from './library/library.module';

@Module({
  imports: [PrismaModule, UsersModule, AuthModule, LibraryModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
