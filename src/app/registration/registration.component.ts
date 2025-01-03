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
import { MatDialog } from '@angular/material/dialog';
import { LocationDataDialogComponent } from '../location-data-dialog/location-data-dialog.component';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { RegistrationSuccessfulComponent } from '../registration-successful/registration-successful.component';

@Component({
  selector: 'app-registration',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
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
  userName: string = '';
  hasSelectedSubRole: boolean = false;

  constructor(
    private fb: FormBuilder,
    private httpClient: HttpClient,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
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
    if (userRole === 'administrator') {
      this.isHTOfficialRoleSelected = true;
      this.isSubRoleEnabled = true; // Enable Sub User Roles if "HT & Official" is selected
    } else {
      this.isHTOfficialRoleSelected = false;
      this.isSubRoleEnabled = false; // Hide Sub User Roles for other user roles
      this.selectedSubRolesArray = []; // Clear selected sub roles when hiding the checkboxes
    }
  }

  getSelectedSubRoles() {
    this.selectedSubRolesArray =
      this.registrationForm.get('subUserRole')?.value ?? [];
      if (this.selectedSubRolesArray.length > 0) {
        this.hasSelectedSubRole = true;
      }
      else {
        this.hasSelectedSubRole = false;
      }
      console.log("isHTOfficialRoleSelected", this.isHTOfficialRoleSelected);
      console.log("hasSelectedSubRole", this.hasSelectedSubRole);
  }

  // get hasSelectedSubRole(): boolean {
  //   if (this.selectedSubRolesArray.length > 0) {
  //     return true;
  //   }
  //   else {
  //     return false;
  //   }
  // }

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
  
      const schoolResponse: any = await this.httpClient
        .post(environment.API_URLS.SEARCH_LOCATION, initialPayload)
        .toPromise();
  
      if (schoolResponse.data.result.count === 0) {
        this.showMessage("Invalid UDISE Code", 'error-snackbar');
        this.isGenerateOtpEnabled = false;
        this.locationdata = {};
        return;
      } else {
        this.showMessage("UDISE Data fetched Successfully", 'success-snackbar');
        this.isGenerateOtpEnabled = true;
      }
      const school = schoolResponse.data.result.response[0];
      this.locationdata = { school };
      this.openDialogForLocation();
  
      await this.fetchLocationDataRecursively(school.parentId);
    } catch (error) {
      console.log("error on fetching location data", error)
      this.showMessage("Error in fetching location data", 'error-snackbar');
      console.error('Error in fetching location data:', error);
    }
  }
  
  async fetchLocationDataRecursively(parentId: string) {
    if (!parentId) return;

    const payload = {
      request: {
        filters: { id: parentId },
      },
    };

    const response: any = await this.httpClient
      .post(environment.API_URLS.SEARCH_LOCATION, payload)
      .toPromise();

    const location = response.data.result.response[0];
    if (location.type === 'cluster') this.locationdata.cluster = location;
    else if (location.type === 'block') this.locationdata.block = location;
    else if (location.type === 'district')
      this.locationdata.district = location;
    else if (location.type === 'state') this.locationdata.state = location;

    await this.fetchLocationDataRecursively(location.parentId);
  }

  onSubmit() {
    const requestData = this.prepareRequestData();
    this.submitData(requestData);
  }

  prepareRequestData() {
    const name = this.registrationForm.get('name')?.value || '';
    const nameParts = name.split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    const firstNameLower = firstName.toLowerCase();

    const lastNameParts = lastName.split(' ');
    const lastNameLower = lastNameParts
      .map(part => part.charAt(0).toLowerCase() + part.slice(1).toLowerCase())
      .join('');

    this.userName =  `${firstNameLower}_${lastNameLower}`;
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
      this.isHTOfficialRoleSelected = true;
      this.selectedSubRolesArray.forEach((role) => {
        userTypes.push({
          type: userRole,
          subType: role.toLowerCase()
        });
      });
    } else {
      this.isHTOfficialRoleSelected = false;
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
          userName: this.userName,
          password: this.registrationForm.get('password')?.value,
          dob: dob ? dob.split('-')[0] : '',
          roles: ['PUBLIC'],
        }
      },
      profileLocation,
      profileUserTypes: userTypes
    };
  }

  submitData(requestData: any) {
    this.httpClient
      .post(environment.API_URLS.SUBMIT_USER_DATA, requestData)
      .pipe(
        catchError((error) => {
          console.log("error on submiting registration data", error)
          this.showMessage("Error" + error.message, 'error-snackbar');
          console.error('Error submitting data:', error);
          throw error;
        })
      )
      .subscribe((response) => {
        this.onRegister();
        console.log('User data submitted successfully', response);
      });
  }

  generateOTP() {
    let req = {
      request: {
        key: this.registrationForm.get('email')?.value ?? '',
        type: 'email',
      },
    };
    this.httpClient
      .post(environment.API_URLS.OTP_GENERATE, req)
      .pipe(
        catchError((error) => {
          console.log("error on generating data", error)
          const message = (error as { message: string }).message;
          this.showMessage(message, 'error-snackbar');
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
        this.showMessage("OTP generated successfully", 'success-snackbar');
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
    this.httpClient
      .post(environment.API_URLS.OTP_VERIFY, req,)
      .pipe(
        catchError((error) => {
          this.showMessage(error.error.error.params.errmsg, 'error-snackbar');
          console.error('Error submitting data:', error);
          throw error;
        })
      )
      .subscribe((response) => {
        this.isVerifyOtpEnabled = true;
        this.registerButton = true;
        this.registrationForm.get('email')?.disable();
        this.registrationForm.get('udise')?.disable();
        this.showMessage('OTP submitted successfully', 'success-snackbar');
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
    this.registrationForm.get('email')?.enable();
    this.registrationForm.get('udise')?.enable();
    this.registerButton = false;
    this.hasSelectedSubRole = false;
  }

  showMessage(message : string, cssStyle: string) {
    this.snackBar.open(message, 'Close', {
      duration: 6000, 
      panelClass: [cssStyle]
    });
  }

  openDialogForLocation() {
    this.dialog.open(LocationDataDialogComponent, {
      width: '400px',
      height: '300px',
      data: this.locationdata
    });
  }

  onRegister() {
    const dialogRef = this.dialog.open(RegistrationSuccessfulComponent, {
      width: '400px',
      height: '300px',
      data: this.userName
    });
    dialogRef.afterClosed().subscribe(() => {
      this.resetForm();
    });
  }
}
