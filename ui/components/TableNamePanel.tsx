import { Session } from "../util/types";
import { DataTable } from "./DataTable";

export const TableNamePanel = ({
  blurTableName,
  session,
  setTableName,
}: {
  blurTableName: Function;
  session: Session;
  setTableName: Function;
}) => {
  return (
    <div>
      <h3 className="font-semibold mb-2">Table Name</h3>
      <input
        type="text"
        placeholder="Enter table name"
        className="w-full p-2 border rounded"
        value={session.tableName || ""}
        onChange={(e) => setTableName(e.target.value)}
        onBlur={() => blurTableName()}
      />

      <DataTable data={session.tableData} sql={session.tableSql} />
    </div>
  );
};
