import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-registration',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './registration.component.html',
  styleUrl: './registration.component.css'
})
export class RegistrationComponent {
  user = {
    name: '',
    dob: '',
    email: '',
    password: '',
    udise: ''
  };

  onSubmit() {
    console.log('Form submitted:', this.user);
    // You can add further logic to handle form submission like API calls here
  }
}
