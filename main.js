/* Load Data */
const url = "https://raw.githubusercontent.com/menocsk27/datavis-a2/main/cars.csv";

d3.csv(url).then(data => {
  data = data.map(d => ({
    Name: d.Name,
    Type: d.Type,
    AWD: +d.AWD,
    RWD: +d.RWD,
    "Retail Price": +d["Retail Price"],
    "Dealer Cost": +d["Dealer Cost"],
    "Engine Size": +d["Engine Size (l)"],
    "Cylinder": +d["Cyl"],
    "Horsepower": +d["Horsepower(HP)"],
    "City MPG": +d["City Miles Per Gallon"],
    "Highway MPG": +d["Highway Miles Per Gallon"],
    "Weight": +d["Weight"],
    "Wheel Base": +d["Wheel Base"],
    "Length": +d["Len"],
    "Width": +d["Width"]
  }))
  .filter(d =>
    !isNaN(d.Horsepower) &&
    !isNaN(d["City MPG"]) &&
    d["City MPG"] > 0 &&
    d["City MPG"] < 100 &&
    d.Horsepower < 600 &&
    d.Type !== ""
  );

  drawScatterplot(data);
});

/* Scatterplot */
function drawScatterplot(data) {
  const width = 650, height = 450, margin = 50;

  const svg = d3.select("#chart").append("svg")
    .attr("width", width)
    .attr("height", height);

  const x = d3.scaleLinear()
    .domain([0, d3.max(data, d => d.Horsepower)])
    .nice()
    .range([margin, width - margin]);

  const y = d3.scaleLinear()
    .domain([0, d3.max(data, d => d["City MPG"])])
    .nice()
    .range([height - margin, margin]);

  const types = [...new Set(data.map(d => d.Type))].filter(d => d !== "");
  const color = d3.scaleOrdinal().domain(types).range(d3.schemeSet2);
  const shapeScale = d3.scaleOrdinal()
    .domain(types)
    .range([d3.symbolCircle, d3.symbolSquare, d3.symbolTriangle, d3.symbolDiamond, d3.symbolCross, d3.symbolStar]);

  svg.append("g").attr("transform", `translate(0,${height - margin})`).call(d3.axisBottom(x));
  svg.append("g").attr("transform", `translate(${margin},0)`).call(d3.axisLeft(y));

  svg.append("text")
    .attr("x", width / 2)
    .attr("y", height - 10)
    .attr("text-anchor", "middle")
    .attr("font-weight", "bold")
    .attr("font-size", "13px")
    .text("Horsepower");

  svg.append("text")
    .attr("x", -height / 2)
    .attr("y", 15)
    .attr("transform", "rotate(-90)")
    .attr("text-anchor", "middle")
    .attr("font-weight", "bold")
    .attr("font-size", "13px")
    .text("Miles per Gallon");

  svg.selectAll(".point")
    .data(data)
    .enter()
    .append("path")
    .attr("class", "point")
    .attr("transform", d => `translate(${x(d.Horsepower)},${y(d["City MPG"])})`)
    .attr("d", d3.symbol().size(80).type(d => shapeScale(d.Type)))
    .attr("fill", d => color(d.Type))
    .attr("stroke", "white")
    .attr("stroke-width", 0.8)
    .attr("opacity", 0.9)
    .on("click", function (event, d) {
      showDetails(d);
      drawStarPlot(d);
      d3.selectAll(".point").attr("stroke", "white");
      d3.select(this).attr("stroke", "#000").attr("stroke-width", 2);
    });

  /* Legend */
  const legend = svg.append("g").attr("transform", `translate(${width - 150},${50})`);
  types.forEach((type, i) => {
    const g = legend.append("g").attr("transform", `translate(0,${i * 25})`);
    g.append("path")
      .attr("d", d3.symbol().size(100).type(shapeScale(type)))
      .attr("fill", color(type))
      .attr("stroke", "white");
    g.append("text")
      .attr("x", 20)
      .attr("y", 5)
      .attr("font-size", "12px")
      .text(type);
  });
}

/* Sidebar - Details */
function showDetails(d) {
  let html = `<h3>${d.Name}</h3><table>`;
  for (const [key, value] of Object.entries(d)) {
    html += `<tr><td><b>${key}</b></td><td>${value}</td></tr>`;
  }
  html += "</table>";
  d3.select("#details").html(html);
}

/* Sidebar - Starplot */
function drawStarPlot(d) {
  const attrs = ["Retail Price", "Engine Size", "Cylinder", "Horsepower", "City MPG", "Highway MPG"];
  const maxRanges = {
    "Retail Price": 130000,
    "Engine Size": 8,
    "Cylinder": 12,
    "Horsepower": 500,
    "City MPG": 60,
    "Highway MPG": 70
  };
  const values = attrs.map(a => d[a] / maxRanges[a]);
  const width = 280, height = 280, radius = 90;

  const angle = d3.scaleLinear().domain([0, attrs.length]).range([0, 2 * Math.PI]);
  const r = d3.scaleLinear().domain([0, 1]).range([0, radius]);

  d3.select("#starplot").selectAll("*").remove();
  const svg = d3.select("#starplot").append("svg")
    .attr("width", width)
    .attr("height", height)
    .append("g")
    .attr("transform", `translate(${width / 2},${height / 2})`);

  svg.selectAll("line")
    .data(attrs)
    .enter()
    .append("line")
    .attr("x1", 0)
    .attr("y1", 0)
    .attr("x2", (d, i) => radius * Math.sin(angle(i)))
    .attr("y2", (d, i) => -radius * Math.cos(angle(i)))
    .attr("stroke", "#ccc");

  svg.selectAll("text")
    .data(attrs)
    .enter()
    .append("text")
    .attr("x", (d, i) => (radius + 15) * Math.sin(angle(i)))
    .attr("y", (d, i) => -(radius + 15) * Math.cos(angle(i)))
    .attr("text-anchor", "middle")
    .attr("font-size", "10px")
    .text(d => d);

  const line = d3.lineRadial()
    .radius((d, i) => r(values[i]))
    .angle((d, i) => angle(i))
    .curve(d3.curveLinearClosed);

  svg.append("path")
    .datum(values)
    .attr("fill", "orange")
    .attr("fill-opacity", 0.6)
    .attr("stroke", "#e67e22")
    .attr("stroke-width", 2)
    .attr("d", line);
}
