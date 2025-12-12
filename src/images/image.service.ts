import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Image } from './image.entity';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class ImageService {
  private readonly uploadPath = './uploads';

  constructor(
    @InjectRepository(Image)
    private readonly imageRepository: Repository<Image>,
  ) {
    // Ensure upload directory exists
    if (!fs.existsSync(this.uploadPath)) {
      fs.mkdirSync(this.uploadPath, { recursive: true });
    }
  }

  async uploadImage(file: Express.Multer.File): Promise<Image> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    // Validate file type
    const allowedMimeTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
    ];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        'Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.',
      );
    }

    // Generate unique filename
    const fileExtension = path.extname(file.originalname);
    const filename = `${uuidv4()}${fileExtension}`;
    const filePath = path.join(this.uploadPath, filename);

    try {
      // Save file to disk
      fs.writeFileSync(filePath, file.buffer);

      // Create image record in database
      const image = this.imageRepository.create({
        filename,
        original_name: file.originalname,
        mime_type: file.mimetype,
        size: file.size,
        path: filePath,
        url: `/images/${filename}`,
      });

      return await this.imageRepository.save(image);
    } catch (error) {
      // Clean up file if database save fails
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      throw new BadRequestException('Failed to upload image');
    }
  }

  async getImageById(id: string): Promise<Image> {
    const image = await this.imageRepository.findOne({ where: { id } });
    if (!image) {
      throw new NotFoundException('Image not found');
    }
    return image;
  }

  async getImageByFilename(filename: string): Promise<Image> {
    const image = await this.imageRepository.findOne({ where: { filename } });
    if (!image) {
      throw new NotFoundException('Image not found');
    }
    return image;
  }

  async getAllImages(
    page: number = 1,
    limit: number = 10,
  ): Promise<{ data: Image[]; total: number; page: number; limit: number }> {
    const [data, total] = await this.imageRepository.findAndCount({
      order: { created_at: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data,
      total,
      page,
      limit,
    };
  }

  async deleteImage(id: string): Promise<void> {
    const image = await this.getImageById(id);

    try {
      // Delete file from disk
      if (fs.existsSync(image.path)) {
        fs.unlinkSync(image.path);
      }

      // Delete record from database
      await this.imageRepository.delete(id);
    } catch (error) {
      throw new BadRequestException('Failed to delete image');
    }
  }

  getImageStream(filename: string): fs.ReadStream {
    const filePath = path.join(this.uploadPath, filename);

    if (!fs.existsSync(filePath)) {
      throw new NotFoundException('Image file not found');
    }

    return fs.createReadStream(filePath);
  }
}
