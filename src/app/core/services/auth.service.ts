import { Injectable, NgZone } from '@angular/core';
import { Auth, GoogleAuthProvider, createUserWithEmailAndPassword, getAuth, onAuthStateChanged, signInWithEmailAndPassword, signInWithPopup, signOut } from '@angular/fire/auth';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  UserData: any;
  constructor(private auth: Auth, public ngZone: NgZone, public router: Router) {
    onAuthStateChanged(this.auth, (user: any) => {
      if (user) {
        this.UserData = user;

        localStorage.setItem('user', JSON.stringify(this.UserData));
        JSON.parse(localStorage.getItem('user')!);
      } else {
        localStorage.setItem('user', 'null');
        JSON.parse(localStorage.getItem('user')!);
      }
    })
  }

  get userUid() {
    return this.UserData.uid || ''
  }


  //get User
  //get Authenticated user from firebase
  getAuthFire() {
    return this.auth.currentUser;
  }

  //Check wither User Is looged in or not
  get isLoggedIn(): boolean {
    const token = localStorage.getItem('user')
    const user = JSON.parse(token as string);
    return user !== null ? true : false;
  }


  //get Authenticated user from Local Storage
  getAuthLocal() {
    const token = localStorage.getItem('user')
    const user = JSON.parse(token as string);
    return user;
  }

  //Register Method
  Register(email: string, password: string) {
    return createUserWithEmailAndPassword(this.auth, email, password)
      .then((result) => {
        this.UserData = result.user;
        this.ngZone.run(() => {
          /* Call the SendVerificaitonMail() function when new user sign
       up and returns promise */
          this.sendEmailVerification()
          this.router.navigate(['/signIn']);
        });
      })
      .catch((error) => {
        window.alert(error.message);
      });
  }
  sendEmailVerification() {
    throw new Error('Method not implemented.');
  }


  //Login Method
  Login(email: string, password: string) {
    return signInWithEmailAndPassword(this.auth, email, password)
      .then((result: any) => {
        this.UserData = result.user;
        this.ngZone.run(() => {
          this.router.navigate(['/']);
        });
      })
      .catch((error) => {
        window.alert(error.message);
      });
  }

  googleSignIn() {
    return this.loginWithPopup(new GoogleAuthProvider())
  }

  loginWithPopup(provider: any) {
    return signInWithPopup(this.auth, provider).then((res) => {
      console.log('logged in', res);
      return res
      // this.router.navigateByUrl('/');
    }).catch((error) => {
      console.log(error);

    })
  }

  logout() {
    signOut(this.auth).then(() => this.router.navigate(['/signIn']))
  }

  isSignedIn() {
    const auth = getAuth();
    const user = auth.currentUser;

    if (user !== null) {
      return true;
    }
    return false;
  }
}
