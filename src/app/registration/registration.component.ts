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
  officialRoles = ['HM', 'CRP', 'Complex HM', 'MEO', 'DyEO', 'ATWO', 'DTWO', 'GCDO PMRC', 'CMO PMRC', 'AMO PMRC', 'DDTW', 'ASO DPO', 'Asst ALS Coordinator',
    'Asst IE Coordinator', 'ALS Coordinator', 'IE Coordinator', 'CMO', 'AAMO', 'AMO', 'APC', 'DIET Lecturer', 'DIET Principal', 'DEO', 'RJD', 'SLCC', 'SLMO',
    'SPPD', 'Director Adult Eucation', 'Director Public Libraries', 'Director SCERT', 'Secretary KGBV', 'Secretary Public Libraries',
    'Deputy Director Adult Education', 'Librarian Public Libraries/ Book Deposit Center', 'Instructor/ Volunteer Adult Education', 'BDC Incharge'];
  locationdata: any;
  isHTOfficialRoleSelected: boolean = false;
  selectedSubRolesArray: string[] = [];

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
      subUserRole: [[]],
      udise: ['', [Validators.required]],
    });
  }

  // This method is triggered when the userRole is changed
  onUserRoleChange(): void {
    const userRole = this.registrationForm.get('userRole')?.value;
    if (userRole === 'HT & Official') {
      this.isSubRoleEnabled = true; // Enable Sub User Roles if "HT & Official" is selected
    } else {
      this.isSubRoleEnabled = false; // Hide Sub User Roles for other user roles
      this.selectedSubRolesArray = []; // Clear selected sub roles when hiding the checkboxes
    }
  }

  getSelectedSubRoles() {
    this.selectedSubRolesArray = this.registrationForm.get('subUserRole')?.value ?? [];
  }

  get hasSelectedSubRole(): boolean {
    return this.selectedSubRolesArray.length > 0;
  }

  async fetchLocationData() {
    const code = this.registrationForm.get('udise')?.value;
    try {
      const initialPayload = {
        request: {
          filters: {
            code: code,
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

  onSubmit() {
    this.fetchLocationData().then(() => {
      const requestData = this.prepareRequestData();
      this.submitData(requestData);
    });
  }

  prepareRequestData() {
    const name = this.registrationForm.get('name')?.value || ''; // Default to an empty string if 'name' is null/undefined
    const nameParts = name.split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    const dob = this.registrationForm.get('dob')?.value; // Get the date value
  
    const profileLocation = [
      this.locationdata.state,
      this.locationdata.district,
      this.locationdata.block,
      this.locationdata.cluster,
      this.locationdata.school
    ].filter(Boolean); // Remove any undefined/null values

    let userTypes: { type: string, subType: string }[] = [];
    const userRole = this.registrationForm.get('userRole')?.value ?? ''; 

    if (userRole === 'HT & Official') {
      this.selectedSubRolesArray.forEach(role => {
        userTypes.push({
          type: userRole,
          subType: role
        });
      });      
    } else {
      if (userRole === 'Youth' || userRole === 'Teacher') {
        userTypes.push({
          type: userRole,
          subType: ''
        });
      }
    }
    return {
      request: {
        usercreate: {
          firstName,
          lastName,
          organisationId: '01406407969375027211',
          email: this.registrationForm.get('email')?.value,
          emailVerified: true,
          userName: firstName.toLowerCase(),
          password: this.registrationForm.get('password')?.value,
          dob: dob ? dob.split('-')[0] : '', // Extract year from DOB
          roles: ['PUBLIC']
        },
        profileLocation,
        profileUserTypes: [{ type: userTypes }]
      }
    };
  }

  submitData(requestData: any) {
    const headers = new HttpHeaders({
      Authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiI5dndaeklzS3U0ZzRjSWxoZnE1MWQ2SlR1d0w4dktlZCJ9.4jPaZhi9dHMzqqoZAZvfD5t5QPAVAuWOr9SDf1apZb8',
      'Content-Type': 'application/json'
    });    

    this.httpClient
      .post(urlConstants.API_URLS.SUBMIT_USER_DATA, requestData, { headers })
      .pipe(catchError(error => {
        console.error('Error submitting data:', error);
        throw error;
      }))
      .subscribe(response => {
        console.log('User data submitted successfully:', response);
      });
  }
}
