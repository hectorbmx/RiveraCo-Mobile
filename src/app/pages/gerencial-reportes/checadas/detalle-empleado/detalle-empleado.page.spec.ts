import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DetalleEmpleadoPage } from './detalle-empleado.page';

describe('DetalleEmpleadoPage', () => {
  let component: DetalleEmpleadoPage;
  let fixture: ComponentFixture<DetalleEmpleadoPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(DetalleEmpleadoPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
