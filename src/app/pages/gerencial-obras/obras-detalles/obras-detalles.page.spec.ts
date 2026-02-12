import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ObrasDetallesPage } from './obras-detalles.page';

describe('ObrasDetallesPage', () => {
  let component: ObrasDetallesPage;
  let fixture: ComponentFixture<ObrasDetallesPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(ObrasDetallesPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
