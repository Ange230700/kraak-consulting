import { TestBed } from '@angular/core/testing';

import { Section } from './section.component';

describe('Section', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Section],
    }).compileComponents();
  });

  it('should render a section with a title', () => {
    const fixture = TestBed.createComponent(Section);
    fixture.componentRef.setInput('title', 'Nos services');
    fixture.componentRef.setInput('subtitle', 'Un accompagnement sur mesure.');
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('section')).toBeTruthy();
    expect(element.querySelector('h2')?.textContent).toContain('Nos services');
  });

  // Given size='lg'
  // When the section is rendered
  // Then the large padding class is applied
  it('Given size lg, when the section is rendered, then the large padding classes are applied', () => {
    const fixture = TestBed.createComponent(Section);
    fixture.componentRef.setInput('title', 'Grande section');
    fixture.componentRef.setInput('size', 'lg');
    fixture.detectChanges();

    const section = fixture.nativeElement.querySelector(
      'section',
    ) as HTMLElement;

    expect(section.className).toContain('py-24');
  });

  // Given background='primary'
  // When the section is rendered
  // Then primary color classes are applied to title and subtitle
  it('Given background primary, when the section is rendered, then the primary color classes are applied', () => {
    const fixture = TestBed.createComponent(Section);
    fixture.componentRef.setInput('title', 'Section primaire');
    fixture.componentRef.setInput('subtitle', 'Sous-titre');
    fixture.componentRef.setInput('background', 'primary');
    fixture.detectChanges();

    const section = fixture.nativeElement.querySelector(
      'section',
    ) as HTMLElement;
    const h2 = fixture.nativeElement.querySelector('h2') as HTMLElement;

    expect(section.className).toContain('bg-primary');
    expect(h2.className).toContain('text-brand-white');
  });
});
