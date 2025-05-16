import type { NextApiRequest, NextApiResponse } from "next";
import fs from "fs/promises";

type ResponseData = {};

export default async function handler(req: NextApiRequest, res: NextApiResponse<ResponseData>) {
  try {
    // return array of the files in ../sessions
    const filenames = await fs.readdir("../sessions");
    const files = [];
    for (const filename of filenames) {
      const filePath = `../sessions/${filename}`;
      const fileContent = await fs.readFile(filePath, "utf-8");
      files.push(JSON.parse(fileContent));
    }

    res.status(200).json(files);
  } catch (err) {
    console.log(err);
    res.status(500).end();
  }
}
