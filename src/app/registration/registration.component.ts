import { Component } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

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
  isSubRoleEnabled: boolean = false;
  officialRoles = ['CRM', 'HM', 'AAA'];

  constructor(private fb: FormBuilder) {
    this.registrationForm = this.fb.group({
      name: ['', [Validators.required]],
      dob: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      password: [
        '',
        [
          Validators.required,
          Validators.minLength(8),
          Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/),
        ],
      ],
      userRole: ['', [Validators.required]],
      subUserRole: [{ value: '', disabled: true }, [Validators.required]],
      udise: ['', [Validators.required]],
    });
  }

  onSubmit() {
    console.log('Form submitted:', this.registrationForm.value);
  }

  onUserRoleChange() {
    const userRole = this.registrationForm.get('userRole')?.value;
    if (userRole === 'HT & Official') {
      this.registrationForm.get('subUserRole')?.enable(); // Enable the dropdown
    } else {
      this.registrationForm.get('subUserRole')?.disable(); // Disable the dropdown
      this.registrationForm.get('subUserRole')?.reset(); // Reset the value
    }
  }
}
