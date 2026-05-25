import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { MessageService } from 'primeng/api';
import { beforeEach, describe, expect, it } from 'vitest';

import { signal } from '@angular/core';
import { WebAuthService } from '../../../core/auth/web-auth.service';
import AdminRessourcesPage from './admin-ressources.page';
import type { ResourceDto } from '@kraak/contracts';

const mockRessources: ResourceDto[] = [
  {
    id: 'res-1',
    title: 'Guide de leadership',
    description: 'Un guide pratique sur le leadership.',
    resourceType: 'document',
    resourceTheme: 'training',
    resourceAudience: 'all',
    url: 'https://example.com/guide',
    filePath: null,
    status: 'published',
    publishedAt: '2025-01-01T00:00:00Z',
    programId: null,
    cohortId: null,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'res-2',
    title: 'Vidéo : gestion de projet agile',
    description: null,
    resourceType: 'video',
    resourceTheme: 'project_management',
    resourceAudience: 'organizations',
    url: 'https://example.com/video',
    filePath: null,
    status: 'draft',
    publishedAt: null,
    programId: null,
    cohortId: null,
    createdAt: '2025-02-01T00:00:00Z',
    updatedAt: '2025-02-01T00:00:00Z',
  },
];

const webAuthServiceMock = {
  currentSession: signal<null>(null),
  isAuthenticated: signal(false),
  isAdmin: signal(false),
  hasRole: () => false,
};

const resourcesClientMock = {
  list: async () => ({ data: mockRessources, total: mockRessources.length }),
  create: async () =>
    ({
      id: 'res-new',
      title: 'New',
      description: null,
      resourceType: 'link',
      resourceTheme: 'training',
      resourceAudience: 'all',
      url: null,
      filePath: null,
      status: 'draft',
      publishedAt: null,
      programId: null,
      cohortId: null,
      createdAt: '',
      updatedAt: '',
    }) as ResourceDto,
  update: async (id: string) => ({ ...mockRessources[0], id }),
  remove: async () => undefined,
};

describe('AdminRessourcesPage', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminRessourcesPage],
      providers: [
        provideRouter([]),
        MessageService,
        { provide: WebAuthService, useValue: webAuthServiceMock },
      ],
    }).compileComponents();
  });

  it('Given the admin ressources page When it is created Then the instance exists', () => {
    const fixture = TestBed.createComponent(AdminRessourcesPage);

    expect(fixture.componentInstance).toBeTruthy();
  });

  it('Given the admin ressources page When it renders Then it shows the page heading', async () => {
    const fixture = TestBed.createComponent(AdminRessourcesPage);
    fixture.componentInstance.resourcesClient = resourcesClientMock;
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const content = fixture.nativeElement.textContent as string;

    expect(content).toContain('Ressources');
    expect(content).toContain('Nouvelle ressource');
    expect(content).toContain('Administration');
  });

  it('Given ressources are loaded When the list is displayed Then it shows the resource titles', async () => {
    const fixture = TestBed.createComponent(AdminRessourcesPage);
    fixture.componentInstance.resourcesClient = resourcesClientMock;
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const content = fixture.nativeElement.textContent as string;

    expect(content).toContain('Guide de leadership');
    expect(content).toContain('Vidéo : gestion de projet agile');
  });

  it('Given no ressources exist When the list renders Then it shows the empty state', async () => {
    const fixture = TestBed.createComponent(AdminRessourcesPage);
    fixture.componentInstance.resourcesClient = {
      ...resourcesClientMock,
      list: async () => ({ data: [], total: 0 }),
    };
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const content = fixture.nativeElement.textContent as string;

    expect(content).toContain('Aucune ressource pour le moment');
  });

  it('Given the create button is clicked When the form opens Then it shows the create form', async () => {
    const fixture = TestBed.createComponent(AdminRessourcesPage);
    fixture.componentInstance.resourcesClient = resourcesClientMock;
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    fixture.componentInstance.openCreateForm();
    fixture.detectChanges();

    const content = fixture.nativeElement.textContent as string;

    expect(content).toContain('Nouvelle ressource');
    expect(content).toContain('Titre');
    expect(content).toContain('Type');
    expect(content).toContain('Annuler');
  });

  it('Given an existing ressource When openEditForm is called Then the form is prefilled', async () => {
    const fixture = TestBed.createComponent(AdminRessourcesPage);
    fixture.componentInstance.resourcesClient = resourcesClientMock;
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    fixture.componentInstance.openEditForm(mockRessources[0]);
    fixture.detectChanges();

    expect(fixture.componentInstance['form'].controls.title.value).toBe(
      'Guide de leadership',
    );
    expect(fixture.componentInstance['form'].controls.resourceType.value).toBe(
      'document',
    );
  });

  it('Given the form is open When cancelForm is called Then the form is hidden', async () => {
    const fixture = TestBed.createComponent(AdminRessourcesPage);
    fixture.componentInstance.resourcesClient = resourcesClientMock;
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    fixture.componentInstance.openCreateForm();
    fixture.detectChanges();

    fixture.componentInstance.cancelForm();
    fixture.detectChanges();

    expect(fixture.componentInstance['showForm']()).toBe(false);
  });
});
