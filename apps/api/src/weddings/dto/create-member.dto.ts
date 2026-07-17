import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export enum FamilyPlanningRoleDto {
  WEDDING_OWNER = 'WEDDING_OWNER',
  BUDGET_MANAGER = 'BUDGET_MANAGER',
  VENDOR_COORDINATOR = 'VENDOR_COORDINATOR',
  GUEST_MANAGER = 'GUEST_MANAGER',
  CATERING_COORDINATOR = 'CATERING_COORDINATOR',
  SHOPPING_COORDINATOR = 'SHOPPING_COORDINATOR',
  TRANSPORT_COORDINATOR = 'TRANSPORT_COORDINATOR',
  EVENT_DAY_COORDINATOR = 'EVENT_DAY_COORDINATOR',
  VIEWER = 'VIEWER',
}

export class CreateMemberDto {
  @IsEmail()
  email!: string;

  @IsOptional()
  @IsString()
  fullName?: string;

  @IsEnum(FamilyPlanningRoleDto)
  role!: FamilyPlanningRoleDto;
}

export class UpdateMemberDto {
  @IsOptional()
  @IsString()
  fullName?: string;

  @IsOptional()
  @IsEnum(FamilyPlanningRoleDto)
  role?: FamilyPlanningRoleDto;

  @IsOptional()
  @IsNotEmpty()
  @IsString()
  status?: string;
}
