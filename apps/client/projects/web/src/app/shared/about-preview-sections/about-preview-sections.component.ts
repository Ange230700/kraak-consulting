import { Component } from '@angular/core';

import { TeamGrid } from '../team-grid/team-grid.component';

@Component({
  selector: 'kraak-about-preview-sections',
  standalone: true,
  imports: [TeamGrid],
  templateUrl: './about-preview-sections.component.html',
})
export class AboutPreviewSections {}
