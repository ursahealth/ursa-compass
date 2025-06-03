import type { NextApiRequest, NextApiResponse } from "next";
import query from "@/app/lib/query";

type ResponseData = {};

function sanitize(input: string): string {
  // Basic sanitization to prevent SQL injection
  return input.replace(/[^a-zA-Z0-9_-]/g, "");
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<ResponseData>) {
  try {
    const [schema, tableName] = (req.query.tableName as string).split(".");
    const sql = `select * from ${sanitize(schema)}.${sanitize(tableName)} limit 5`;
    const results = await query(sql, []);

    res.status(200).json({ sql, results });
  } catch (err) {
    console.log(err);
    res.status(500).end();
  }
}
