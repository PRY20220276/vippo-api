export class PaginationResponseDto<T> {
  items: T[];

  total: number;

  page: number;

  limit: number;

  hasNext: boolean;

  hasPrev: boolean;

  constructor(items: T[], total: number, page: number, limit: number) {
    this.items = items;
    this.total = total;
    this.page = page;
    this.limit = limit;
    this.hasNext = page * limit < total;
    this.hasPrev = page > 1;
  }

  get totalPages(): number {
    return Math.ceil(this.total / this.limit);
  }
}
