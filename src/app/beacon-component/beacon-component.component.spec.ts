import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BeaconComponentComponent } from './beacon-component.component';

describe('BeaconComponentComponent', () => {
  let component: BeaconComponentComponent;
  let fixture: ComponentFixture<BeaconComponentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BeaconComponentComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(BeaconComponentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
