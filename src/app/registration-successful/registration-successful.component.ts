import { Component, Inject } from '@angular/core';
import { MatDialogModule, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common'; 

@Component({
  selector: 'app-registration-successful',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, CommonModule],
  templateUrl: './registration-successful.component.html',
  styleUrl: './registration-successful.component.css'
})
export class RegistrationSuccessfulComponent {
  constructor(@Inject(MAT_DIALOG_DATA) public data: string) {}
}
