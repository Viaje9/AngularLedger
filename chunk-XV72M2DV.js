import{Bb as d,C as S,Db as m,Eb as g,F as j,Fb as D,G as R,Gb as c,Hb as y,I as k,Jb as $,K as O,Kb as v,Lb as f,Nb as b,Ob as p,Pb as P,ca as A,e as I,f as T,h as x,j as E,l as w,o as C,p as l,x as _,xb as B,yb as h,zb as U}from"./chunk-JSKYAQZL.js";var Q=function(t){return t.Expense="expense",t.Income="income",t}(Q||{});var W=j;function X(t){return!!t[W]}var ee=Symbol("__destroy"),M=Symbol("__decoratorApplied");function q(t){return typeof t=="string"?Symbol(`__destroy__${t}`):ee}function te(t){t.prototype[M]=!0}function Z(t,o){t[o]||(t[o]=new x)}function G(t,o){t[o]&&(t[o].next(),t[o].complete(),t[o]=null)}function V(t){t instanceof T&&t.unsubscribe()}function oe(t){Array.isArray(t)&&t.forEach(V)}function Y(t,o){return function(){if(t&&t.call(this),G(this,q()),o.arrayName&&oe(this[o.arrayName]),o.checkProperties)for(let i in this)o.blackList?.includes(i)||V(this[i])}}function re(t,o){t.prototype.ngOnDestroy=Y(t.prototype.ngOnDestroy,o)}function se(t,o){let i=t.\u0275pipe;i.onDestroy=Y(i.onDestroy,o)}function he(t={}){return o=>{X(o)?se(o,t):re(o,t),te(o)}}var F=7,H=Symbol("CheckerHasBeenSet");function ne(t,o){t[H]||ie()||(N(()=>w(Promise.resolve()).pipe(l(()=>{let i;try{i=A(t)}catch{i=null}let e=i?.lView;if(e==null)return E;let r=e[F]||(e[F]=[]),s=new x;return r.push(function(){N(()=>{s.next(),s.complete()})}),s}),l(()=>Promise.resolve())).subscribe(()=>{(o.observed??o.observers.length>0)&&console.warn(ce(t))})),t[H]=!0)}function ie(){return typeof __karma__<"u"&&!!__karma__||typeof jasmine<"u"&&!!jasmine||typeof jest<"u"&&!!jest||typeof Mocha<"u"&&!!Mocha||typeof process<"u"&&Object.prototype.toString.call(process)==="[object process]"}function N(t){let o=k.Zone;return!!o&&typeof o.root?.run=="function"?o.root.run(t):t()}function ce(t){return`
  The ${t.constructor.name} still has subscriptions that haven't been unsubscribed.
  This may happen if the class extends another class decorated with @UntilDestroy().
  The child class implements its own ngOnDestroy() method but doesn't call super.ngOnDestroy().
  Let's look at the following example:
  @UntilDestroy()
  @Directive()
  export abstract class BaseDirective {}
  @Component({ template: '' })
  export class ConcreteComponent extends BaseDirective implements OnDestroy {
    constructor() {
      super();
      someObservable$.pipe(untilDestroyed(this)).subscribe();
    }
    ngOnDestroy(): void {
      // Some logic here...
    }
  }
  The BaseDirective.ngOnDestroy() will not be called since Angular will call ngOnDestroy()
  on the ConcreteComponent, but not on the BaseDirective.
  One of the solutions is to declare an empty ngOnDestroy method on the BaseDirective:
  @UntilDestroy()
  @Directive()
  export abstract class BaseDirective {
    ngOnDestroy(): void {}
  }
  @Component({ template: '' })
  export class ConcreteComponent extends BaseDirective implements OnDestroy {
    constructor() {
      super();
      someObservable$.pipe(untilDestroyed(this)).subscribe();
    }
    ngOnDestroy(): void {
      // Some logic here...
      super.ngOnDestroy();
    }
  }
  `}var L=!1;function ae(t,o,i){let e=t[o];if(L&&typeof e!="function")throw new Error(`${t.constructor.name} is using untilDestroyed but doesn't implement ${o}`);Z(t,i),t[o]=function(){e.apply(this,arguments),G(this,i),t[o]=e}}function me(t,o){return i=>{let e=q(o);typeof o=="string"?ae(t,o,e):(L&&ue(t),Z(t,e));let r=t[e];return L&&ne(t,r),i.pipe(S(r))}}function ue(t){let o=Object.getPrototypeOf(t);if(!(M in o))throw new Error("untilDestroyed operator cannot be used inside directives or components or providers that are not decorated with UntilDestroy decorator")}var Ce=(()=>{let o=class o{constructor(e,r){this.firestore=e,this.auth=r,this.tagsCollection=g(this.firestore,this.tagsPath),this.expenseListCollection=g(this.firestore,this.expenseListPath),this.incomeListCollection=g(this.firestore,this.incomeListPath)}get tagsPath(){return`users/${this.auth.userUid}/tags`}get expenseListPath(){return`users/${this.auth.userUid}/expenseList`}get incomeListPath(){return`users/${this.auth.userUid}/incomeList`}getTagList(e){return d(f(this.tagsCollection,p("transactionType","==",e),v("sort","asc")),{idField:"id"})}getTagInfo(e){let r=c(this.firestore,this.tagsPath,e);return y(r)}getTagLastSort(e){return d(f(this.tagsCollection,p("transactionType","==",e),v("sort","desc"),$(1))).pipe(C(r=>r.length?r[0].sort+1:0)).pipe(_(1))}addTagDoc(e){return m(this.tagsCollection,e)}updateTagDoc(e,r,s){let n=c(this.firestore,this.tagsPath,e);return b(n,{tagName:s,tagIconName:r})}removeTagDoc(e){let r=c(this.firestore,this.tagsPath,e);return D(r)}updateTagsSort(e){let r=P(this.firestore);return e.forEach(s=>{let n=c(this.firestore,this.tagsPath,s.id);r.update(n,{sort:s.sort})}),r.commit()}update(e){let r=P(this.firestore);return e.forEach(s=>{let n=c(this.firestore,this.tagsPath,s.id);r.update(n,{sort:s.sort,tagName:s.tagName,tagIconName:s.tagIconName,transactionType:s.transactionType})}),r.commit()}getExpenseInfo(e){let r=c(this.firestore,this.expenseListPath,e);return y(r)}addExpense(e){return m(this.expenseListCollection,e)}updateExpense(e){let r=c(this.firestore,this.expenseListPath,e.docId);return b(r,{date:e.date,price:e.price,tagId:e.tagId,description:e.description})}deleteExpense(e){let r=c(this.firestore,this.expenseListPath,e);return D(r)}getTodayExpenseList(e){return d(f(this.expenseListCollection,...this.queryDate(e,"date")),{idField:"id"}).pipe(l(r=>I(this,null,function*(){let s=[];for(let n of r){let a=n,u=yield this.getTagInfo(a.tagId);n.tagInfo=u?.data()||{},s.push(n)}return s})))}getTodayIncomeList(e){return d(f(this.incomeListCollection,...this.queryDate(e,"date")),{idField:"id"}).pipe(l(r=>I(this,null,function*(){let s=[];for(let n of r){let a=n,u=yield this.getTagInfo(a.tagId);n.tagInfo=u?.data()||{},s.push(n)}return s})))}getIncomeInfo(e){let r=c(this.firestore,this.incomeListPath,e);return y(r)}addIncome(e){return m(this.incomeListCollection,e)}updateIncome(e){let r=c(this.firestore,this.incomeListPath,e.docId);return b(r,{date:e.date,price:e.price,tagId:e.tagId,description:e.description})}deleteIncome(e){let r=c(this.firestore,this.incomeListPath,e);return D(r)}getBudgetAmount(e,r){console.log(e);let s=structuredClone(e);s.setHours(0,0,0,0);let n=h.fromDate(s),a=structuredClone(r);a.setHours(23,59,59,999);let u=h.fromDate(a);return d(f(this.expenseListCollection,p("date",">=",n),p("date","<=",u)),{idField:"id"}).pipe(C(z=>z.reduce((J,K)=>J+parseInt(K.price),0)))}queryDate(e,r){let s=structuredClone(e);s.setHours(0,0,0,0);let n=h.fromDate(s),a=structuredClone(e);a.setHours(23,59,59,999);let u=h.fromDate(a);return[p(r,">=",n),p(r,"<=",u)]}};o.\u0275fac=function(r){return new(r||o)(O(U),O(B))},o.\u0275prov=R({token:o,factory:o.\u0275fac,providedIn:"root"});let t=o;return t})();export{Q as a,he as b,me as c,Ce as d};
