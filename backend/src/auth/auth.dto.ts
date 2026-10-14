import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class RegisterDto {
  @IsEmail()
  @MaxLength(254)
  email: string;

  @IsString()
  @MinLength(12)
  @MaxLength(128) // a 1Mb password burns CPU in your slow hash
  password: string;
}

export class LoginDto {
  @IsEmail()
  @MaxLength(254)
  email: string;
  @IsString()
  @MaxLength(128)
  password: string;
}
