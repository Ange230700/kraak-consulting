import { CommonModule } from '@angular/common';
import { Component, Input, computed } from '@angular/core';
import {
  TEAM_GRID_PREVIEW_MEMBERS,
  TEAM_GRID_PREVIEW_SECTION,
  type TeamMemberPreview,
} from '../preview-content';

export type TeamMember = TeamMemberPreview;

@Component({
  selector: 'kraak-team-grid',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './team-grid.component.html',
})
export class TeamGrid {
  @Input() members: TeamMember[] = [];
  @Input() placeholder = true;
  readonly previewSection = TEAM_GRID_PREVIEW_SECTION;
  readonly fallbackMembers: TeamMember[] = TEAM_GRID_PREVIEW_MEMBERS;

  readonly visibleMembers = computed(() => {
    if (this.members.length > 0) {
      return this.members;
    }

    if (!this.placeholder) {
      return [];
    }

    return this.fallbackMembers;
  });

  readonly isPreviewMode = computed(
    () => this.members.length === 0 && this.placeholder,
  );
}
