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
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import type {
  CmsHomepageContentDto,
  PartnerDto,
  StatisticDto,
  TeamMemberDto,
  TestimonialDto,
} from '@kraak/contracts';
import { AuthService } from '../auth/auth.service';
import { requireAdminAccess } from '../shared/admin-access.utils';
import {
  validateCreatePartnerPayload,
  validateCreateStatisticPayload,
  validateCreateTeamMemberPayload,
  validateCreateTestimonialPayload,
  validateUpdatePartnerPayload,
  validateUpdateStatisticPayload,
  validateUpdateTeamMemberPayload,
  validateUpdateTestimonialPayload,
} from './cms.dto';
import { CmsService } from './cms.service';

@ApiTags('CMS')
@Controller()
export class CmsController {
  constructor(
    private readonly cmsService: CmsService,
    private readonly authService: AuthService,
  ) {}

  @Get('cms/homepage')
  @ApiOperation({ summary: 'Charger le contenu homepage publié du CMS' })
  async getHomepageContent(): Promise<CmsHomepageContentDto> {
    return this.cmsService.getHomepageContent();
  }

  @Get('admin/cms/statistics')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Lister toutes les statistiques (admin)' })
  async listStatistics(
    @Headers('authorization') authorizationHeader?: string,
  ): Promise<StatisticDto[]> {
    await requireAdminAccess(this.authService, authorizationHeader);
    return this.cmsService.listStatistics();
  }

  @Post('admin/cms/statistics')
  @ApiBearerAuth('access-token')
  @ApiBody({ type: Object })
  @ApiOperation({ summary: 'Créer une nouvelle statistique (admin)' })
  async createStatistic(
    @Body() body: unknown,
    @Headers('authorization') authorizationHeader?: string,
  ): Promise<StatisticDto> {
    await requireAdminAccess(this.authService, authorizationHeader);
    const validated = validateCreateStatisticPayload(body);

    if (!validated.valid) {
      throw new BadRequestException({
        success: false,
        message: 'Payload invalide.',
        errors: validated.errors,
      });
    }

    return this.cmsService.createStatistic(validated.data);
  }

  @Patch('admin/cms/statistics/:id')
  @ApiBearerAuth('access-token')
  @ApiBody({ type: Object })
  @ApiOperation({ summary: 'Mettre à jour une statistique (admin)' })
  async updateStatistic(
    @Param('id') id: string,
    @Body() body: unknown,
    @Headers('authorization') authorizationHeader?: string,
  ): Promise<StatisticDto> {
    await requireAdminAccess(this.authService, authorizationHeader);
    const validated = validateUpdateStatisticPayload(body);

    if (!validated.valid) {
      throw new BadRequestException({
        success: false,
        message: 'Payload invalide.',
        errors: validated.errors,
      });
    }

    return this.cmsService.updateStatistic(id, validated.data);
  }

  @Delete('admin/cms/statistics/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Archiver une statistique (admin)' })
  async deleteStatistic(
    @Param('id') id: string,
    @Headers('authorization') authorizationHeader?: string,
  ): Promise<void> {
    await requireAdminAccess(this.authService, authorizationHeader);
    await this.cmsService.deleteStatistic(id);
  }

  @Get('admin/cms/partners')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Lister tous les partenaires (admin)' })
  async listPartners(
    @Headers('authorization') authorizationHeader?: string,
  ): Promise<PartnerDto[]> {
    await requireAdminAccess(this.authService, authorizationHeader);
    return this.cmsService.listPartners();
  }

  @Post('admin/cms/partners')
  @ApiBearerAuth('access-token')
  @ApiBody({ type: Object })
  @ApiOperation({ summary: 'Créer un nouveau partenaire (admin)' })
  async createPartner(
    @Body() body: unknown,
    @Headers('authorization') authorizationHeader?: string,
  ): Promise<PartnerDto> {
    await requireAdminAccess(this.authService, authorizationHeader);
    const validated = validateCreatePartnerPayload(body);

    if (!validated.valid) {
      throw new BadRequestException({
        success: false,
        message: 'Payload invalide.',
        errors: validated.errors,
      });
    }

    return this.cmsService.createPartner(validated.data);
  }

  @Patch('admin/cms/partners/:id')
  @ApiBearerAuth('access-token')
  @ApiBody({ type: Object })
  @ApiOperation({ summary: 'Mettre à jour un partenaire (admin)' })
  async updatePartner(
    @Param('id') id: string,
    @Body() body: unknown,
    @Headers('authorization') authorizationHeader?: string,
  ): Promise<PartnerDto> {
    await requireAdminAccess(this.authService, authorizationHeader);
    const validated = validateUpdatePartnerPayload(body);

    if (!validated.valid) {
      throw new BadRequestException({
        success: false,
        message: 'Payload invalide.',
        errors: validated.errors,
      });
    }

    return this.cmsService.updatePartner(id, validated.data);
  }

  @Delete('admin/cms/partners/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Archiver un partenaire (admin)' })
  async deletePartner(
    @Param('id') id: string,
    @Headers('authorization') authorizationHeader?: string,
  ): Promise<void> {
    await requireAdminAccess(this.authService, authorizationHeader);
    await this.cmsService.deletePartner(id);
  }

  @Get('admin/cms/testimonials')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Lister tous les témoignages (admin)' })
  async listTestimonials(
    @Headers('authorization') authorizationHeader?: string,
  ): Promise<TestimonialDto[]> {
    await requireAdminAccess(this.authService, authorizationHeader);
    return this.cmsService.listTestimonials();
  }

  @Post('admin/cms/testimonials')
  @ApiBearerAuth('access-token')
  @ApiBody({ type: Object })
  @ApiOperation({ summary: 'Créer un nouveau témoignage (admin)' })
  async createTestimonial(
    @Body() body: unknown,
    @Headers('authorization') authorizationHeader?: string,
  ): Promise<TestimonialDto> {
    await requireAdminAccess(this.authService, authorizationHeader);
    const validated = validateCreateTestimonialPayload(body);

    if (!validated.valid) {
      throw new BadRequestException({
        success: false,
        message: 'Payload invalide.',
        errors: validated.errors,
      });
    }

    return this.cmsService.createTestimonial(validated.data);
  }

  @Patch('admin/cms/testimonials/:id')
  @ApiBearerAuth('access-token')
  @ApiBody({ type: Object })
  @ApiOperation({ summary: 'Mettre à jour un témoignage (admin)' })
  async updateTestimonial(
    @Param('id') id: string,
    @Body() body: unknown,
    @Headers('authorization') authorizationHeader?: string,
  ): Promise<TestimonialDto> {
    await requireAdminAccess(this.authService, authorizationHeader);
    const validated = validateUpdateTestimonialPayload(body);

    if (!validated.valid) {
      throw new BadRequestException({
        success: false,
        message: 'Payload invalide.',
        errors: validated.errors,
      });
    }

    return this.cmsService.updateTestimonial(id, validated.data);
  }

  @Delete('admin/cms/testimonials/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Archiver un témoignage (admin)' })
  async deleteTestimonial(
    @Param('id') id: string,
    @Headers('authorization') authorizationHeader?: string,
  ): Promise<void> {
    await requireAdminAccess(this.authService, authorizationHeader);
    await this.cmsService.deleteTestimonial(id);
  }

  @Get('admin/cms/team-members')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Lister tous les membres d’équipe (admin)' })
  async listTeamMembers(
    @Headers('authorization') authorizationHeader?: string,
  ): Promise<TeamMemberDto[]> {
    await requireAdminAccess(this.authService, authorizationHeader);
    return this.cmsService.listTeamMembers();
  }

  @Post('admin/cms/team-members')
  @ApiBearerAuth('access-token')
  @ApiBody({ type: Object })
  @ApiOperation({ summary: 'Créer un nouveau membre d’équipe (admin)' })
  async createTeamMember(
    @Body() body: unknown,
    @Headers('authorization') authorizationHeader?: string,
  ): Promise<TeamMemberDto> {
    await requireAdminAccess(this.authService, authorizationHeader);
    const validated = validateCreateTeamMemberPayload(body);

    if (!validated.valid) {
      throw new BadRequestException({
        success: false,
        message: 'Payload invalide.',
        errors: validated.errors,
      });
    }

    return this.cmsService.createTeamMember(validated.data);
  }

  @Patch('admin/cms/team-members/:id')
  @ApiBearerAuth('access-token')
  @ApiBody({ type: Object })
  @ApiOperation({ summary: 'Mettre à jour un membre d’équipe (admin)' })
  async updateTeamMember(
    @Param('id') id: string,
    @Body() body: unknown,
    @Headers('authorization') authorizationHeader?: string,
  ): Promise<TeamMemberDto> {
    await requireAdminAccess(this.authService, authorizationHeader);
    const validated = validateUpdateTeamMemberPayload(body);

    if (!validated.valid) {
      throw new BadRequestException({
        success: false,
        message: 'Payload invalide.',
        errors: validated.errors,
      });
    }

    return this.cmsService.updateTeamMember(id, validated.data);
  }

  @Delete('admin/cms/team-members/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Archiver un membre d’équipe (admin)' })
  async deleteTeamMember(
    @Param('id') id: string,
    @Headers('authorization') authorizationHeader?: string,
  ): Promise<void> {
    await requireAdminAccess(this.authService, authorizationHeader);
    await this.cmsService.deleteTeamMember(id);
  }
}
