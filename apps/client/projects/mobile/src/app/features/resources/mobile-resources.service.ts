import { Injectable, inject } from '@angular/core';
import type {
  ResourceAudienceValue,
  ResourceDto,
  ResourceThemeValue,
} from '@kraak/contracts';
import { environment } from '../../../environments/environment';
import { MobileAuthService } from '../auth/mobile-auth.service';

export interface ResourceListFilters {
  resourceTheme?: ResourceThemeValue;
  resourceAudience?: ResourceAudienceValue;
  page?: number;
  limit?: number;
}

export interface ResourceListResponse {
  data: ResourceDto[];
  total: number;
}

@Injectable({
  providedIn: 'root',
})
export class MobileResourcesService {
  private readonly authService = inject(MobileAuthService);

  async listResources(
    filters?: ResourceListFilters,
  ): Promise<ResourceListResponse> {
    const queryParams = new URLSearchParams();

    if (filters?.resourceTheme) {
      queryParams.set('resourceTheme', filters.resourceTheme);
    }

    if (filters?.resourceAudience) {
      queryParams.set('resourceAudience', filters.resourceAudience);
    }

    if (typeof filters?.page === 'number') {
      queryParams.set('page', String(filters.page));
    }

    if (typeof filters?.limit === 'number') {
      queryParams.set('limit', String(filters.limit));
    }

    const queryString = queryParams.toString();
    const path =
      queryString.length > 0 ? `/resources?${queryString}` : '/resources';

    return this.request<ResourceListResponse>(path);
  }

  async getResourceById(resourceId: string): Promise<ResourceDto> {
    return this.request<ResourceDto>(`/resources/${resourceId}`);
  }

  private async request<T>(path: string): Promise<T> {
    const authToken = this.authService.currentSession()?.accessToken ?? null;

    const response = await fetch(`${environment.apiBaseUrl}${path}`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      },
    });

    if (!response.ok) {
      let responseMessage = '';
      try {
        const errorBody = (await response.json()) as { message?: string };
        responseMessage = errorBody.message?.trim() ?? '';
      } catch (error) {
        void error;
      }

      if (responseMessage.length > 0) {
        throw new Error(responseMessage);
      }

      throw new Error(`Erreur API (${response.status})`);
    }

    return response.json() as Promise<T>;
  }
}
