import{Ab as l,C as S,Cb as d,Db as m,Eb as g,F as j,Fb as c,G as R,Gb as D,I as k,Ib as $,Jb as P,K as v,Kb as f,Mb as y,Nb as h,Ob as C,ca as A,e as b,f as L,h as I,j as T,l as E,o as w,p as u,wb as B,x as _,xb as x,yb as U}from"./chunk-IGXZ44CT.js";var z=function(e){return e.Expense="expense",e.Income="income",e}(z||{});var J=j;function K(e){return!!e[J]}var Q=Symbol("__destroy"),M=Symbol("__decoratorApplied");function q(e){return typeof e=="string"?Symbol(`__destroy__${e}`):Q}function W(e){e.prototype[M]=!0}function Z(e,o){e[o]||(e[o]=new I)}function G(e,o){e[o]&&(e[o].next(),e[o].complete(),e[o]=null)}function V(e){e instanceof L&&e.unsubscribe()}function X(e){Array.isArray(e)&&e.forEach(V)}function Y(e,o){return function(){if(e&&e.call(this),G(this,q()),o.arrayName&&X(this[o.arrayName]),o.checkProperties)for(let n in this)o.blackList?.includes(n)||V(this[n])}}function ee(e,o){e.prototype.ngOnDestroy=Y(e.prototype.ngOnDestroy,o)}function te(e,o){let n=e.\u0275pipe;n.onDestroy=Y(n.onDestroy,o)}function le(e={}){return o=>{K(o)?te(o,e):ee(o,e),W(o)}}var F=7,N=Symbol("CheckerHasBeenSet");function oe(e,o){e[N]||re()||(H(()=>E(Promise.resolve()).pipe(u(()=>{let n;try{n=A(e)}catch{n=null}let t=n?.lView;if(t==null)return T;let r=t[F]||(t[F]=[]),s=new I;return r.push(function(){H(()=>{s.next(),s.complete()})}),s}),u(()=>Promise.resolve())).subscribe(()=>{(o.observed??o.observers.length>0)&&console.warn(se(e))})),e[N]=!0)}function re(){return typeof __karma__<"u"&&!!__karma__||typeof jasmine<"u"&&!!jasmine||typeof jest<"u"&&!!jest||typeof Mocha<"u"&&!!Mocha||typeof process<"u"&&Object.prototype.toString.call(process)==="[object process]"}function H(e){let o=k.Zone;return!!o&&typeof o.root?.run=="function"?o.root.run(e):e()}function se(e){return`
  The ${e.constructor.name} still has subscriptions that haven't been unsubscribed.
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
  `}var O=!1;function ne(e,o,n){let t=e[o];if(O&&typeof t!="function")throw new Error(`${e.constructor.name} is using untilDestroyed but doesn't implement ${o}`);Z(e,n),e[o]=function(){t.apply(this,arguments),G(this,n),e[o]=t}}function fe(e,o){return n=>{let t=q(o);typeof o=="string"?ne(e,o,t):(O&&ie(e),Z(e,t));let r=e[t];return O&&oe(e,r),n.pipe(S(r))}}function ie(e){let o=Object.getPrototypeOf(e);if(!(M in o))throw new Error("untilDestroyed operator cannot be used inside directives or components or providers that are not decorated with UntilDestroy decorator")}var be=(()=>{let o=class o{constructor(t,r){this.firestore=t,this.auth=r,this.tagsCollection=m(this.firestore,this.tagsPath),this.expenseListCollection=m(this.firestore,this.expenseListPath),this.incomeListCollection=m(this.firestore,this.incomeListPath)}get tagsPath(){return`users/${this.auth.userUid}/tags`}get expenseListPath(){return`users/${this.auth.userUid}/expenseList`}get incomeListPath(){return`users/${this.auth.userUid}/incomeList`}getTagList(t){return l(f(this.tagsCollection,h("transactionType","==",t),P("sort","asc")),{idField:"id"})}getTagInfo(t){let r=c(this.firestore,this.tagsPath,t);return D(r)}getTagLastSort(t){return l(f(this.tagsCollection,h("transactionType","==",t),P("sort","desc"),$(1))).pipe(w(r=>r.length?r[0].sort+1:0)).pipe(_(1))}addTagDoc(t){return d(this.tagsCollection,t)}updateTagDoc(t,r,s){let i=c(this.firestore,this.tagsPath,t);return y(i,{tagName:s,tagIconName:r})}removeTagDoc(t){let r=c(this.firestore,this.tagsPath,t);return g(r)}updateTagsSort(t){let r=C(this.firestore);return t.forEach(s=>{let i=c(this.firestore,this.tagsPath,s.id);r.update(i,{sort:s.sort})}),r.commit()}update(t){let r=C(this.firestore);return t.forEach(s=>{let i=c(this.firestore,this.tagsPath,s.id);r.update(i,{sort:s.sort,tagName:s.tagName,tagIconName:s.tagIconName,transactionType:s.transactionType})}),r.commit()}getExpenseInfo(t){let r=c(this.firestore,this.expenseListPath,t);return D(r)}addExpense(t){return d(this.expenseListCollection,t)}updateExpense(t){let r=c(this.firestore,this.expenseListPath,t.docId);return y(r,{date:t.date,price:t.price,tagId:t.tagId,description:t.description})}deleteExpense(t){let r=c(this.firestore,this.expenseListPath,t);return g(r)}getTodayExpenseList(t){return l(f(this.expenseListCollection,...this.queryDate(t,"date")),{idField:"id"}).pipe(u(r=>b(this,null,function*(){let s=[];for(let i of r){let a=i,p=yield this.getTagInfo(a.tagId);i.tagInfo=p?.data()||{},s.push(i)}return s})))}getTodayIncomeList(t){return l(f(this.incomeListCollection,...this.queryDate(t,"date")),{idField:"id"}).pipe(u(r=>b(this,null,function*(){let s=[];for(let i of r){let a=i,p=yield this.getTagInfo(a.tagId);i.tagInfo=p?.data()||{},s.push(i)}return s})))}getIncomeInfo(t){let r=c(this.firestore,this.incomeListPath,t);return D(r)}addIncome(t){return d(this.incomeListCollection,t)}updateIncome(t){let r=c(this.firestore,this.incomeListPath,t.docId);return y(r,{date:t.date,price:t.price,tagId:t.tagId,description:t.description})}deleteIncome(t){let r=c(this.firestore,this.incomeListPath,t);return g(r)}queryDate(t,r){let s=structuredClone(t);s.setHours(0,0,0,0);let i=x.fromDate(s),a=structuredClone(t);a.setHours(23,59,59,999);let p=x.fromDate(a);return[h(r,">=",i),h(r,"<=",p)]}};o.\u0275fac=function(r){return new(r||o)(v(U),v(B))},o.\u0275prov=R({token:o,factory:o.\u0275fac,providedIn:"root"});let e=o;return e})();export{z as a,le as b,fe as c,be as d};
