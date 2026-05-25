import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { MessageService } from 'primeng/api';

import { signal } from '@angular/core';
import { WebAuthService } from '../../../core/auth/web-auth.service';
import AdminProgrammesPage from './admin-programmes.page';
import type { ProgramDto } from '@kraak/contracts';

const mockProgrammes: ProgramDto[] = [
  {
    id: 'prog-1',
    slug: 'formation-leadership',
    title: 'Formation Leadership',
    summary: 'Un programme de formation au leadership.',
    description: 'Description complète du programme de formation.',
    status: 'published',
    visibility: 'public',
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'prog-2',
    slug: 'gestion-projet',
    title: 'Gestion de Projet',
    summary: 'Maîtriser les fondamentaux de la gestion de projet.',
    description: 'Description complète du programme de gestion de projet.',
    status: 'draft',
    visibility: 'private',
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

const programsClientMock = {
  list: async () => mockProgrammes,
  create: async () =>
    ({
      id: 'prog-new',
      slug: 'new',
      title: 'New',
      summary: '',
      description: '',
      status: 'draft',
      visibility: 'private',
      createdAt: '',
      updatedAt: '',
    }) as ProgramDto,
  update: async (id: string) => ({ ...mockProgrammes[0], id }) as ProgramDto,
  remove: async () => undefined,
};

describe('AdminProgrammesPage', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminProgrammesPage],
      providers: [
        provideRouter([]),
        MessageService,
        { provide: WebAuthService, useValue: webAuthServiceMock },
      ],
    }).compileComponents();
  });

  it('Given the admin programmes page When it is created Then the instance exists', () => {
    const fixture = TestBed.createComponent(AdminProgrammesPage);

    expect(fixture.componentInstance).toBeTruthy();
  });

  it('Given the admin programmes page When it renders Then it shows the page heading', async () => {
    const fixture = TestBed.createComponent(AdminProgrammesPage);
    fixture.componentInstance.programsClient = programsClientMock;
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const content = fixture.nativeElement.textContent as string;

    expect(content).toContain('Programmes');
    expect(content).toContain('Nouveau programme');
    expect(content).toContain('Administration');
  });

  it('Given programmes are loaded When the list is displayed Then it shows the programme titles', async () => {
    const fixture = TestBed.createComponent(AdminProgrammesPage);
    fixture.componentInstance.programsClient = programsClientMock;
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const content = fixture.nativeElement.textContent as string;

    expect(content).toContain('Formation Leadership');
    expect(content).toContain('Gestion de Projet');
  });

  it('Given no programmes exist When the list renders Then it shows the empty state', async () => {
    const fixture = TestBed.createComponent(AdminProgrammesPage);
    fixture.componentInstance.programsClient = {
      ...programsClientMock,
      list: async () => [],
    };
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const content = fixture.nativeElement.textContent as string;

    expect(content).toContain('Aucun programme pour le moment');
  });

  it('Given the create button is clicked When the form opens Then it shows the create form', async () => {
    const fixture = TestBed.createComponent(AdminProgrammesPage);
    fixture.componentInstance.programsClient = programsClientMock;
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    fixture.componentInstance.openCreateForm();
    fixture.detectChanges();

    const content = fixture.nativeElement.textContent as string;

    expect(content).toContain('Nouveau programme');
    expect(content).toContain('Slug');
    expect(content).toContain('Titre');
    expect(content).toContain('Annuler');
  });

  it('Given an existing programme When openEditForm is called Then the form is prefilled', async () => {
    const fixture = TestBed.createComponent(AdminProgrammesPage);
    fixture.componentInstance.programsClient = programsClientMock;
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    fixture.componentInstance.openEditForm(mockProgrammes[0]);
    fixture.detectChanges();

    expect(fixture.componentInstance['form'].controls.title.value).toBe(
      'Formation Leadership',
    );
    expect(fixture.componentInstance['form'].controls.slug.value).toBe(
      'formation-leadership',
    );
  });

  it('Given the form is open When cancelForm is called Then the form is hidden', async () => {
    const fixture = TestBed.createComponent(AdminProgrammesPage);
    fixture.componentInstance.programsClient = programsClientMock;
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
