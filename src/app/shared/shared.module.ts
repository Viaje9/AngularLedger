import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { RouterModule } from "@angular/router";

const imports = [CommonModule, FormsModule, ReactiveFormsModule, RouterModule];

@NgModule({
  declarations: [],
  imports: [...imports],
  exports: [
    imports
  ],
})
export class SharedModule {}
