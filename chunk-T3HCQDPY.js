import{a as R}from"./chunk-GLGDLUNE.js";import{a as fe,b as se,f as ve,g as _e,h as we,q as xe}from"./chunk-OYZCVYSU.js";import{a as x,b as he}from"./chunk-TNTRPJKC.js";import{$a as pe,$c as U,Bb as ge,Ca as g,Ea as h,Ia as y,J as A,Ja as S,Ka as I,La as re,Ma as l,N as B,Na as L,Oa as E,Oc as $,Pa as b,Qa as M,Ra as V,Rc as q,T as d,Ta as G,U as p,Ua as K,Va as j,Wa as Y,Wc as J,Xa as oe,ad as ae,ca as m,d as le,da as f,db as W,e as X,hb as me,hd as z,ib as Ve,k as de,ka as O,mb as N,na as C,nb as Re,oa as ie,ob as k,pb as ue,ra as ne,sb as Q,ta as H,ua as T,va as D,wa as o,xa as c,ya as u,za as _}from"./chunk-2QOMN4PE.js";var Ae=(()=>{let t=class t{ngOnInit(){}};t.\u0275fac=function(n){return new(n||t)},t.\u0275cmp=B({type:t,selectors:[["app-ledger"]],standalone:!0,features:[G],decls:1,vars:0,template:function(n,i){n&1&&u(0,"router-outlet")},dependencies:[Ve,Re],styles:["[_nghost-%COMP%]{display:block}"]});let a=t;return a})();var be=le(fe());var Ne=["scrollTags"],Qe=["tagGroup"],$e=["templateRef"],qe=["priceInput"],Je=["descriptionInput"],Ue=(a,t)=>t.id,ze=a=>({"bg-neutral-300":a}),He=a=>({"bg-gray-900":a});function Ke(a,t){if(a&1){let r=_();o(0,"div",25),g("click",function(){let n=d(r).$implicit,i=h(2);return p(i.onTagClick(n.id))}),u(1,"i",26),o(2,"p"),l(3),c()()}if(a&2){let r=t.$implicit,e=h(2);C("ngClass",K(3,ze,r.id===e.selectedTagId)),m(),C("ngClass",r.tagIconName),m(2),L(r.tagName)}}function Xe(a,t){if(a&1&&(o(0,"div",15,3)(2,"div",23),T(3,Ke,4,5,"div",24,Ue),c()()),a&2){let r=t.$implicit;m(3),D(r)}}function Ze(a,t){if(a&1&&u(0,"div",17),a&2){let r=t.$index,e=h();C("ngClass",K(1,He,e.currentTagGroupPage===r))}}function et(a,t){if(a&1){let r=_();o(0,"textarea",27,4),V("ngModelChange",function(n){d(r);let i=h();return M(i.description,n)||(i.description=n),p(n)}),c()}if(a&2){let r=h();b("ngModel",r.description)}}var Be=(()=>{let t=class t{constructor(e,n,i,s,v,w){this.route=e,this.router=n,this.modalService=i,this.loaderService=s,this.ledgerService=v,this.changeDetectorRef=w,this.maxTagGroupPage=0,this.currentTagGroupPage=0,this.translateFactor="translate(0, 0)",this.tagsGroup=[],this.selectedTagId="",this.description="",this.tagsGroup=this.route.snapshot.data.tagListGroup;let te=this.route.snapshot.queryParamMap.get("date")||"";se(te)?this.date=ge.fromDate((0,be.default)(te,"YYYY-MM-DD").toDate()):this.router.navigate(["/"])}ngOnInit(){let{price:e,description:n}=this.route.snapshot.queryParams,i=parseInt(e);i>0&&(this.price=i),n&&(this.description=n)}ngAfterViewInit(){let e=this.scrollTagsRef.nativeElement.scrollWidth,n=this.tagGroupRef.nativeElement.scrollWidth;this.maxTagGroupPage=Math.ceil(e/n)}onSwipeRight(){if(this.currentTagGroupPage>0){this.currentTagGroupPage-=1;let e=this.currentTagGroupPage*100;this.translateFactor=`translate(-${e}%, 0)`}}onSwipeLeft(){if(this.currentTagGroupPage<this.maxTagGroupPage-1){this.currentTagGroupPage+=1;let e=this.currentTagGroupPage*100;this.translateFactor=`translate(-${e}%, 0)`}}onTagClick(e){this.selectedTagId===e?this.selectedTagId="":(this.priceInput.nativeElement.focus(),this.selectedTagId=e)}onClickBack(){this.router.navigate(["/"],{queryParams:{date:(0,be.default)(this.date.toDate()).format("YYYY-MM-DD")}})}onClickSave(){return X(this,null,function*(){this.saveCheck()&&(this.loaderService.start(),yield this.ledgerService.addExpense({date:this.date,price:this.price.toString(),tagId:this.selectedTagId,description:this.description}).catch(e=>{this.showError()}).then(()=>{this.onClickBack()}).finally(()=>this.loaderService.stop()))})}onClickEdit(){return X(this,null,function*(){this.saveCheck()&&(this.loaderService.start(),yield this.ledgerService.updateExpense({docId:this.route.snapshot.data.data.docId,date:this.date,price:this.price.toString(),tagId:this.selectedTagId,description:this.description}).catch(e=>{this.showError()}).then(()=>{this.onClickBack()}).finally(()=>this.loaderService.stop()))})}saveCheck(){let e=this.tagsGroup.some(n=>n.some(i=>i.id===this.selectedTagId));return!this.selectedTagId||!this.price||!e?(this.modalService.openConfirm({content:"\u8ACB\u8F38\u5165\u91D1\u984D\u8207\u9078\u64C7\u6A19\u7C64",okText:"\u78BA\u8A8D",showCancelBtn:!1,outsideClose:!0}),!1):!0}onClickDescription(){this.modalService.openConfirm({title:"\u5099\u8A3B",okText:"\u78BA\u8A8D",showCancelBtn:!1,outsideClose:!0,contentTemplateRef:this.templateRef,afterViewInit:()=>{this.changeDetectorRef.detectChanges(),this.descriptionInput?.nativeElement.focus()}})}showError(){this.modalService.openConfirm({content:"\u64CD\u4F5C\u5931\u6557",okText:"\u78BA\u8A8D",showCancelBtn:!1,outsideClose:!0})}};t.\u0275fac=function(n){return new(n||t)(f(N),f(k),f($),f(Q),f(x),f(pe))},t.\u0275cmp=B({type:t,selectors:[["app-add-expense"]],viewQuery:function(n,i){if(n&1&&(y(Ne,5),y(Qe,5),y($e,5),y(qe,5),y(Je,5)),n&2){let s;S(s=I())&&(i.scrollTagsRef=s.first),S(s=I())&&(i.tagGroupRef=s.first),S(s=I())&&(i.templateRef=s.first),S(s=I())&&(i.priceInput=s.first),S(s=I())&&(i.descriptionInput=s.first)}},standalone:!0,features:[G],decls:30,vars:4,consts:[["priceInput",""],["scrollTags",""],["templateRef",""],["tagGroup",""],["descriptionInput",""],[1,"bg-gray-800","text-white","p-4","flex","justify-between","items-center"],[1,"w-10",3,"click"],[1,"fas","fa-arrow-left"],[1,"text-lg"],[1,"bg-gray-600","px-4","py-2","rounded",3,"click"],[1,"bg-red-600","text-center","p-10","flex"],[1,"text-white","text-3xl","me-3","pt-2"],["autocomplete","off","id","tagName","type","number","inputmode","numeric",1,"w-full","text-right","bg-red-600","rounded","border","border-red-700","focus:border-red-500","focus:ring-2","focus:ring-red-900","text-3xl","outline-none","text-gray-100","py-1","px-3","leading-8","transition-colors","duration-200","ease-in-out",3,"ngModelChange","ngModel"],[1,"w-full","overflow-hidden"],[1,"flex","w-full","transition",3,"swipeLeft","swipeRight"],[1,"w-screen","text-center"],[1,"flex","justify-center","my-4"],[1,"mx-2","w-2","h-2","bg-gray-500","rounded-full",3,"ngClass"],[1,"bg-white","py-4","border-t","border-gray-300"],[1,"flex","p-4","border-b","items-center","justify-between",3,"click"],[1,"flex","items-center"],[1,"mr-4","fas","fa-pencil-alt"],[1,"w-3/5","text-ellipsis","overflow-hidden","text-right","text-nowrap"],[1,"flex","w-screen","flex-wrap"],[1,"w-1/3","py-8",3,"ngClass"],[1,"w-1/3","py-8",3,"click","ngClass"],[3,"ngClass"],["rows","10",1,"text-black","w-full","py-1","px-2","focus:border-none","focus:outline-none",3,"ngModelChange","ngModel"]],template:function(n,i){if(n&1){let s=_();o(0,"div",5)(1,"div",6),g("click",function(){return d(s),p(i.onClickBack())}),u(2,"i",7),c(),o(3,"h1",8),l(4,"\u65B0\u589E\u652F\u51FA"),c(),o(5,"button",9),g("click",function(){return d(s),p(i.onClickSave())}),l(6," \u5132\u5B58 "),c()(),o(7,"div",10)(8,"span",11),l(9,"$"),c(),o(10,"input",12,0),V("ngModelChange",function(w){return d(s),M(i.price,w)||(i.price=w),p(w)}),c()(),o(12,"div",13)(13,"div",14,1),g("swipeLeft",function(){return d(s),p(i.onSwipeLeft())})("swipeRight",function(){return d(s),p(i.onSwipeRight())}),T(15,Xe,5,0,"div",15,H),c()(),o(17,"div",16),T(18,Ze,1,3,"div",17,H),c(),o(20,"div",18)(21,"div",19),g("click",function(){return d(s),p(i.onClickDescription())}),o(22,"div",20),u(23,"i",21),o(24,"p"),l(25,"\u5099\u8A3B"),c()(),o(26,"span",22),l(27),c()()(),O(28,et,2,1,"ng-template",null,2,oe)}n&2&&(m(10),b("ngModel",i.price),m(3),ie("transform",i.translateFactor),m(2),D(i.tagsGroup),m(3),D(i.tagsGroup),m(9),E(" ",i.description," "))},dependencies:[z,W,q,ae,J,U],styles:[".icon[_ngcontent-%COMP%]{width:40px;height:40px;background-color:#d1d5db;-webkit-mask-size:cover;mask-size:cover;display:inline-block}.active-icon[_ngcontent-%COMP%]{background-color:#111827}.transition[_ngcontent-%COMP%]{transform:all .8s ease-out}"]});let a=t;return a})();var Le=()=>A(x).getTagList(R.Expense).then(t=>t.reduce((e,n,i)=>{let s=Math.floor(i/9);return e[s]?e[s].push(n):e[s]=[n],e},[]));var P=function(a){return a.Add="add",a.Edit="edit",a}(P||{});var tt=["scrollTags"],it=["tagGroup"],nt=["templateRef"],rt=["priceInput"],ot=(a,t)=>t.id,at=a=>({"bg-neutral-300":a}),st=a=>({"bg-gray-900":a});function ct(a,t){if(a&1){let r=_();o(0,"button",22),g("click",function(){d(r);let n=h();return p(n.onClickSave())}),l(1," \u5132\u5B58 "),c()}}function lt(a,t){if(a&1){let r=_();o(0,"button",22),g("click",function(){d(r);let n=h();return p(n.onClickEdit())}),l(1," \u5132\u5B58 "),c()}}function dt(a,t){if(a&1){let r=_();o(0,"div",25),g("click",function(){let n=d(r).$implicit,i=h(2);return p(i.onTagClick(n.id))}),u(1,"i",26),o(2,"p"),l(3),c()()}if(a&2){let r=t.$implicit,e=h(2);C("ngClass",K(3,at,r.id===e.selectedTagId)),m(),C("ngClass",r.tagIconName),m(2),L(r.tagName)}}function pt(a,t){if(a&1&&(o(0,"div",14,3)(2,"div",23),T(3,dt,4,5,"div",24,ot),c()()),a&2){let r=t.$implicit;m(3),D(r)}}function mt(a,t){if(a&1&&u(0,"div",27),a&2){let r=t.$index,e=h(2);C("ngClass",K(1,st,e.currentTagGroupPage===r))}}function ut(a,t){if(a&1&&T(0,mt,1,3,"div",27,H),a&2){let r=h();D(r.tagsGroup)}}function gt(a,t){if(a&1){let r=_();o(0,"div",28),g("click",function(){d(r);let n=h();return p(n.onClickDelete())}),u(1,"i",29),o(2,"p",30),l(3,"\u522A\u9664"),c()()}}function ft(a,t){if(a&1){let r=_();o(0,"textarea",31),V("ngModelChange",function(n){d(r);let i=h();return M(i.description,n)||(i.description=n),p(n)}),c()}if(a&2){let r=h();b("ngModel",r.description)}}var Ge=(()=>{let t=class t{get StatusEnum(){return P}constructor(e,n,i,s,v){if(this.route=e,this.router=n,this.modalService=i,this.loaderService=s,this.ledgerService=v,this.maxTagGroupPage=0,this.currentTagGroupPage=0,this.translateFactor="translate(0, 0)",this.tagsGroup=[],this.selectedTagId="",this.description="",this.tagsGroup=this.route.snapshot.data.tagListGroup,this.incomeStatus=this.route.snapshot.data.data.incomeStatus,this.incomeStatus===P.Edit){let w=this.route.snapshot.data.data;this.price=parseInt(w.price),this.selectedTagId=w.tagId,this.description=w.description,this.date=w.date}else this.incomeStatus===P.Add&&(this.date=this.route.snapshot.data.data.date)}ngOnInit(){}ngAfterViewInit(){let e=this.scrollTagsRef.nativeElement.scrollWidth,n=this.tagGroupRef.nativeElement.scrollWidth;this.maxTagGroupPage=Math.ceil(e/n)}onSwipeRight(){if(this.currentTagGroupPage>0){this.currentTagGroupPage-=1;let e=this.currentTagGroupPage*100;this.translateFactor=`translate(-${e}%, 0)`}}onSwipeLeft(){if(this.currentTagGroupPage<this.maxTagGroupPage-1){this.currentTagGroupPage+=1;let e=this.currentTagGroupPage*100;this.translateFactor=`translate(-${e}%, 0)`}}onTagClick(e){this.selectedTagId===e?this.selectedTagId="":(this.priceInput.nativeElement.focus(),this.selectedTagId=e)}onClickBack(){this.router.navigateByUrl("/",{state:{transactionType:R.Income,date:this.date.toDate()}})}onClickSave(){return X(this,null,function*(){this.saveCheck()&&(this.loaderService.start(),yield this.ledgerService.addIncome({date:this.date,price:this.price.toString(),tagId:this.selectedTagId,description:this.description}).catch(e=>{console.error("Error adding document: ",e)}).then(()=>{this.router.navigateByUrl("/",{state:{transactionType:R.Income,date:this.date.toDate()}})}).finally(()=>this.loaderService.stop()))})}onClickEdit(){return X(this,null,function*(){this.saveCheck()&&(this.loaderService.start(),yield this.ledgerService.updateIncome({docId:this.route.snapshot.data.data.docId,date:this.date,price:this.price.toString(),tagId:this.selectedTagId,description:this.description}).catch(e=>{console.error("Error updating document: ",e)}).then(()=>{this.router.navigateByUrl("/",{state:{transactionType:R.Income,date:this.date.toDate()}})}).finally(()=>this.loaderService.stop()))})}saveCheck(){return!this.selectedTagId||!this.price?(this.modalService.openConfirm({content:"\u8ACB\u8F38\u5165\u91D1\u984D\u8207\u9078\u64C7\u6A19\u7C64",okText:"\u78BA\u8A8D",showCancelBtn:!1,outsideClose:!0}),!1):!0}onClickDescription(){this.modalService.openConfirm({title:"\u5099\u8A3B",okText:"\u78BA\u8A8D",showCancelBtn:!1,outsideClose:!0,contentTemplateRef:this.templateRef})}onClickDelete(){this.modalService.openConfirm({content:"\u78BA\u8A8D\u522A\u9664\uFF1F",outsideClose:!0,onOk:()=>{this.doDelete()}})}doDelete(){this.loaderService.start(),this.ledgerService.deleteIncome(this.route.snapshot.data.data.docId).then(()=>{this.router.navigateByUrl("/",{state:{transactionType:R.Income,date:this.date.toDate()}})}).finally(()=>this.loaderService.stop())}};t.\u0275fac=function(n){return new(n||t)(f(N),f(k),f($),f(Q),f(x))},t.\u0275cmp=B({type:t,selectors:[["app-add-income"]],viewQuery:function(n,i){if(n&1&&(y(tt,5),y(it,5),y(nt,5),y(rt,5)),n&2){let s;S(s=I())&&(i.scrollTagsRef=s.first),S(s=I())&&(i.tagGroupRef=s.first),S(s=I())&&(i.templateRef=s.first),S(s=I())&&(i.priceInput=s.first)}},standalone:!0,features:[G],decls:30,vars:7,consts:[["priceInput",""],["scrollTags",""],["templateRef",""],["tagGroup",""],[1,"bg-gray-800","text-white","p-4","flex","justify-between","items-center"],[1,"w-10",3,"click"],[1,"fas","fa-arrow-left"],[1,"text-lg"],[1,"bg-gray-600","px-4","py-2","rounded"],[1,"bg-green-600","text-center","p-10","flex"],[1,"text-white","text-3xl","me-3","pt-2"],["autocomplete","off","id","tagName","type","number","inputmode","numeric",1,"w-full","text-right","bg-green-600","rounded","border","border-green-700","focus:border-green-500","focus:ring-2","focus:ring-green-900","text-3xl","outline-none","text-gray-100","py-1","px-3","leading-8","transition-colors","duration-200","ease-in-out",3,"ngModelChange","ngModel"],[1,"w-full","overflow-hidden"],[1,"flex","w-full","transition",3,"swipeLeft","swipeRight"],[1,"w-screen","text-center"],[1,"flex","justify-center","my-4"],[1,"bg-white","py-4","border-t","border-gray-300"],[1,"flex","p-4","border-b","items-center","justify-between",3,"click"],[1,"flex","items-center"],[1,"mr-4","fas","fa-pencil-alt"],[1,"w-3/5","text-ellipsis","overflow-hidden","text-right","text-nowrap"],[1,"flex","p-4","border-b","justify-center","items-center","bg-green-600","text-white","text-2xl"],[1,"bg-gray-600","px-4","py-2","rounded",3,"click"],[1,"flex","w-screen","flex-wrap"],[1,"w-1/3","py-8",3,"ngClass"],[1,"w-1/3","py-8",3,"click","ngClass"],[3,"ngClass"],[1,"mx-2","w-2","h-2","bg-gray-500","rounded-full",3,"ngClass"],[1,"flex","p-4","border-b","justify-center","items-center","bg-green-600","text-white","text-2xl",3,"click"],[1,"fas","fa-trash","mr-2"],[1,""],["rows","10",1,"text-black","w-full",3,"ngModelChange","ngModel"]],template:function(n,i){if(n&1){let s=_();o(0,"div",4)(1,"div",5),g("click",function(){return d(s),p(i.onClickBack())}),u(2,"i",6),c(),o(3,"h1",7),l(4,"\u65B0\u589E\u6536\u5165"),c(),O(5,ct,2,0,"button",8)(6,lt,2,0),c(),o(7,"div",9)(8,"span",10),l(9,"$"),c(),o(10,"input",11,0),V("ngModelChange",function(w){return d(s),M(i.price,w)||(i.price=w),p(w)}),c()(),o(12,"div",12)(13,"div",13,1),g("swipeLeft",function(){return d(s),p(i.onSwipeLeft())})("swipeRight",function(){return d(s),p(i.onSwipeRight())}),T(15,pt,5,0,"div",14,H),c()(),o(17,"div",15),O(18,ut,2,0),c(),o(19,"div",16)(20,"div",17),g("click",function(){return d(s),p(i.onClickDescription())}),o(21,"div",18),u(22,"i",19),o(23,"p"),l(24,"\u5099\u8A3B"),c()(),o(25,"span",20),l(26),c()(),O(27,gt,4,0,"div",21),c(),O(28,ft,1,1,"ng-template",null,2,oe)}n&2&&(m(5),ne(5,i.incomeStatus===i.StatusEnum.Add?5:6),m(5),b("ngModel",i.price),m(3),ie("transform",i.translateFactor),m(2),D(i.tagsGroup),m(3),ne(18,i.tagsGroup.length>1?18:-1),m(8),E(" ",i.description," "),m(),ne(27,i.incomeStatus===i.StatusEnum.Edit?27:-1))},dependencies:[z,W,q,ae,J,U],styles:["[_nghost-%COMP%]{display:block}"]});let a=t;return a})();var Oe=()=>A(x).getTagList(R.Income).then(t=>t.reduce((e,n,i)=>{let s=Math.floor(i/9);return e[s]?e[s].push(n):e[s]=[n],e},[]));var Pe=()=>{let a=A(x),t=A(k),r=t?.getCurrentNavigation()?.extras.state?.incomeStatus;if(r===P.Edit){let e=t?.getCurrentNavigation()?.extras.state?.docId;return a.getIncomeInfo(e).then(n=>{if(n.exists()){let i=n.data();return{incomeStatus:r,docId:e,date:i.date,price:i.price,tagId:i.tagId,description:i.description}}else t.navigate(["/"])})}else if(r===P.Add){let e=t?.getCurrentNavigation()?.extras.state?.date;if(e)return{incomeStatus:r,date:ge.fromDate(e)}}t.navigate(["/"])};var F=le(fe());var _t=(a,t)=>t.id;function wt(a,t){if(a&1){let r=_();o(0,"div",29),g("click",function(){let n=d(r).$implicit,i=h();return p(i.goToEditExpense(n))}),o(1,"span"),u(2,"i",30),o(3,"span"),l(4),c()(),o(5,"span"),l(6),j(7,"number"),c()()}if(a&2){let r=t.$implicit;m(2),C("ngClass",r.tagInfo.tagIconName),m(2),L(r.tagInfo.tagName),m(2),E("$ ",Y(7,3,r.price),"")}}function xt(a,t){if(a&1&&(o(0,"div",19)(1,"div",5)(2,"div",31)(3,"div",32)(4,"span",33),l(5),j(6,"number"),c(),o(7,"span",34),l(8,"\u9031\u671F\u9918\u984D"),c()()(),o(9,"div",31)(10,"div",32)(11,"span",33),l(12),j(13,"number"),c(),o(14,"span",34),l(15,"\u6BCF\u65E5\u5269\u9918"),c()()(),o(16,"div",31)(17,"div",35)(18,"span",33),l(19),j(20,"number"),c(),o(21,"span",34),l(22,"\u5269\u9918\u9810\u7B97"),c()(),l(23," / "),o(24,"div",36)(25,"span",33),l(26),j(27,"number"),c(),o(28,"span",34),l(29,"\u9810\u7B97\u7E3D\u984D"),c()()()()()),a&2){let r=h();m(5),E("$ ",Y(6,4,r.calculateRangeDayBudget()),""),m(7),E("$ ",Y(13,6,r.calculateTodayBudget()),""),m(7),E("$ ",Y(20,8,r.currentRangeBudget),""),m(7),E("$ ",Y(27,10,r.budgetAmount),"")}}var Z,Ee=(Z=class{constructor(t,r,e,n,i){this.router=t,this.loaderService=r,this.ledgerService=e,this.modalService=n,this.activatedRoute=i,this.currentDate=new Date,this.ledgerItems=[],this.showBudget=localStorage.getItem("showBudget")==="1",this.budgetAmount=parseInt(localStorage.getItem("budgetAmount")||"0"),this.currentRangeBudget=0,this.startDate="",this.endDate="";let s=this.activatedRoute.snapshot.queryParams.date;se(s)&&(this.currentDate=(0,F.default)(s,"YYYY-MM-DD").toDate()),this.currentDate.setHours(0,0,0,0)}ngOnInit(){this.countBudget(),this.getExpenseList()}countBudget(){let t=parseInt(localStorage.getItem("selectedDate")||"0");if(t){let r=(0,F.default)(this.currentDate),e,n;r.date()>=t?(e=r.date(t),n=r.add(1,"month").date(t).subtract(1,"day")):(e=r.subtract(1,"month").date(t),n=r.date(t).subtract(1,"day"));let i=e.format("YYYY/MM/DD"),s=n.format("YYYY/MM/DD");i!==this.startDate&&s!==this.endDate&&(this.startDate=i,this.endDate=s,this.ledgerService.getBudgetAmount(e.toDate(),n.toDate()).then(v=>{this.currentRangeBudget=this.budgetAmount-v}))}}calculateDiffRangeDay(){let t=(0,F.default)(this.currentDate);return(0,F.default)(this.endDate,"YYYY/MM/DD").diff(t,"day")+1}calculateRangeDayBudget(){let t=(0,F.default)(this.currentDate),e=(0,F.default)(this.endDate,"YYYY/MM/DD").diff(t,"day")+1;return parseInt((this.currentRangeBudget/e).toFixed())-this.totalAmount()}calculateTodayBudget(){let t=(0,F.default)(this.startDate,"YYYY/MM/DD"),e=(0,F.default)(this.endDate,"YYYY/MM/DD").diff(t,"day")+1;return parseInt((this.budgetAmount/e).toFixed())-this.totalAmount()}onSwipeLeft(){let t=structuredClone(this.currentDate);t.setDate(this.currentDate.getDate()+1),this.currentDate=t,this.onDateChange()}onSwipeRight(){let t=structuredClone(this.currentDate);t.setDate(this.currentDate.getDate()-1),this.currentDate=t,this.onDateChange()}onDateChange(){this.getExpenseList(),this.countBudget()}formateDate(t){return`${t.getFullYear()}/${t.getMonth()+1}/${t.getDate()}`}getExpenseList(t=0){t<2&&(this.loaderService.start(),this.ledgerService.getTodayExpenseList(this.currentDate).then(r=>{this.ledgerItems=r}).finally(()=>{this.loaderService.stop()}).catch(()=>{this.getExpenseList(t+1)}))}totalAmount(){return this.ledgerItems.reduce((t,r)=>t+parseInt(r.price),0)}goToEditExpense(t){this.router.navigate(["/editExpense"],{state:{docId:t.id}})}goToAdd(){this.router.navigate(["/addExpense"],{queryParams:{date:(0,F.default)(this.currentDate).format("YYYY-MM-DD")}})}goToIncome(){this.router.navigate(["/incomeOverview"],{queryParams:{date:(0,F.default)(this.currentDate).format("YYYY-MM-DD")}})}onClickStatistics(){localStorage.getItem("showBudget")==="1"?this.router.navigate(["/search/statisticsCharts"],{state:{date:this.currentDate}}):this.modalService.openConfirm({title:"\u901A\u77E5",content:"\u8ACB\u5148\u8A2D\u5B9A\u9810\u7B97\u9031\u671F\uFF0C\u518D\u67E5\u770B\u7D71\u8A08\u5716\u8868",okText:"\u78BA\u8A8D",outsideClose:!1,onOk:()=>{this.router.navigate(["/setting/budget"],{state:{date:this.currentDate}})}})}},Z.\u0275fac=function(r){return new(r||Z)(f(k),f(Q),f(x),f($),f(N))},Z.\u0275cmp=B({type:Z,selectors:[["app-expense-overview"]],standalone:!0,features:[G],decls:44,vars:7,consts:[["picker",""],[1,"bg-gray-100","h-dvh","flex","flex-col"],[1,"flex","flex-col","flex-1"],[1,"sticky","top-0"],[1,"p-4","text-white","bg-red-600"],[1,"flex","justify-between","items-center"],[1,"w-1/5","text-2xl"],[1,"flex","items-center","justify-center","w-3/5",3,"click"],["src","https://img.icons8.com/ios-filled/50/ffffff/calendar.png","alt","Calendar",1,"h-6","w-6","me-2"],["matInput","","readonly","",1,"bg-red-600","text-2xl","w-36","mr-3","focus:outline-none",3,"ngModelChange","dateChange","ngModel","matDatepicker"],["touchUi",""],[1,"w-1/5","flex","justify-end"],[1,"p-2","rounded-full","bg-red-800",3,"click"],["src","https://img.icons8.com/ios-filled/50/ffffff/plus-math.png","alt","Add",1,"h-6","w-6"],[1,"p-4","text-white","bg-red-500"],[1,"flex","justify-between","items-center","text-4xl"],[1,"wrapper","flex-1","p-4","space-y-2","bg-red-500",3,"swipeLeft","swipeRight"],[1,"bg-white","p-2","flex","justify-between","items-center"],[1,"sticky","bottom-0"],["routerLink","/setting/budget",1,"bg-red-300","p-4","text-red-800"],[1,"flex","justify-around","items-center","bg-gray-200"],[1,"w-1/4","p-4","pb-8","bg-gray-400"],[1,"fas","fa-arrow-up"],[1,"block","text-lg"],[1,"w-1/4","p-4","pb-8",3,"click"],[1,"fas","fa-arrow-down"],[1,"fas","fa-chart-line"],["routerLink","/setting",1,"w-1/4","p-4","pb-8"],[1,"fas","fa-cog"],[1,"bg-white","p-2","flex","justify-between","items-center",3,"click"],[1,"w-5","mr-1",3,"ngClass"],[1,"flex"],[1,"mr-1","flex","flex-col","items-center"],[1,"text-xl","block"],[1,"text-sm"],[1,"mr-1","flex","flex-col","items-end"],[1,"ml-1","flex","flex-col","items-end"]],template:function(r,e){if(r&1){let n=_();o(0,"div",1)(1,"div",2)(2,"div",3)(3,"div",4)(4,"div",5)(5,"div",6),l(6),c(),o(7,"div",7),g("click",function(){d(n);let s=re(11);return p(s.open())}),u(8,"img",8),o(9,"input",9),V("ngModelChange",function(s){return d(n),M(e.currentDate,s)||(e.currentDate=s),p(s)}),g("dateChange",function(){return d(n),p(e.onDateChange())}),c(),u(10,"mat-datepicker",10,0),c(),o(12,"div",11)(13,"button",12),g("click",function(){return d(n),p(e.goToAdd())}),u(14,"img",13),c()()()(),o(15,"div",14)(16,"div",15)(17,"span"),l(18,"TWD"),c(),o(19,"span"),l(20),j(21,"number"),c()()()(),o(22,"div",16),g("swipeLeft",function(){return d(n),p(e.onSwipeLeft())})("swipeRight",function(){return d(n),p(e.onSwipeRight())}),T(23,wt,8,5,"div",17,_t),c()(),o(25,"div",18),O(26,xt,30,12,"div",19),o(27,"div",20)(28,"button",21),u(29,"i",22),o(30,"span",23),l(31,"\u652F\u51FA"),c()(),o(32,"button",24),g("click",function(){return d(n),p(e.goToIncome())}),u(33,"i",25),o(34,"span",23),l(35,"\u6536\u5165"),c()(),o(36,"button",24),g("click",function(){return d(n),p(e.onClickStatistics())}),u(37,"i",26),o(38,"span",23),l(39,"\u7D71\u8A08"),c()(),o(40,"button",27),u(41,"i",28),o(42,"span",23),l(43,"\u8A2D\u5B9A"),c()()()()()}if(r&2){let n=re(11);m(6),E(" ",e.calculateDiffRangeDay()||""," "),m(3),b("ngModel",e.currentDate),C("matDatepicker",n),m(11),L(Y(21,5,e.totalAmount())),m(3),D(e.ledgerItems),m(3),ne(26,e.showBudget?26:-1)}},dependencies:[z,W,q,J,U,ue,me,xe,ve,_e,we],styles:["[_nghost-%COMP%]{display:block}.wrapper[_ngcontent-%COMP%]{overflow-y:auto;touch-action:pan-y!important}"]}),Z);Ee=de([he()],Ee);var Me=le(fe());var Ct=(a,t)=>t.id;function yt(a,t){if(a&1){let r=_();o(0,"div",28),g("click",function(){let n=d(r).$implicit,i=h();return p(i.goToEditTag(n))}),o(1,"span"),u(2,"i",29),o(3,"span"),l(4),c()(),o(5,"span"),l(6),j(7,"number"),c()()}if(a&2){let r=t.$implicit;m(2),C("ngClass",r.tagInfo.tagIconName),m(2),L(r.tagInfo.tagName),m(2),E("$ ",Y(7,3,r.price),"")}}var ee,ke=(ee=class{get TransactionTypeEnum(){return R}constructor(t,r,e,n,i){this.router=t,this.loaderService=r,this.ledgerService=e,this.modalService=n,this.activatedRoute=i,this.transactionType=this.TransactionTypeEnum.Income,this.currentDate=new Date,this.ledgerItems=[],this.showBudget=localStorage.getItem("showBudget")==="1",this.budgetAmount=parseInt(localStorage.getItem("budgetAmount")||"0"),this.currentRangeBudget=0,this.startDate="",this.endDate="";let s=this.activatedRoute.snapshot.queryParams.date;se(s)&&(this.currentDate=(0,Me.default)(s,"YYYY-MM-DD").toDate()),this.currentDate.setHours(0,0,0,0)}ngOnInit(){this.getIncomeList()}onSwipeLeft(){let t=structuredClone(this.currentDate);t.setDate(this.currentDate.getDate()+1),this.currentDate=t,this.onDateChange()}onSwipeRight(){let t=structuredClone(this.currentDate);t.setDate(this.currentDate.getDate()-1),this.currentDate=t,this.onDateChange()}onDateChange(){this.getIncomeList()}formateDate(t){return`${t.getFullYear()}/${t.getMonth()+1}/${t.getDate()}`}onClickAdd(){this.router.navigate(["/addIncome"],{state:{incomeStatus:P.Add,date:this.currentDate}})}getIncomeList(){this.loaderService.start(),this.ledgerService.getTodayIncomeList(this.currentDate).then(t=>{this.ledgerItems=t}).finally(()=>{this.loaderService.stop()})}totalAmount(){return this.ledgerItems.reduce((t,r)=>t+parseInt(r.price),0)}goToEditTag(t){let r={incomeStatus:P.Edit,docId:t.id,date:t.date,price:t.price,tagId:t.tagId,description:t.description};this.router.navigate(["/addIncome"],{state:r})}goToExpense(){this.router.navigate(["/expenseOverview"],{queryParams:{date:(0,Me.default)(this.currentDate).format("YYYY-MM-DD")}})}onClickStatistics(){localStorage.getItem("showBudget")==="1"?this.router.navigate(["/search/statisticsCharts"],{state:{date:this.currentDate}}):this.modalService.openConfirm({title:"\u901A\u77E5",content:"\u8ACB\u5148\u8A2D\u5B9A\u9810\u7B97\u9031\u671F\uFF0C\u518D\u67E5\u770B\u7D71\u8A08\u5716\u8868",okText:"\u78BA\u8A8D",outsideClose:!1,onOk:()=>{this.router.navigate(["/setting/budget"],{state:{date:this.currentDate}})}})}},ee.\u0275fac=function(r){return new(r||ee)(f(k),f(Q),f(x),f($),f(N))},ee.\u0275cmp=B({type:ee,selectors:[["app-income-overview"]],standalone:!0,features:[G],decls:42,vars:5,consts:[["picker",""],[1,"bg-gray-100","h-dvh","flex","flex-col"],[1,"flex","flex-col","flex-1"],[1,"sticky","top-0"],[1,"p-4","text-white","bg-green-600"],[1,"flex","justify-between","items-center"],[1,"w-1/5","text-2xl"],[1,"flex","items-center","justify-center","w-3/5",3,"click"],["src","https://img.icons8.com/ios-filled/50/ffffff/calendar.png","alt","Calendar",1,"h-6","w-6","me-2"],["matInput","","readonly","",1,"bg-green-600","text-2xl","w-36","mr-3","focus:outline-none",3,"ngModelChange","dateChange","ngModel","matDatepicker"],["touchUi",""],[1,"w-1/5","flex","justify-end"],[1,"bg-green-800","p-2","rounded-full",3,"click"],["src","https://img.icons8.com/ios-filled/50/ffffff/plus-math.png","alt","Add",1,"h-6","w-6"],[1,"bg-green-500","p-4","text-white"],[1,"flex","justify-between","items-center","text-4xl"],[1,"bg-green-500","wrapper","flex-1","p-4","space-y-2",3,"swipeLeft","swipeRight"],[1,"bg-white","p-2","flex","justify-between","items-center"],[1,"sticky","bottom-0"],[1,"flex","justify-around","items-center","bg-gray-200"],[1,"w-1/4","p-4","pb-8",3,"click"],[1,"fas","fa-arrow-up"],[1,"block","text-lg"],[1,"w-1/4","p-4","pb-8","bg-gray-400"],[1,"fas","fa-arrow-down"],[1,"fas","fa-chart-line"],["routerLink","/setting",1,"w-1/4","p-4","pb-8"],[1,"fas","fa-cog"],[1,"bg-white","p-2","flex","justify-between","items-center",3,"click"],[1,"w-5","mr-1",3,"ngClass"]],template:function(r,e){if(r&1){let n=_();o(0,"div",1)(1,"div",2)(2,"div",3)(3,"div",4)(4,"div",5),u(5,"div",6),o(6,"div",7),g("click",function(){d(n);let s=re(10);return p(s.open())}),u(7,"img",8),o(8,"input",9),V("ngModelChange",function(s){return d(n),M(e.currentDate,s)||(e.currentDate=s),p(s)}),g("dateChange",function(){return d(n),p(e.onDateChange())}),c(),u(9,"mat-datepicker",10,0),c(),o(11,"div",11)(12,"button",12),g("click",function(){return d(n),p(e.onClickAdd())}),u(13,"img",13),c()()()(),o(14,"div",14)(15,"div",15)(16,"span"),l(17,"TWD"),c(),o(18,"span"),l(19),j(20,"number"),c()()()(),o(21,"div",16),g("swipeLeft",function(){return d(n),p(e.onSwipeLeft())})("swipeRight",function(){return d(n),p(e.onSwipeRight())}),T(22,yt,8,5,"div",17,Ct),c()(),o(24,"div",18)(25,"div",19)(26,"button",20),g("click",function(){return d(n),p(e.goToExpense())}),u(27,"i",21),o(28,"span",22),l(29,"\u652F\u51FA"),c()(),o(30,"button",23),u(31,"i",24),o(32,"span",22),l(33,"\u6536\u5165"),c()(),o(34,"button",20),g("click",function(){return d(n),p(e.onClickStatistics())}),u(35,"i",25),o(36,"span",22),l(37,"\u7D71\u8A08"),c()(),o(38,"button",26),u(39,"i",27),o(40,"span",22),l(41,"\u8A2D\u5B9A"),c()()()()()}if(r&2){let n=re(10);m(8),b("ngModel",e.currentDate),C("matDatepicker",n),m(11),L(Y(20,3,e.totalAmount())),m(3),D(e.ledgerItems)}},dependencies:[z,W,q,J,U,ue,me,xe,ve,_e,we],styles:["[_nghost-%COMP%]{display:block}.wrapper[_ngcontent-%COMP%]{overflow-y:auto;touch-action:pan-y!important}"]}),ee);ke=de([he()],ke);var Fe=le(fe());var St=["scrollTags"],It=["tagGroup"],Tt=["templateRef"],Dt=["priceInput"],Et=["descriptionInput"],kt=(a,t)=>t.id,bt=a=>({"bg-neutral-300":a}),Mt=a=>({"bg-gray-900":a});function Vt(a,t){if(a&1){let r=_();o(0,"div",28),g("click",function(){let n=d(r).$implicit,i=h(2);return p(i.onTagClick(n.id))}),u(1,"i",29),o(2,"p"),l(3),c()()}if(a&2){let r=t.$implicit,e=h(2);C("ngClass",K(3,bt,r.id===e.selectedTagId)),m(),C("ngClass",r.tagIconName),m(2),L(r.tagName)}}function Rt(a,t){if(a&1&&(o(0,"div",15,3)(2,"div",26),T(3,Vt,4,5,"div",27,kt),c()()),a&2){let r=t.$implicit;m(3),D(r)}}function At(a,t){if(a&1&&u(0,"div",17),a&2){let r=t.$index,e=h();C("ngClass",K(1,Mt,e.currentTagGroupPage===r))}}function Bt(a,t){if(a&1){let r=_();o(0,"textarea",30,4),V("ngModelChange",function(n){d(r);let i=h();return M(i.description,n)||(i.description=n),p(n)}),c()}if(a&2){let r=h();b("ngModel",r.description)}}var je=(()=>{let t=class t{constructor(e,n,i,s,v,w){this.route=e,this.router=n,this.modalService=i,this.loaderService=s,this.ledgerService=v,this.changeDetectorRef=w,this.maxTagGroupPage=0,this.currentTagGroupPage=0,this.translateFactor="translate(0, 0)",this.tagsGroup=[],this.selectedTagId="",this.description="",this.tagsGroup=this.route.snapshot.data.tagListGroup;let te=this.route.snapshot.data.data;this.price=parseInt(te.price),this.selectedTagId=te.tagId,this.description=te.description,this.date=te.date}ngOnInit(){}ngAfterViewInit(){let e=this.scrollTagsRef.nativeElement.scrollWidth,n=this.tagGroupRef.nativeElement.scrollWidth;this.maxTagGroupPage=Math.ceil(e/n)}onSwipeRight(){if(this.currentTagGroupPage>0){this.currentTagGroupPage-=1;let e=this.currentTagGroupPage*100;this.translateFactor=`translate(-${e}%, 0)`}}onSwipeLeft(){if(this.currentTagGroupPage<this.maxTagGroupPage-1){this.currentTagGroupPage+=1;let e=this.currentTagGroupPage*100;this.translateFactor=`translate(-${e}%, 0)`}}onTagClick(e){this.selectedTagId===e?this.selectedTagId="":(this.priceInput.nativeElement.focus(),this.selectedTagId=e)}onClickBack(){this.router.navigate(["/"],{queryParams:{date:(0,Fe.default)(this.date.toDate()).format("YYYY-MM-DD")}})}onClickEdit(){return X(this,null,function*(){this.saveCheck()&&(this.loaderService.start(),yield this.ledgerService.updateExpense({docId:this.route.snapshot.data.data.docId,date:this.date,price:this.price.toString(),tagId:this.selectedTagId,description:this.description}).catch(e=>{this.showError()}).then(()=>{this.onClickBack()}).finally(()=>this.loaderService.stop()))})}saveCheck(){let e=this.tagsGroup.some(n=>n.some(i=>i.id===this.selectedTagId));return!this.selectedTagId||!this.price||!e?(this.modalService.openConfirm({content:"\u8ACB\u8F38\u5165\u91D1\u984D\u8207\u9078\u64C7\u6A19\u7C64",okText:"\u78BA\u8A8D",showCancelBtn:!1,outsideClose:!0}),!1):!0}onClickDescription(){this.modalService.openConfirm({title:"\u5099\u8A3B",okText:"\u78BA\u8A8D",showCancelBtn:!1,outsideClose:!0,contentTemplateRef:this.templateRef,afterViewInit:()=>{this.changeDetectorRef.detectChanges(),this.descriptionInput?.nativeElement.focus()}})}onClickDelete(){this.modalService.openConfirm({content:"\u78BA\u8A8D\u522A\u9664\uFF1F",outsideClose:!0,onOk:()=>{this.doDelete()}})}doDelete(){this.loaderService.start(),this.ledgerService.deleteExpense(this.route.snapshot.data.data.docId).catch(e=>{this.showError()}).then(()=>{this.onClickBack()}).finally(()=>this.loaderService.stop())}showError(){this.modalService.openConfirm({content:"\u64CD\u4F5C\u5931\u6557",okText:"\u78BA\u8A8D",showCancelBtn:!1,outsideClose:!0})}};t.\u0275fac=function(n){return new(n||t)(f(N),f(k),f($),f(Q),f(x),f(pe))},t.\u0275cmp=B({type:t,selectors:[["app-edit-expense"]],viewQuery:function(n,i){if(n&1&&(y(St,5),y(It,5),y(Tt,5),y(Dt,5),y(Et,5)),n&2){let s;S(s=I())&&(i.scrollTagsRef=s.first),S(s=I())&&(i.tagGroupRef=s.first),S(s=I())&&(i.templateRef=s.first),S(s=I())&&(i.priceInput=s.first),S(s=I())&&(i.descriptionInput=s.first)}},standalone:!0,features:[G],decls:34,vars:4,consts:[["priceInput",""],["scrollTags",""],["templateRef",""],["tagGroup",""],["descriptionInput",""],[1,"bg-gray-800","text-white","p-4","flex","justify-between","items-center"],[1,"w-10",3,"click"],[1,"fas","fa-arrow-left"],[1,"text-lg"],[1,"bg-gray-600","px-4","py-2","rounded",3,"click"],[1,"bg-red-600","text-center","p-10","flex"],[1,"text-white","text-3xl","me-3","pt-2"],["autocomplete","off","id","tagName","type","number","inputmode","numeric",1,"w-full","text-right","bg-red-600","rounded","border","border-red-700","focus:border-red-500","focus:ring-2","focus:ring-red-900","text-3xl","outline-none","text-gray-100","py-1","px-3","leading-8","transition-colors","duration-200","ease-in-out",3,"ngModelChange","ngModel"],[1,"w-full","overflow-hidden"],[1,"flex","w-full","transition",3,"swipeLeft","swipeRight"],[1,"w-screen","text-center"],[1,"flex","justify-center","my-4"],[1,"mx-2","w-2","h-2","bg-gray-500","rounded-full",3,"ngClass"],[1,"bg-white","py-4","border-t","border-gray-300"],[1,"flex","p-4","border-b","items-center","justify-between",3,"click"],[1,"flex","items-center"],[1,"mr-4","fas","fa-pencil-alt"],[1,"w-3/5","text-ellipsis","overflow-hidden","text-right","text-nowrap"],[1,"flex","p-4","border-b","justify-center","items-center","bg-red-600","text-white","text-2xl",3,"click"],[1,"fas","fa-trash","mr-2"],[1,""],[1,"flex","w-screen","flex-wrap"],[1,"w-1/3","py-8",3,"ngClass"],[1,"w-1/3","py-8",3,"click","ngClass"],[3,"ngClass"],["rows","10",1,"text-black","w-full","py-1","px-2","focus:border-none","focus:outline-none",3,"ngModelChange","ngModel"]],template:function(n,i){if(n&1){let s=_();o(0,"div",5)(1,"div",6),g("click",function(){return d(s),p(i.onClickBack())}),u(2,"i",7),c(),o(3,"h1",8),l(4,"\u65B0\u589E\u652F\u51FA"),c(),o(5,"button",9),g("click",function(){return d(s),p(i.onClickEdit())}),l(6," \u5132\u5B58 "),c()(),o(7,"div",10)(8,"span",11),l(9,"$"),c(),o(10,"input",12,0),V("ngModelChange",function(w){return d(s),M(i.price,w)||(i.price=w),p(w)}),c()(),o(12,"div",13)(13,"div",14,1),g("swipeLeft",function(){return d(s),p(i.onSwipeLeft())})("swipeRight",function(){return d(s),p(i.onSwipeRight())}),T(15,Rt,5,0,"div",15,H),c()(),o(17,"div",16),T(18,At,1,3,"div",17,H),c(),o(20,"div",18)(21,"div",19),g("click",function(){return d(s),p(i.onClickDescription())}),o(22,"div",20),u(23,"i",21),o(24,"p"),l(25,"\u5099\u8A3B"),c()(),o(26,"span",22),l(27),c()(),o(28,"div",23),g("click",function(){return d(s),p(i.onClickDelete())}),u(29,"i",24),o(30,"p",25),l(31,"\u522A\u9664"),c()()(),O(32,Bt,2,1,"ng-template",null,2,oe)}n&2&&(m(10),b("ngModel",i.price),m(3),ie("transform",i.translateFactor),m(2),D(i.tagsGroup),m(3),D(i.tagsGroup),m(9),E(" ",i.description," "))},dependencies:[z,W,q,ae,J,U],styles:[".icon[_ngcontent-%COMP%]{width:40px;height:40px;background-color:#d1d5db;-webkit-mask-size:cover;mask-size:cover;display:inline-block}.active-icon[_ngcontent-%COMP%]{background-color:#111827}.transition[_ngcontent-%COMP%]{transform:all .8s ease-out}"]});let a=t;return a})();var Ye=()=>A(x).getTagList(R.Expense).then(t=>t.reduce((e,n,i)=>{let s=Math.floor(i/9);return e[s]?e[s].push(n):e[s]=[n],e},[]));var We=()=>{let a=A(x),t=A(k),r=t?.getCurrentNavigation()?.extras.state?.docId;return a.getExpenseInfo(r).then(e=>{if(e.exists()){let n=e.data();return{docId:r,date:n.date,price:n.price,tagId:n.tagId,description:n.description}}else t.navigate(["/"])})};var $i=[{path:"",component:Ae,children:[{path:"",pathMatch:"full",redirectTo:"expenseOverview"},{path:"expenseOverview",component:Ee},{path:"editExpense",component:je,resolve:{tagListGroup:Ye,data:We}},{path:"incomeOverview",component:ke},{path:"addExpense",component:Be,resolve:{tagListGroup:Le}},{path:"addIncome",component:Ge,resolve:{tagListGroup:Oe,data:Pe}}]}];export{$i as LEDGER_ROUTES};
