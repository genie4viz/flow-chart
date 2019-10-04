import React, { useEffect, useRef, Fragment } from "react";
import {Row, Col} from "antd";
import * as d3 from "d3";
import { getOpacity, getCurrentIndex, getNearDate } from "../../globals";
import "./index.css";

const formatDate = d3.timeFormat("%I:%M:%S %d %b");
const parseDate = d3.timeParse("%m/%d/%y");

export const FlowChart = ({
  info,
  width,
  height,
  xcount,
  ycount,
  bgImage, 
  duration,
  isStart
}) => {  
  console.log(info, 'to show')
  //-------------------------
  const canvasRef = useRef();
  const svgRef = useRef();

  const timesRef = useRef(0);
  const durationIntervalRef = useRef(null);
  const frameIntervalRef = useRef(null);

  //canvas functions

  //----------------
  const initSettings = () => {
    clearInterval(durationIntervalRef.current);
    clearInterval(frameIntervalRef.current);
  };
  
  useEffect(() => {
    const xStep = width / xcount,
      yStep = height / ycount;      
    const startDate = new Date(info.dateFrom),
      endDate = new Date(info.dateTo);
    
    const margin = { top: 0, right: 40, bottom: 0, left: 40 },
      w = width - margin.left - margin.right,
      h = 100 - margin.top - margin.bottom;
    const days = endDate.getDate() - startDate.getDate();

    initSettings();
    const ctx = canvasRef.current.getContext("2d");
    ctx.fillStyle = `rgba(255, 255, 255, 1)`;
    ctx.fillRect(0, 0, width, height);

    if (isStart) {
      timesRef.current = 0;
      const svg = d3.select(svgRef.current);
      svg.selectAll("*").remove();
      let current = 0;
      let targetValue = w;

      const x = d3
        .scaleTime()
        .domain([startDate, endDate])
        .range([0, targetValue])
        .clamp(true);

      const ruler = svg
        .append("g")
        .attr('class', 'ruler')
        .attr("transform", `translate(${margin.left}, 20)`)
        .call(d3.axisBottom(x).ticks(10).tickSize(52));//days instead of 10
      
      ruler
        .selectAll('text')
        .attr('dy', 12);

      const slider = svg
        .append("g")
        .attr("class", "slider")
        .attr("transform", "translate(" + margin.left + "," + h / 2 + ")");
      //ticks
      // slider
      //   .insert("g", ".track-overlay")
      //   .attr("class", "ticks")
      //   .attr("transform", "translate(0, 20)")
      //   .selectAll("text")
      //   .data(x.ticks(10))
      //   .enter()
      //   .append("text")
      //   .attr("x", x)
      //   .attr("y", 10)
      //   .attr("text-anchor", "middle")
      //   .text(d => 'a');//parseDate(d)
      slider
        .append("rect")
        .attr("class", "track")
        .attr("rx", 5)
        .attr("ry", 5)
        .attr("x", x.range()[0])
        .attr("y", -20)
        .attr("width", x.range()[1])
        .attr("height", 40)
        .attr("fill", "grey")
        .attr("fill-opacity", 0.6)
        .select(function() {
          return this.parentNode.appendChild(this.cloneNode(true));
        })
        .attr("class", "track-inset")
        .select(function() {
          return this.parentNode.appendChild(this.cloneNode(true));
        })
        .attr("class", "track-overlay")
        .call(
          d3
            .drag()
            .on("start.interrupt", function() {
              slider.interrupt();
            })
            .on("start", function() {
              clearInterval(frameIntervalRef.current);
              clearInterval(durationIntervalRef.current);
            })
            .on("drag", function() {              
              current = d3.event.x;
              update(x.invert(current));
            })
            .on("end", function() {
              current = d3.event.x;
              const date = x.invert(current);              
              const nearDate = getNearDate(date, info.dateFrom, info.dateTo, info.periodMS, info.totalTimes);
              // console.log(x(nearDate), 'drag end position')
              current = x(nearDate);
              // update(nearDate);//days instead of 10
              timesRef.current = getCurrentIndex(date, info.dateFrom, info.dateTo, info.periodMS, info.totalTimes);              
              drawTrail(info.dt);
            })
        );

      const handle = slider
        .insert("circle", ".track-overlay")
        .attr("class", "handle")
        .attr("cy", -30)
        .attr("r", 9);
      const indicator = slider
        .insert("rect", ".track-overlay")
        .attr("class", "handle-indicator")        
        .attr('x', -1)
        .attr('y', -20)
        .attr('width', 3)
        .attr('height', 40)
        .attr('fill', 'red')

      const label = slider
        .append("text")
        .attr("class", "label")
        .attr("text-anchor", "middle")
        .attr("font-size", 10)
        .text(formatDate(startDate))
        .attr("transform", "translate(0," + 20 + ")");
      
      const step = () => {
        update(x.invert(current));

        current = current + w / info.dt.length;        
        // if (current >= targetValue) {
          // current = 0;
          // handle.attr("cx", 0);
          // indicator.attr("x", -1);
          // label.attr("transform", "translate(0," + 20 + ")");
          // clearInterval(timeIntervalRef.current);
        // }
      }

      const update = h => {        
        handle.attr("cx", x(h));
        indicator.attr("x", x(h) - 1);
        label.attr("x", x(h)).text(formatDate(h));
      }

      const drawHeatmap = (ctx, data) => {
        
          for(let i = 0; i < xcount; i++){
            for(let j = 0; j < ycount; j++){
              ctx.fillStyle = `rgba(255, 255, 255, 0.05)`;
              ctx.fillRect(
                i * xStep + 1,
                j * yStep + 1,
                xStep - 2,
                yStep - 2
              );
            }
          }
            
        for(let i = 0; i < data.length; i++){          
          ctx.fillStyle = `rgba(200, 0, 0, ${getOpacity(data[i].id_counts)})`;
          ctx.fillRect(
            data[i].xi * xStep + 1,
            data[i].yi * yStep + 1,
            xStep - 2,
            yStep - 2
          );
        } 
      };

      const clearCanvas = (ctx) => {
        ctx.fillStyle = `rgb(255, 255, 255)`;
        ctx.fillRect(0, 0, width, height);
      }
      
      const drawAxis = ctx => {
        ctx.beginPath();        
        ctx.fillStyle = "black";        

        for (let i = 0; i < xcount + 1; i++) {
          ctx.moveTo(i * xStep, 0);
          ctx.lineTo(i * xStep, height);          
        }
        for (let j = 0; j < ycount + 1; j++) {
          ctx.moveTo(0, j * yStep);
          ctx.lineTo(width, j * yStep);          
        }
        ctx.stroke();
      };
      const updatePosition = dataPoints => {        
        ctx.fillStyle = "#0000ff";
        for (let j = 0; j < dataPoints.length; j++) {
          for (let k = 0; k < dataPoints[j].shows.length; k++) {
            dataPoints[j].shows[k].from_x += dataPoints[j].shows[k].step_x;
            dataPoints[j].shows[k].from_y += dataPoints[j].shows[k].step_y;
            ctx.fillRect(
              dataPoints[j].shows[k].from_x - 1.2,
              dataPoints[j].shows[k].from_y - 1.2,
              2.4,
              2.4
            );
          }
        }
      };
      const updateTrailPerFrame = (ctx, dataFrame, prevData) => {        
        drawHeatmap(ctx, dataFrame, prevData);
        updatePosition(dataFrame);
      };
      const updateTrailPerDuration = (ctx, dataDuration, prevData) => {
        let new_data = JSON.parse(JSON.stringify(dataDuration));
        for (let j = 0; j < new_data.length; j++) {
          for (let k = 0; k < new_data[j].shows.length; k++) {            
            new_data[j].shows[k].step_x =
              (new_data[j].shows[k].to_x - new_data[j].shows[k].from_x) /
              (duration * 1000 / 10);
              new_data[j].shows[k].step_y =
              (new_data[j].shows[k].to_y - new_data[j].shows[k].from_y) /
              (duration * 1000 / 10);
          }
        }
        updateTrailPerFrame(ctx, new_data, prevData);
        frameIntervalRef.current = setInterval(() => {          
          updateTrailPerFrame(ctx, new_data, prevData);
        }, 10);
      };
      const drawTrail = dataTotal => {        
        const ctx = canvasRef.current.getContext("2d");
        clearCanvas(ctx);
        drawAxis(ctx);
        updateTrailPerDuration(ctx, dataTotal[timesRef.current], null);
        step();
        durationIntervalRef.current = setInterval(() => {
          step();
          if (timesRef.current >= dataTotal.length - 1) {
            clearInterval(frameIntervalRef.current);
            clearInterval(durationIntervalRef.current);
          } else {
            clearInterval(frameIntervalRef.current);            
            drawAxis(ctx);
            timesRef.current++;
            if (dataTotal[timesRef.current].length > 0) {              
              updateTrailPerDuration(ctx, dataTotal[timesRef.current], dataTotal[timesRef.current - 1]);
            }            
          }
        }, duration * 1000);
      };
      
      drawTrail(info.dt);
    }
  }, [isStart, duration, width, height, xcount, ycount, info.dt, info.dateFrom, info.dateTo, info.totalTimes, info.periodMS]);

  return (
    <Fragment>
      <Row>              
        <Col
          style={{
            padding: 4,
            margin: 4,
            display: "flex",
            justifyContent: "center"
          }}
        >
          <div className="chartArea" 
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              width: width,
              height: height,
              background: 'url(' + bgImage + ') no-repeat'
          }}>            
            <canvas          
              width={width}
              height={height}
              ref={canvasRef}
              style={{opacity: 0.5}}
            />            
          </div>
        </Col>            
      </Row>
      <Row style={{display: 'flex', justifyContent:'center', alignItems: 'center'}}>
        <svg width={width} height={100} ref={svgRef} />
      </Row>
    </Fragment>
  );
};
