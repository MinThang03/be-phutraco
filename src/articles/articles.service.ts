import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Article } from './articles.entity';
import { ArticleEn } from './articles-en.entity';
import { CreateArticleDto, UpdateArticleDto } from './articles.controller';

@Injectable()
export class ArticleService {
  constructor(
    @InjectRepository(Article)
    private readonly articleRepository: Repository<Article>,
    @InjectRepository(ArticleEn)
    private readonly articleEnRepository: Repository<ArticleEn>,
  ) {}

  private generateSlug(title: string): string {
    // Chuyển đổi tiếng Việt không dấu
    const vietnamese = {
      à: 'a',
      á: 'a',
      ạ: 'a',
      ả: 'a',
      ã: 'a',
      â: 'a',
      ầ: 'a',
      ấ: 'a',
      ậ: 'a',
      ẩ: 'a',
      ẫ: 'a',
      ă: 'a',
      ằ: 'a',
      ắ: 'a',
      ặ: 'a',
      ẳ: 'a',
      ẵ: 'a',
      è: 'e',
      é: 'e',
      ẹ: 'e',
      ẻ: 'e',
      ẽ: 'e',
      ê: 'e',
      ề: 'e',
      ế: 'e',
      ệ: 'e',
      ể: 'e',
      ễ: 'e',
      ì: 'i',
      í: 'i',
      ị: 'i',
      ỉ: 'i',
      ĩ: 'i',
      ò: 'o',
      ó: 'o',
      ọ: 'o',
      ỏ: 'o',
      õ: 'o',
      ô: 'o',
      ồ: 'o',
      ố: 'o',
      ộ: 'o',
      ổ: 'o',
      ỗ: 'o',
      ơ: 'o',
      ờ: 'o',
      ớ: 'o',
      ợ: 'o',
      ở: 'o',
      ỡ: 'o',
      ù: 'u',
      ú: 'u',
      ụ: 'u',
      ủ: 'u',
      ũ: 'u',
      ư: 'u',
      ừ: 'u',
      ứ: 'u',
      ự: 'u',
      ử: 'u',
      ữ: 'u',
      ỳ: 'y',
      ý: 'y',
      ỵ: 'y',
      ỷ: 'y',
      ỹ: 'y',
      đ: 'd',
      À: 'A',
      Á: 'A',
      Ạ: 'A',
      Ả: 'A',
      Ã: 'A',
      Â: 'A',
      Ầ: 'A',
      Ấ: 'A',
      Ậ: 'A',
      Ẩ: 'A',
      Ẫ: 'A',
      Ă: 'A',
      Ằ: 'A',
      Ắ: 'A',
      Ặ: 'A',
      Ẳ: 'A',
      Ẵ: 'A',
      È: 'E',
      É: 'E',
      Ẹ: 'E',
      Ẻ: 'E',
      Ẽ: 'E',
      Ê: 'E',
      Ề: 'E',
      Ế: 'E',
      Ệ: 'E',
      Ể: 'E',
      Ễ: 'E',
      Ì: 'I',
      Í: 'I',
      Ị: 'I',
      Ỉ: 'I',
      Ĩ: 'I',
      Ò: 'O',
      Ó: 'O',
      Ọ: 'O',
      Ỏ: 'O',
      Õ: 'O',
      Ô: 'O',
      Ồ: 'O',
      Ố: 'O',
      Ộ: 'O',
      Ổ: 'O',
      Ỗ: 'O',
      Ơ: 'O',
      Ờ: 'O',
      Ớ: 'O',
      Ợ: 'O',
      Ở: 'O',
      Ỡ: 'O',
      Ù: 'U',
      Ú: 'U',
      Ụ: 'U',
      Ủ: 'U',
      Ũ: 'U',
      Ư: 'U',
      Ừ: 'U',
      Ứ: 'U',
      Ự: 'U',
      Ử: 'U',
      Ữ: 'U',
      Ỳ: 'Y',
      Ý: 'Y',
      Ỵ: 'Y',
      Ỷ: 'Y',
      Ỹ: 'Y',
      Đ: 'D',
    };

    let result = title.toLowerCase();

    // Thay thế các ký tự tiếng Việt
    for (const [vietnamese_char, latin_char] of Object.entries(vietnamese)) {
      result = result.replace(new RegExp(vietnamese_char, 'g'), latin_char);
    }

    return result
      .replace(/[^a-z0-9 -]/g, '') // Remove remaining special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
      .trim() // Remove leading/trailing whitespace
      .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
  }

  async createArticle(createArticleDto: CreateArticleDto): Promise<Article> {
    const {
      title,
      excerpt,
      content,
      thumbnail_url,
      author_id,
      status = 'draft',
    } = createArticleDto;

    let slug = this.generateSlug(title);

    // Ensure slug is unique
    let counter = 1;
    const baseSlug = slug;
    while (await this.articleRepository.findOne({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    const article = this.articleRepository.create({
      title,
      slug,
      excerpt,
      content,
      thumbnail_url,
      author_id,
      status,
    });

    return await this.articleRepository.save(article);
  }

  async getArticleById(id: string): Promise<Article> {
    const article = await this.articleRepository.findOne({ where: { id } });
    if (!article) {
      throw new NotFoundException('Article not found');
    }
    return article;
  }

  async getArticleBySlug(slug: string): Promise<Article> {
    const article = await this.articleRepository.findOne({ where: { slug } });
    if (!article) {
      throw new NotFoundException('Article not found');
    }
    return article;
  }

  async getAllArticles(
    page: number = 1,
    limit: number = 10,
    status?: string,
  ): Promise<{ data: Article[]; total: number; page: number; limit: number }> {
    const queryBuilder = this.articleRepository.createQueryBuilder('article');

    if (status) {
      queryBuilder.where('article.status = :status', { status });
    }

    const [data, total] = await queryBuilder
      .orderBy('article.created_at', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
    };
  }

  async updateArticle(
    id: string,
    updateArticleDto: UpdateArticleDto,
  ): Promise<Article> {
    const article = await this.getArticleById(id);

    if (updateArticleDto.title && updateArticleDto.title !== article.title) {
      let slug = this.generateSlug(updateArticleDto.title);

      // Ensure slug is unique (excluding current article)
      let counter = 1;
      const baseSlug = slug;
      while (
        await this.articleRepository.findOne({
          where: { slug },
          // Exclude current article from uniqueness check
        })
      ) {
        const existingArticle = await this.articleRepository.findOne({
          where: { slug },
        });
        if (existingArticle && existingArticle.id !== id) {
          slug = `${baseSlug}-${counter}`;
          counter++;
        } else {
          break;
        }
      }

      article.slug = slug;
    }

    Object.assign(article, updateArticleDto);
    return await this.articleRepository.save(article);
  }

  async deleteArticle(id: string): Promise<void> {
    const article = await this.getArticleById(id);
    await this.articleRepository.delete(id);
  }

  // English articles methods
  async createArticleEn(createArticleDto: CreateArticleDto): Promise<ArticleEn> {
    const {
      title,
      excerpt,
      content,
      thumbnail_url,
      author_id,
      status = 'draft',
    } = createArticleDto;

    let slug = this.generateSlug(title);

    // Ensure slug is unique
    let counter = 1;
    const baseSlug = slug;
    while (await this.articleEnRepository.findOne({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    const article = this.articleEnRepository.create({
      title,
      slug,
      excerpt,
      content,
      thumbnail_url,
      author_id,
      status,
    });

    return await this.articleEnRepository.save(article);
  }

  async getArticleEnById(id: string): Promise<ArticleEn> {
    const article = await this.articleEnRepository.findOne({ where: { id } });
    if (!article) {
      throw new NotFoundException('Article not found');
    }
    return article;
  }

  async getArticleEnBySlug(slug: string): Promise<ArticleEn> {
    const article = await this.articleEnRepository.findOne({ where: { slug } });
    if (!article) {
      throw new NotFoundException('Article not found');
    }
    return article;
  }

  async getAllArticlesEn(
    page: number = 1,
    limit: number = 10,
    status?: string,
  ): Promise<{ data: ArticleEn[]; total: number; page: number; limit: number }> {
    const queryBuilder = this.articleEnRepository.createQueryBuilder('article');

    if (status) {
      queryBuilder.where('article.status = :status', { status });
    }

    const [data, total] = await queryBuilder
      .orderBy('article.created_at', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
    };
  }

  async updateArticleEn(
    id: string,
    updateArticleDto: UpdateArticleDto,
  ): Promise<ArticleEn> {
    const article = await this.getArticleEnById(id);

    if (updateArticleDto.title && updateArticleDto.title !== article.title) {
      let slug = this.generateSlug(updateArticleDto.title);

      // Ensure slug is unique (excluding current article)
      let counter = 1;
      const baseSlug = slug;
      while (
        await this.articleEnRepository.findOne({
          where: { slug },
        })
      ) {
        const existingArticle = await this.articleEnRepository.findOne({
          where: { slug },
        });
        if (existingArticle && existingArticle.id !== id) {
          slug = `${baseSlug}-${counter}`;
          counter++;
        } else {
          break;
        }
      }

      article.slug = slug;
    }

    Object.assign(article, updateArticleDto);
    return await this.articleEnRepository.save(article);
  }

  async deleteArticleEn(id: string): Promise<void> {
    const article = await this.getArticleEnById(id);
    await this.articleEnRepository.delete(id);
  }
}
