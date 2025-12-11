import {
  Controller,
  Post,
  Get,
  Delete,
  Put,
  Param,
  Body,
  Query,
  BadRequestException,
  UseGuards,
} from '@nestjs/common';
import { ArticleService } from './articles.service';
import { Article } from './articles.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

export interface CreateArticleDto {
  title: string;
  excerpt?: string;
  content: string;
  thumbnail_url?: string;
  author_id: number;
  status?: string;
}

export interface UpdateArticleDto {
  title?: string;
  excerpt?: string;
  content?: string;
  thumbnail_url?: string;
  status?: string;
}

@Controller('api/articles')
export class ArticleController {
  constructor(private readonly articleService: ArticleService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async createArticle(
    @Body() createArticleDto: CreateArticleDto,
  ): Promise<Article> {
    return await this.articleService.createArticle(createArticleDto);
  }

  @Get()
  async getAllArticles(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('status') status?: string,
  ) {
    return await this.articleService.getAllArticles(page, limit, status);
  }

  @Get(':id')
  async getArticleById(@Param('id') id: string): Promise<Article> {
    return await this.articleService.getArticleById(id);
  }

  @Get('slug/:slug')
  async getArticleBySlug(@Param('slug') slug: string): Promise<Article> {
    return await this.articleService.getArticleBySlug(slug);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  async updateArticle(
    @Param('id') id: string,
    @Body() updateArticleDto: UpdateArticleDto,
  ): Promise<Article> {
    return await this.articleService.updateArticle(id, updateArticleDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async deleteArticle(@Param('id') id: string): Promise<{ message: string }> {
    await this.articleService.deleteArticle(id);
    return { message: 'Article deleted successfully' };
  }
}
