import {
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";

export class MitigationDto {
  @IsString()
  action_id!: string;

  @IsNumber()
  @Min(0)
  @Max(1)
  coverage!: number;
}

export class CreateSubmissionDto {
  @IsNumber()
  year!: number;

  @IsString()
  region_id!: string;

  @IsNumber()
  @Min(0)
  total_population!: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MitigationDto)
  mitigations?: MitigationDto[];
}
