import _ from "lodash";

export default function getTableDescriptions(tableSpecs) {
  const tableOutputs = _.map(tableSpecs, (tableSpec) => {
    const columns = tableSpec.columns
      .map((field) => ` - ${field.column} [${field.dataType}] ${field.description}`)
      .join("\n");
    return `${tableSpec.table}\n\n${tableSpec.description}\n\n${columns}`;
  });
  return tableOutputs.join("\n\n");
}

