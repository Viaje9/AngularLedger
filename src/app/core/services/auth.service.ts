import { Injectable, NgZone } from '@angular/core';
import {
  Auth,
  createUserWithEmailAndPassword,
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
} from '@angular/fire/auth';
import { doc, Firestore, setDoc } from '@angular/fire/firestore';
import { getToken, Messaging } from '@angular/fire/messaging';
import { Router } from '@angular/router';
import { environment } from '@src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  UserData: any;
  constructor(
    private auth: Auth,
    private messaging: Messaging,
    private firestore: Firestore,
    public ngZone: NgZone,
    public router: Router,
  ) {
    onAuthStateChanged(this.auth, (user: any) => {
      if (user) {
        this.UserData = user;
        this.initFCMToken();
      }
    });
  }

  get userUid() {
    const auth = getAuth();
    const user = auth.currentUser;
    return user?.uid || '';
  }

  async initFCMToken() {
    try {
      const token = await getToken(this.messaging, {
        vapidKey: environment.vapidKey,
      });

      const userRef = doc(this.firestore, `users/${this.userUid}`);
      await setDoc(userRef, { fcmToken: token }, { merge: true });
    } catch (err) {
      console.error('取得 FCM Token 失敗:', err);
    }
  }

  //get User
  //get Authenticated user from firebase
  getAuthFire() {
    return this.auth.currentUser;
  }

  //Register Method
  Register(email: string, password: string) {
    return createUserWithEmailAndPassword(this.auth, email, password)
      .then((result) => {
        this.UserData = result.user;
        this.ngZone.run(() => {
          /* Call the SendVerificaitonMail() function when new user sign
       up and returns promise */
          this.sendEmailVerification();
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
    return this.loginWithPopup(new GoogleAuthProvider());
  }

  loginWithPopup(provider: any) {
    return signInWithPopup(this.auth, provider)
      .then((res) => {
        console.log('logged in', res);
        return res;
        // this.router.navigateByUrl('/');
      })
      .catch((error) => {
        console.log(error);
      });
  }

  logout() {
    signOut(this.auth).then(() => this.router.navigate(['/signIn']));
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
