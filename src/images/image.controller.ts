import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  UseInterceptors,
  UploadedFile,
  Query,
  Res,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { ImageService } from './image.service';
import { Image } from './image.entity';

@Controller('api/images')
export class ImageController {
  constructor(private readonly imageService: ImageService) {}

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('image', {
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
      },
      fileFilter: (req, file, cb) => {
        const allowedMimeTypes = [
          'image/jpeg',
          'image/png',
          'image/gif',
          'image/webp',
        ];
        if (allowedMimeTypes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new BadRequestException('Invalid file type'), false);
        }
      },
    }),
  )
  async uploadImage(@UploadedFile() file: Express.Multer.File): Promise<Image> {
    return await this.imageService.uploadImage(file);
  }

  @Get()
  async getAllImages(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    return await this.imageService.getAllImages(page, limit);
  }

  @Get(':filename')
  async getImage(
    @Param('filename') filename: string,
    @Res() res: Response,
  ): Promise<void> {
    try {
      const image = await this.imageService.getImageByFilename(filename);
      const imageStream = this.imageService.getImageStream(filename);

      res.set({
        'Content-Type': image.mime_type,
        'Content-Length': image.size.toString(),
        'Cache-Control': 'public, max-age=31536000', // Cache for 1 year
      });

      imageStream.pipe(res);
    } catch (error) {
      res.status(404).json({ message: 'Image not found' });
    }
  }

  @Get('info/:id')
  async getImageInfo(@Param('id') id: string): Promise<Image> {
    return await this.imageService.getImageById(id);
  }

  @Delete(':id')
  async deleteImage(@Param('id') id: string): Promise<{ message: string }> {
    await this.imageService.deleteImage(id);
    return { message: 'Image deleted successfully' };
  }
}
