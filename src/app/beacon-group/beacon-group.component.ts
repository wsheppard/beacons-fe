import { AfterViewInit, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import {BeaconComponentComponent} from '../beacon-component/beacon-component.component';
import {Beacon} from '../../../interfaces';
import {CommonModule} from '@angular/common';
import { CdkMenu, CdkMenuItem, CdkMenuModule, CdkMenuTrigger } from '@angular/cdk/menu';
import {GroupService} from '../local-service';
import {FormsModule} from '@angular/forms';
import {BeaconServiceService} from '../beacon-service.service';

@Component({
  selector: 'app-beacon-group',
  standalone: true,
  imports: [
    BeaconComponentComponent,
    FormsModule,
    CommonModule,
    CdkMenuModule,
    CdkMenuTrigger,
    CdkMenu,
    CdkMenuItem
  ],
  templateUrl: './beacon-group.component.html',
  styleUrl: './beacon-group.component.scss'
})
export class BeaconGroupComponent implements AfterViewInit {
  @Input() header: string = "";
  @Input() fullWidth: boolean = false;
  @Input() beacons: Beacon[] = [];
  @Output() beaconClick = new EventEmitter<Beacon>();

  ctxt : { addGrps:string[], beacon:Beacon|null } = { addGrps:[], beacon:null };
  orig_header: string = "";

  addingMAC: Boolean = false;
  addedMAC: string = "";

  constructor(
    private groupService: GroupService,
    private beaconService: BeaconServiceService
  ) {
  }

  deleteGroup(): void {
    this.groupService.deleteGroup(this.header);
  }

  saveNewMAC() : void {
    this.groupService.addMacToGroup(this.header, this.addedMAC);
    this.addingMAC = false;
  }


  saveHeader(): void {
    console.log("Save the group!");
    this.groupService.renameGroup(this.orig_header, this.header);
  }

  ngAfterViewInit(): void {
    this.orig_header = this.header;
    console.log("New group called: ", this.orig_header );
  }

  rmFromGrp(){
    if (!this.ctxt.beacon)
      return;
    let bssid = this.ctxt.beacon.bssid;
    console.log("Remove ", bssid, " from group ", this.header );
    this.groupService.removeMacFromGroup(this.header, bssid);
  }

  addToGrp( grp: string ){
    if (!this.ctxt.beacon)
      return;
    console.log("OK adding ", this.ctxt.beacon.bssid, " to group ", grp);
    this.groupService.addMacToGroup(grp, this.ctxt.beacon.bssid)
  }

  click(beacon: Beacon){
    this.beaconClick.emit(beacon);
  }

  openContext( beacon: Beacon ){
    console.log("Open context: ", beacon);
    this.ctxt.addGrps = Object.keys( this.groupService.getGroups() );
    this.ctxt.beacon = beacon;
  }

  resetCount( beacon: Beacon ){
    this.beaconService.resetCounter(beacon.bssid).subscribe();
  }

  resetCounts() {
    this.beacons.forEach(beacon=>this.resetCount(beacon));
  }
}
