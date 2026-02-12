import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MaquinasDetallesPage } from './maquinas-detalles.page';

describe('MaquinasDetallesPage', () => {
  let component: MaquinasDetallesPage;
  let fixture: ComponentFixture<MaquinasDetallesPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(MaquinasDetallesPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
