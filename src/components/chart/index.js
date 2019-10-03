import React, { useEffect, useRef } from "react";
import { getOpacity } from "../../globals";

export const FlowChart = ({
  info,
  width,
  height,
  xcount,
  ycount,
  duration,
  isStart
}) => {  
    
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
    const xStep = width / xcount,
      yStep = height / ycount;      
      
    initSettings();
    const ctx = canvasRef.current.getContext("2d");
    ctx.fillStyle = `rgba(255, 255, 255, 1)`;
    ctx.fillRect(0, 0, width, height);

    if (isStart) {
      timesRef.current = 0;      
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
        ctx.fillRect(0, 0, width, height);
      };
      const drawAxis = ctx => {
        ctx.beginPath();
        ctx.strokeStyle = "rgba(0,0,0,1)";
        ctx.fillStyle = "grey";
        ctx.textAlign = "center";

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
      const updateTrailPerFrame = (ctx, dataFrame) => {
        clearEachCell(ctx);
        drawHeatmap(ctx, dataFrame);        
        updatePosition(dataFrame);
      };
      const updateTrailPerDuration = (ctx, dataDuration) => {
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
            clearInterval(frameIntervalRef.current);
            // clearEachCell(ctx, 1);
            drawAxis(ctx);
            timesRef.current++;
            if (dataTotal[timesRef.current].length > 0) {              
              updateTrailPerDuration(ctx, dataTotal[timesRef.current]);
            } 
          }
        }, duration * 1000);
      };
      clearEachCell(ctx, 1);
      drawAxis(ctx);
      drawTrail(info.dt);
    }
  }, [isStart, duration, width, height, xcount, ycount, info.dt]);
  
  return (
    <canvas          
      width={width}
      height={height}
      ref={canvasRef}
      style={{opacity: 0.8}}
    />
  );
};
