import _ from "lodash";
import { Options } from "highcharts";

export const formatDataForHighcharts = (
  data: Array<any>,
  measureField: string,
) => {
  if (!data) {
    return {};
  }
  const actualMeasureField =
    Object.keys(data[0]).find((key) => {
      if (key === measureField) {
        return key;
      }
      const value = _.first(data)[key];
      if (_.isNumber(value) || !_.isNaN(Number(value))) {
        return key;
      }
    }) || "count";
  const categoryField =
    Object.keys(data[0]).find((key) => {
      if (key === measureField) {
        return false;
      }
      const value = _.first(data)[key];
      if (_.isNumber(value) || !_.isNaN(Number(value))) {
        return false;
      }
      return key;
    }) || "unknown";
  const categories = data.map((item) => item[categoryField]);
  const counts: Array<number> = data.map((item) =>
    parseFloat(item[actualMeasureField]),
  );
  const options: Options = {
    chart: {
      type: "bar",
    },
    title: {
      text: _.map(_.startCase(measureField).split(" "), _.capitalize).join(" "),
    },
    xAxis: {
      categories,
      title: {
        text: null,
      },
    },
    yAxis: {
      min: 0,
      title: {
        text: "Value",
        align: "high",
      },
      labels: {
        overflow: "justify",
      },
    },
    series: [
      {
        name: "Count",
        type: "bar",
        data: counts,
      },
    ],
    credits: { enabled: false },
  };
  return options;
};

export const formatDataForChartJs = (
  data: Array<any>,
  measureField: string,
) => {
  if (!data || data.length === 0) {
    return {};
  }

  const actualMeasureField =
    Object.keys(data[0]).find((key) => {
      if (key === measureField) {
        return key;
      }
      const value = _.first(data)[key];
      if (_.isNumber(value) || !_.isNaN(Number(value))) {
        return key;
      }
    }) || "count";
  const categoryField =
    Object.keys(data[0]).find((key) => {
      if (key === measureField) {
        return false;
      }
      const value = _.first(data)[key];
      if (_.isNumber(value) || !_.isNaN(Number(value))) {
        return false;
      }
      return key;
    }) || "unknown";

  // Extracting categories and counts
  const categories = data.map((item) => item[categoryField]);
  const counts = data.map((item) => parseFloat(item[actualMeasureField]));

  // Chart.js configuration
  const config = {
    type: "bar",
    data: {
      labels: categories,
      datasets: [
        {
          label: "Count",
          data: counts,
          backgroundColor: "rgba(54, 162, 235, 0.2)", // Customize as needed
          borderColor: "rgba(54, 162, 235, 1)", // Customize as needed
          borderWidth: 1,
        },
      ],
    },
    options: {
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: "Count",
          },
        },
        x: {
          title: {
            display: true,
            text: measureField,
          },
        },
      },
      plugins: {
        title: {
          display: true,
          text: measureField.split(" ").map(_.capitalize).join(" "),
        },
        legend: {
          display: true,
          position: "top",
        },
      },
    },
  };

  return config;
};
