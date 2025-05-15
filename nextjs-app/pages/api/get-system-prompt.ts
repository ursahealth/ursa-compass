import type { NextApiRequest, NextApiResponse } from "next";
import fs from "fs/promises";

type ResponseData = {};

export default async function handler(req: NextApiRequest, res: NextApiResponse<ResponseData>) {
  try {
    const filePath = "../prompts/interrogation.txt";
    const fileContent = await fs.readFile(filePath, "utf-8");
    res.status(200).json({ prompt: fileContent });
  } catch (err) {
    console.log(err);
    res.status(500).end();
  }
}
