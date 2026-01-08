import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  ParseIntPipe,
} from "@nestjs/common";
import { UsersService } from "./users.service";
import { UserDto } from "./users.dto";

@Controller("users")
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get()
  getAll() {
    return this.users.findAll();
  }

  @Post()
  create(@Body() dto: UserDto) {
    const payload = {
      name: dto.name,
      email: dto.email,
      province: dto.province,
      provinceCode: dto.provinceCode ?? dto.province,
      role: dto.role,
      active: dto.active ?? true,
      password: dto.password,
    };
    return this.users.create(payload as any);
  }

  @Put(":id")
  update(@Param("id", ParseIntPipe) id: number, @Body() dto: Partial<UserDto>) {
    return this.users.update(id, dto);
  }

  @Delete(":id")
  remove(@Param("id", ParseIntPipe) id: number) {
    return this.users.remove(id);
  }
}
