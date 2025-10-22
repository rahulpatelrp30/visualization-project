import React, {Component} from "react";
import * as d3 from "d3";

class BarChart extends Component {
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

        // dimensions of the bar chart
        const margin = {top: 20, right: 0, bottom: 50, left: 42};
        const width = 320 - margin.left - margin.right;
        const height = 300 - margin.top - margin.bottom;

        d3.select(this.chartRef.current).selectAll("*").remove();

        const svg = d3.select(this.chartRef.current)
            .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom + 100)
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top * 2})`);

        // representing the data just like our document states in an ascending order bar chart
        const groupedData = d3.group(data, d => d.Brand);
        const averagedData = Array.from(groupedData, ([key, value]) => ({
            Brand: key,
            "Discount price (USD)": d3.mean(value, d => d["Discount price (USD)"])
        }));

        // const sortedData = data.sort((a, b) => b["Discount price (USD)"] - a["Discount price (USD)"]); doesnt work,
        const sortedData = averagedData.sort((a, b) => a["Discount price (USD)"] - b["Discount price (USD)"]);

        // xScale definition
        const xScale = d3.scaleBand()
            .domain(sortedData.map(d => d.Brand))
            .range([0, width])
            .padding(0.1);

        // yScale definition
        const yScale = d3.scaleLinear()
            .domain([0, d3.max(sortedData, d => d["Discount price (USD)"])])
            .range([height, 0]);

        // appending the ticks and the text in the ticks
        svg.append("g")
            .attr("transform", `translate(0,${height})`)
            .call(d3.axisBottom(xScale))
            .selectAll("text")
            .attr("transform", "translate(-12,9)rotate(-90)")
            .style("text-anchor", "end");

        // append the real y scale and the ticks/values
        svg.append("g")
            .call(d3.axisLeft(yScale));

        // appending the light lines in the y axis for better visualization to the data on the y axis
        svg.append("g")
            .attr("class", "grid")
            .call(d3.axisLeft(yScale)
                .tickSize(-width)
                .tickFormat("")
            )
            .style("stroke", "gray")
            .style("stroke-opacity", 0.1);

        // implement the bars in the chart based on the sorted Avg Data
        svg.selectAll(".bar")
            .data(sortedData)
            .enter().append("rect")
            .attr("class", "bar")
            .attr("x", d => xScale(d.Brand))
            .attr("width", xScale.bandwidth())
            .attr("y", d => yScale(d["Discount price (USD)"]))
            .attr("height", d => height - yScale(d["Discount price (USD)"]))
            .attr("fill", "steelblue");

        // appended the y axis title
        svg.append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", 0 - margin.left-5)
            .attr("x", 0 - (height / 2))
            .attr("dy", "1em")
            .style("text-anchor", "middle")
            .text("Average Discount Price (USD)");

        // appended the x axis title
        svg.append("text")
            .attr("transform", `translate(${width / 2}, ${height + margin.top + 70})`)
            .style("text-anchor", "middle")
            .text("Brand");

        // Appended the title to the bar chart
        svg
            .append("text")
            .attr("x", width / 2)
            .attr("y", margin.top - 30)
            .attr("text-anchor", "middle")
            .style("font-size", "16px")
            .text("Avg. Discouted Price By Brand");
    }

    render() {
        return <div ref={this.chartRef}></div>;
    }
}

export default BarChart;
