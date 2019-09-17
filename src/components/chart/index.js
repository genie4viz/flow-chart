import React, { useEffect, useRef } from "react";
import { getOpacity } from "../../globals";
import mall from "../../static/mall.png";

const FPS = 60;
const duration = 5;

export const FlowChart = ({ info, width, height, xcount, ycount }) => {
  console.log(info);
  const canvasRef = useRef();

  const clearCanvas = () => {
    const ctx = canvasRef.current.getContext("2d");
    ctx.fillStyle = "white";
    ctx.fill();
    ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
  };

  useEffect(() => {
    clearCanvas();
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

    const drawHeatmap = (ctx, data) => {
      for (let i = 0; i < xcount; i++) {
        for (let j = 0; j < ycount; j++) {
          let counts = data[i * (xcount - 1) + j].id_counts;
          if (counts > 0) {
            ctx.fillStyle = `rgba(200, 0, 0, ${getOpacity(counts)})`;
          } else {
            ctx.fillStyle = "rgba(255, 255, 255, 0.01)";
          }
          ctx.fillRect(i * xStep + 2, j * yStep + 2, xStep - 4, yStep - 4);
        }
      }
    };

    const clearEachCell = (ctx, opacity = 0.01) => {
      ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
      for (let i = 0; i < xcount; i++) {
        for (let j = 0; j < ycount; j++) {
          ctx.fillRect(i * xStep + 2, j * yStep + 2, xStep - 4, yStep - 4);
        }
      }
    };

    const drawAxis = ctx => {
      ctx.beginPath();
      ctx.strokeStyle = "rgba(0,0,0,0.3)";
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
    const drawTrail = data => {
      console.log(data, "dd");
      let times = 0;
      const ctx = canvasRef.current.getContext("2d");
      ctx.translate(margins.left, margins.top);
      drawAxis(ctx);

      const updatePosition = data => {
        for (let j = 0; j < data.counts_arr.length; j++) {
          data.counts_arr[j].from.x += data.counts_arr[j].step.x;
          data.counts_arr[j].from.y += data.counts_arr[j].step.y;
        }
      };
      const updateTrailPerFrame = dataPerDuration => {
        updatePosition(dataPerDuration);
        drawHeatmap(ctx, dataPerDuration.cell_info);
        clearEachCell(ctx);

        ctx.fillStyle = "#0000ff";
        for (let j = 0; j < dataPerDuration.counts_arr.length; j++) {
          ctx.fillRect(
            dataPerDuration.counts_arr[j].from.x - 1.5,
            dataPerDuration.counts_arr[j].from.y - 1.5,
            3,
            3
          );
        }
      };
      const updateTrailPerDuration = dataPerDuration => {
        for (let j = 0; j < dataPerDuration.counts_arr.length; j++) {
          dataPerDuration.counts_arr[j].from.x =
            ratio.x * dataPerDuration.counts_arr[j].from.x;
          dataPerDuration.counts_arr[j].from.y =
            ratio.y * dataPerDuration.counts_arr[j].from.y;
          dataPerDuration.counts_arr[j].to.x =
            ratio.x * dataPerDuration.counts_arr[j].to.x;
          dataPerDuration.counts_arr[j].to.y =
            ratio.y * dataPerDuration.counts_arr[j].to.y;
          dataPerDuration.counts_arr[j].step = {
            x:
              (dataPerDuration.counts_arr[j].to.x -
                dataPerDuration.counts_arr[j].from.x) /
              (duration * FPS),
            y:
              (dataPerDuration.counts_arr[j].to.y -
                dataPerDuration.counts_arr[j].from.y) /
              (duration * FPS)
          };
        }

        clearEachCell(ctx, 1);

        let overed = 0;
        updateTrailPerFrame(dataPerDuration);
        const timeInterval = setInterval(() => {
          if (overed / FPS > duration) {
            clearInterval(timeInterval);
          }
          updateTrailPerFrame(dataPerDuration);
          overed++;
        }, 1000 / FPS);
      };
      updateTrailPerDuration(data[times]);
      const totalInterval = setInterval(() => {
        if (times >= data.length - 1) {
          clearInterval(totalInterval);
        } else {
          times++;
          if (data[times].counts_arr) {
            updateTrailPerDuration(data[times]);
          }
        }
      }, duration * 1000);
    };
    drawTrail(info.arranged);
  }, [info, width, height, xcount, ycount]);

  return (
    <div className="chartArea" style={{ width: width, height: height }}>
      <div>
        <canvas
          width={width}
          height={height}
          ref={canvasRef}
          style={{ position: "absolute", zIndex: 0 }}
        />
        <img
          src={mall}
          width={width}
          height={height}
          alt=""
          style={{ padding: 30, zIndex: 1, position: "absolute", opacity: 0.4 }}
        />
      </div>
    </div>
  );
};
