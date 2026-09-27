import { provideHttpClient, HttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { fakeAsync, flushMicrotasks, TestBed } from '@angular/core/testing';
import { client } from '../../api/generated/client.gen';
import { LedgerService } from './ledger.service';

describe('LedgerService Worker API', () => {
  let service: LedgerService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    client.setConfig({ httpClient: TestBed.inject(HttpClient) });
    service = TestBed.inject(LedgerService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('讀完分頁並轉換日期、TWD 小數金額與標籤', fakeAsync(() => {
    let result: Awaited<ReturnType<LedgerService['getTodayExpenseList']>> | undefined;
    service.getTodayExpenseList(new Date(2026, 8, 27))
      .then(items => { result = items; });
    flushMicrotasks();

    const first = http.expectOne(request => request.url.startsWith('/api/v1/entries?'));
    const firstQuery = new URL(first.request.url, 'http://localhost').searchParams;
    expect(firstQuery.get('kind')).toBe('expense');
    expect(firstQuery.get('limit')).toBe('100');
    first.flush({ items: [{
      id: 'entry-1', kind: 'expense', occurredAtMs: 1790438400000,
      amountMinor: 1234, currencyCode: 'TWD', currencyScale: 2,
      tagId: 'tag-1', description: '午餐',
      tag: { id: 'tag-1', kind: 'expense', name: '餐飲', iconName: 'fas fa-utensils', sortOrder: 0, archivedAtMs: null },
    }], nextCursor: 'page-2' });
    flushMicrotasks();

    const second = http.expectOne(request => request.url.startsWith('/api/v1/entries?'));
    expect(new URL(second.request.url, 'http://localhost').searchParams.get('cursor')).toBe('page-2');
    second.flush({ items: [], nextCursor: null });
    flushMicrotasks();

    expect(result?.length).toBe(1);
    expect(result?.[0].date).toEqual(new Date(1790438400000));
    expect(result?.[0].price).toBe('12.34');
    expect(result?.[0].tagInfo.tagName).toBe('餐飲');
  }));

  it('新增記帳時以最小幣值單位傳送小數金額', fakeAsync(() => {
    let savedId = '';
    service.addExpense({
      date: new Date(1790438400000), price: '12.34',
      tagId: 'tag-1', description: '午餐',
    }).then(item => { savedId = item.id; });
    flushMicrotasks();

    const request = http.expectOne(req => req.url === '/api/v1/entries');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({
      kind: 'expense', occurredAtMs: 1790438400000, amountMinor: 1234,
      currencyCode: 'TWD', currencyScale: 2, tagId: 'tag-1', description: '午餐',
    });
    request.flush({
      id: 'entry-1', ...request.request.body,
      tag: { id: 'tag-1', kind: 'expense', name: '餐飲', iconName: 'fas fa-utensils', sortOrder: 0, archivedAtMs: null },
    });
    flushMicrotasks();
    expect(savedId).toBe('entry-1');
  }));
});
