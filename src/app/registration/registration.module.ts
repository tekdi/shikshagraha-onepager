import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { RegistrationComponent } from './registration.component';

@NgModule({
  declarations: [
    RegistrationComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
  ],
  providers: [],
  bootstrap: []
})
export class registrationModule { }