import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GerencialMaquinasPage } from './gerencial-maquinas.page';

describe('GerencialMaquinasPage', () => {
  let component: GerencialMaquinasPage;
  let fixture: ComponentFixture<GerencialMaquinasPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(GerencialMaquinasPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
