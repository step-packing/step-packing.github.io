// Configuration for the CSV files and their corresponding labels/colors
const datasetConfig = {
  "STEP-1": {
    csvPath: "./static/data/15_pareto_agg.csv",
    color: "#ff8c1a",
    lightColor: "#ffd580",
    darkColor: "#ff8c1a"
  },
  "STEP-3": {
    csvPath: "./static/data/35_pareto_agg.csv", 
    color: "#006400",
    lightColor: "#b6e3b6",
    darkColor: "#006400"
  },
  "STEP-5": {
    csvPath: "./static/data/55_pareto_agg.csv",
    color: "#003366", 
    lightColor: "#a6c8ff",
    darkColor: "#003366"
  }
};

let paretoData = {};

// Function to truncate to 2 decimal places without rounding
function truncateToTwoDecimals(num) {
  return Math.floor(num * 100) / 100;
}

// Function to parse CSV data
function parseCSV(csvText) {
  const lines = csvText.trim().split('\n');
  const headers = lines[0].split(',');
  const data = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',');
    const row = {};
    headers.forEach((header, index) => {
      const value = values[index];
      // Convert numeric values
      if (header === 'w1' || header === 'w2' || header === 'space_mean' || header === 'time_mean') {
        row[header] = parseFloat(value);
      } else if (header === 'is_pareto') {
        row[header] = parseInt(value) === 1;
      } else {
        row[header] = value;
      }
    });
    data.push(row);
  }
  return data;
}

// Function to load CSV file
async function loadCSV(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const csvText = await response.text();
    return parseCSV(csvText);
  } catch (error) {
    console.error(`Error loading CSV from ${url}:`, error);
    return [];
  }
}

// Function to load all datasets
async function loadAllData() {
  const loadPromises = Object.entries(datasetConfig).map(async ([stepVariant, config]) => {
    const data = await loadCSV(config.csvPath);
    paretoData[stepVariant] = {
      color: config.color,
      lightColor: config.lightColor,
      darkColor: config.darkColor,
      points: data
    };
  });
  
  await Promise.all(loadPromises);
}

function createParetoChart() {
  const margin = { top: 40, right: 120, bottom: 80, left: 80 };
  const width = 900 - margin.left - margin.right;
  const height = 600 - margin.top - margin.bottom;

  // Clear any existing chart
  d3.select("#pareto-chart").selectAll("*").remove();

  // Create container (simplified - no positioning)
  const container = d3.select("#pareto-chart");

  // Create SVG
  const svg = container
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom);

  const g = svg.append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  // Find data ranges
  let allPoints = [];
  Object.values(paretoData).forEach(dataset => {
    allPoints = allPoints.concat(dataset.points);
  });

  if (allPoints.length === 0) {
    g.append("text")
      .attr("x", width / 2)
      .attr("y", height / 2)
      .attr("text-anchor", "middle")
      .style("font-size", "18px")
      .text("Loading data...");
    return;
  }

  const timeExtent = d3.extent(allPoints, d => d.time_mean);
  const spaceExtent = d3.extent(allPoints, d => d.space_mean * 100); // Convert to percentage

  // Create scales with some padding
  const xScale = d3.scaleLinear()
    .domain([timeExtent[0] * 0.95, timeExtent[1] * 1.05])
    .range([0, width]);

  const yScale = d3.scaleLinear()
    .domain([spaceExtent[0] * 0.98, spaceExtent[1] * 1.02])
    .range([height, 0]);

  // Add grid
  g.append("g")
    .attr("class", "grid")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(xScale)
      .tickSize(-height)
      .tickFormat("")
    )
    .style("stroke-dasharray", "3,3")
    .style("opacity", 0.7);

  g.append("g")
    .attr("class", "grid")
    .call(d3.axisLeft(yScale)
      .tickSize(-width)
      .tickFormat("")
    )
    .style("stroke-dasharray", "3,3")
    .style("opacity", 0.7);

  // Add axes
  g.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(xScale))
    .style("font-size", "18px");

  g.append("g")
    .call(d3.axisLeft(yScale))
    .style("font-size", "18px");

  // Add axis labels
  g.append("text")
    .attr("x", width / 2)
    .attr("y", height + 60)
    .attr("text-anchor", "middle")
    .style("font-size", "20px")
    .style("font-weight", "bold")
    .text("Operational Time");

  g.append("text")
    .attr("transform", "rotate(-90)")
    .attr("y", -50)
    .attr("x", -height / 2)
    .attr("text-anchor", "middle")
    .style("font-size", "20px")
    .style("font-weight", "bold")
    .text("Space Utilization");

  // Create tooltip
  const tooltip = d3.select("body").append("div")
    .attr("class", "pareto-tooltip")
    .style("opacity", 0)
    .style("position", "absolute")
    .style("background", "rgba(0, 0, 0, 0.95)")
    .style("color", "#ffffff")
    .style("padding", "12px")
    .style("border-radius", "8px")
    .style("font-size", "14px")
    .style("font-family", "monospace")
    .style("pointer-events", "none")
    .style("box-shadow", "0 4px 6px rgba(0, 0, 0, 0.1)")
    .style("z-index", "1000");

  // Process each dataset
  Object.entries(paretoData).forEach(([stepVariant, dataset]) => {
    const points = dataset.points;
    
    // Separate Pareto front and non-Pareto points
    const paretoPoints = points.filter(d => d.is_pareto);
    const nonParetoPoints = points.filter(d => !d.is_pareto);

    // Plot non-Pareto points (more visible now)
    g.selectAll(`.non-pareto-${stepVariant}`)
      .data(nonParetoPoints)
      .enter()
      .append("circle")
      .attr("class", `non-pareto-${stepVariant}`)
      .attr("cx", d => xScale(d.time_mean))
      .attr("cy", d => yScale(d.space_mean * 100))
      .attr("r", 5)
      .attr("fill", dataset.lightColor)
      .attr("opacity", 0.7)
      .attr("stroke", dataset.color)
      .attr("stroke-width", 0.5)
      .style("cursor", "pointer")
      .on("mouseover", function(event, d) {
        showTooltip(event, d, stepVariant);
        d3.select(this).attr("r", 7).attr("opacity", 1.0);
      })
      .on("mouseout", function() {
        hideTooltip();
        d3.select(this).attr("r", 5).attr("opacity", 0.7);
      });

    // Sort Pareto points by time for line drawing
    paretoPoints.sort((a, b) => a.time_mean - b.time_mean);

    // Draw Pareto front line
    if (paretoPoints.length > 1) {
      const line = d3.line()
        .x(d => xScale(d.time_mean))
        .y(d => yScale(d.space_mean * 100))
        .curve(d3.curveLinear);

      g.append("path")
        .datum(paretoPoints)
        .attr("fill", "none")
        .attr("stroke", dataset.color)
        .attr("stroke-width", 2)
        .attr("d", line);
    }

    // Plot Pareto front points
    g.selectAll(`.pareto-${stepVariant}`)
      .data(paretoPoints)
      .enter()
      .append("circle")
      .attr("class", `pareto-${stepVariant}`)
      .attr("cx", d => xScale(d.time_mean))
      .attr("cy", d => yScale(d.space_mean * 100))
      .attr("r", 6)
      .attr("fill", dataset.color)
      .attr("stroke", "white")
      .attr("stroke-width", 2)
      .style("cursor", "pointer")
      .on("mouseover", function(event, d) {
        showTooltip(event, d, stepVariant);
        d3.select(this).attr("r", 8).attr("stroke-width", 3);
      })
      .on("mouseout", function() {
        hideTooltip();
        d3.select(this).attr("r", 6).attr("stroke-width", 2);
      });
  });

  // Add legend in bottom-right
  const legend = g.append("g")
    .attr("class", "legend")
    .attr("transform", `translate(${width - 150}, ${height - 100})`);

  Object.entries(paretoData).forEach(([stepVariant, dataset], i) => {
    const legendRow = legend.append("g")
      .attr("transform", `translate(0, ${i * 25})`);

    legendRow.append("circle")
      .attr("r", 6)
      .attr("fill", dataset.color)
      .attr("stroke", "white")
      .attr("stroke-width", 2);

    legendRow.append("text")
      .attr("x", 15)
      .attr("y", 5)
      .style("font-size", "12px")
      .style("fill", "black")
      .text(`${stepVariant} (Pareto front)`);
  });

  // Tooltip functions
  function showTooltip(event, d, stepVariant) {
    // Calculate preference vector using truncated space value
    const spacePreference = truncateToTwoDecimals(d.w1);
    const timePreference = 1 - spacePreference; // Use truncated space value
    
    tooltip.transition()
      .duration(200)
      .style("opacity", 1);
    
    tooltip.html(`
      <strong style="color: #ffffff;">${stepVariant}</strong><br/>
      <span style="color: #ffffff;">Space Utilization: ${(d.space_mean * 100).toFixed(1)}%</span><br/>
      <span style="color: #ffffff;">Operational Time: ${d.time_mean.toFixed(1)}</span><br/>
      <span style="color: #ffffff;">Preference Vector: [${spacePreference.toFixed(2)}, ${timePreference.toFixed(2)}]</span><br/>
      <span style="color: #ffffff;">Pareto Optimal: ${d.is_pareto ? 'Yes' : 'No'}</span>
    `)
      .style("left", (event.pageX + 10) + "px")
      .style("top", (event.pageY - 10) + "px");
  }

  function hideTooltip() {
    tooltip.transition()
      .duration(500)
      .style("opacity", 0);
  }
}

// Initialize chart when page loads
document.addEventListener('DOMContentLoaded', async function() {
  // Show loading message
  d3.select("#pareto-chart")
    .append("div")
    .style("text-align", "center")
    .style("padding", "50px")
    .style("font-size", "18px")
    .text("Loading Pareto front data...");
  
  // Load data and create chart
  await loadAllData();
  createParetoChart();
});

// Clean up tooltip when page unloads
window.addEventListener('beforeunload', function() {
  d3.selectAll('.pareto-tooltip').remove();
});