import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, type EntityManager, Repository } from 'typeorm';
import { PageType } from '../common/constants/page-type';
import {
  ExchangeMaterial,
  MaterialExchangeRecord,
  PageEntryCode,
} from '../entities';
import {
  CreateMaterialExchangeRecordDto,
  UpdateMaterialExchangeRecordDto,
} from './dto/create-material-exchange-record.dto';
import { QrCodeService } from './qr-code.service';

@Injectable()
export class MaterialExchangeService {
  constructor(
    @InjectRepository(MaterialExchangeRecord)
    private readonly recordRepository: Repository<MaterialExchangeRecord>,
    @InjectRepository(ExchangeMaterial)
    private readonly materialRepository: Repository<ExchangeMaterial>,
    @InjectRepository(PageEntryCode)
    private readonly pageEntryCodeRepository: Repository<PageEntryCode>,
    private readonly dataSource: DataSource,
    private readonly qrCodeService: QrCodeService,
  ) {}

  /** 互换页：全部有效物料，按数量倒序 */
  findMaterialsForExchange() {
    return this.materialRepository.find({
      where: { isValid: true },
      order: { quantity: 'DESC', id: 'DESC' },
    });
  }

  async findByPageCode(pageCode: string) {
    const record = await this.recordRepository.findOne({
      where: { pageCode: pageCode.trim(), isValid: true },
      relations: { material: true },
    });

    return {
      record: record ? this.toRecordResponse(record) : null,
    };
  }

  /** 管理页：有效期内且有效记录 */
  async findActiveRecords() {
    const now = new Date();
    const records = await this.recordRepository
      .createQueryBuilder('record')
      .innerJoinAndSelect('record.material', 'material')
      .where('record.is_valid = :recordValid', { recordValid: true })
      .andWhere('material.is_valid = :isValid', { isValid: true })
      .andWhere(
        '(material.expire_at IS NULL OR material.expire_at >= :now)',
        { now },
      )
      .orderBy('record.id', 'DESC')
      .getMany();

    return records.map((record) => this.toRecordResponse(record));
  }

  async create(dto: CreateMaterialExchangeRecordDto) {
    const pageCode = dto.pageCode.trim();
    const platformUserId = dto.platformUserId.trim();
    await this.assertExchangePageCode(pageCode);

    const materialForQr = await this.materialRepository.findOne({
      where: { id: dto.materialId },
    });
    if (!materialForQr || !materialForQr.isValid) {
      throw new NotFoundException('物料不存在或已失效');
    }

    const redeemCode = this.qrCodeService.generateRedeemCode();
    const qrPayload = this.qrCodeService.buildQrPayload({
      materialName: materialForQr.name,
      platform: dto.platform,
      platformUserId,
      redeemCode,
    });
    const qrCodeUrl = await this.qrCodeService.createQrCodeImage(
      qrPayload,
      redeemCode,
    );

    return this.dataSource.transaction(async (manager) => {
      const existing = await manager.findOne(MaterialExchangeRecord, {
        where: { pageCode },
        lock: { mode: 'pessimistic_write' },
      });

      if (existing?.isValid) {
        throw new BadRequestException(
          '该页面码已选择过物料，请先取消选择后再选',
        );
      }

      const material = await this.lockSelectableMaterial(
        manager,
        dto.materialId,
      );

      material.quantity -= 1;
      await manager.save(material);

      let record: MaterialExchangeRecord;
      if (existing) {
        existing.materialId = material.id;
        existing.materialName = material.name;
        existing.platform = dto.platform;
        existing.platformUserId = platformUserId;
        existing.isValid = true;
        existing.redeemCode = redeemCode;
        existing.qrCodeUrl = qrCodeUrl;
        record = await manager.save(existing);
      } else {
        record = await manager.save(
          manager.create(MaterialExchangeRecord, {
            pageCode,
            materialId: material.id,
            materialName: material.name,
            platform: dto.platform,
            platformUserId,
            isValid: true,
            redeemCode,
            qrCodeUrl,
          }),
        );
      }

      const withMaterial = await manager.findOne(MaterialExchangeRecord, {
        where: { id: record.id },
        relations: { material: true },
      });

      return this.toRecordResponse(withMaterial ?? record);
    });
  }

  async updateByPageCode(
    pageCode: string,
    dto: UpdateMaterialExchangeRecordDto,
  ) {
    const code = pageCode.trim();
    await this.assertExchangePageCode(code);

    if (
      dto.materialId === undefined &&
      dto.platform === undefined &&
      dto.platformUserId === undefined
    ) {
      throw new BadRequestException('请至少修改一项内容');
    }

    return this.dataSource.transaction(async (manager) => {
      const record = await manager.findOne(MaterialExchangeRecord, {
        where: { pageCode: code, isValid: true },
        lock: { mode: 'pessimistic_write' },
      });

      if (!record) {
        throw new NotFoundException('尚未提交互换记录');
      }

      if (dto.materialId !== undefined && dto.materialId !== record.materialId) {
        const oldMaterial = await manager.findOne(ExchangeMaterial, {
          where: { id: record.materialId },
          lock: { mode: 'pessimistic_write' },
        });

        if (oldMaterial) {
          oldMaterial.quantity += 1;
          await manager.save(oldMaterial);
        }

        const nextMaterial = await this.lockSelectableMaterial(
          manager,
          dto.materialId,
        );
        nextMaterial.quantity -= 1;
        await manager.save(nextMaterial);

        record.materialId = nextMaterial.id;
        record.materialName = nextMaterial.name;
      }

      if (dto.platform !== undefined) {
        record.platform = dto.platform;
      }

      if (dto.platformUserId !== undefined) {
        record.platformUserId = dto.platformUserId.trim();
      }

      const saved = await manager.save(record);
      const withMaterial = await manager.findOne(MaterialExchangeRecord, {
        where: { id: saved.id },
        relations: { material: true },
      });

      return this.toRecordResponse(withMaterial ?? saved);
    });
  }

  async cancelByPageCode(pageCode: string) {
    const code = pageCode.trim();
    await this.assertExchangePageCode(code);

    return this.dataSource.transaction(async (manager) => {
      const record = await manager.findOne(MaterialExchangeRecord, {
        where: { pageCode: code, isValid: true },
        lock: { mode: 'pessimistic_write' },
      });

      if (!record) {
        throw new NotFoundException('尚未提交互换记录');
      }

      const material = await manager.findOne(ExchangeMaterial, {
        where: { id: record.materialId },
        lock: { mode: 'pessimistic_write' },
      });

      if (material) {
        material.quantity += 1;
        await manager.save(material);
      }

      record.isValid = false;
      await manager.save(record);
      return { success: true };
    });
  }

  private async assertExchangePageCode(pageCode: string) {
    const entry = await this.pageEntryCodeRepository.findOne({
      where: { code: pageCode, isValid: true },
    });

    if (!entry) {
      throw new BadRequestException('页面码无效或不存在');
    }

    if (entry.pageType !== PageType.Exchange) {
      throw new BadRequestException('该页面码不是物料互换类型');
    }
  }

  private async lockSelectableMaterial(
    manager: EntityManager,
    materialId: string,
  ) {
    const material = await manager.findOne(ExchangeMaterial, {
      where: { id: materialId },
      lock: { mode: 'pessimistic_write' },
    });

    if (!material || !material.isValid) {
      throw new NotFoundException('物料不存在或已失效');
    }

    if (material.quantity <= 0) {
      throw new BadRequestException('该物料数量为 0，无法选择');
    }

    if (material.expireAt && material.expireAt.getTime() < Date.now()) {
      throw new BadRequestException('该物料已过期，无法互换');
    }

    return material;
  }

  private toRecordResponse(record: MaterialExchangeRecord) {
    return {
      id: record.id,
      pageCode: record.pageCode,
      materialId: record.materialId,
      materialName: record.materialName,
      platform: record.platform,
      platformUserId: record.platformUserId,
      isValid: record.isValid,
      redeemCode: record.redeemCode,
      qrCodeUrl: record.qrCodeUrl,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      materialExpireAt: record.material?.expireAt ?? null,
      materialQuantity: record.material?.quantity ?? null,
    };
  }
}
