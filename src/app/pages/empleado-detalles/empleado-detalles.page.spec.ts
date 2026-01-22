import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EmpleadoDetallesPage } from './empleado-detalles.page';

describe('EmpleadoDetallesPage', () => {
  let component: EmpleadoDetallesPage;
  let fixture: ComponentFixture<EmpleadoDetallesPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(EmpleadoDetallesPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
