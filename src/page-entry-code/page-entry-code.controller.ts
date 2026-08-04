/*
 * @Description: 网页进入码接口
 */
import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import {
  CreatePageEntryCodeDto,
  UpdatePageEntryCodeDto,
} from './dto/create-page-entry-code.dto';
import { ResolvePageCodeDto } from './dto/resolve-page-code.dto';
import { PageEntryCodeService } from './page-entry-code.service';

@Controller('page-entry-codes')
export class PageEntryCodeController {
  constructor(private readonly pageEntryCodeService: PageEntryCodeService) {}

  @Get()
  findAll() {
    return this.pageEntryCodeService.findAll();
  }

  @Post()
  create(@Body() dto: CreatePageEntryCodeDto) {
    return this.pageEntryCodeService.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdatePageEntryCodeDto) {
    return this.pageEntryCodeService.update(id, dto);
  }

  @Get(':code')
  resolve(@Param() params: ResolvePageCodeDto) {
    return this.pageEntryCodeService.resolveByCode(params.code);
  }
}
