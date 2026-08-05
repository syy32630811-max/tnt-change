import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import {
  CreateMaterialExchangeRecordDto,
  UpdateMaterialExchangeRecordDto,
} from './dto/create-material-exchange-record.dto';
import { MaterialExchangeService } from './material-exchange.service';

@Controller()
export class MaterialExchangeController {
  constructor(
    private readonly materialExchangeService: MaterialExchangeService,
  ) {}

  /** 互换页物料列表（按数量倒序） */
  @Get('exchange-materials')
  findMaterialsForExchange() {
    return this.materialExchangeService.findMaterialsForExchange();
  }

  /** 管理页：有效期内互换记录列表 */
  @Get('material-exchange-records')
  findActiveRecords() {
    return this.materialExchangeService.findActiveRecords();
  }

  /** 互换页：根据页面码查询已领取记录 */
  @Get('material-exchange-records/by-code/:pageCode')
  findByPageCode(@Param('pageCode') pageCode: string) {
    return this.materialExchangeService.findByPageCode(pageCode);
  }

  @Post('material-exchange-records')
  create(@Body() dto: CreateMaterialExchangeRecordDto) {
    return this.materialExchangeService.create(dto);
  }

  @Patch('material-exchange-records/by-code/:pageCode')
  updateByPageCode(
    @Param('pageCode') pageCode: string,
    @Body() dto: UpdateMaterialExchangeRecordDto,
  ) {
    return this.materialExchangeService.updateByPageCode(pageCode, dto);
  }

  /** 取消选择：删除记录并归还库存 */
  @Delete('material-exchange-records/by-code/:pageCode')
  cancelByPageCode(@Param('pageCode') pageCode: string) {
    return this.materialExchangeService.cancelByPageCode(pageCode);
  }
}
