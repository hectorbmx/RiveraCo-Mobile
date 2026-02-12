import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GerencialInventarioPage } from './gerencial-inventario.page';

describe('GerencialInventarioPage', () => {
  let component: GerencialInventarioPage;
  let fixture: ComponentFixture<GerencialInventarioPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(GerencialInventarioPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
