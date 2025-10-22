import React, { Component, createRef } from "react";
import * as d3 from "d3";
import "./TreeMap.css"; // Ensure this file contains the tooltip and legend styles

class TreeMap extends Component {
    constructor(props) {
        super(props);
        this.chartRef = createRef();
    }

    componentDidMount() {
        this.drawChart();
    }

    componentDidUpdate() {
        this.drawChart();
    }

    drawChart() {
        const data = this.props.csv_data;
        if (!data || data.length === 0) return;

        // Define margins and total dimensions
        const margin = { top: 10, right: 90, bottom:40, left:0 };
        const totalWidth = 500; // Increased width to accommodate the legend
        const totalHeight = 350;

        // Calculate inner dimensions by subtracting margins once
        const innerWidth = totalWidth - margin.left - margin.right; 
        const innerHeight = totalHeight - margin.top - margin.bottom; 

        // Clear any existing content
        d3.select(this.chartRef.current).selectAll("*").remove();

        // Append SVG with total dimensions
        const svg = d3.select(this.chartRef.current)
            .append("svg")
            .attr("width", totalWidth)  
            .attr("height", totalHeight) 
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`); // Translate group by margins
            svg
            .append("text")
            .attr("x", totalWidth-400 )
            .attr("y", totalHeight-330)
            .attr("text-anchor", "center")
            .style("font-size", "12px")
            .text("TreeMap of Brands and their ratings")
        // Extract unique brands
        const brands = data.map(d => d.Brand);
        const uniqueBrands = Array.from(new Set(brands));

        // Define color scale
        const colorScale = d3.scaleOrdinal()
            .domain(uniqueBrands)
            .range(
                uniqueBrands.map((_, i) => d3.interpolateRainbow(i / uniqueBrands.length))
            );

        console.log("Color Assignments:", data.map(d => colorScale(d.Brand)));

        // Transform flat data into hierarchical data
        const hierarchicalData = {
            name: "Root",
            children: Array.from(
                d3.group(data, d => d.Brand),
                ([Brand, products]) => ({
                    name: Brand,
                    children: products
                        .filter(product => !isNaN(+product.Stars) && +product.Stars > 0) // Ensure valid stars
                        .map(product => ({
                            name: product["Product Name"],
                            Stars: +product.Stars, // Correct field access
                            // Include other features for tooltip
                            Camera: product.Camera,
                            Description: product.Description,
                            Link: product.Link,
                            "Actual price (USD)": +product["Actual price (USD)"],
                            "Discount price (USD)": +product["Discount price (USD)"],
                            "Display Size (inch)": +product["Display Size (inch)"],
                            "Ram (Gb)": +product["Ram (Gb)"],
                            Ratings: +product.Ratings,
                            Reviews: +product.Reviews,
                            "Storage (GB)": +product["Storage (GB)"]
                        }))
                })
            )
        };

        console.log("Hierarchical Data:", hierarchicalData);

        // Create root hierarchy
        const root = d3.hierarchy(hierarchicalData)
            .sum(d => d.Stars) // Size based on Stars
            .sort((a, b) => b.value - a.value);

        // Generate treemap layout
        d3.treemap()
            .size([innerWidth, innerHeight])
            .paddingInner(1)
            .paddingOuter(1)
            .paddingTop(20) // Space for labels
            (root);

        // Inspect treemap leaf nodes
        console.log("Treemap Leaf Nodes:", root.leaves());

        // Select all leaf nodes
        const nodes = svg.selectAll("g")
            .data(root.leaves())
            .enter()
            .append("g")
            .attr("transform", d => `translate(${d.x0},${d.y0})`);

        // Select the tooltip div
        const tooltip = d3.select(".tooltip");

        // Append rectangles with tooltip interactivity
        nodes.append("rect")
            .attr("class", "node")
            .attr("width", d => 2+d.x1 - d.x0)
            .attr("height", d => 5+d.y1 - d.y0)
            .attr("fill", d => colorScale(d.parent.data.name))
            .attr("stroke", "#fff")
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
                    <strong>Product:</strong> ${d.data.name || "N/A"}<br/>
                    <strong>Brand:</strong> ${d.parent.data.name || "N/A"}<br/>
                    <strong>Camera:</strong> ${d.data.Camera || "N/A"}<br/>
                    <strong>Description:</strong> ${d.data.Description || "N/A"}<br/>
                    <strong>Price:</strong> $${d.data["Discount price (USD)"] ? d.data["Discount price (USD)"].toFixed(2) : "N/A"} 
                        (Original: $${d.data["Actual price (USD)"] ? d.data["Actual price (USD)"].toFixed(2) : "N/A"})<br/>
                    <strong>Display Size:</strong> ${d.data["Display Size (inch)"] || "N/A"} inch<br/>
                    <strong>RAM:</strong> ${d.data["Ram (Gb)"] || "N/A"} GB<br/>
                    <strong>Storage:</strong> ${d.data["Storage (GB)"] || "N/A"} GB<br/>
                    <strong>Ratings:</strong> ${d.data.Ratings || "N/A"} (${d.data.Reviews || "N/A"} reviews)<br/>
                `);
            })
            .on("mousemove", function(event, d) {
                // Get mouse coordinates relative to the viewport
                const [mouseX, mouseY] = d3.pointer(event, document.body);

                // Define offsets to prevent the tooltip from covering the cursor
           

                // Calculate the tooltip's position
                let left = mouseX+10;
                let top = mouseY-250 

             
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

        // Append text labels with conditional display
        nodes.append("text")
            .attr("class", "label")
            .attr("x", 4)
            .attr("y", 14)
            .text(d => d.data.name)
            .attr("fill", "white")
            .attr("font-size", "10px")
            .attr("pointer-events", "none")
            .style("display", d =>
                (d.x1 - d.x0 > 50 && d.y1 - d.y0 > 20) ? "block" : "none"
            );

        // Implement a Scrollable Legend
        const legendMargin = { top: 20, right: 30, bottom: 20, left: 10 };
        const legendX = innerWidth + legendMargin.left;
        const legendY = 50;
        const legendWidth = 150;
        const legendHeight = innerHeight;

        // Append a group for the legend
        const legendGroup = d3.select(this.chartRef.current).select("svg")
            .append("g")
            .attr("transform", `translate(${legendX}, ${legendY})`)
            .attr("class", "legend");

        // Add a title to the legend
        legendGroup.append("text")
            .attr("x", 0)
            .attr("y", -10)
            .attr("text-anchor", "start")
            .attr("font-size", "12px")
            .attr("font-weight", "bold")
            .text("Brands");

        // Create a scrollable container using foreignObject
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
        return (
            <div style={{ position: 'relative' }}>
                <div ref={this.chartRef}></div>
                {/* Tooltip Div */}
                <div 
                    className="tooltip" 
                    id="tooltip" 
                    style={{ 
                        position: 'absolute', 
                        textAlign: 'left', 
                        padding: '10px', 
                        font: '12px Arial, sans-serif', 
                        background: 'rgba(0, 0, 0, 0.85)', 
                        color: '#fff', 
                        borderRadius: '5px', 
                        pointerEvents: 'none', 
                        opacity: 0,
                        transition: 'opacity 0.3s ease',
                        maxWidth: '300px', // Adjust as needed
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)', // Adds depth
                        zIndex: 1000 // Ensure tooltip appears above other elements
                    }}>
                </div>
            </div>
        );
    }
}

export default TreeMap;
