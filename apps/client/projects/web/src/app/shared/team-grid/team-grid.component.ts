import { CommonModule } from '@angular/common';
import { Component, Input, computed } from '@angular/core';
import { KraakTranslatePipe } from '../../../../../shared/i18n';
import { buildAvatarCircleUrl } from '../brand/brand-constants';

export interface TeamMember {
  id: number;
  name: string;
  role: string;
  image: string;
}

@Component({
  selector: 'kraak-team-grid',
  standalone: true,
  imports: [CommonModule, KraakTranslatePipe],
  templateUrl: './team-grid.component.html',
})
export class TeamGrid {
  @Input() members: TeamMember[] = [];
  @Input() placeholder = true;

  readonly fallbackMembers: TeamMember[] = [
    {
      id: 1,
      name: 'Savannah Nguyen',
      role: 'web.shared.teamGrid.roles.softwareDeveloper',
      image: buildAvatarCircleUrl('avatar-f-1.png'),
    },
    {
      id: 2,
      name: 'Jenny Wilson',
      role: 'web.shared.teamGrid.roles.softwareDeveloper',
      image: buildAvatarCircleUrl('avatar-f-2.png'),
    },
    {
      id: 3,
      name: 'Albert Flores',
      role: 'web.shared.teamGrid.roles.softwareTester',
      image: buildAvatarCircleUrl('avatar-m-1.png'),
    },
    {
      id: 4,
      name: 'Ralph Edwards',
      role: 'web.shared.teamGrid.roles.teamLead',
      image: buildAvatarCircleUrl('avatar-m-2.png'),
    },
    {
      id: 5,
      name: 'Eleanor Pena',
      role: 'web.shared.teamGrid.roles.marketingSpecialist',
      image: buildAvatarCircleUrl('avatar-f-3.png'),
    },
    {
      id: 6,
      name: 'Annette Black',
      role: 'web.shared.teamGrid.roles.uiUxDesigner',
      image: buildAvatarCircleUrl('avatar-f-4.png'),
    },
    {
      id: 7,
      name: 'Arlene McCoy',
      role: 'web.shared.teamGrid.roles.softwareDeveloper',
      image: buildAvatarCircleUrl('avatar-f-5.png'),
    },
    {
      id: 8,
      name: 'James Wilson',
      role: 'web.shared.teamGrid.roles.productManager',
      image: buildAvatarCircleUrl('avatar-m-3.png'),
    },
    {
      id: 9,
      name: 'Darlene Robertson',
      role: 'web.shared.teamGrid.roles.softwareTester',
      image: buildAvatarCircleUrl('avatar-f-6.png'),
    },
    {
      id: 10,
      name: 'Kristin Watson',
      role: 'web.shared.teamGrid.roles.softwareDeveloper',
      image: buildAvatarCircleUrl('avatar-f-7.png'),
    },
    {
      id: 11,
      name: 'Floyd Miles',
      role: 'web.shared.teamGrid.roles.softwareTester',
      image: buildAvatarCircleUrl('avatar-m-4.png'),
    },
    {
      id: 12,
      name: 'Jane Olivia',
      role: 'web.shared.teamGrid.roles.uiUxDesigner',
      image: buildAvatarCircleUrl('avatar-f-8.png'),
    },
  ];

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
