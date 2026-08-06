/*
 * @Description: 网页进入码服务
 */
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
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
    const pageType = dto.pageType;
    let code = dto.code?.trim() || '';
    const screenshotUrl = dto.screenshotUrl?.trim() || '';

    if (code) {
      this.assertCustomCode(pageType, code, screenshotUrl);
    } else {
      code = await this.generateUniqueCode();
    }

    const exists = await this.pageEntryCodeRepository.exists({
      where: { code },
    });
    if (exists) {
      throw new ConflictException('该标识码已存在');
    }

    const entry = this.pageEntryCodeRepository.create({
      pageType,
      code,
      screenshotUrl:
        pageType === PageType.Exchange ? screenshotUrl : '',
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

  private assertCustomCode(
    pageType: PageType,
    code: string,
    screenshotUrl: string,
  ) {
    if (pageType === PageType.Exchange) {
      if (!/^(xhs|dy).+/i.test(code)) {
        throw new BadRequestException('互换标识码格式应为 xhs/dy + ID');
      }
      if (!screenshotUrl) {
        throw new BadRequestException('请上传个人中心 ID 截图');
      }
      return;
    }

    if (pageType === PageType.Custom) {
      if (!code) {
        throw new BadRequestException('请输入用户名作为标识码');
      }
      if (/^(xhs|dy)/i.test(code)) {
        throw new BadRequestException('定制标识码请使用用户名，勿使用互换前缀');
      }
      return;
    }

    // admin 等类型允许自定义码，但不强制截图
  }

  private async generateUniqueCode() {
    let code = generatePageCode(12);
    for (let i = 0; i < 5; i += 1) {
      const exists = await this.pageEntryCodeRepository.exists({
        where: { code },
      });
      if (!exists) return code;
      code = generatePageCode(12);
    }
    return code;
  }

  private toResponse(entry: PageEntryCode) {
    return {
      ...entry,
      pageTypeLabel:
        PAGE_TYPE_LABELS[entry.pageType as PageType] ?? entry.pageType,
    };
  }
}
