import React, { useEffect, useRef, Fragment } from "react";
import {Row, Col, Slider} from "antd";
import { getOpacity, getCurrentIndex } from "../../globals";

export const FlowChart = ({
  info,
  width,
  height,
  xcount,
  ycount,
  bgImage, 
  duration,
  currentTime,
  isStart
}) => {  
  console.log(info, 'to show')
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
      timesRef.current = getCurrentIndex(currentTime, info.dateFrom, info.dateTo, info.periodMS, info.totalTimes);      
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
        updateTrailPerDuration(ctx, dataTotal[timesRef.current], null);
        durationIntervalRef.current = setInterval(() => {
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
      clearCanvas(ctx);
      drawAxis(ctx);
      drawTrail(info.dt);
    }
  }, [isStart, duration, width, height, xcount, ycount, info.dt, info.dateFrom, info.dateTo, info.totalTimes, info.periodMS, currentTime]);
  
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
        <Slider defaultValue={30} tooltipVisible />
      </Row>
    </Fragment>
  );
};
