// apps\client\projects\web\src\app\features\contact\contact.service.ts

import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import type { ContactFormDto } from '@kraak/contracts';

import { resolveApiBaseUrl } from '../../core/runtime/runtime-config';
import { environment } from '../../../environments/environment';

export type ContactPayload = ContactFormDto;

export interface ContactResponse {
  success: boolean;
  message: string;
}

@Injectable({ providedIn: 'root' })
export class ContactService {
  private readonly http = inject(HttpClient);
  private readonly endpoint = `${resolveApiBaseUrl(environment.apiBaseUrl)}/contact`;

  submit(payload: ContactPayload): Observable<ContactResponse> {
    return this.http.post<ContactResponse>(this.endpoint, payload);
  }
}
