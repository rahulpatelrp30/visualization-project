import React, { Component } from "react";
import './App.css';
import FileUpload from "./Cleaned_Mobiles_Dataset_Cleaned_Mobiles_Dataset.csv";
import ProcessData from "./ProcessData";
import BarChart from "./BarChart";
import ScatterPlot from "./ScatterPlot";
import TreeMap from "./TreeMap";

class App extends Component {
    constructor(props) {
        super(props);
        this.state = {
            data: [],
            sliderValue: 0, // Initial slider value
            selectedBrand: "All", // Initial dropdown value (show all brands)
            brands: [], // List of unique brands
        };
    }

    componentDidMount() {
        // Fetch and process the CSV file
        fetch(FileUpload)
            .then((response) => response.text())
            .then((fileContent) => {
                const processData = new ProcessData();
                const usableData = processData.csvToJson(fileContent);

                // Get unique brands and sort them alphabetically, adding an "All" option
                const uniqueBrands = Array.from(
                    new Set(usableData.map((item) => item.Brand))
                ).sort();

                this.setState({
                    data: usableData,
                    brands: ["All", ...uniqueBrands],
                });
            });
    }

    handleSliderChange = (event) => {
        const value = event.target.value;
        this.setState({ sliderValue: parseInt(value) });
    };

    handleDropdownChange = (event) => {
        const selectedBrand = event.target.value;
        this.setState({ selectedBrand });
    };

    getFilteredData() {
        const { data, sliderValue, selectedBrand } = this.state;

        // Apply slider and dropdown filters
        return data.filter((item) => {
            const meetsSliderCriteria =
                item["Discount price (USD)"] !== undefined &&
                item["Discount price (USD)"] >= sliderValue;
            const meetsBrandCriteria =
                selectedBrand === "All" || item.Brand === selectedBrand;

            return meetsSliderCriteria && meetsBrandCriteria;
        });
    }

    render() {
        const { sliderValue, brands, selectedBrand } = this.state;
        const filteredData = this.getFilteredData();

        return (
            <div>
                <div className="groupInfo">
                    <p>Group #: 9</p>
                    <p>Group Members: Jeremy Granizo, Rahul Patel, Alamdar Qanoongo, Daniel Santos Martinez</p>
                </div>

                {/* Slider */}
                <div className="slider-container">
                    <label>Filter by Discount Price (USD): {sliderValue}</label>
                    <input
                        type="range"
                        min="0"
                        max="1000"
                        step="10"
                        value={sliderValue}
                        onChange={this.handleSliderChange}
                    />
                </div>

                {/* Dropdown */}
                <div className="dropdown-container">
                    <label htmlFor="brandDropdown">Select Brand:</label>
                    <select
                        id="brandDropdown"
                        value={selectedBrand}
                        onChange={this.handleDropdownChange}
                    >
                        {brands.map((brand, index) => (
                            <option key={index} value={brand}>
                                {brand}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Render Visualizations */}
                <div className="parent">
                    <TreeMap csv_data={filteredData} />
                    <ScatterPlot csv_data={filteredData} />
                    <BarChart csv_data={filteredData} />
                </div>
            </div>
        );
    }
}

export default App;
