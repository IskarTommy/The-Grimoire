import { Injectable, ConflictException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import * as bcrypt from "bcrypt";

@Injectable()
export class UsersService {
    constructor(private prisma: PrismaService) { }

    async findByUsername(username: string) {
        return this.prisma.user.findUnique({
            where: { username },
        });
    }

    async findByIdentifier(identifier: string) {
        return this.prisma.user.findFirst({
            where: {
                OR: [
                    { username: identifier },
                    { email: identifier.toLowerCase().trim() },
                ],
            },
        });
    }


    async findById(id: string) {
        return this.prisma.user.findUnique({
            where: { id },
            select: { id: true, username: true, email: true, createdAt: true },
        });
    }

    async createUser(username: string, passwordPlain: string, email: string) {
        // It checks if the user already exists
        const existingUser = await this.prisma.user.findFirst({
            where: {
                OR: [{ username }, { email }]
            },
        });

        if (existingUser) {
            throw new ConflictException("Username or Email already exists");
        }

        // Hash the password before saving 
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(passwordPlain, saltRounds);

        const newUser = await this.prisma.user.create({
            data: {
                username,
                email,
                password: hashedPassword,
            },
            select: {
                id: true,
                username: true,
                email: true,
                createdAt: true,
            },
        });

        return newUser;
    }
}

