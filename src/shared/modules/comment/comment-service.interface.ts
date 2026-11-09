import type {DocumentType} from '@typegoose/typegoose';
import type {CommentEntity} from './comment.entity.js';
import type {CreateCommentDto} from './dto/create-comment.dto.js';

export interface CommentService {
  create(dto: CreateCommentDto): Promise<DocumentType<CommentEntity>>;

  findByOfferId(offerId: string): Promise<DocumentType<CommentEntity>[]>;

  deleteByOfferId(offerId: string): Promise<number>;
}
