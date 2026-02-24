import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReviewsModule } from './reviews/reviews.module';
import { ExternalReview } from './reviews/entities/external-review.entity';
import { ReviewInsight } from './reviews/entities/review-insight.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      username: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_NAME || 'chatwoot',
      entities: [ExternalReview, ReviewInsight],
      synchronize: process.env.NODE_ENV !== 'production', // Auto-create tables in dev
      logging: false,
    }),
    ReviewsModule,
  ],
})
export class AppModule {}
