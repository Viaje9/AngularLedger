// pie-chart.component.ts
import { Component, OnInit } from '@angular/core';
import * as d3 from 'd3';

@Component({
  selector: 'app-pie-chart',
  standalone: true,
  templateUrl: './pie-chart.component.html',
  styleUrls: ['./pie-chart.component.css']
})
export class PieChartComponent implements OnInit {

  constructor() { }

  ngOnInit(): void {
    this.drawChart();
  }

  drawChart(): void {
    const width = window.innerWidth * 0.8,
      height = window.innerWidth * 0.8,
      radius = Math.min(width, height) / 2;

    const labels = ["Lorem ipsum", "dolor sit", "amet", "consectetur", "adipisicing", "elit", "sed", "do", "eiusmod", "tempor", "incididunt"]
    const enhancedLabels = this.enhanceArrayWithBackgroundColor(labels)


    const color = d3.scaleOrdinal()
      .domain(enhancedLabels.map((label: any) => label.label))
      .range(enhancedLabels.map((label: any) => label.backgroundColor)) as any

    const randomData = () => {
      var labels = color.domain();
      return labels.map((label: any) => {
        return { label: label, value: Math.random() };
      });
    }


    const arc = d3.arc()
      .outerRadius(radius - 10)
      .innerRadius(0) as any

    const labelArc = d3.arc()
      .outerRadius(radius - 40)
      .innerRadius(radius - 40);

    const pie = d3.pie()
      .sort(null)
      .value((d: any) => d.value);


    const svg = d3.select("#pieChart")
      .append("svg")
      .attr("width", width)
      .attr("height", height)
      .append("g")
      .attr("transform", `translate(${width / 2}, ${height / 2})`);


    const data = randomData()

    const g = svg.selectAll(".arc")
      .data(pie(data))
      .enter().append("g")
      .attr("class", "arc");

    g.append("path")
      .attr("d", arc)
      .style("fill", (d: any) => color(d.data.label));

    g.append("text")
      .attr("transform", (d: any) => `translate(${labelArc.centroid(d)})`)
      .attr("dy", ".35em")
      .text((d: any) => d.data.label);
  }

  enhanceArrayWithBackgroundColor<T>(array: T[]) {
    // 計算每一步增加的亮度值
    const lightnessStep = array.length > 1 ? (50 / (array.length - 1)) : 0;
    const baseHue = Math.floor(Math.random() * 360); // 為整個陣列生成一個基本色相
    const baseSaturation = 50

    return array.map((item, index) => {
      const lightness = 50 + index * lightnessStep; // 計算亮度，從50%開始增加
      const backgroundColor = `hsl(${baseHue}, ${baseSaturation}%, ${lightness}%)`;

      if (typeof item === 'object') {

        return { ...item, backgroundColor }; // 返回新的項目，包含背景顏色
      }

      return { label: item, backgroundColor }; // 返回新的項目，包含背景顏色
    });
  }
}
