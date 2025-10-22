import React, {Component} from "react";

class ProcessData extends Component {
    constructor(props) {
        super(props);
        this.state = {
            file: null,
            jsonData: null,
        };
    }

    handleFileSubmit = (event) => {
        event.preventDefault();
        const {file} = this.state;

        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const text = e.target.result;
                const json = this.csvToJson(text);
                this.setState({jsonData: json});
                this.props.set_data(json);
            };
            reader.readAsText(file);
        }
    };

    csvToJson = (csv) => {
        const lines = csv.split("\n");
        const headers = lines[0].split(",").map(header => header.trim());
        const result = [];

        /* painful regex we had to make to deal with the incessant amount of commas messing up the data which attributed
         to our data being read wrong. without this regex, data would always be located in the wrong columns */
        for (let i = 1; i < lines.length; i++) {

            // took a good hr to get this down, don't erase
            const currentLine = lines[i].match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);

            // for the header in the csv file or else it crashes
            if (!currentLine) {
                continue;
            }

            const obj = {};
            /*another painful regex sequence we had to deal with where we had to take into account with the quotes
            besides the commas inside of them*/
            headers.forEach((header, index) => {
                let value = currentLine[index]?.replace(/^"(.*)"$/, '$1')?.trim();
                obj[header] = value;
            });

            // placing the data where it belongs to use in our visualizations
            if (Object.keys(obj).length && lines[i].trim()) {
                const parsedObj = {
                    Brand: obj.Brand,
                    Camera: obj.Camera,
                    Description: obj.Description,
                    Link: obj.Link,
                    "Product Name": obj["Product Name"],
                    "Actual price (USD)": parseFloat(obj["Actual price (USD)"]),
                    "Discount price (USD)": parseFloat(obj["Discount price (USD)"]),
                    "Display Size (inch)": parseFloat(obj["Display Size (inch)"]),
                    "Ram (Gb)": parseInt(obj["Ram (Gb)"]),
                    Ratings: parseInt(obj.Ratings),
                    Reviews: parseInt(obj.Reviews),
                    Stars: parseFloat(obj.Stars),
                    "Storage (GB)": parseInt(obj["Storage (GB)"])
                };
                result.push(parsedObj);
            }
        }
        return result;
    };

    render() {
        // shouldn't return anything, we only wanna process the data
        return null;
    }
}

export default ProcessData;
