import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ContactFormDto } from '@kraak/contracts';
import { MobileAuthService } from '../../features/auth/mobile-auth.service';
import { MobileSupportService } from './mobile-support.service';

const contactClientMock = { submit: vi.fn() };

vi.mock('@kraak/api-client', () => ({
  createApiClient: vi.fn(() => ({
    contact: contactClientMock,
  })),
}));

describe('MobileSupportService', () => {
  const authServiceMock = {
    currentSession: vi.fn(() => ({ accessToken: 'test-token' })),
  };

  beforeEach(() => {
    contactClientMock.submit.mockReset();

    TestBed.configureTestingModule({
      providers: [
        MobileSupportService,
        { provide: MobileAuthService, useValue: authServiceMock },
      ],
    });
  });

  it('should be created', () => {
    const service = TestBed.inject(MobileSupportService);
    expect(service).toBeTruthy();
  });

  it('Given a valid contact form payload, when submitContactForm is called, then it delegates to the contact client', async () => {
    const service = TestBed.inject(MobileSupportService);
    const payload: ContactFormDto = {
      name: 'Alice Dupont',
      email: 'alice@kraak.org',
      subject: 'Problème de connexion',
      message: 'Je ne parviens pas à accéder à mon espace participant.',
      category: 'technical',
    };

    contactClientMock.submit.mockResolvedValue({
      success: true,
      message: 'Votre demande a bien été reçue.',
    });

    const result = await service.submitContactForm(payload);

    expect(contactClientMock.submit).toHaveBeenCalledWith(payload);
    expect(result.success).toBe(true);
  });

  it('Given a failing API call, when submitContactForm is called, then it propagates the error', async () => {
    const service = TestBed.inject(MobileSupportService);
    const payload: ContactFormDto = {
      name: 'Bob Martin',
      email: 'bob@kraak.org',
      subject: 'Question programme',
      message: 'Quand commence la prochaine session de formation ?',
      category: 'program',
    };

    contactClientMock.submit.mockRejectedValue(new Error('Network error'));

    await expect(service.submitContactForm(payload)).rejects.toThrow(
      'Network error',
    );
  });
});
