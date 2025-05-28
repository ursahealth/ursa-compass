import type { NextApiRequest, NextApiResponse } from "next";
import fs from "fs/promises";
import path from "path";

type ResponseData = {};

export default async function handler(req: NextApiRequest, res: NextApiResponse<ResponseData>) {
  try {
    const playbookPath = path.resolve("../playbooks", req.body.filename);
    await fs.writeFile(playbookPath, req.body.rawContent, "utf-8");
    res.status(200).end();
  } catch (err) {
    console.log(err);
    res.status(500).end();
  }
}
