import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { D3StackedBarChartComponent } from './d3-stacked-bar-chart.component';

describe('D3StackedBarChartComponent', () => {
  let component: D3StackedBarChartComponent;
  let fixture: ComponentFixture<D3StackedBarChartComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ D3StackedBarChartComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(D3StackedBarChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
