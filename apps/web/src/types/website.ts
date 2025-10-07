export interface Website {
  id: string;
  url: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  userId: string;
}

export interface WebsiteStatus {
  id: string;
  websiteId: string;
  status: 'UP' | 'DOWN';
  responseTime: number;
  statusCode?: number;
  checkedAt: string;
  region: string;
}

export interface WebsiteStatusTick {
  id: string;
  website_id: string;
  status: 'UP' | 'DOWN' | 'Unknown';
  response_time_ms: number;
  createdAt: string;
  region: {
    id?: string;
    name: string;
  };
}

export interface WebsiteWithStatus extends Website {
  currentStatus?: WebsiteStatus;
  uptime?: number;
  avgResponseTime?: number;
}

export interface AddWebsiteData {
  url: string;
  isActive?: boolean;
}

export interface DashboardStats {
  totalWebsites: number;
  uptime: number;
  avgResponseTime: number;
  incidents: number;
}

export interface DashboardData {
  stats: DashboardStats;
  websites: WebsiteWithStatus[];
  recentActivity: ActivityItem[];
}

export interface WebsiteHistoryPagination {
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

export interface WebsiteHistoryApiResponse {
  data: WebsiteStatusTick[];
  pagination: WebsiteHistoryPagination;
  history?: WebsiteStatusTick[];
}

export interface WebsiteHistoryResponse {
  data: WebsiteStatusTick[];
  history: WebsiteStatusTick[];
  pagination: WebsiteHistoryPagination;
}

export interface ActivityItem {
  id: string;
  type: 'STATUS_CHANGE' | 'WEBSITE_ADDED' | 'WEBSITE_REMOVED';
  websiteId: string;
  websiteUrl: string;
  message: string;
  timestamp: string;
  status?: 'UP' | 'DOWN';
}
