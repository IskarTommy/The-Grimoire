import { IsInt, IsOptional, IsString, Min, Max } from 'class-validator';

export class updateProgressDto {
    @IsInt()
    @Min(0, { message: 'Chapter cannot be negative' })
    @IsOptional()
    currentChapter?: number;

    @IsString()
    @IsOptional()
    status?: string;

    @IsInt()
    @Min(0)
    @Max(10)
    @IsOptional()
    rating?: number;
}