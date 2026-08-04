import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ExchangeMaterial } from '../entities';
import { CreateMaterialDto, UpdateMaterialDto } from './dto/material.dto';

@Injectable()
export class MaterialService {
  constructor(
    @InjectRepository(ExchangeMaterial)
    private readonly materialRepository: Repository<ExchangeMaterial>,
  ) {}

  findAll() {
    return this.materialRepository.find({
      order: { id: 'DESC' },
    });
  }

  async findOne(id: string) {
    const material = await this.materialRepository.findOne({ where: { id } });
    if (!material) {
      throw new NotFoundException('物料不存在');
    }
    return material;
  }

  create(dto: CreateMaterialDto) {
    const material = this.materialRepository.create({
      name: dto.name.trim(),
      image: dto.image,
      quantity: dto.quantity,
      expireAt: new Date(dto.expireAt),
      isValid: true,
    });
    return this.materialRepository.save(material);
  }

  async update(id: string, dto: UpdateMaterialDto) {
    const material = await this.findOne(id);

    if (dto.name !== undefined) material.name = dto.name.trim();
    if (dto.image !== undefined) material.image = dto.image;
    if (dto.quantity !== undefined) material.quantity = dto.quantity;
    if (dto.expireAt !== undefined) material.expireAt = new Date(dto.expireAt);
    if (dto.isValid !== undefined) material.isValid = dto.isValid;

    return this.materialRepository.save(material);
  }
}
