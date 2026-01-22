import { ComponentFixture, TestBed } from '@angular/core/testing';
import { VehiculoRegistroPage } from './vehiculo-registro.page';

describe('VehiculoRegistroPage', () => {
  let component: VehiculoRegistroPage;
  let fixture: ComponentFixture<VehiculoRegistroPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(VehiculoRegistroPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
