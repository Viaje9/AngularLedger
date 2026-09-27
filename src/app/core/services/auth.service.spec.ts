import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { fakeAsync, flushMicrotasks, TestBed } from '@angular/core/testing';
import { client } from '../../api/generated/client.gen';
import { authFailureInterceptor } from '../interceptors/auth-failure.interceptor';
import { AuthService } from './auth.service';

describe('AuthService 導覽登入狀態', () => {
  let auth: AuthService;
  let http: HttpTestingController;
  let httpClient: HttpClient;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authFailureInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    httpClient = TestBed.inject(HttpClient);
    client.setConfig({ httpClient });
    auth = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('同時的檢查共用一次請求，成功後換頁不再請求 /me', fakeAsync(() => {
    let first: boolean | undefined;
    let second: boolean | undefined;
    auth.isSignedIn().then(value => first = value);
    auth.isSignedIn().then(value => second = value);
    flushMicrotasks();

    http.expectOne('/api/v1/me').flush({ account: { id: 'account-1' } });
    flushMicrotasks();
    expect(first).toBeTrue();
    expect(second).toBeTrue();
    expect(auth.accountId).toBe('account-1');

    auth.isSignedIn().then(value => first = value);
    flushMicrotasks();
    expect(first).toBeTrue();
    http.expectNone('/api/v1/me');
  }));

  it('API 回 401 後清掉狀態，下次檢查重新請求 /me', fakeAsync(() => {
    auth.isSignedIn();
    flushMicrotasks();
    http.expectOne('/api/v1/me').flush({ account: { id: 'account-1' } });
    flushMicrotasks();

    httpClient.get('/api/v1/tags').subscribe({ error: () => undefined });
    http.expectOne('/api/v1/tags').flush(
      { error: { code: 'UNAUTHENTICATED' } },
      { status: 401, statusText: 'Unauthorized' },
    );
    expect(auth.accountId).toBeNull();

    auth.isSignedIn();
    flushMicrotasks();
    http.expectOne('/api/v1/me').flush({ account: { id: 'account-2' } });
    flushMicrotasks();
    expect(auth.accountId).toBe('account-2');
  }));

  it('失效前尚未完成的 /me 不能恢復舊身分', fakeAsync(() => {
    let signedIn: boolean | undefined;
    auth.isSignedIn().then(value => signedIn = value);
    flushMicrotasks();
    const pending = http.expectOne('/api/v1/me');

    auth.invalidate();
    pending.flush({ account: { id: 'old-account' } });
    flushMicrotasks();
    expect(signedIn).toBeFalse();
    expect(auth.accountId).toBeNull();
  }));
});
