import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ImpactStats } from './impact-stats.component';

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

  it('Given the component is created When Angular instantiates it Then the instance should exist', () => {
    expect(component).toBeTruthy();
  });

  it('Given the preview impact catalog When the component is initialized Then it should expose three stats', () => {
    const stats = (component as unknown as { stats: unknown[] }).stats;
    expect(stats.length).toBe(3);
  });

  it('Given the impact stats section When the component renders Then it should display one card per stat', () => {
    const cards = fixture.nativeElement.querySelectorAll('article');
    expect(cards.length).toBe(3);
  });
});
