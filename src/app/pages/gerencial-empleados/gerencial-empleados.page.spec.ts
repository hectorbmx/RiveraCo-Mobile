import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GerencialEmpleadosPage } from './gerencial-empleados.page';

describe('GerencialEmpleadosPage', () => {
  let component: GerencialEmpleadosPage;
  let fixture: ComponentFixture<GerencialEmpleadosPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(GerencialEmpleadosPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
