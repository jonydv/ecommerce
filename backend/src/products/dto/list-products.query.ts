import {Type} from 'class-transformer';
import {IsOptional, Min, Max, IsInt, IsUUID} from 'class-validator';

export class ListProductsQuery {
    @IsOptional() @Type(()=> Number) @IsInt() @Min(1) @Max(50) // witouth ceiling it´s a free Dos
    limit: number = 12;
    @IsOptional() @IsUUID()
    cursor?: string;
}