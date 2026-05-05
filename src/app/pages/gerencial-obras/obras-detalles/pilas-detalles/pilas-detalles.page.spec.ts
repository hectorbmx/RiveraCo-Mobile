import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PilasDetallesPage } from './pilas-detalles.page';

describe('PilasDetallesPage', () => {
  let component: PilasDetallesPage;
  let fixture: ComponentFixture<PilasDetallesPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(PilasDetallesPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
