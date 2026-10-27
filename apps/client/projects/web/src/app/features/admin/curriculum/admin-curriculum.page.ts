import { Component, OnInit, computed, inject, signal } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { RouterLink } from '@angular/router';
import { createApiClient, type ApiClient } from '@kraak/api-client';
import type {
  CourseDto,
  CreateCourseDto,
  ProgramCourseDto,
  ProgramDto,
} from '@kraak/contracts';
import { PublicationStatus } from '@kraak/contracts';
import { ButtonDirective } from 'primeng/button';
import { Message } from 'primeng/message';

import { environment } from '../../../../environments/environment';
import { WebAuthService } from '../../../core/auth/web-auth.service';
import { resolveApiBaseUrl } from '../../../core/runtime/runtime-config';
import {
  createPublicationControls,
  type PublicationFormModel,
} from '../publication-form.utils';

import {
  KraakI18nService,
  KraakTranslatePipe,
} from '../../../../../../shared/i18n';
interface PlacementFormModel {
  courseId: FormControl<string>;
  sortOrder: FormControl<number>;
  isRequired: FormControl<boolean>;
}

@Component({
  selector: 'kraak-admin-curriculum-page',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    ButtonDirective,
    Message,
    KraakTranslatePipe,
  ],
  templateUrl: './admin-curriculum.page.html',
})
export default class AdminCurriculumPage implements OnInit {
  private readonly authService = inject(WebAuthService);
  private placementsLoadSequence = 0;

  private readonly i18n = inject(KraakI18nService);
  private readonly apiClient = createApiClient({
    getLocale: () => this.i18n.locale(),
    baseUrl: resolveApiBaseUrl(environment.apiBaseUrl),
    getAuthToken: () => this.authService.currentSession()?.accessToken ?? null,
  });

  programsClient: Pick<ApiClient['programs'], 'list'> = this.apiClient.programs;
  coursesClient: Pick<
    ApiClient['courses'],
    'list' | 'create' | 'update' | 'remove'
  > = this.apiClient.courses;
  programCoursesClient: Pick<
    ApiClient['programCourses'],
    'list' | 'create' | 'remove'
  > = this.apiClient.programCourses;

  protected readonly programs = signal<ProgramDto[]>([]);
  protected readonly courses = signal<CourseDto[]>([]);
  protected readonly placements = signal<ProgramCourseDto[]>([]);
  protected readonly selectedProgramId = signal<string | null>(null);

  protected readonly loading = signal(true);
  protected readonly placementsLoading = signal(false);
  protected readonly placementsReady = signal(false);
  protected readonly submittingCourse = signal(false);
  protected readonly attachingCourse = signal(false);
  protected readonly showCourseForm = signal(false);
  protected readonly editingCourseId = signal<string | null>(null);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly successMessage = signal<string | null>(null);

  protected readonly isEditingCourse = computed(
    () => this.editingCourseId() !== null,
  );

  protected readonly selectedProgram = computed(() => {
    const id = this.selectedProgramId();
    return this.programs().find((program) => program.id === id) ?? null;
  });

  protected readonly availableCourses = computed(() => {
    const assignedIds = new Set(
      this.placements().map((placement) => placement.courseId),
    );

    return this.courses().filter(
      (course) => course.status !== 'archived' && !assignedIds.has(course.id),
    );
  });

  protected getPublicationStatusLabel(status: string): string {
    const key = `web.admin.curriculum.statuses.${status}`;
    const translated = this.i18n.translate(key);

    return translated === key ? status : translated;
  }

  protected getProgramVisibilityLabel(visibility: string): string {
    const key = `web.admin.curriculum.visibilities.${visibility}`;
    const translated = this.i18n.translate(key);

    return translated === key ? visibility : translated;
  }

  protected getEditCourseAriaLabel(course: { title: string }): string {
    return this.i18n.translate('web.admin.curriculum.actions.editCourseAria', {
      title: course.title,
    });
  }

  protected getArchiveCourseAriaLabel(course: { title: string }): string {
    return this.i18n.translate(
      'web.admin.curriculum.actions.archiveCourseAria',
      {
        title: course.title,
      },
    );
  }

  readonly publicationStatuses = Object.values(PublicationStatus);

  readonly courseForm = new FormGroup<PublicationFormModel>(
    createPublicationControls(),
  );

  readonly placementForm = new FormGroup<PlacementFormModel>({
    courseId: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    sortOrder: new FormControl(0, {
      nonNullable: true,
      validators: [Validators.required, Validators.min(0)],
    }),
    isRequired: new FormControl(true, {
      nonNullable: true,
    }),
  });

  ngOnInit(): void {
    void this.loadInitialData();
  }

  async loadInitialData(): Promise<void> {
    this.loading.set(true);
    this.errorMessage.set(null);

    try {
      const [programs, courses] = await Promise.all([
        this.programsClient.list(),
        this.coursesClient.list(),
      ]);

      this.programs.set(programs);
      this.courses.set(courses);

      const firstProgram = programs[0] ?? null;
      this.selectedProgramId.set(firstProgram?.id ?? null);

      if (firstProgram) {
        await this.loadPlacements(firstProgram.id);
      } else {
        this.placements.set([]);
      }
    } catch (error) {
      console.error(
        '[AdminCurriculumPage] Erreur lors du chargement du curriculum',
        error,
      );
      this.errorMessage.set(
        this.i18n.translate('web.admin.curriculum.feedback.loadFailure'),
      );
    } finally {
      this.loading.set(false);
    }
  }

  async selectProgram(programId: string): Promise<void> {
    if (programId === this.selectedProgramId() && this.placementsReady()) {
      return;
    }

    this.selectedProgramId.set(programId);
    this.successMessage.set(null);
    this.errorMessage.set(null);
    await this.loadPlacements(programId);
  }

  async loadPlacements(programId: string): Promise<void> {
    const loadSequence = ++this.placementsLoadSequence;

    this.placementsLoading.set(true);
    this.placementsReady.set(false);
    this.placements.set([]);
    this.resetPlacementForm();

    try {
      const placements = await this.programCoursesClient.list({ programId });

      if (loadSequence !== this.placementsLoadSequence) {
        return;
      }

      this.placements.set(placements);
      this.resetPlacementForm();
      this.placementsReady.set(true);
    } catch (error) {
      if (loadSequence !== this.placementsLoadSequence) {
        return;
      }

      console.error(
        '[AdminCurriculumPage] Erreur lors du chargement des cours du programme',
        error,
      );
      this.errorMessage.set(
        this.i18n.translate(
          'web.admin.curriculum.feedback.loadPlacementsFailure',
        ),
      );
    } finally {
      if (loadSequence === this.placementsLoadSequence) {
        this.placementsLoading.set(false);
      }
    }
  }

  protected courseById(courseId: string): CourseDto | null {
    return this.courses().find((course) => course.id === courseId) ?? null;
  }

  openCreateCourseForm(): void {
    this.editingCourseId.set(null);
    this.courseForm.reset({
      slug: '',
      title: '',
      summary: '',
      description: '',
      status: 'draft',
    });
    this.showCourseForm.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);
  }

  openEditCourseForm(course: CourseDto): void {
    this.editingCourseId.set(course.id);
    this.courseForm.reset({
      slug: course.slug,
      title: course.title,
      summary: course.summary,
      description: course.description,
      status: course.status,
    });
    this.showCourseForm.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);
  }

  cancelCourseForm(): void {
    this.showCourseForm.set(false);
    this.editingCourseId.set(null);
  }

  private buildCoursePayload(): CreateCourseDto {
    const values = this.courseForm.getRawValue();

    return {
      slug: values.slug,
      title: values.title,
      summary: values.summary,
      description: values.description,
      status: values.status as CreateCourseDto['status'],
    };
  }

  async submitCourse(): Promise<void> {
    this.courseForm.markAllAsTouched();
    if (this.courseForm.invalid) {
      return;
    }

    this.submittingCourse.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    try {
      const payload = this.buildCoursePayload();
      const editingId = this.editingCourseId();

      if (editingId === null) {
        const created = await this.coursesClient.create(payload);
        this.courses.update((courses) => [...courses, created]);
        this.successMessage.set(
          this.i18n.translate(
            'web.admin.curriculum.feedback.createCourseSuccess',
            {
              title: created.title,
            },
          ),
        );
      } else {
        const updated = await this.coursesClient.update(editingId, payload);
        this.courses.update((courses) =>
          courses.map((course) => (course.id === editingId ? updated : course)),
        );
        this.successMessage.set(
          this.i18n.translate(
            'web.admin.curriculum.feedback.updateCourseSuccess',
            {
              title: updated.title,
            },
          ),
        );
      }

      this.cancelCourseForm();
    } catch (error) {
      console.error(
        '[AdminCurriculumPage] Erreur lors de la sauvegarde du cours',
        error,
      );
      this.errorMessage.set(
        this.i18n.translate('web.admin.curriculum.feedback.saveCourseFailure'),
      );
    } finally {
      this.submittingCourse.set(false);
    }
  }

  async archiveCourse(course: CourseDto): Promise<void> {
    if (
      !confirm(
        this.i18n.translate(
          'web.admin.curriculum.feedback.archiveCourseConfirm',
          {
            title: course.title,
          },
        ),
      )
    ) {
      return;
    }

    this.errorMessage.set(null);
    this.successMessage.set(null);

    try {
      await this.coursesClient.remove(course.id);
      this.courses.update((courses) =>
        courses.map((item) =>
          item.id === course.id ? { ...item, status: 'archived' } : item,
        ),
      );
      this.successMessage.set(
        this.i18n.translate(
          'web.admin.curriculum.feedback.archiveCourseSuccess',
          {
            title: course.title,
          },
        ),
      );
    } catch (error) {
      console.error(
        '[AdminCurriculumPage] Erreur lors de l’archivage du cours',
        error,
      );
      this.errorMessage.set(
        this.i18n.translate(
          'web.admin.curriculum.feedback.archiveCourseFailure',
        ),
      );
    }
  }

  async attachCourse(): Promise<void> {
    this.placementForm.markAllAsTouched();

    const programId = this.selectedProgramId();
    if (
      this.placementForm.invalid ||
      programId === null ||
      !this.placementsReady()
    ) {
      return;
    }

    this.attachingCourse.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    try {
      const values = this.placementForm.getRawValue();
      const created = await this.programCoursesClient.create({
        programId,
        courseId: values.courseId,
        sortOrder: values.sortOrder,
        isRequired: values.isRequired,
      });

      if (this.selectedProgramId() !== programId) {
        return;
      }

      this.placements.update((placements) =>
        [...placements, created].sort((a, b) => a.sortOrder - b.sortOrder),
      );

      const course = this.courseById(created.courseId);
      this.successMessage.set(
        course
          ? this.i18n.translate(
              'web.admin.curriculum.feedback.addCourseSuccess',
              {
                title: course.title,
              },
            )
          : this.i18n.translate(
              'web.admin.curriculum.feedback.addCourseFallbackSuccess',
            ),
      );
      this.resetPlacementForm();
    } catch (error) {
      console.error(
        '[AdminCurriculumPage] Erreur lors de l’affectation du cours',
        error,
      );
      this.errorMessage.set(
        this.i18n.translate('web.admin.curriculum.feedback.addCourseFailure'),
      );
    } finally {
      this.attachingCourse.set(false);
    }
  }

  async detachCourse(placement: ProgramCourseDto): Promise<void> {
    const course = this.courseById(placement.courseId);

    if (
      !confirm(
        course
          ? this.i18n.translate(
              'web.admin.curriculum.feedback.removeCourseConfirm',
              {
                title: course.title,
              },
            )
          : this.i18n.translate(
              'web.admin.curriculum.feedback.removeCourseFallbackConfirm',
            ),
      )
    ) {
      return;
    }

    this.errorMessage.set(null);
    this.successMessage.set(null);

    try {
      await this.programCoursesClient.remove(placement.id);
      this.placements.update((placements) =>
        placements.filter((item) => item.id !== placement.id),
      );
      this.successMessage.set(
        course
          ? this.i18n.translate(
              'web.admin.curriculum.feedback.removeCourseSuccess',
              {
                title: course.title,
              },
            )
          : this.i18n.translate(
              'web.admin.curriculum.feedback.removeCourseFallbackSuccess',
            ),
      );
      this.resetPlacementForm();
    } catch (error) {
      console.error(
        '[AdminCurriculumPage] Erreur lors du retrait du cours',
        error,
      );
      this.errorMessage.set(
        this.i18n.translate(
          'web.admin.curriculum.feedback.removeCourseFailure',
        ),
      );
    }
  }

  private resetPlacementForm(): void {
    const nextSortOrder =
      this.placements().reduce(
        (highest, placement) => Math.max(highest, placement.sortOrder),
        -1,
      ) + 1;

    this.placementForm.reset({
      courseId: '',
      sortOrder: nextSortOrder,
      isRequired: true,
    });
  }
}
