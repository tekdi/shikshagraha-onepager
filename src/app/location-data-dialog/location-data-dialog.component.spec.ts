import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LocationDataDialogComponent } from './location-data-dialog.component';

describe('LocationDataDialogComponent', () => {
  let component: LocationDataDialogComponent;
  let fixture: ComponentFixture<LocationDataDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LocationDataDialogComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(LocationDataDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
