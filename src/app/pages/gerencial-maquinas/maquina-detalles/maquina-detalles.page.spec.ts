import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MaquinaDetallesPage } from './maquina-detalles.page';

describe('MaquinaDetallesPage', () => {
  let component: MaquinaDetallesPage;
  let fixture: ComponentFixture<MaquinaDetallesPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(MaquinaDetallesPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
