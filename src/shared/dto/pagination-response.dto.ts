import { Expose } from 'class-transformer';

export class PaginationResponseDto<T> {
  items: T[];

  page: number;

  limit: number;

  hasNext: boolean;

  hasPrev: boolean;

  totalItems: number;

  constructor(items: T[], total: number, page: number, limit: number) {
    this.items = items;
    this.totalItems = total;
    this.page = page;
    this.limit = limit;
    this.hasNext = page * limit < total;
    this.hasPrev = page > 1;
  }

  @Expose()
  get totalPages(): number {
    return Math.ceil(this.totalItems / this.limit);
  }
}
