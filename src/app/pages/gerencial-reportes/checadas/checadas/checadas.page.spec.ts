import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ChecadasPage } from './checadas.page';

describe('ChecadasPage', () => {
  let component: ChecadasPage;
  let fixture: ComponentFixture<ChecadasPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(ChecadasPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
