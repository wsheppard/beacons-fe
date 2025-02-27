
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class GroupService {

  private storageKey = 'wifiGroups';
  private groupsSubject: BehaviorSubject<Record<string, string[]>>;

  constructor() {
    const storedGroups = this.getGroups();

    this.groupsSubject = new BehaviorSubject<Record<string, string[]>>(storedGroups);
  }

  getGroups(): Record<string, string[]> {
    const groups = localStorage.getItem(this.storageKey);
    return groups ? JSON.parse(groups) : {};
  }

  addGroup( group: string ): void {
    const groups = this.getGroups();
    groups[group] = [];
    this.saveGroups(groups);
  }

  deleteGroup( group: string ){
    const groups = this.getGroups();
    delete groups[group];
    this.saveGroups(groups);
  }

  renameGroup( group: string, name: string ){
    const groups = this.getGroups();
    const val = groups[group];
    groups[name] = val;
    delete groups[group];
    this.saveGroups(groups);
  }

  private saveGroups(groups: Record<string, string[]>): void {
    localStorage.setItem(this.storageKey, JSON.stringify(groups));
    this.groupsSubject.next(groups); // Update the subject with new data
  }

  get groups$(): Observable<Record<string, string[]>> {
    return this.groupsSubject.asObservable();
  }


  addMacToGroup(group: string, mac: string): void {
    const groups = this.getGroups();
    if (!groups[group]) {
      groups[group] = [];
    }

    mac = mac.toLowerCase();

    if (!groups[group].includes(mac)) {
      groups[group].push(mac);
    }
    this.saveGroups(groups);
  }

  removeMacFromGroup(group: string, mac: string): void {
    const groups = this.getGroups();
    if (groups[group]) {
      groups[group] = groups[group].filter(m => m !== mac);
      this.saveGroups(groups);
    }
  }

  isMacInGroup(group: string, mac: string): boolean {
    const groups = this.getGroups();
    return groups[group] ? groups[group].includes(mac) : false;
  }

  getGroupsForMac(mac: string): string[] {
    const groups = this.getGroups();
    return Object.entries(groups)
      .filter(([group, macs]) => macs.includes(mac))
      .map(([group]) => group);
  }
}



