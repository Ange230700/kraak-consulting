import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ImpactStats } from './impact-stats';

describe('ImpactStats', () => {
  let component: ImpactStats;
  let fixture: ComponentFixture<ImpactStats>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ImpactStats],
    }).compileComponents();

    fixture = TestBed.createComponent(ImpactStats);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should expose three preview stats', () => {
    const stats = (component as unknown as { stats: unknown[] }).stats;
    expect(stats.length).toBe(3);
  });

  it('should render stat cards', () => {
    const cards = fixture.nativeElement.querySelectorAll('article');
    expect(cards.length).toBe(3);
  });
});
