
// import {PCA} from 'https://cdn.jsdelivr.net/npm/ml-pca@4.1.1/+esm'
// import {getNumbers} from 'https://cdn.jsdelivr.net/npm/ml-dataset-iris@1.2.1/+esm'
// string to number 
//https://stackoverflow.com/questions/61057507/how-to-convert-object-properties-string-to-integer-in-javascript

const { PCA } = await import("https://esm.sh/ml-pca");
const dataset = (await import("https://esm.sh/ml-dataset-iris")).getNumbers();
import * as d3 from "https://cdn.skypack.dev/d3@7"
import {default as d3tip} from 'https://esm.sh/d3-tip';

// const pca = new PCA(dataset);
// console.log('pca.getExplainedVariance()',pca.getExplainedVariance());

const pca = {}
// PCA (scale, asDataframe, plotPCA)/////////////////////////////////////////////////////////

function asDataFrame(value) {
  // check if value is array of objects (aoo)
  if (value === undefined || value === null)
    throw new Error("No data passed to function.");
  if (
    !Array.isArray(value) ||
    typeof value[0] !== "object" ||
    value[0] === null
  ) {
    throw new Error("First argument must be an array of objects");
  }

  const aoo = value;
  // columns: if parsed using d3, the aoo will already have a columns prop
  // -> create it otherwise
  if (!value.columns) {
    const set = new Set();
    for (const row of aoo) {
      for (const key of Object.keys(row)) set.add(key);
    }
    aoo.columns = [...set];
  }
  // create getters and setters for columns
  aoo.columns.forEach((column) => {
    if (!Object.getOwnPropertyDescriptor(aoo, column)) {
      Object.defineProperty(aoo, column, {
        get: function () {
          return this.map((row) => row[column]);
        },
        set: function (array) {
          if (!array) {
            throw new Error(`No data passed to set ${column} column.`);
          }
          if (array.length !== this.length) {
            throw new Error(
              `Data length (${array.length}) different from column ${column} length (${this.length}).`
            );
          }
          this.forEach((row, index) => (row[column] = array[index]));
        }
      });
    }
  });
  return aoo;
}

function scale(value) {
    const clone = JSON.parse(JSON.stringify(value));
    const df = asDataFrame(clone);
    df.columns.forEach((column) => {
      const values = df[column];
      const mean = d3.mean(values);
      const sd = d3.deviation(values);
      df[column] = values.map((v) => {
        if (v !== null && v !== undefined) {
          return (v - mean) / sd;
        }
        return v;
      });
    });
    return df;
  }
pca.calculatePca = function (data) {

    const headers =  Object.keys(data[0]).filter(key => !isNaN(data[0][key]))

    const dt = (scale(data.map(obj => Object.fromEntries(Object.entries(obj)
    .filter(([key])=> headers.includes(key)))))).map( Object.values )

    // todo: add headers to dt
    // console.log('(scale(data.map(obj => Object.fromEntries(Object.entries(obj).filter(([key])=> idx.includes(key))))))',(scale(data.map(obj => Object.fromEntries(Object.entries(obj).filter(([key])=> idx.includes(key)))))))
    dt['headers'] = headers
   
    const data2 = data.map(({ species,id, ...rest }) => rest)
    const pca = new PCA(dt, { center: true, scale: true })
    console.log('pca',pca)  
    const scores = pca.predict((scale(data2)).map( Object.values ))
    .toJSON()
    .map((row, rowIndex) => {
      const columns = Object.keys(data[rowIndex]);
      const rowObj = {
        group: data[rowIndex]['species'],
        id: data[rowIndex]['id']
      };
      columns.forEach((column, colIndex) => {
        rowObj[`PC${colIndex + 1}`] = row[colIndex];
      });
      return rowObj;
    }).map(({PC1,PC2,group,id}) => ({PC1,PC2,group,id}))
   const groups = [...new Set(scores.map( d => d.group))]
return scores
 }

 
pca.plotPCA = function(scores,groups){
  const color = d3.scaleOrdinal( ["#8C236A", "#4477AA", "#AA7744", "#117777", "#DD7788", "#77AADD", "#777711", "#AA4488", "#44AA77", "#AA4455"])
  .domain(groups)

    const width = 300
    const height = width/1.5
    const fontFamily= 'monospace'
    const maxOpacity = 0.7
    const margin = ({top: 20, right: 90, bottom: 45, left: 45})
    const paddedMin = d3.min(scores, d => d.PC1) - d3.min(scores, d => d.PC1)*-0.10
    const paddedMax = d3.max(scores, d => d.PC1) + d3.max(scores, d => d.PC1)*0.10
    const x = d3.scaleLinear()
        .domain([paddedMin, paddedMax])
        .range([margin.left, width - margin.right])
      
    const xAxis = g => g
        .attr("transform", `translate(0,${height - margin.bottom + 5})`)
        .call(d3.axisBottom(x))
        .call(g => g.select(".domain").remove())
        .call(g => g.append("text")
            .attr("x", width-margin.left -20)
            .attr("y", 15)
           // .attr("x", width - margin.right)
           //  .attr("y", -4)
            .attr("fill", "#000")
            .attr("font-weight", "bold")
            .attr("text-anchor", "end")
            .text("PC1"))
      
    const y = d3.scaleLinear()
        .domain(d3.extent(scores, d => d.PC2))
        .range([height - margin.bottom, margin.top])
      
    const yAxis = g => g
        .attr("transform", `translate(${margin.left-5},0)`)
        .call(d3.axisLeft(y))
        .call(g => g.select(".domain").remove())
        .call(g => g.select(".tick:last-of-type text").clone()
            .attr("x", -margin.top)
            .attr("y", -margin.top)
            .attr("fill", "#000")
            .attr("text-anchor", "start")
            .attr("font-weight", "bold")
            .text("PC2"))
      
    const svg = d3.create("svg")
    // const g = d3.select(DOM.svg(width, height));
      
    const g = svg
      .attr('width', width  )
      .attr('height', height )
      .append('g')
     // .attr('transform', `translate(${margin.left+margin.right}, ${margin.top+margin.bottom})`)
    
       g.append("g")
          .call(xAxis);
      
      g.append("g")
          .call(yAxis);
      
      g.append("rect")
        .attr("id", "background")
        .attr("x", margin.left)
        .attr("y", margin.top)
        .attr("width", width - margin.top - margin.right)
        .attr("height", height - margin.top - margin.bottom)
        .attr("fill", "white")
        .on("click", d => { d3.selectAll(".points, .keyRects").transition().attr("opacity", maxOpacity) })
    
     const gPoints = g.append("g").attr("class", "gPoints");
      
     const tooltip = d3tip()
        .style('border', 'solid 3px black')
        .style('background-color', 'white')
        .style('border-radius', '11px')
        .style('float', 'left')
        .style('font-family', fontFamily)
        .html((event, d) => `
          <div style='float: right'>
            name:${d.Name} <br/>
            pc1:${d.PC1.toFixed(2)} <br/>
            pc2:${d.PC2.toFixed(2)}
          </div>`)
      
    // Apply tooltip to our SVG
     svg.call(tooltip)
     gPoints.selectAll()
      g.append("g")
        .style("isolation", "isolate")
        .selectAll("circle")
        .data(scores)
        .enter().append("circle")
          .attr("class", "points")
          .attr("cx", d => x(d.PC1))
          .attr("cy", d => y(d.PC2))
          .attr("fill", d => color(d.group))
          // .style("mix-blend-mode", blendingMode)
          .attr("opacity", 0.7)
          .attr("r", 4)
          .on('mouseover', tooltip.show)
          .on('mouseout', tooltip.hide) 
      
      const key = g.append("g")
        .selectAll("rect")
        .data(groups)
      console.log("key",key)
        key.enter().append("rect")
          .attr("class", "keyRects")
          .attr("x", width - margin.left - 70)
          .attr("y", (d, i) => i * 20)
          .attr("width", 12)
          .attr("height", 12)
          .attr("fill", d => color(d))
          .on("click", (event, d) => {
          return selectGroup(this, d, maxOpacity)
          })
          
        key.enter().append("text")
          .attr("x", d => width - margin.left -50)
          .attr("y", (d, i) => i * 20)
          .attr("dy", "0.7em")
          .text(d => `${d}`)
          .style("font-size", "11px")
          .on("click", (event, d) => {
          return selectGroup(this, d, maxOpacity)
          });
    // x and y-axis labels
    // svg.append("text")
    //     .attr("class", "x label")
    //     .attr("text-anchor", "end")
    //     .attr("x", width/2)
    //     .attr("y", height - 6)
    //     .text("PC1");
    // svg.append("text")
    //     .attr("class", "y label")
    //     .attr("text-anchor", "end")
    //     .attr("x", -height/2)
    //     .attr("y", 0)
    //     .attr("dy", "0.9em")
    //     .attr("transform", "rotate(-90)")
    //     .text("PC2");
    const pcaDiv = document.createElement("div")
    pcaDiv.id = 'pcaDiv'
    document.body.appendChild(pcaDiv);
    pcaDiv.append(document.createElement('br'));
    document.getElementById('pcaDiv').appendChild(svg.node());
      return svg.node();
    }

export {pca}