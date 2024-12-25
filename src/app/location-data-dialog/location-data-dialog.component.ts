import { Component, Inject } from '@angular/core';
import { MatDialogModule, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common'; 

@Component({
  selector: 'app-location-data-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, CommonModule],
  templateUrl: './location-data-dialog.component.html',
  styleUrl: './location-data-dialog.component.css'
})
export class LocationDataDialogComponent {
  constructor(@Inject(MAT_DIALOG_DATA) public locationData: { state: { name: string },
  district: { name: string }, block: { name: string }, cluster: { name: string }, school: { name: string } }) {}
}
