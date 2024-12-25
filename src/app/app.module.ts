import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RegistrationComponent } from './registration/registration.component';
import { MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { ReactiveFormsModule } from '@angular/forms';
import { LocationDataDialogComponent } from './location-data-dialog/location-data-dialog.component'

@NgModule({
  declarations: [],
  imports: [
    BrowserModule,
    MatDialogModule,
    MatButtonModule,
    ReactiveFormsModule,
    RegistrationComponent,
    LocationDataDialogComponent
  ],
  providers: [],
  bootstrap: [RegistrationComponent], // Bootstrap the registration component
})
export class AppModule {}
