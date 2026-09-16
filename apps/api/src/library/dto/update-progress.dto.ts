import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class updateProgressDto {
    @IsInt()
    @Min(0, { message: 'Chapter cannot be negative' })
    currentChapter!: number;

    @IsString()
    @IsOptional()
    status?: string;
}