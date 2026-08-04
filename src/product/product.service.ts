import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Product, ProductSpec } from '../entities';
import { CreateProductDto, UpdateProductDto } from './dto/product.dto';

@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(ProductSpec)
    private readonly productSpecRepository: Repository<ProductSpec>,
    private readonly dataSource: DataSource,
  ) {}

  findAll() {
    return this.productRepository.find({
      order: { id: 'DESC' },
    });
  }

  async findOne(id: string) {
    const product = await this.productRepository.findOne({ where: { id } });
    if (!product) {
      throw new NotFoundException('商品不存在');
    }
    return product;
  }

  async create(dto: CreateProductDto) {
    const product = this.productRepository.create({
      name: dto.name.trim(),
      coverImage: dto.coverImage,
      isValid: true,
      specs: dto.specs.map((spec, index) =>
        this.productSpecRepository.create({
          name: spec.name.trim(),
          image: spec.image,
          price: spec.price.toFixed(2),
          sortOrder: index,
        }),
      ),
    });

    return this.productRepository.save(product);
  }

  async update(id: string, dto: UpdateProductDto) {
    return this.dataSource.transaction(async (manager) => {
      const product = await manager.findOne(Product, {
        where: { id },
        relations: { specs: true },
      });

      if (!product) {
        throw new NotFoundException('商品不存在');
      }

      if (dto.name !== undefined) product.name = dto.name.trim();
      if (dto.coverImage !== undefined) product.coverImage = dto.coverImage;
      if (dto.isValid !== undefined) product.isValid = dto.isValid;

      if (dto.specs) {
        await manager.delete(ProductSpec, { productId: id });
        product.specs = dto.specs.map((spec, index) =>
          manager.create(ProductSpec, {
            productId: id,
            name: spec.name.trim(),
            image: spec.image,
            price: spec.price.toFixed(2),
            sortOrder: index,
          }),
        );
      }

      return manager.save(product);
    });
  }
}
