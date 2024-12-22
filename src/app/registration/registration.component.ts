import { Component } from '@angular/core';
import {  FormsModule, FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-registration',
  standalone: true,
  imports: [FormsModule, CommonModule, ReactiveFormsModule], // Ensure both are included
  templateUrl: './registration.component.html',
  styleUrls: ['./registration.component.css'] // Correct file name
})
export class RegistrationComponent {
  registrationForm;
  passwordVisible: boolean = false;
  
  constructor(private fb: FormBuilder) {
    this.registrationForm = this.fb.group({
      name: ['', [Validators.required]],
      dob: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8),Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)]],
      udise: ['', [Validators.required]]
    });
  }

  onSubmit() {
    console.log('Form submitted:', this.registrationForm);
  }
}
