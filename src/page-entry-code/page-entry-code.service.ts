/*
 * @Description: 网页进入码服务
 */
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  PAGE_TYPE_LABELS,
  PageType,
  SUPPORTED_PAGE_TYPES,
} from '../common/constants/page-type';
import { generatePageCode } from '../common/utils/generate-page-code';
import { PageEntryCode } from '../entities';
import {
  CreatePageEntryCodeDto,
  UpdatePageEntryCodeDto,
} from './dto/create-page-entry-code.dto';

@Injectable()
export class PageEntryCodeService {
  constructor(
    @InjectRepository(PageEntryCode)
    private readonly pageEntryCodeRepository: Repository<PageEntryCode>,
  ) {}

  async findAll() {
    const list = await this.pageEntryCodeRepository.find({
      order: { id: 'DESC' },
    });

    return list.map((item) => this.toResponse(item));
  }

  async create(dto: CreatePageEntryCodeDto) {
    let code = generatePageCode(12);
    for (let i = 0; i < 5; i += 1) {
      const exists = await this.pageEntryCodeRepository.exists({
        where: { code },
      });
      if (!exists) break;
      code = generatePageCode(12);
    }

    const entry = this.pageEntryCodeRepository.create({
      pageType: dto.pageType,
      code,
      isValid: true,
    });

    return this.toResponse(await this.pageEntryCodeRepository.save(entry));
  }

  async update(id: string, dto: UpdatePageEntryCodeDto) {
    const entry = await this.pageEntryCodeRepository.findOne({ where: { id } });
    if (!entry) {
      throw new NotFoundException('页面码不存在');
    }

    if (dto.pageType !== undefined) entry.pageType = dto.pageType;
    if (dto.isValid !== undefined) entry.isValid = dto.isValid;

    return this.toResponse(await this.pageEntryCodeRepository.save(entry));
  }

  async resolveByCode(code: string) {
    const entry = await this.pageEntryCodeRepository.findOne({
      where: { code: code.trim(), isValid: true },
    });

    if (!entry) {
      throw new NotFoundException('页面码无效或不存在');
    }

    if (!SUPPORTED_PAGE_TYPES.includes(entry.pageType as PageType)) {
      throw new NotFoundException('暂不支持该页面类型');
    }

    const pageType = entry.pageType as PageType;

    return {
      code: entry.code,
      pageType,
      pageTypeLabel: PAGE_TYPE_LABELS[pageType],
    };
  }

  private toResponse(entry: PageEntryCode) {
    return {
      ...entry,
      pageTypeLabel:
        PAGE_TYPE_LABELS[entry.pageType as PageType] ?? entry.pageType,
    };
  }
}
