import { Component, Inject } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import {
  HttpClient,
  HttpClientModule,
  HttpHeaders,
} from '@angular/common/http'; // Add HttpClientModule
import { catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-registration',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule, // Import HttpClientModule here
  ],
  templateUrl: './registration.component.html',
  styleUrls: ['./registration.component.css'],
})
export class RegistrationComponent {
  registrationForm;
  passwordVisible: boolean = false;
  isSubRoleEnabled: boolean = false;
  officialRoles = [
    'HM',
    'CRP',
    'Complex HM',
    'MEO',
    'DyEO',
    'ATWO',
    'DTWO',
    'GCDO PMRC',
    'CMO PMRC',
    'AMO PMRC',
    'DDTW',
    'ASO DPO',
    'Asst ALS Coordinator',
    'Asst IE Coordinator',
    'ALS Coordinator',
    'IE Coordinator',
    'CMO',
    'AAMO',
    'AMO',
    'APC',
    'DIET Lecturer',
    'DIET Principal',
    'DEO',
    'RJD',
    'SLCC',
    'SLMO',
    'SPPD',
    'Director Adult Eucation',
    'Director Public Libraries',
    'Director SCERT',
    'Secretary KGBV',
    'Secretary Public Libraries',
    'Deputy Director Adult Education',
    'Librarian Public Libraries/ Book Deposit Center',
    'Instructor/ Volunteer Adult Education',
    'BDC Incharge',
  ];
  locationdata: any;
  isHTOfficialRoleSelected: boolean = false;
  selectedSubRolesArray: string[] = [];
  loader: any;
  otpGenerated: boolean = false;
  otpVerified: boolean = false;
  isGenerateOtpEnabled: boolean = false;
  isVerifyOtpEnabled: boolean = false;
  registerButton: boolean = false;
  showInfoMessage: boolean = false;
  displayMessage: string = '';
  messageCss: string = '';
  constructor(
    private fb: FormBuilder,
    private httpClient: HttpClient,
  ) {
    this.registrationForm = this.fb.group({
      name: ['', [Validators.required]],
      dob: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      password: [
        '',
        [
          Validators.required,
          Validators.minLength(8),
          Validators.pattern(
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
          ),
        ],
      ],
      userRole: ['', [Validators.required]],
      subUserRole: [[]],
      udise: ['', [Validators.required]],
      otp: [''],
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
    this.selectedSubRolesArray =
      this.registrationForm.get('subUserRole')?.value ?? [];
  }

  get hasSelectedSubRole(): boolean {
    return this.selectedSubRolesArray.length > 0;
  }

  async fetchLocationData() {
    this.registrationForm.get('email')?.disable();
    const code = this.registrationForm.get('udise')?.value;
    try {
      const initialPayload = {
        request: {
          filters: {
            code: code,
            type: 'school',
          },
        },
      };
      const headers = new HttpHeaders({
        Authorization: environment.auth,
        'Content-Type': 'application/json',
      });

      const schoolResponse: any = await this.httpClient
        .post(environment.API_URLS.SEARCH_LOCATION, initialPayload, { headers })
        .toPromise();

      if (schoolResponse.result.count === 0) {
        this.showMessage("Invalid UDISE Code", false);
        this.isGenerateOtpEnabled = false;
        this.locationdata = {};
        return;
      } else {
        this.showInfoMessage = true;
        this.showMessage("UDISE Data fetched Successfully", true);
        this.isGenerateOtpEnabled = true;
      }

      const school = schoolResponse.result.response[0];
      this.locationdata = { school };

      await this.fetchLocationDataRecursively(school.parentId, headers);
    } catch (error) {
      this.showMessage("Error in fetching location data", false);
      console.error('Error in fetching location data:', error);
    }
  }

  async fetchLocationDataRecursively(parentId: string, headers: HttpHeaders) {
    if (!parentId) return;

    const payload = {
      request: {
        filters: { id: parentId },
      },
    };

    const response: any = await this.httpClient
      .post(environment.API_URLS.SEARCH_LOCATION, payload, { headers })
      .toPromise();

    const location = response.result.response[0];
    if (location.type === 'cluster') this.locationdata.cluster = location;
    else if (location.type === 'block') this.locationdata.block = location;
    else if (location.type === 'district')
      this.locationdata.district = location;
    else if (location.type === 'state') this.locationdata.state = location;

    await this.fetchLocationDataRecursively(location.parentId, headers);
  }

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

    console.log("this.locationdata", this.locationdata);
    const profileLocation = [
      this.locationdata.state,
      this.locationdata.district,
      this.locationdata.block,
      this.locationdata.cluster,
      this.locationdata.school,
    ].filter(Boolean); // Remove any undefined/null values

    let userTypes: { type: string; subType: string }[] = [];
    const userRole = this.registrationForm.get('userRole')?.value ?? '';

    if (userRole === 'administrator') {
      this.selectedSubRolesArray.forEach((role) => {
        userTypes.push({
          type: userRole,
          subType: role.toLowerCase()
        });
      });
    } else {
      if (userRole === 'youth' || userRole === 'teacher') {
        userTypes.push({
          type: userRole,
          subType: '',
        });
      }
    }
    return {
      usercreate: {
        request: {
          firstName,
          lastName,
          organisationId: '0137236500887961602',
          email: this.registrationForm.get('email')?.value,
          emailVerified: true,
          userName: `${firstName}_${lastName}`.toLowerCase(),
          password: this.registrationForm.get('password')?.value,
          dob: dob ? dob.split('-')[0] : '', // Extract year from DOB
          roles: ['PUBLIC'],
        }
      },
      profileLocation,
      profileUserTypes: userTypes
    };
  }

  submitData(requestData: any) {
    const headers = new HttpHeaders({
      Authorization: environment.auth,
      'Content-Type': 'application/json',
    });

    this.httpClient
      .post(environment.API_URLS.SUBMIT_USER_DATA, requestData, { headers })
      .pipe(
        catchError((error) => {
          this.showMessage("Error" + error, false);
          console.error('Error submitting data:', error);
          throw error;
        })
      )
      .subscribe((response) => {
        const message = (response as { message: string }).message;
        this.showMessage(message, true);
        console.log('User data submitted successfully:', response);
        this.resetForm();
      });
  }

  generateOTP() {
    let req = {
      request: {
        key: this.registrationForm.get('email')?.value ?? '',
        type: 'email',
      },
    };
    const headers = new HttpHeaders({
      Authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJ0WEZYTWFVOWFBanpUbk5aSXNySEpyV0hwVW94bzY3NyJ9.WSWVtVh5MCH_yymFEM_qpVzXGdDO5mukrqmIii1C5Ww',
      'Content-Type': 'application/json',
    });
    this.httpClient
      .post(environment.API_URLS.OTP_GENERATE, req, { headers })
      .pipe(
        catchError((error) => {
          const message = (error as { message: string }).message;
          this.showMessage(message, false);
          console.error('Error submitting data:', error);
          this.isVerifyOtpEnabled = false;
          this.registrationForm.get('email')?.enable();
          this.registrationForm.get('udise')?.enable();
          throw error;
        })
      )
      .subscribe((response) => {
        this.isVerifyOtpEnabled = true;
        this.registrationForm.get('email')?.disable();
        this.registrationForm.get('udise')?.disable();
        this.showMessage("OTP generated successfully", true);
        console.log('OTP generated successfully:', response);
      });
  }

  verifyOTP() {
    let req = {
      request: {
        key: this.registrationForm.get('email')?.value ?? '',
        type: 'email',
        otp: String(this.registrationForm.get('otp')?.value ?? ''),
      },
    };
    const headers = new HttpHeaders({
      Authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJ0WEZYTWFVOWFBanpUbk5aSXNySEpyV0hwVW94bzY3NyJ9.WSWVtVh5MCH_yymFEM_qpVzXGdDO5mukrqmIii1C5Ww',
      'Content-Type': 'application/json',
    });
    this.httpClient
      .post(environment.API_URLS.OTP_VERIFY, req, { headers })
      .pipe(
        catchError((error) => {
          this.showMessage(error.error.params.errmsg, false);
          console.error('Error submitting data:', error.error.params.errmsg);
          throw error;
        })
      )
      .subscribe((response) => {
        this.isVerifyOtpEnabled = true;
        this.registerButton = true;
        this.registrationForm.get('email')?.disable();
        this.registrationForm.get('udise')?.disable();
        this.showMessage('OTP submitted successfully:', true);
        console.log('OTP submitted successfully:', response);
      });
  }

  resetForm() {
    this.registrationForm.reset();
    this.passwordVisible = false;
    this.isSubRoleEnabled = false;
    this.locationdata = {};
    this.isHTOfficialRoleSelected = false;
    this.selectedSubRolesArray = [];
    this.otpGenerated = false;
    this.otpVerified = false;
    this.isGenerateOtpEnabled = false;
    this.isVerifyOtpEnabled = false;
    // this.showInfoMessage = false;
    // this.displayMessage = '';
  }

  showMessage(message : string, isSuccess: boolean) {
    this.displayMessage = message;
    this.messageCss = isSuccess ? 'success-snackbar' : 'error-snackbar'
  }
}
