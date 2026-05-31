import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminCitas } from './admin-citas';

describe('AdminCitas', () => {
  let component: AdminCitas;
  let fixture: ComponentFixture<AdminCitas>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminCitas],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminCitas);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
