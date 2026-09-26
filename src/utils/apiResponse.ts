export interface ApiResponseMeta {
  page?: number;
  limit?: number;
  total?: number;
  totalPages?: number;
  [key: string]: any;
}

export class ApiResponse<T = any> {
  public readonly success: boolean = true;
  public readonly message: string;
  public readonly data: T;
  public readonly meta?: ApiResponseMeta;
  public readonly timestamp: string;

  constructor(message: string, data: T, meta?: ApiResponseMeta) {
    this.message = message;
    this.data = data;
    if (meta) {
      this.meta = meta;
    }
    this.timestamp = new Date().toISOString();
  }

  static success<T>(message: string, data: T, meta?: ApiResponseMeta): ApiResponse<T> {
    return new ApiResponse(message, data, meta);
  }
}
