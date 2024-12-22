import { Component } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule, HttpHeaders } from '@angular/common/http'; // Add HttpClientModule
import { urlConstants } from '../service/urlConstants';
import { catchError } from 'rxjs/operators';

@Component({
  selector: 'app-registration',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    ReactiveFormsModule, 
    HttpClientModule // Import HttpClientModule here
  ],
  templateUrl: './registration.component.html',
  styleUrls: ['./registration.component.css']
})
export class RegistrationComponent {
  registrationForm;
  passwordVisible: boolean = false;
  isSubRoleEnabled: boolean = false;
  officialRoles = ['CRM', 'HM', 'AAA'];
  locationdata: any;

  constructor(private fb: FormBuilder, private httpClient: HttpClient) {
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

  async fetchLocationData() {
    try {
      const initialPayload = {
        request: {
          filters: {
            code: this.registrationForm.get('udise'),
            type: 'school'
          }
        }
      };

      const headers = new HttpHeaders({
        Authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiI5dndaeklzS3U0ZzRjSWxoZnE1MWQ2SlR1d0w4dktlZCJ9.4jPaZhi9dHMzqqoZAZvfD5t5QPAVAuWOr9SDf1apZb8',
        'Content-Type': 'application/json'
      });

      const schoolResponse: any = await this.httpClient
        .post(urlConstants.API_URLS.SEARCH_LOCATION, initialPayload, { headers })
        .toPromise();

      if (schoolResponse.result.count === 0) {
        this.locationdata = {};
        return;
      }

      const school = schoolResponse.result.response[0];
      this.locationdata = { school };

      await this.fetchLocationDataRecursively(school.parentId, headers);
    } catch (error) {
      console.error('Error in fetching location data:', error);
    }
  }

  async fetchLocationDataRecursively(parentId: string, headers: HttpHeaders) {
    if (!parentId) return;

    const payload = {
      request: {
        filters: { id: parentId }
      }
    };

    const response: any = await this.httpClient
      .post(urlConstants.API_URLS.SEARCH_LOCATION, payload, { headers })
      .toPromise();

    const location = response.result.response[0];
    if (location.type === 'cluster') this.locationdata.cluster = location;
    else if (location.type === 'block') this.locationdata.block = location;
    else if (location.type === 'district') this.locationdata.district = location;
    else if (location.type === 'state') this.locationdata.state = location;

    await this.fetchLocationDataRecursively(location.parentId, headers);
  }

  getotp() {}

  verifyotp() {}
}
