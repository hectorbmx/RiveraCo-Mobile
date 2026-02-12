import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GerencialObrasPage } from './gerencial-obras.page';

describe('GerencialObrasPage', () => {
  let component: GerencialObrasPage;
  let fixture: ComponentFixture<GerencialObrasPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(GerencialObrasPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
