import { HttpClient, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { fakeAsync, flushMicrotasks, TestBed } from '@angular/core/testing';
import { client } from '../../api/generated/client.gen';
import { AuthService } from './auth.service';
import { PreferencesService } from './preferences.service';

describe('PreferencesService 常用備註快取', () => {
  const accountA = 'account-a';
  const accountB = 'account-b';
  const key = (accountId: string) => `angular-ledger:saved-descriptions:v1:${accountId}`;
  const first = { id: 'note-1', description: '午餐', createdAtMs: 1000 };
  let service: PreferencesService;
  let auth: AuthService;
  let http: HttpTestingController;

  beforeEach(() => {
    localStorage.removeItem(key(accountA));
    localStorage.removeItem(key(accountB));
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    client.setConfig({ httpClient: TestBed.inject(HttpClient) });
    auth = TestBed.inject(AuthService);
    auth.accountId = accountA;
    service = TestBed.inject(PreferencesService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
    localStorage.removeItem(key(accountA));
    localStorage.removeItem(key(accountB));
  });

  it('第一次從 API 取得後存入帳本專屬快取', fakeAsync(() => {
    expect(service.cachedDescriptions()).toBeNull();
    let result: Awaited<ReturnType<PreferencesService['refreshDescriptions']>> | undefined;
    service.refreshDescriptions().then(items => { result = items; });
    flushMicrotasks();
    http.expectOne('/api/v1/saved-descriptions').flush({ items: [first] });
    flushMicrotasks();

    expect(result).toEqual([first]);
    expect(service.cachedDescriptions()).toEqual([first]);
    expect(service.shouldRefreshDescriptions()).toBeFalse();
    auth.accountId = accountB;
    expect(service.cachedDescriptions()).toBeNull();
    auth.accountId = accountA;
    expect(service.cachedDescriptions()).toEqual([first]);
  }));

  it('新增與刪除同步更新快取，從支出匯入後清除快取', fakeAsync(() => {
    localStorage.setItem(key(accountA), JSON.stringify({ fetchedAtMs: Date.now(), items: [first] }));
    const second = { id: 'note-2', description: '晚餐', createdAtMs: 2000 };

    service.addDescription('晚餐');
    flushMicrotasks();
    http.expectOne('/api/v1/saved-descriptions').flush(second);
    flushMicrotasks();
    expect(service.cachedDescriptions()).toEqual([second, first]);

    service.removeDescription(second.id);
    flushMicrotasks();
    http.expectOne(`/api/v1/saved-descriptions/${second.id}`).flush(null);
    flushMicrotasks();
    expect(service.cachedDescriptions()).toEqual([first]);

    service.saveExpenseDescriptions();
    flushMicrotasks();
    http.expectOne('/api/v1/saved-descriptions/from-entries')
      .flush({ added: 1, alreadyPresent: 0 });
    flushMicrotasks();
    expect(service.cachedDescriptions()).toBeNull();
  }));

  it('快取過期時仍先提供舊清單，再允許重新向 D1 取得資料', () => {
    localStorage.setItem(key(accountA), JSON.stringify({
      fetchedAtMs: Date.now() - 6 * 60 * 1000, items: [first],
    }));
    expect(service.cachedDescriptions()).toEqual([first]);
    expect(service.shouldRefreshDescriptions()).toBeTrue();
  });
});
