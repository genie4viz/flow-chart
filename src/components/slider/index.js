import React, { useEffect, useRef } from "react";
import * as d3 from "d3";
import "./index.css";

const formatDate = d3.timeFormat("%I:%M:%S %d %b");
const parseDate = d3.timeParse("%m/%d/%y");

export const Slider = ({ dateFrom, dateTo, duration, width, height, isStart }) => {
  const svgRef = useRef();
  const timeIntervalRef = useRef(null);

  useEffect(() => {
    if(isStart){
      if(timeIntervalRef.current){
        clearInterval(timeIntervalRef.current);
      }
      const startDate = new Date(dateFrom),
        endDate = new Date(dateTo);

      const margin = { top: 0, right: 40, bottom: 0, left: 40 },
        w = width - margin.left - margin.right,
        h = height - margin.top - margin.bottom;

      const svg = d3.select(svgRef.current);
      svg.selectAll("*").remove();
      
      let currentValue = 0;
      let targetValue = w;
      const x = d3
        .scaleTime()
        .domain([startDate, endDate])
        .range([0, targetValue])
        .clamp(true);
      svg
        .append("g")
        .attr("transform", `translate(${margin.left}, 0)`)
        .call(d3.axisBottom(x));
      const slider = svg
        .append("g")
        .attr("class", "slider")
        .attr("transform", "translate(" + margin.left + "," + h / 2 + ")");
      slider
        .append("line")
        .attr("class", "track")
        .attr("x1", x.range()[0])
        .attr("x2", x.range()[1])
        .select(function() {
          return this.parentNode.appendChild(this.cloneNode(true));
        })
        .attr("class", "track-inset")
        .select(function() {
          return this.parentNode.appendChild(this.cloneNode(true));
        })
        .attr("class", "track-overlay");
      //   .call(
      //     d3
      //       .drag()
      //       .on("start.interrupt", function() {
      //         slider.interrupt();
      //       })
      //       .on("start drag", function() {
      //         currentValue = d3.event.x;
      //         update(x.invert(currentValue));
      //       })
      //   );

      slider
        .insert("g", ".track-overlay")
        .attr("class", "ticks")
        .attr("transform", "translate(0," + h / 2 + ")")
        .selectAll("text")
        .data(x.ticks(10))
        .enter()
        .append("text")
        .attr("x", x)
        .attr("y", 10)
        .attr("text-anchor", "middle")
        .text(d => parseDate(d));

      const handle = slider
        .insert("circle", ".track-overlay")
        .attr("class", "handle")
        .attr("r", 9);

      const label = slider
        .append("text")
        .attr("class", "label")
        .attr("text-anchor", "middle")
        .attr("font-size", 10)
        .text(formatDate(startDate))
        .attr("transform", "translate(0," + 20 + ")");
      
      step();
      timeIntervalRef.current = setInterval(step, 100);
      function step() {
        update(x.invert(currentValue));

        currentValue = currentValue + w  / (duration * 10);      
        if (currentValue > targetValue) {    
          currentValue = 0;
          handle.attr("cx", 0);
          clearInterval(timeIntervalRef.current);
        }
      }

      function update(h) {        
        handle.attr("cx", x(h));
        label.attr("x", x(h)).text(formatDate(h));
      }
    }
  }, [dateFrom, dateTo, width, height, duration, isStart]);
  return <svg width={width} height={height} ref={svgRef} />;
};
