import { CommonModule } from '@angular/common';
import { Component, Input, computed } from '@angular/core';
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
  imports: [CommonModule],
  templateUrl: './team-grid.component.html',
})
export class TeamGrid {
  @Input() members: TeamMember[] = [];
  @Input() placeholder = true;

  readonly fallbackMembers: TeamMember[] = [
    {
      id: 1,
      name: 'Savannah Nguyen',
      role: 'Développeuse logiciel',
      image: buildAvatarCircleUrl('avatar-f-1.png'),
    },
    {
      id: 2,
      name: 'Jenny Wilson',
      role: 'Développeuse logiciel',
      image: buildAvatarCircleUrl('avatar-f-2.png'),
    },
    {
      id: 3,
      name: 'Albert Flores',
      role: 'Testeur logiciel',
      image: buildAvatarCircleUrl('avatar-m-1.png'),
    },
    {
      id: 4,
      name: 'Ralph Edwards',
      role: "Chef d'équipe",
      image: buildAvatarCircleUrl('avatar-m-2.png'),
    },
    {
      id: 5,
      name: 'Eleanor Pena',
      role: 'Spécialiste marketing',
      image: buildAvatarCircleUrl('avatar-f-3.png'),
    },
    {
      id: 6,
      name: 'Annette Black',
      role: 'Designer UI/UX',
      image: buildAvatarCircleUrl('avatar-f-4.png'),
    },
    {
      id: 7,
      name: 'Arlene McCoy',
      role: 'Développeuse logiciel',
      image: buildAvatarCircleUrl('avatar-f-5.png'),
    },
    {
      id: 8,
      name: 'James Wilson',
      role: 'Product manager',
      image: buildAvatarCircleUrl('avatar-m-3.png'),
    },
    {
      id: 9,
      name: 'Darlene Robertson',
      role: 'Testeuse logiciel',
      image: buildAvatarCircleUrl('avatar-f-6.png'),
    },
    {
      id: 10,
      name: 'Kristin Watson',
      role: 'Développeuse logiciel',
      image: buildAvatarCircleUrl('avatar-f-7.png'),
    },
    {
      id: 11,
      name: 'Floyd Miles',
      role: 'Testeur logiciel',
      image: buildAvatarCircleUrl('avatar-m-4.png'),
    },
    {
      id: 12,
      name: 'Jane Olivia',
      role: 'Designer UI/UX',
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
