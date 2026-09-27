import { Component } from '@angular/core';
import { AuthService } from '@src/app/core/services/auth.service';

@Component({
  selector: 'app-sign-in',
  templateUrl: './sign-in.component.html',
  styleUrl: './sign-in.component.css'
})
export class SignInComponent {
  constructor(public auth: AuthService) {}
  onLogin() { this.auth.login(); }
}
