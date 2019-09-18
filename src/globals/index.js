import * as d3 from "d3";

export function formatData(data) {    
  if (data[0].length === 1) {
    //first row is field data ?
    data.shift(); //remove field row
    data.sort((a, b) => +a[1] - +b[1]);
  } else {
    data.sort((a, b) => +a[0] - +b[0]);
  }

  const recordFieldLen = data[0].length;

  let new_data = data.map(d => {
    if (recordFieldLen === 4) {
      return {
        device: "Unique Device",
        ts: +d[0] * 1000,
        id: d[1],
        x: +d[2],
        y: +d[3]
      };
    } else {
      return {
        device: d[0],
        ts: +d[1] * 1000,
        id: d[2],
        x: +d[3],
        y: +d[4]
      };
    }
  });
  return {
    dt: new_data,    
    axisw: Math.ceil(d3.max(new_data.map(d => d.x)) / 100) * 100,
    axish: Math.ceil(d3.max(new_data.map(d => d.y)) / 100) * 100
  };
}

export function adjustData(data, period, threshold, xcount, ycount, cbFunc) {
  //get Partial data  
  let partials = [],
    partial,
    baseFrom = data.dt[0].ts,
    baseTo = data.dt[data.dt.length - 1].ts,
    periodMS = period * 60 * 1000,
    times =
      Math.round((baseTo - baseFrom) / periodMS) < 1
        ? 1
        : Math.round((baseTo - baseFrom) / periodMS),
    currentFrom,
    currentTo;

  for (let i = 0; i < times; i++) {
    currentFrom = baseFrom + i * periodMS;
    currentTo = currentFrom + periodMS;
    partial = data.dt.filter(d => d.ts >= currentFrom && d.ts <= currentTo);
    partials.push(
      getCellData(partial, threshold, data.axisw, data.axish, xcount, ycount)
    );
  }
  cbFunc({
    dt: partials,
    dateFrom: baseFrom,
    dateTo: baseFrom + times * periodMS, //baseTo
    axisw: data.axisw,
    axish: data.axish
  });
}
//get data per each cell
function getCellData(data, threshold, w, h, xcount, ycount) {
  let cellInfo = [],
    stepX = w / xcount,
    stepY = h / ycount,
    rect;
  for (let i = 0; i < xcount; i++) {
    for (let j = 0; j < ycount; j++) {
      rect = {
        x: i * stepX,
        y: j * stepY,
        width: stepX,
        height: stepY
      };

      const subs = data.filter(d => ptInRect(d.x, d.y, rect));
      const nested = d3
        .nest()
        .key(d => d.device + ":" + d.id)
        .entries(subs);
      
      if (nested.length >= threshold) {
        let shows = [];
        nested.forEach(n => {
          shows.push({
            key: n.key,
            from: {
              x: n.values[0].x,
              y: n.values[0].y
            },
            to: {
              x: n.values[n.values.length - 1].x,
              y: n.values[n.values.length - 1].y
            }
          });
        });
        cellInfo.push({
          xi: i,
          yi: j,
          id_counts: nested.length,
          shows: shows
        });
      }
    }
  }
  return cellInfo;
}

function ptInRect(x, y, rect) {
  return (
    rect.x <= x &&
    x < rect.x + rect.width &&
    rect.y <= y &&
    y < rect.y + rect.height
  );
}

export function getOpacity(appeardCount) {
  if (appeardCount > 100) appeardCount = 100;
  return (0.5 / 100) * appeardCount;
}
