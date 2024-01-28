import { CommonModule } from '@angular/common';
import { Component, type OnInit } from '@angular/core';
import { DocumentReference, Firestore, collection, collectionData, doc, docData, orderBy, query, setDoc } from '@angular/fire/firestore';
import { Router } from '@angular/router';
import { TagInfo } from '@src/app/core/models/tag.model';
import { AuthService } from '@src/app/core/services/auth.service';
import { ModalService } from '@src/app/core/services/modal.service';
import { Observable, take } from 'rxjs';

@Component({
  selector: 'app-sign-in',
  standalone: true,
  imports: [
    CommonModule,
  ],
  templateUrl: './sign-in.component.html',
  styleUrl: './sign-in.component.css',
})
export class SignInComponent implements OnInit {

  constructor(
    private auth: AuthService,
    private firestore: Firestore,
    private modalService: ModalService,
    public router: Router
  ) { }

  ngOnInit(): void { }

  onGoogleSignUp() {
    this.auth.googleSignIn().then(res => {
      const user = res?.user
      if (user) {
        const { displayName, uid, email } = user
        const userInfo = doc(this.firestore, 'users', uid);
        docData(userInfo).pipe(take(1)).subscribe((res) => {
          if (!res) {
            this.modalService.openConfirm({
              content: '請先註冊，點選確認後將自動註冊',
              okText: '確認',
              cancelText: '取消',
              onOk: this.onRegister.bind(this, uid, email || '', displayName || ''),
            });
          }else {
            this.router.navigateByUrl('/setting/tagsManage');
            // this.modalService.openConfirm({
            //   content: '登入成功',
            //   okText: '確認',
            //   showCancelBtn: false,
            //   onOk: () => {
            //
            //   }
            // });
          }
        })
      }
    })
  }

  onRegister(uid: string, email: string, displayName: string) {
    console.log(uid, email, displayName);

    const userRef = doc(this.firestore, `users/${uid}`);
    const userData: UserData = {
      uid,
      email,
      displayName
    };
    setDoc(userRef, userData, { merge: true }).then(res => {
      console.log('res', res);
    }).catch(err => {
      console.log('err', err);

    })
  }
}


interface UserData {
  uid: string;
  email: string;
  displayName: string;
}
