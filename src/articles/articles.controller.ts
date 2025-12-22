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
import { ArticleEn } from './articles-en.entity';
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

@Controller('/articles')
export class ArticleController {
  constructor(private readonly articleService: ArticleService) {}

  // Vietnamese articles endpoints
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

  // English articles endpoints
  @Post('en')
  @UseGuards(JwtAuthGuard)
  async createArticleEn(
    @Body() createArticleDto: CreateArticleDto,
  ): Promise<ArticleEn> {
    return await this.articleService.createArticleEn(createArticleDto);
  }

  @Get('en/all')
  async getAllArticlesEn(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('status') status?: string,
  ) {
    return await this.articleService.getAllArticlesEn(page, limit, status);
  }

  @Get('en/:id')
  async getArticleEnById(@Param('id') id: string): Promise<ArticleEn> {
    return await this.articleService.getArticleEnById(id);
  }

  @Get('en/slug/:slug')
  async getArticleEnBySlug(@Param('slug') slug: string): Promise<ArticleEn> {
    return await this.articleService.getArticleEnBySlug(slug);
  }

  @Put('en/:id')
  @UseGuards(JwtAuthGuard)
  async updateArticleEn(
    @Param('id') id: string,
    @Body() updateArticleDto: UpdateArticleDto,
  ): Promise<ArticleEn> {
    return await this.articleService.updateArticleEn(id, updateArticleDto);
  }

  @Delete('en/:id')
  @UseGuards(JwtAuthGuard)
  async deleteArticleEn(@Param('id') id: string): Promise<{ message: string }> {
    await this.articleService.deleteArticleEn(id);
    return { message: 'Article deleted successfully' };
  }
}
