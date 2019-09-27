import React, { useEffect, useRef } from "react";
import _ from "lodash";
import { getOpacity } from "../../globals";

import './index.css';
const FPS = 60;

export const FlowChart = ({
  info,
  width,
  height,
  xcount,
  ycount,
  duration,
  isStart
}) => {
  //declare for drawing canvas
  const margins = { left: 30, right: 30, bottom: 30, top: 30 };
  const drawSz = {
    w: width - margins.left - margins.right,
    h: height - margins.top - margins.bottom
  };
  const ratio = {
    x: drawSz.w / info.axisw,
    y: drawSz.h / info.axish
  };

  const xStep = drawSz.w / xcount,
    yStep = drawSz.h / ycount,
    vxStep = info.axisw / xcount,
    vyStep = info.axish / ycount;
  //-------------------------
  const canvasRef = useRef();

  const timesRef = useRef(0);
  const durationIntervalRef = useRef(null);
  const frameIntervalRef = useRef(null);

  //canvas functions
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
    if(opacity !== 0.01 ){
      ctx.fillStyle = `rgba(241, 242, 245, ${opacity})`;      
    }else{
      ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
    }    
    ctx.fillRect(0, 0, width, height);
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
  const updatePosition = data => {
    for (let j = 0; j < data.length; j++) {
      for (let k = 0; k < data[j].shows.length; k++) {
        data[j].shows[k].from_x += data[j].shows[k].step_x;
        data[j].shows[k].from_y += data[j].shows[k].step_y;
      }
    }
  };
  const updateTrailPerFrame = (ctx, data) => {
    clearEachCell(ctx);
    drawHeatmap(ctx, data);
    updatePosition(data);
    drawAxis(ctx);

    ctx.fillStyle = "#0000ff";
    for (let j = 0; j < data.length; j++) {
      for (let k = 0; k < data[j].shows.length; k++) {
        ctx.fillRect(
          data[j].shows[k].from_x - 1.5,
          data[j].shows[k].from_y - 1.5,
          3,
          3
        );
      }
    }
  };
  const updateTrailPerDuration = (ctx, dataDuration) => {
    let new_data = [];
    new_data = _.cloneDeep(dataDuration);

    for (let j = 0; j < new_data.length; j++) {
      for (let k = 0; k < new_data[j].shows.length; k++) {
        new_data[j].shows[k].from_x = ratio.x * new_data[j].shows[k].from_x;
        new_data[j].shows[k].from_y = ratio.y * new_data[j].shows[k].from_y;
        new_data[j].shows[k].to_x = ratio.x * new_data[j].shows[k].to_x;
        new_data[j].shows[k].to_y = ratio.y * new_data[j].shows[k].to_y;
        new_data[j].shows[k].step_x = (new_data[j].shows[k].to_x - new_data[j].shows[k].from_x) /(duration * FPS);
        new_data[j].shows[k].step_y = (new_data[j].shows[k].to_y - new_data[j].shows[k].from_y) /(duration * FPS);
      }
    }

    let overed = 0;
    updateTrailPerFrame(ctx, new_data);
    frameIntervalRef.current = setInterval(() => {
      if (overed / FPS > duration) {
        clearInterval(frameIntervalRef.current);
      }

      updateTrailPerFrame(ctx, new_data);
      overed++;
    }, 1000 / FPS);
  };
  const drawTrail = data => {
    const ctx = canvasRef.current.getContext("2d");
    updateTrailPerDuration(ctx, data[timesRef.current]);
    durationIntervalRef.current = setInterval(() => {
      clearEachCell(ctx, 1);
      drawAxis(ctx);
      if (timesRef.current >= data.length - 1) {
        clearInterval(durationIntervalRef.current);
      } else {
        timesRef.current++;
        if (data[timesRef.current].length > 0) {
          updateTrailPerDuration(ctx, data[timesRef.current]);
        }
      }
    }, duration * 1000);
  };
  //----------------
  const initSettings = () => {
    timesRef.current = 0;
    clearInterval(durationIntervalRef.current);
    clearInterval(frameIntervalRef.current);
  };
  useEffect(() => {
    const ctx = canvasRef.current.getContext("2d");
    ctx.translate(margins.left, margins.top);
    initSettings();
  }, []);

  useEffect(() => {
    initSettings();
    if (isStart) {
      const ctx = canvasRef.current.getContext("2d");
      clearEachCell(ctx, 1);
      drawTrail(info.dt);
    }
  }, [isStart]);

  return (
    <div
      className="chartArea"
      style={{ width: width, height: height}}
    >
      <canvas
        className="canvasArea"
        width={width}
        height={height}
        ref={canvasRef}
        style={{opacity: 0.6}}
      />

    </div>
  );
};
