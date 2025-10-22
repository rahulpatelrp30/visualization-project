import React, {Component} from "react";
import * as d3 from "d3";

class ScatterPlot extends Component {
    constructor(props) {
        super(props);
        this.chartRef = React.createRef();
    }

    componentDidMount() {
        this.drawChart();
    }

    componentDidUpdate() {
        this.drawChart();
    }

    drawChart() {
        const data = this.props.csv_data;

        // ensures that we only refresh when new valid data is loaded
        if (!data || data.length === 0) return;

        // dimensions of the scatter plot
        const margin = {top: 20, right: 20, bottom: 50, left: 20};
        const width = 350 - margin.left - margin.right;
        const height = 300 - margin.top - margin.bottom;
        const innerWidth = width - margin.left - margin.right; 
        const innerHeight = height - margin.top - margin.bottom; 

        d3.select(this.chartRef.current).selectAll("*").remove();

        /*Hollly data processing . headache here and with the scale bc of the dataset*/
        // it makes sense to hard code. short on time
        // real scale
        const xScale = d3.scaleLinear().domain([0, 450]).range([0, width]);
        const yScale = d3.scaleLinear().domain([0, 5]).range([height, 0]);
        const brands = data.map(d => d.Brand);
        const uniqueBrands = Array.from(new Set(brands));
        const colorScale = d3.scaleOrdinal()
                .domain(uniqueBrands)
                .range(
                uniqueBrands.map((_, i) => d3.interpolateRainbow(i / uniqueBrands.length))
                    );
        const groupedData = d3.group(data, (d) => d.Brand);
        const averagedData = Array.from(groupedData, ([key, value]) => ({
            Brand: key,
            "Average Storage": d3.mean(value, (d) => +d["Storage (GB)"]),
            "Average Stars": d3.mean(value, (d) => +d.Stars)
        }));
       

        const svg = d3
            .select(this.chartRef.current)
            .append("svg")
            .attr("width", width + margin.left + margin.right+50)
            .attr("height", height + margin.top + margin.bottom + 100)
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        const container = svg
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        // appending the xAxis Scale to the svg
        container
            .append("g")
            .attr("transform", `translate(0,${height})`)
            .call(d3.axisBottom(xScale))
            .selectAll("text")
            .style("font-size", "10px");

        // appending the yAxis Scale to the svg
        container
            .append("g")
            .call(d3.axisLeft(yScale))
            .selectAll("text")
            .style("font-size", "10px");

        // appending the x axis title
        svg
            .append("text")
            .attr("x", width - 300)
            .attr("y", height + 60)
            .attr("text-anchor", "center")
            .style("font-size", "12px")
            .text("Avg. Storage (GB)");

        // appending the y axis title
        svg
            .append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", margin.left-30)
            .attr("x", -(height / 2 + margin.top))
            .attr("text-anchor", "middle")
            .style("font-size", "12px")
            .text("Avg. Stars");

        // appending the title on the scatter plot
        svg
            .append("text")
            .attr("x", width / 2 + margin.left)
            .attr("y", margin.top / 2)
            .attr("text-anchor", "middle")
            .style("font-size", "16px")
            .text("Avg. Storage (GB) vs Avg. Stars by Brand");

        // adds the vertical light lines for better visualization on the plot values
        container.append("g")
            .attr("class", "grid")
            .attr("transform", `translate(0,${height})`)
            .call(d3.axisBottom(xScale).tickSize(-height).tickFormat(""));

        // adds the horizontal light lines for same reason as above
        container.append("g")
            .attr("class", "grid")
            .call(d3.axisLeft(yScale).tickSize(-width).tickFormat(""));

        // styles the measurement grid lines in the visualization
        svg.selectAll(".grid line")
            .style("stroke", "#e0e0e0")
            .style("stroke-opacity", "0.5")

        // the plots themselves
         const tooltip = d3.select(".tooltip");
        container
            .selectAll("circle")
            .data(averagedData)
            .join("circle")
            .attr("cx", (d) => xScale(d["Average Storage"]))
            .attr("cy", (d) => yScale(d["Average Stars"]))
            .attr("r", 5)
            .attr("fill", d => colorScale(d.Brand))
             .on("mouseover", function(event, d) {
                            d3.select(this)
                                .attr("stroke", "#000")
                                .attr("stroke-width", 2);
            
                            // Debugging log
                            console.log("Hovered Data:", d.data);
            
                            // Show the tooltip
                            tooltip.transition()
                                .duration(200)
                                .style("opacity", 0.9);
            
                            // Populate the tooltip with product details
                            tooltip.html(`
                                <strong>Brand:</strong> ${d.Brand || "N/A"}<br/>
                                <strong>Average Storage:</strong> ${d["Average Storage"] || "N/A"} GB<br/>
                                <strong>Average Ratings:</strong> ${d["Average Stars"] || "N/A"}<br/>
                            `);
                        })
                        .on("mousemove", function(event, d) {
                            // Get mouse coordinates relative to the viewport
                            const [mouseX, mouseY] = d3.pointer(event, document.body);
            
                            // Define offsets to prevent the tooltip from covering the cursor
                       
            
                            // Calculate the tooltip's position
                            let left = mouseX+10;
                            let top = mouseY-150 
            
                         
                            // Apply the calculated positions
                            tooltip
                                .style("left", `${left}px`)
                                .style("top", `${top}px`);
                        })
                        .on("mouseout", function(event, d) {
                            d3.select(this)
                                .attr("stroke", "#fff")
                                .attr("stroke-width", 1);
            
                            // Hide the tooltip
                            tooltip.transition()
                                .duration(500)
                                .style("opacity", 0);
                        });

        // select title being output, will be changed later to color scale because it still cluters
        const brandTitleOutput = ["VOX", "KARBONN", "ITEL", "LAVA", "CMF", "GOOGLE", "APPLE", "HONOR", "XIAOMI"]
        container
            .selectAll("text.label")
            .data(averagedData.filter(d => brandTitleOutput.includes(d.Brand)))
            .join("text")
            .attr("class", "label")
            .attr("x", (d) => xScale(d["Average Storage"]) + 5)
            .attr("y", (d) => yScale(d["Average Stars"]) - 5)
            .style("font-size", "10px")
            .style("fill", "black")
            .text((d) => d.Brand);
      const legendMargin = { top: 20, right: 30, bottom: 20, left: 50 };
            const legendX = innerWidth + legendMargin.left-55;
            const legendY = 100;
            const legendWidth = 150;
            const legendHeight = innerHeight;
    
            // Append a group for the legend
            const legendGroup = d3.select(this.chartRef.current).select("svg")
                .append("g")
                .attr("transform", `translate(${legendX}, ${legendY})`)
                .attr("class", "legend");
    
            // Add a title to the legend
            legendGroup.append("text")
                .attr("x", -25)
                .attr("y", -10)
                .attr("text-anchor", "start")
                .attr("font-size", "12px")
                .attr("font-weight", "bold")
                .text("Brands");
    
    const legendContainer = legendGroup.append("foreignObject")
    .attr("width", legendWidth)
    .attr("height", legendHeight)
    .append("xhtml:div")
    .attr("style", "overflow-y: scroll; height: " + (legendHeight - 30) + "px;");

// Append legend items
uniqueBrands.forEach((brand, i) => {
    const legendItem = legendContainer.append("div")
        .attr("class", "legend-item")
        .attr("style", "display: flex; align-items: center; margin-bottom: 5px;");

    legendItem.append("div")
        .attr("class", "legend-color")
        .attr("style", `width: 14px; height: 14px; background-color: ${colorScale(brand)}; margin-right: 8px; flex-shrink: 0;`);

    legendItem.append("span")
        .text(brand)
        .attr("style", "font-size: 12px;");
});
    }

    render() {
        return <div ref={this.chartRef}></div>;
    }
}

export default ScatterPlot;
