import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GerencialHomePage } from './gerencial-home.page';

describe('GerencialHomePage', () => {
  let component: GerencialHomePage;
  let fixture: ComponentFixture<GerencialHomePage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(GerencialHomePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
