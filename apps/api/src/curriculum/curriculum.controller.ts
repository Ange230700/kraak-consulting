import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type {
  ChapterDto,
  ChapterLessonDto,
  CourseDto,
  CourseModuleDto,
  LearningModuleDto,
  LessonDto,
  ProgramCourseDto,
} from '@kraak/contracts';
import { AuthService } from '../auth/auth.service';
import { requireAdminAccess } from '../shared/admin-access.utils';
import type { ValidationResult } from '../shared/validation-result.type';
import {
  validateCreateChapterLessonPayload,
  validateCreateChapterPayload,
  validateCreateCourseModulePayload,
  validateCreateCoursePayload,
  validateCreateLearningModulePayload,
  validateCreateLessonPayload,
  validateCreateProgramCoursePayload,
  validateUpdateChapterLessonPayload,
  validateUpdateChapterPayload,
  validateUpdateCourseModulePayload,
  validateUpdateCoursePayload,
  validateUpdateLearningModulePayload,
  validateUpdateLessonPayload,
  validateUpdateProgramCoursePayload,
} from './curriculum.dto';
import { CurriculumService } from './curriculum.service';
import { apiMessage } from '../i18n/api-message';

@ApiTags('Curriculum')
@ApiBearerAuth('access-token')
@Controller('curriculum')
export class CurriculumController {
  constructor(
    private readonly curriculumService: CurriculumService,
    private readonly authService: AuthService,
  ) {}

  // Courses

  @Get('courses')
  async listCourses(
    @Headers('authorization') authorizationHeader?: string,
  ): Promise<CourseDto[]> {
    await this.requireAdmin(authorizationHeader);
    return this.curriculumService.listCourses();
  }

  @Post('courses')
  async createCourse(
    @Body() body: unknown,
    @Headers('authorization') authorizationHeader?: string,
  ): Promise<CourseDto> {
    await this.requireAdmin(authorizationHeader);
    return this.curriculumService.createCourse(
      this.unwrap(validateCreateCoursePayload(body)),
    );
  }

  @Patch('courses/:courseId')
  async updateCourse(
    @Param('courseId') courseId: string,
    @Body() body: unknown,
    @Headers('authorization') authorizationHeader?: string,
  ): Promise<CourseDto> {
    await this.requireAdmin(authorizationHeader);
    return this.curriculumService.updateCourse(
      courseId,
      this.unwrap(validateUpdateCoursePayload(body)),
    );
  }

  @Delete('courses/:courseId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async archiveCourse(
    @Param('courseId') courseId: string,
    @Headers('authorization') authorizationHeader?: string,
  ): Promise<void> {
    await this.requireAdmin(authorizationHeader);
    await this.curriculumService.archiveCourse(courseId);
  }

  // Learning modules

  @Get('modules')
  async listLearningModules(
    @Headers('authorization') authorizationHeader?: string,
  ): Promise<LearningModuleDto[]> {
    await this.requireAdmin(authorizationHeader);
    return this.curriculumService.listLearningModules();
  }

  @Post('modules')
  async createLearningModule(
    @Body() body: unknown,
    @Headers('authorization') authorizationHeader?: string,
  ): Promise<LearningModuleDto> {
    await this.requireAdmin(authorizationHeader);
    return this.curriculumService.createLearningModule(
      this.unwrap(validateCreateLearningModulePayload(body)),
    );
  }

  @Patch('modules/:learningModuleId')
  async updateLearningModule(
    @Param('learningModuleId') learningModuleId: string,
    @Body() body: unknown,
    @Headers('authorization') authorizationHeader?: string,
  ): Promise<LearningModuleDto> {
    await this.requireAdmin(authorizationHeader);
    return this.curriculumService.updateLearningModule(
      learningModuleId,
      this.unwrap(validateUpdateLearningModulePayload(body)),
    );
  }

  @Delete('modules/:learningModuleId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async archiveLearningModule(
    @Param('learningModuleId') learningModuleId: string,
    @Headers('authorization') authorizationHeader?: string,
  ): Promise<void> {
    await this.requireAdmin(authorizationHeader);
    await this.curriculumService.archiveLearningModule(learningModuleId);
  }

  // Chapters

  @Get('chapters')
  async listChapters(
    @Query('learningModuleId') learningModuleId?: string,
    @Headers('authorization') authorizationHeader?: string,
  ): Promise<ChapterDto[]> {
    await this.requireAdmin(authorizationHeader);
    return this.curriculumService.listChapters(learningModuleId);
  }

  @Post('chapters')
  async createChapter(
    @Body() body: unknown,
    @Headers('authorization') authorizationHeader?: string,
  ): Promise<ChapterDto> {
    await this.requireAdmin(authorizationHeader);
    return this.curriculumService.createChapter(
      this.unwrap(validateCreateChapterPayload(body)),
    );
  }

  @Patch('chapters/:chapterId')
  async updateChapter(
    @Param('chapterId') chapterId: string,
    @Body() body: unknown,
    @Headers('authorization') authorizationHeader?: string,
  ): Promise<ChapterDto> {
    await this.requireAdmin(authorizationHeader);
    return this.curriculumService.updateChapter(
      chapterId,
      this.unwrap(validateUpdateChapterPayload(body)),
    );
  }

  @Delete('chapters/:chapterId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async archiveChapter(
    @Param('chapterId') chapterId: string,
    @Headers('authorization') authorizationHeader?: string,
  ): Promise<void> {
    await this.requireAdmin(authorizationHeader);
    await this.curriculumService.archiveChapter(chapterId);
  }

  // Lessons

  @Get('lessons')
  async listLessons(
    @Headers('authorization') authorizationHeader?: string,
  ): Promise<LessonDto[]> {
    await this.requireAdmin(authorizationHeader);
    return this.curriculumService.listLessons();
  }

  @Post('lessons')
  async createLesson(
    @Body() body: unknown,
    @Headers('authorization') authorizationHeader?: string,
  ): Promise<LessonDto> {
    await this.requireAdmin(authorizationHeader);
    return this.curriculumService.createLesson(
      this.unwrap(validateCreateLessonPayload(body)),
    );
  }

  @Patch('lessons/:lessonId')
  async updateLesson(
    @Param('lessonId') lessonId: string,
    @Body() body: unknown,
    @Headers('authorization') authorizationHeader?: string,
  ): Promise<LessonDto> {
    await this.requireAdmin(authorizationHeader);
    return this.curriculumService.updateLesson(
      lessonId,
      this.unwrap(validateUpdateLessonPayload(body)),
    );
  }

  @Delete('lessons/:lessonId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async archiveLesson(
    @Param('lessonId') lessonId: string,
    @Headers('authorization') authorizationHeader?: string,
  ): Promise<void> {
    await this.requireAdmin(authorizationHeader);
    await this.curriculumService.archiveLesson(lessonId);
  }

  // Program -> Course placements

  @Get('program-courses')
  async listProgramCourses(
    @Query('programId') programId?: string,
    @Headers('authorization') authorizationHeader?: string,
  ): Promise<ProgramCourseDto[]> {
    await this.requireAdmin(authorizationHeader);
    return this.curriculumService.listProgramCourses(programId);
  }

  @Post('program-courses')
  async createProgramCourse(
    @Body() body: unknown,
    @Headers('authorization') authorizationHeader?: string,
  ): Promise<ProgramCourseDto> {
    await this.requireAdmin(authorizationHeader);
    return this.curriculumService.createProgramCourse(
      this.unwrap(validateCreateProgramCoursePayload(body)),
    );
  }

  @Patch('program-courses/:placementId')
  async updateProgramCourse(
    @Param('placementId') placementId: string,
    @Body() body: unknown,
    @Headers('authorization') authorizationHeader?: string,
  ): Promise<ProgramCourseDto> {
    await this.requireAdmin(authorizationHeader);
    return this.curriculumService.updateProgramCourse(
      placementId,
      this.unwrap(validateUpdateProgramCoursePayload(body)),
    );
  }

  @Delete('program-courses/:placementId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteProgramCourse(
    @Param('placementId') placementId: string,
    @Headers('authorization') authorizationHeader?: string,
  ): Promise<void> {
    await this.requireAdmin(authorizationHeader);
    await this.curriculumService.deleteProgramCourse(placementId);
  }

  // Course -> Module placements

  @Get('course-modules')
  async listCourseModules(
    @Query('courseId') courseId?: string,
    @Headers('authorization') authorizationHeader?: string,
  ): Promise<CourseModuleDto[]> {
    await this.requireAdmin(authorizationHeader);
    return this.curriculumService.listCourseModules(courseId);
  }

  @Post('course-modules')
  async createCourseModule(
    @Body() body: unknown,
    @Headers('authorization') authorizationHeader?: string,
  ): Promise<CourseModuleDto> {
    await this.requireAdmin(authorizationHeader);
    return this.curriculumService.createCourseModule(
      this.unwrap(validateCreateCourseModulePayload(body)),
    );
  }

  @Patch('course-modules/:placementId')
  async updateCourseModule(
    @Param('placementId') placementId: string,
    @Body() body: unknown,
    @Headers('authorization') authorizationHeader?: string,
  ): Promise<CourseModuleDto> {
    await this.requireAdmin(authorizationHeader);
    return this.curriculumService.updateCourseModule(
      placementId,
      this.unwrap(validateUpdateCourseModulePayload(body)),
    );
  }

  @Delete('course-modules/:placementId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteCourseModule(
    @Param('placementId') placementId: string,
    @Headers('authorization') authorizationHeader?: string,
  ): Promise<void> {
    await this.requireAdmin(authorizationHeader);
    await this.curriculumService.deleteCourseModule(placementId);
  }

  // Chapter -> Lesson placements

  @Get('chapter-lessons')
  async listChapterLessons(
    @Query('chapterId') chapterId?: string,
    @Headers('authorization') authorizationHeader?: string,
  ): Promise<ChapterLessonDto[]> {
    await this.requireAdmin(authorizationHeader);
    return this.curriculumService.listChapterLessons(chapterId);
  }

  @Post('chapter-lessons')
  async createChapterLesson(
    @Body() body: unknown,
    @Headers('authorization') authorizationHeader?: string,
  ): Promise<ChapterLessonDto> {
    await this.requireAdmin(authorizationHeader);
    return this.curriculumService.createChapterLesson(
      this.unwrap(validateCreateChapterLessonPayload(body)),
    );
  }

  @Patch('chapter-lessons/:placementId')
  async updateChapterLesson(
    @Param('placementId') placementId: string,
    @Body() body: unknown,
    @Headers('authorization') authorizationHeader?: string,
  ): Promise<ChapterLessonDto> {
    await this.requireAdmin(authorizationHeader);
    return this.curriculumService.updateChapterLesson(
      placementId,
      this.unwrap(validateUpdateChapterLessonPayload(body)),
    );
  }

  @Delete('chapter-lessons/:placementId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteChapterLesson(
    @Param('placementId') placementId: string,
    @Headers('authorization') authorizationHeader?: string,
  ): Promise<void> {
    await this.requireAdmin(authorizationHeader);
    await this.curriculumService.deleteChapterLesson(placementId);
  }

  private async requireAdmin(authorizationHeader?: string): Promise<void> {
    await requireAdminAccess(this.authService, authorizationHeader);
  }

  private unwrap<T>(result: ValidationResult<T>): T {
    if (!result.valid) {
      throw new BadRequestException({
        success: false,
        message: apiMessage('validation.invalidPayload'),
        errors: result.errors,
      });
    }

    return result.data;
  }
}
