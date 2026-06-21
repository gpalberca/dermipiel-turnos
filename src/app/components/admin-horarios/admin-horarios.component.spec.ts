import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AdminHorariosComponent } from './admin-horarios.component';

describe('AdminHorariosComponent', () => {
  let component: AdminHorariosComponent;
  let fixture: ComponentFixture<AdminHorariosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminHorariosComponent]
    }).compileComponents();
    fixture = TestBed.createComponent(AdminHorariosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
