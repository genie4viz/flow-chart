import React, { useEffect, useRef } from "react";
import _ from "lodash";
import { Row } from "antd";
import { Slider } from "../../components/slider";
import { getOpacity } from "../../globals";

import "./index.css";

export const FlowChart = ({
  info,
  width,
  height,
  xcount,
  ycount,
  duration,
  period,
  isStart
}) => {
  //declare for drawing canvas
  const margins = { left: 30, right: 30, bottom: 30, top: 30 };  
  //-------------------------
  const canvasRef = useRef();

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
    const ctx = canvasRef.current.getContext("2d");
    ctx.translate(margins.left, margins.top);
    initSettings();
  }, [margins.left, margins.top]);

  useEffect(() => {
    const drawSz = {
      w: width - margins.left - margins.right,
      h: height - 100 - margins.top - margins.bottom
    };
    const ratio = {
      x: drawSz.w / info.axisw,
      y: drawSz.h / info.axish
    };
  
    const xStep = drawSz.w / xcount,
      yStep = drawSz.h / ycount,
      vxStep = info.axisw / xcount,
      vyStep = info.axish / ycount;
      
    initSettings();
    const ctx = canvasRef.current.getContext("2d");
    ctx.fillStyle = `rgba(255, 255, 255, 1)`;
    ctx.fillRect(0, 0, width, height - 100);

    if (isStart) {
      timesRef.current = 0;
      const ctx = canvasRef.current.getContext("2d");
      const drawHeatmap = (ctx, data) => {
        for (let i = 0; i < data.length; i++) {
          ctx.fillStyle = `rgba(200, 0, 0, ${getOpacity(data[i].id_counts)})`;
          ctx.fillRect(
            data[i].xi * xStep + 2,
            data[i].yi * yStep + 2,
            xStep - 4,
            yStep - 4
          );
        }
      };
      const clearEachCell = (ctx, opacity = 0.01) => {
        if (opacity !== 0.01) {
          ctx.fillStyle = `rgba(241, 242, 245, ${opacity})`;
        } else {
          ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
        }
        ctx.fillRect(0, 0, width, height - 100);
      };
      const drawAxis = ctx => {
        ctx.beginPath();
        ctx.strokeStyle = "rgba(0,0,0,1)";
        ctx.fillStyle = "grey";
        ctx.textAlign = "center";

        for (let i = 0; i < xcount + 1; i++) {
          ctx.moveTo(i * xStep, 0);
          ctx.lineTo(i * xStep, drawSz.h);
          ctx.fillText(i * vxStep, i * xStep, -4);
        }
        for (let j = 0; j < ycount + 1; j++) {
          ctx.moveTo(0, j * yStep);
          ctx.lineTo(drawSz.w, j * yStep);
          if (j !== 0) ctx.fillText(j * vyStep, -10, j * yStep + 4);
        }
        ctx.stroke();
      };
      const updatePosition = dataPoints => {
        let new_data = dataPoints;
        ctx.fillStyle = "#0000ff";
        for (let j = 0; j < new_data.length; j++) {
          for (let k = 0; k < new_data[j].shows.length; k++) {
            new_data[j].shows[k].cur_x += new_data[j].shows[k].step_x;
            new_data[j].shows[k].cur_y += new_data[j].shows[k].step_y;
            ctx.fillRect(
              new_data[j].shows[k].cur_x - 1.5,
              new_data[j].shows[k].cur_y - 1.5,
              3,
              3
            );
          }
        }
      };
      const updateTrailPerFrame = (ctx, dataFrame) => {
        clearEachCell(ctx);
        drawHeatmap(ctx, dataFrame);
        drawAxis(ctx);
        updatePosition(dataFrame);
      };
      const updateTrailPerDuration = (ctx, dataDuration) => {

        let new_data = dataDuration;
        for (let j = 0; j < new_data.length; j++) {
          for (let k = 0; k < new_data[j].shows.length; k++) {
            new_data[j].shows[k].from_x = ratio.x * new_data[j].shows[k].from_x;
            new_data[j].shows[k].from_y = ratio.y * new_data[j].shows[k].from_y;            
            new_data[j].shows[k].to_x = ratio.x * new_data[j].shows[k].to_x;
            new_data[j].shows[k].to_y = ratio.y * new_data[j].shows[k].to_y;
            new_data[j].shows[k].cur_x = new_data[j].shows[k].from_x;
            new_data[j].shows[k].cur_y = new_data[j].shows[k].from_y;
            new_data[j].shows[k].step_x =
              (new_data[j].shows[k].to_x - new_data[j].shows[k].from_x) /
              (duration * 1000 / 10);
              new_data[j].shows[k].step_y =
              (new_data[j].shows[k].to_y - new_data[j].shows[k].from_y) /
              (duration * 1000 / 10);
          }
        }
        
        updateTrailPerFrame(ctx, new_data);
        frameIntervalRef.current = setInterval(() => {          
          updateTrailPerFrame(ctx, new_data);
        }, 10);
      };
      const drawTrail = dataTotal => {
        const ctx = canvasRef.current.getContext("2d");
        updateTrailPerDuration(ctx, dataTotal[timesRef.current]);
        durationIntervalRef.current = setInterval(() => {          
          if (timesRef.current >= dataTotal.length - 1) {
            clearInterval(frameIntervalRef.current);
            clearInterval(durationIntervalRef.current);            
          } else {
            timesRef.current++;
            if (dataTotal[timesRef.current].length > 0) {
              clearInterval(frameIntervalRef.current);
              updateTrailPerDuration(ctx, dataTotal[timesRef.current]);
            }
          }
        }, duration * 1000);
      };      
      drawTrail(info.dt);
    }
  }, [isStart, duration, width, height, margins.left, margins.right, margins.top, margins.bottom, xcount, ycount, info.dt, info.axisw, info.axish]);

  return (
    <div className="chartArea" style={{ width: width, height: height }}>
      <Row>
        <canvas
          className="canvasArea"
          width={width}
          height={height - 100}
          ref={canvasRef}
          style={{ opacity: 0.6 }}
        />
      </Row>
      <Row>
        <Slider
          dateFrom={info.dateFrom}
          dateTo={info.dateTo}
          duration={duration * info.totalTimes}
          period={period} //unit is mins.
          width={1000}
          height={100}
          isStart={isStart}
        />
      </Row>
    </div>
  );
};
