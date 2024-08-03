import _ from "lodash";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { useDebouncedCallback } from "use-debounce";
import { useState } from "react";
import { TableDetailsArray } from "../lib/definitions";

export default function Search({
  placeholder,
  disabledMeasureFields,
  runAnalysis,
  clearDisabledMeasures,
  handleMeasureButtonClick,
}: {
  placeholder: string;
  disabledMeasureFields: Array<string>;
  runAnalysis: Function;
  clearDisabledMeasures: Function;
  handleMeasureButtonClick: Function;
}) {
  const [name, setName] = useState<string>("");
  const [details, setDetails] = useState<TableDetailsArray>([]);
  const [buttonEnabled, setButtonEnabled] = useState<boolean>(false);

  const measureFields: TableDetailsArray = details.filter(
    (item) =>
      ["integer", "numeric"].includes(item.data_type) &&
      item.column_name !== "id",
  );

  const noMeasureCandidates =
    measureFields.filter(
      (field) => !disabledMeasureFields.includes(field.column_name),
    ).length === 0;

  const handleNameChange = useDebouncedCallback((value) => {
    fetch(`/api/inspect-table?name=${value}`)
      .then((response) => {
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        return response.json();
      })
      .then((data) => {
        if (!_.isEmpty(data)) {
          setButtonEnabled(true);
          setDetails(data);
          clearDisabledMeasures();
        }
      })
      .catch((error) => {
        console.error(error);
      });
    setName(value);
  }, 2000);

  return (
    <div>
      <div className="mb-4 mt-4 flex items-center justify-between gap-2 md:mt-8">
        <div className="relative flex flex-1 flex-shrink-0">
          <label htmlFor="search" className="sr-only">
            Search
          </label>
          <input
            className="peer block w-full rounded-md border border-gray-200 py-[9px] pl-10 text-sm outline-2 placeholder:text-gray-500"
            placeholder={placeholder}
            onChange={(e) => {
              handleNameChange(e.target.value);
            }}
            onKeyUp={() => setButtonEnabled(false)}
          />
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-500 peer-focus:text-gray-900" />
          <button
            className="w-40 rounded-md border bg-green-pine p-2 text-white hover:bg-green-forest disabled:cursor-not-allowed disabled:bg-gray-400"
            onClick={() => runAnalysis(details)}
            disabled={!buttonEnabled || noMeasureCandidates}
          >
            Run Analysis
          </button>
        </div>
      </div>
      {measureFields.length > 0 ? (
        <div className="mb-4">
          <h1 className="mb-4 mt-4 text-xl">Measure Fields to Analyze</h1>
          {measureFields.map((detail, i) => {
            const disabledClass = disabledMeasureFields.includes(
              detail.column_name,
            )
              ? "bg-gray-400"
              : "";
            return (
              <button
                key={i}
                onClick={handleMeasureButtonClick.bind(
                  null,
                  detail.column_name,
                )}
                className={`w-30 rounded-md border bg-blue-storm p-1 px-2 text-white ${disabledClass}`}
              >
                {detail.column_name}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
