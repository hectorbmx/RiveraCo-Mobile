import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MaquinaRegistroPage } from './maquina-registro.page';

describe('MaquinaRegistroPage', () => {
  let component: MaquinaRegistroPage;
  let fixture: ComponentFixture<MaquinaRegistroPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(MaquinaRegistroPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
