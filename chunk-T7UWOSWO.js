import{Bb as Z,Cb as m,D as q,Db as G,Fb as g,G as F,H,Hb as C,Ib as b,J as N,Jb as O,Kb as d,L as E,Lb as L,Mb as w,Ob as V,Pb as S,Sb as p,Ub as P,Vb as f,Wb as _,a as v,b as k,da as M,e as I,f as A,h as x,j as B,l as U,o as T,p as h,x as $}from"./chunk-RLPOEWUH.js";var Lt=(()=>{let o=class o{constructor(t,s){this.firestore=t,this.auth=s,this.tagsCollection=b(this.firestore,this.tagsPath),this.expenseListCollection=b(this.firestore,this.expenseListPath),this.incomeListCollection=b(this.firestore,this.incomeListPath)}get tagsPath(){return`users/${this.auth.userUid}/tags`}get expenseListPath(){return`users/${this.auth.userUid}/expenseList`}get incomeListPath(){return`users/${this.auth.userUid}/incomeList`}getTagList(t){return g(p(this.tagsCollection,f("transactionType","==",t),S("sort","asc")),{idField:"id"})}getTagInfo(t){let s=d(this.firestore,this.tagsPath,t);return L(s)}getTagListWithId(t){return I(this,null,function*(){if(!t.length)return[];let s=this.auth.userUid,n=b(this.firestore,`users/${s}/tags`),r=p(n);return(yield w(r)).docs.map(u=>k(v({},u.data()),{id:u.id})).filter(u=>t.includes(u.id))})}getTagLastSort(t){return g(p(this.tagsCollection,f("transactionType","==",t),S("sort","desc"),V(1))).pipe(T(s=>s.length?s[0].sort+1:0)).pipe($(1))}addTagDoc(t){return C(this.tagsCollection,t)}updateTagDoc(t,s,n){let r=d(this.firestore,this.tagsPath,t);return P(r,{tagName:n,tagIconName:s})}removeTagDoc(t){let s=d(this.firestore,this.tagsPath,t);return O(s)}updateTagsSort(t){let s=_(this.firestore);return t.forEach(n=>{let r=d(this.firestore,this.tagsPath,n.id);s.update(r,{sort:n.sort})}),s.commit()}update(t){let s=_(this.firestore);return t.forEach(n=>{let r=d(this.firestore,this.tagsPath,n.id);s.update(r,{sort:n.sort,tagName:n.tagName,tagIconName:n.tagIconName,transactionType:n.transactionType})}),s.commit()}getExpenseInfo(t){let s=d(this.firestore,this.expenseListPath,t);return L(s)}addExpense(t){return C(this.expenseListCollection,t)}updateExpense(t){let s=d(this.firestore,this.expenseListPath,t.docId);return P(s,{date:t.date,price:t.price,tagId:t.tagId,description:t.description})}deleteExpense(t){let s=d(this.firestore,this.expenseListPath,t);return O(s)}getTodayExpenseList(t){return g(p(this.expenseListCollection,...this.queryDate(t,"date")),{idField:"id"}).pipe(h(s=>I(this,null,function*(){let n=[],r=s.map(i=>i.tagId),a=yield this.getTagListWithId(r);for(let i of s){let u=i,l=a.find(D=>D.id===u.tagId);i.tagInfo=l||{},n.push(i)}return n})))}getTodayIncomeList(t){return g(p(this.incomeListCollection,...this.queryDate(t,"date")),{idField:"id"}).pipe(h(s=>I(this,null,function*(){let n=[],r=s.map(i=>i.tagId),a=yield this.getTagListWithId(r);for(let i of s){let u=i,l=a.find(D=>D.id===u.tagId);i.tagInfo=l||{},n.push(i)}return n})))}getIncomeInfo(t){let s=d(this.firestore,this.incomeListPath,t);return L(s)}addIncome(t){return C(this.incomeListCollection,t)}updateIncome(t){let s=d(this.firestore,this.incomeListPath,t.docId);return P(s,{date:t.date,price:t.price,tagId:t.tagId,description:t.description})}deleteIncome(t){let s=d(this.firestore,this.incomeListPath,t);return O(s)}getBudgetAmount(t,s){let n=structuredClone(t);n.setHours(0,0,0,0);let r=m.fromDate(n),a=structuredClone(s);a.setHours(23,59,59,999);let i=m.fromDate(a);return g(p(this.expenseListCollection,f("date",">=",r),f("date","<=",i)),{idField:"id"}).pipe(T(u=>u.reduce((l,D)=>l+parseInt(D.price),0)))}getRangeItems(t,s){let n=structuredClone(t);n.setHours(0,0,0,0);let r=m.fromDate(n),a=structuredClone(s);a.setHours(23,59,59,999);let i=m.fromDate(a);return g(p(this.expenseListCollection,f("date",">=",r),f("date","<=",i)),{idField:"id"}).pipe(h(u=>I(this,null,function*(){let l=p(this.tagsCollection),st=(yield w(l)).docs.map(y=>v({id:y.id},y.data())),R=[];for(let y of u){let ot=y,nt=st.find(rt=>rt.id===ot.tagId);y.tagInfo=nt||{},R.push(y)}return R})))}queryDate(t,s){let n=structuredClone(t);n.setHours(0,0,0,0);let r=m.fromDate(n),a=structuredClone(t);a.setHours(23,59,59,999);let i=m.fromDate(a);return[f(s,">=",r),f(s,"<=",i)]}};o.\u0275fac=function(s){return new(s||o)(E(G),E(Z))},o.\u0275prov=H({token:o,factory:o.\u0275fac,providedIn:"root"});let e=o;return e})();var it=F;function ct(e){return!!e[it]}var at=Symbol("__destroy"),J=Symbol("__decoratorApplied");function K(e){return typeof e=="string"?Symbol(`__destroy__${e}`):at}function ut(e){e.prototype[J]=!0}function Q(e,o){e[o]||(e[o]=new x)}function X(e,o){e[o]&&(e[o].next(),e[o].complete(),e[o]=null)}function tt(e){e instanceof A&&e.unsubscribe()}function dt(e){Array.isArray(e)&&e.forEach(tt)}function et(e,o){return function(){if(e&&e.call(this),X(this,K()),o.arrayName&&dt(this[o.arrayName]),o.checkProperties)for(let c in this)o.blackList?.includes(c)||tt(this[c])}}function pt(e,o){e.prototype.ngOnDestroy=et(e.prototype.ngOnDestroy,o)}function ft(e,o){let c=e.\u0275pipe;c.onDestroy=et(c.onDestroy,o)}function wt(e={}){return o=>{ct(o)?ft(o,e):pt(o,e),ut(o)}}var W=7,Y=Symbol("CheckerHasBeenSet");function lt(e,o){e[Y]||ht()||(z(()=>U(Promise.resolve()).pipe(h(()=>{let c;try{c=M(e)}catch{c=null}let t=c?.lView;if(t==null)return B;let s=t[W]||(t[W]=[]),n=new x;return s.push(function(){z(()=>{n.next(),n.complete()})}),n}),h(()=>Promise.resolve())).subscribe(()=>{(o.observed??o.observers.length>0)&&console.warn(mt(e))})),e[Y]=!0)}function ht(){return typeof __karma__<"u"&&!!__karma__||typeof jasmine<"u"&&!!jasmine||typeof jest<"u"&&!!jest||typeof Mocha<"u"&&!!Mocha||typeof process<"u"&&Object.prototype.toString.call(process)==="[object process]"}function z(e){let o=N.Zone;return!!o&&typeof o.root?.run=="function"?o.root.run(e):e()}function mt(e){return`
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
  `}var j=!1;function gt(e,o,c){let t=e[o];if(j&&typeof t!="function")throw new Error(`${e.constructor.name} is using untilDestroyed but doesn't implement ${o}`);Q(e,c),e[o]=function(){t.apply(this,arguments),X(this,c),e[o]=t}}function St(e,o){return c=>{let t=K(o);typeof o=="string"?gt(e,o,t):(j&&Dt(e),Q(e,t));let s=e[t];return j&&lt(e,s),c.pipe(q(s))}}function Dt(e){let o=Object.getPrototypeOf(e);if(!(J in o))throw new Error("untilDestroyed operator cannot be used inside directives or components or providers that are not decorated with UntilDestroy decorator")}export{Lt as a,wt as b,St as c};
