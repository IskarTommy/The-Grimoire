import { IsString, IsOptional } from 'class-validator';

export class AddMangaDto {
    @IsString()
    mangaId!: string;

    @IsString()
    title!: string;

    @IsString()
    @IsOptional() // This means it doesn't have to be there
    coverUrl?: string;
}