export interface UserPayload {
  id: string;
  email: string;
  role: string;
  companyId?: string;
}

export interface RequestWithUser extends Request {
  user: UserPayload;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  meta?: PaginationMeta;
}

export interface FileUpload {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  buffer: Buffer;
  size: number;
}

export interface CompanyContext {
  id: string;
  name: string;
  registrationCode: string;
  subscriptionStatus?: string;
  settings?: {
    latenessToleranceMinutes: number;
    overtimeRateWeekday: number;
    overtimeRateWeekend: number;
    allowWfh: boolean;
    wfhClockInNeedsLocation: boolean;
  };
}

export interface CacheConfig {
  ttl: number;
  key: string;
}
