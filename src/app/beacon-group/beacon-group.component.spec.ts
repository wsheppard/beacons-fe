import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BeaconGroupComponent } from './beacon-group.component';

describe('BeaconGroupComponent', () => {
  let component: BeaconGroupComponent;
  let fixture: ComponentFixture<BeaconGroupComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BeaconGroupComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BeaconGroupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
