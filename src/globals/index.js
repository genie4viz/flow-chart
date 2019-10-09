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
        y: +d[3],
        is_squarable: false,
        square_grad: 0
      };
    } else {
      return {
        device: d[0],
        ts: +d[1] * 1000,
        id: d[2],
        x: +d[3],
        y: +d[4],
        is_squarable: false,
        square_grad: 0
      };
    }
  });
  return new_data;
}

export function adjustData(data, period, dwell, threshold, xcount, ycount, w, h, cbFunc) {
  //get Partial data  
  let partials = [],
    partial,
    baseFrom = data[0].ts,
    baseTo = data[data.length - 1].ts,
    periodMS = period * 1000,
    times =
      Math.round((baseTo - baseFrom) / periodMS) < 1
        ? 1
        : Math.round((baseTo - baseFrom) / periodMS),
    currentFrom,
    currentTo;
  
  const id_nested_data = d3
    .nest()
    .key(d => d.device + ":" + d.id)
    .entries(data);
  
  data.forEach(d => {
    d.is_squarable = false;
    d.square_grad = 0;
  });
  
  id_nested_data.forEach(dd => {
    const diff =  dd.values[dd.values.length - 1].ts - dd.values[0].ts;
    if(diff >= dwell * 1000){
      data.forEach(d => {
        if(d.device + ":" + d.id === dd.key){
          d.is_squarable = true;
          d.square_grad = 255 * diff/(baseTo - baseFrom);  
        }
      });
    }
  });    
  
  for (let i = 0; i < times; i++) {
    currentFrom = baseFrom + i * periodMS;
    currentTo = currentFrom + periodMS;
    partial = data.filter(d => d.ts >= currentFrom && d.ts <= currentTo);
    partials.push(
      getCellData(partial, threshold, w, h, xcount, ycount)
    );
  }
  
  cbFunc({
    dt: partials,
    dateFrom: baseFrom,    
    dateTo: baseFrom + times * periodMS, //baseTo
    periodMS: periodMS,
    totalTimes: times
  });
}
//get data per each cell
function getCellData(data, threshold, w, h, xcount, ycount) {  
  let cellInfo = [],
    stepX = w / xcount,
    stepY = h / ycount,
    rect;
  
  let uniques = [];
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
          let show_record = {
            key: n.key,
            from_x: n.values[0].x,
            from_y: n.values[0].y,
            to_x: n.values[n.values.length - 1].x,
            to_y: n.values[n.values.length - 1].y,
            cur_x: n.values[0].x,
            cur_y: n.values[0].y,
            step_x: 0,
            step_y: 0,
            is_squarable: n.values[0].is_squarable,
            square_grad: n.values[0].square_grad,
            // last_time: n.values[n.values.length - 1].ts
          };
            
          if(!uniques.includes(n.key)){//do not add same ID in one moment
            uniques.push(n.key);
            shows.push(show_record);
          }          
        });
        
        cellInfo.push({
          xi: i,
          yi: j,          
          id_counts: nested.length,
          shows: shows,
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
  return (1 / 100) * appeardCount;
}

export function getCurrentIndex(currentTime, dateFrom, dateTo, period, times) {  
  for(let i = 0; i < times; i++){
    let currentFrom = dateFrom + i * period;
    let currentTo = currentFrom + period;
    if(currentTime >= currentFrom && currentTime < currentTo){
      return i;
    }
  }
  return 0;
}
export function getNearDate(currentTime, dateFrom, dateTo, period, times) {
  for(let i = 0; i < times; i++){
    let currentFrom = dateFrom + i * period;
    let currentTo = currentFrom + period;
    if(currentTime >= currentFrom && currentTime <= currentTo){
      return currentFrom;
    }
  }  
}