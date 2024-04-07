// pie-chart.component.ts
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { PieChartItem } from '@src/app/core/models/pie-chart-item.model';
import * as d3 from 'd3';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-pie-chart',
  standalone: true,
  templateUrl: './pie-chart.component.html',
  styleUrls: ['./pie-chart.component.css']
})
export class PieChartComponent implements OnInit {

  @Input() set pieChartItems(value: PieChartItem[]) {
    this.pieChartItemsSubject.next(value);
  }

  @Output() onEmitPieChartWithColorItems = new EventEmitter();


  pieChartItemsSubject: Subject<PieChartItem[]> = new Subject<PieChartItem[]>();

  svg!: d3.Selection<SVGGElement, unknown, HTMLElement, any>;

  constructor() {

  }

  ngOnInit(): void {
    this.pieChartItemsSubject.subscribe((list: PieChartItem[]) => {
      this.init()
      this.drawChart(list);
    })
  }

  init() {
    d3.select("#pieChart > svg").remove()
    const width = window.innerWidth,
      height = window.innerWidth;
    this.svg = d3.select("#pieChart")
      .append("svg")
      .attr("width", width)
      .attr("height", height)
      .append("g")

    this.svg.append("g").attr("class", "pies");
    this.svg.append("g").attr("class", "slices");
    this.svg.append("g").attr("class", "labels");
    this.svg.append("g").attr("class", "lines");
    this.svg.append("g").attr("class", "centerText");
    this.svg.attr("transform", `translate(${width / 2}, ${height / 2})`);

  }




  drawChart(list: PieChartItem[]): void {
    const width = window.innerWidth,
      height = window.innerWidth,
      radius = Math.min(width, height) / 2;

    const enhancedList = this.enhanceArrayWithBackgroundColor<PieChartItem>(list)
    this.onEmitPieChartWithColorItems.emit(enhancedList)

    const color = d3.scaleOrdinal()
      .domain(enhancedList.map((label: any) => label.label))
      .range(enhancedList.map((label: any) => label.backgroundColor)) as any

    const randomData = () => {
      return list as any
    }


    const pie = d3.pie<PieChartItem>()
      .padAngle(0.07)
      .sort(null)
      .value((d) => d.value);

    const pie2 = d3.pie<PieChartItem>()
      .sort(null)
      .value((d) => d.value);


    const arc = d3.arc()
      .outerRadius(radius * 0.9)
      .innerRadius(radius * 0.4) as any

    const outerArc = d3.arc()
      .outerRadius(radius * 0.8)
      .innerRadius(radius * 0.8)

    const data = randomData()

    const key = (d: any) => {
      return d.data.label;
    };

    /** SLICES */
    const pies = this.svg.select(".pies").selectAll("path.pie").data(pie2(data), key);
    const slice = this.svg.select(".slices").selectAll("path.slice").data(pie(data), key);

    pies.enter()
      .insert("path")
      .style("fill", "rgb(209 213 219 / var(--tw-bg-opacity))") // 背景色
      .attr("class", "slice")
      .style("stroke", "rgb(209 213 219 / var(--tw-bg-opacity))") // 邊框
      .style("stroke-width", 2) // Set border width
      .transition()
      .duration(1000)
      .attrTween("d", function (d) {
        let _current = d
        const interpolate = d3.interpolate(_current, d);
        _current = interpolate(0);
        return function (t) {
          return arc(interpolate(t))
        };
      })

    slice
      .enter()
      .insert("path")
      .style("fill", function (d: any) {
        return color(d.data.label);
      })
      .style("stroke", "white") // Add border
      .style("stroke-width", 2) // Set border width
      .attr("class", "slice").transition()
      .duration(1000)
      .attrTween("d", function (d) {
        let _current = d
        const interpolate = d3.interpolate(_current, d);
        _current = interpolate(0);
        return function (t) {
          return arc(interpolate(t))
        };
      })

    slice
      .enter()
      .insert('text')
      .text((d) => `${d.index}`)
      .attr("transform", (d) => {
        return "translate(" + arc.centroid(d) + ")"
      })
      .style("text-anchor", "middle")
      .style("font-size", 17)

    /** CENTER TEXT */

    const centerContent = this.svg.select(".centerText")

    const centerText = list.reduce((acc, item) => acc + item.value, 0)

    centerContent.insert("text")
      .attr("text-anchor", "middle")
      .attr('dominant-baseline', 'middle')
      .attr("transform", `translate(0,0)`)
      .style("fill", "white")
      .style("font-size", "2em")
      .text(`$ ${centerText}`);

    /** TEXT LABELS */

    //     const text = this.svg.select(".labels").selectAll("text")
    //       .data(pie(data), key)
    //
    //     text
    //       .enter()
    //       .append("text")
    //       .attr("dy", ".35em")
    //       .attr("fill", "white")
    //       .text((d: any) => `${d.data.label}-${d.data.value}`)
    //       .transition()
    //       .duration(1000)
    //       .attrTween("transform", function (d) {
    //
    //         let _current = d
    //         const interpolate = d3.interpolate(_current, d);
    //         _current = interpolate(0);
    //         return function (t) {
    //           const d2 = interpolate(t) as any;
    //           const pos = outerArc.centroid(d2);
    //           pos[0] = radius * (midAngle(d2) < Math.PI ? 0.5 : -0.8);
    //           return `translate(${pos})`
    //         };
    //       })
    //
    //     const midAngle = (d: any) => {
    //       return d.startAngle + (d.endAngle - d.startAngle) / 2;
    //     }

    /* ------- SLICE TO TEXT POLYLINES -------*/

    //     const polyline = this.svg.select(".lines").selectAll("polyline").data(pie(data), key);
    //
    //     polyline
    //       .enter()
    //       .append("polyline")
    //       .style("opacity", 0.5)
    //       .style("stroke", "black")
    //       .style("stroke-width", "2px")
    //       .style("fill", "none")
    //       .transition()
    //       .duration(1000)
    //       .attrTween("points", function (d) {
    //         let _current = d
    //         const interpolate = d3.interpolate(_current, d);
    //         _current = interpolate(0);
    //         return function (t) {
    //           const d2 = interpolate(t) as any;
    //           const pos = outerArc.centroid(d2);
    //           pos[0] = radius * (midAngle(d2) < Math.PI ? 0.5 : -0.8);
    //           return `${arc.centroid(d2)}, ${outerArc.centroid(d2)}, ${pos}`;
    //         };
    //       })

  }

  enhanceArrayWithBackgroundColor<T>(array: T[]) {
    let baseHue = 190
    const baseSaturation = 60;
    const baseLightness = 55;

    return array.map((item) => {
      baseHue = (baseHue + 35) % 360;
      const backgroundColor = `hsl(${baseHue}, ${baseSaturation}%, ${baseLightness}%)`;

      return { ...item, backgroundColor };
    });
  }
}
