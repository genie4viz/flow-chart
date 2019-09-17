import * as d3 from 'd3';

export function formatData(data, period, xcount, ycount) {
    
    if (data[0][1] === "Timestamp"){//first row is field data ?
        data.shift(); //remove field row 
        data.sort((a, b) => Number(a[1]) - Number(b[1]));
    }else {
        data.sort((a, b) => +a[0] - +b[0]);
    }
    
    const recordFieldLen = data[0].length;

    let new_data = data.map(d => {
        if(recordFieldLen === 4){
            return {                
                device: 'Unique Device',
                ts: +d[0] * 1000,
                id: d[1],
                x: +d[2],
                y: +d[3]
            }    
        }else{
            return {
                device: d[0],
                ts: +d[1] * 1000,
                id: d[2],
                x: +d[3],
                y: +d[4]
            }
        }
    })

    const   mints = d3.min(new_data.map(d => d.ts)),
            maxts = d3.max(new_data.map(d => d.ts)),
            axisw = Math.ceil(d3.max(new_data.map(d => d.x))/100) * 100 ,
            axish = Math.ceil(d3.max(new_data.map(d => d.y))/100) * 100;
    
    //get Partial data    
    let partials = [], partial,
        baseFrom = new_data[0].ts,
        baseTo = new_data[new_data.length - 1].ts,
        periodMS = period * 60 * 1000,
        times = Math.round((baseTo - baseFrom) / periodMS) < 1 ? 1 : Math.round((baseTo - baseFrom) / periodMS),
        currentFrom, currentTo;
    
    for(let i = 0; i < times; i++){
        currentFrom = baseFrom + i * periodMS;
        currentTo = currentFrom + periodMS;
        partial = new_data.filter(d => d.ts >= currentFrom && d.ts <= currentTo);
        partials.push(getCellData(partial, axisw, axish, xcount, ycount));
    }

    return {
        arranged: partials,
        mints: mints,
        maxts: maxts,        
        axisw: axisw,
        axish: axish,
    };

}

//get data per each cell
function getCellData(data, w, h, xcount, ycount) {    
    let cellInfo = [], stepX = w/xcount, stepY = h/ycount;
  
    let cell = {}, rect;
    for(let i = 0; i < xcount; i++){
      for(let j = 0; j < ycount; j++){
        rect = {
          x: i * stepX, 
          y: j * stepY, 
          width: stepX,
          height: stepY
        };
        cell = {
          xi: i,
          yi: j,
          id_counts: 0,
          data: []
        }
        for(let k = 0; k < data.length; k++){
            if(ptInRect(data[k].x, data[k].y, rect)){                
                cell.data.push(data[k]);
            }
        }
        cellInfo.push(cell);
      }
    }    
    //get only represent flow data
    let counts_arr = [], spt, idCounts = 0;
    cellInfo.forEach(cell => {
        idCounts = 0;
        if(cell.data.length > 1){
            let counts = {};
            cell.data.forEach(d => {
                let key = d.device + ":" + d.id;
                counts[key] = (counts[key] || 0) + 1;
            });            
            
            for(let i in counts){
                if(counts[i] > 2){
                    idCounts++;
                    spt = i.split(":");
                    let fil = cell.data.filter(d => spt[0] === d.device && spt[1] === d.id);

                    let sx = fil[0].x,
                        sy = fil[0].y,
                        ex = fil[fil.length - 1].x,
                        ey = fil[fil.length - 1].y;
                    
                    counts_arr.push({
                        key: i,
                        xi: cell.xi,
                        yi: cell.yi,
                        from: {
                            x: sx,
                            y: sy,
                        },
                        to: {
                            x: ex,
                            y: ey
                        }                        
                    });
                }
            }
            cell.id_counts = idCounts;
        }
    });

    return {
        cell_info: cellInfo,
        counts_arr: counts_arr
    };
}

function ptInRect(x, y, rect){
    return rect.x + 2 <= x && x <= rect.x + rect.width - 4 && rect.y + 2 <= y && y <= rect.y + rect.height - 4;
} 

export function getOpacity(appeardCount) {
    if (appeardCount > 100) appeardCount = 100;
    return 0.5/100 * appeardCount;    
}