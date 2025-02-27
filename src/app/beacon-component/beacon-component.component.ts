import {DragDropModule} from '@angular/cdk/drag-drop';
import {CommonModule} from '@angular/common';
import { Component, Input } from '@angular/core';
import {formatDistanceToNow} from 'date-fns';

@Component({
  selector: 'app-beacon-component',
  standalone: true,
  imports: [
    CommonModule,
    DragDropModule
  ],
  templateUrl: './beacon-component.component.html',
  styleUrl: './beacon-component.component.scss'
})
export class BeaconComponentComponent {
  @Input() beacon: any;

  ageFormat() {

    const pDate = new Date( Date.now() - this.beacon.age * 1000 );
    return formatDistanceToNow( pDate );
  }

  grabInfo( $event: MouseEvent )
  {
    $event.stopPropagation();
    console.log(this.beacon);
  }

  getColorForTime(value: number, min: number = 0, max: number = 60): string {
    const halfway = (max - min) / 2;
    let red = 0;
    let green = 0;

    if (value <= halfway) { // From green to yellow
      // Linearly scale red up and keep green at max
      red = (255 * value) / halfway; // Scale red from 0 to 255 as value goes from min to halfway
      green = 255; // Keep green constant for the green to yellow transition
    } else { // From yellow to red
      // Linearly scale green down, keep red at max
      red = 255; // Keep red constant for the yellow to red transition
      green = 255 * (1 - (value - halfway) / halfway); // Scale green from 255 to 0 as value goes from halfway to max
    }
    return `rgb(${Math.round(red)}, ${Math.round(green)}, 0)`;
  }


}
