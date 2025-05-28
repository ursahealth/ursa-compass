import type { NextApiRequest, NextApiResponse } from "next";
import fs from "fs/promises";

type ResponseData = {};

export default async function handler(req: NextApiRequest, res: NextApiResponse<ResponseData>) {
  try {
    console.log(req.body)
    const filePath = "../prompts/inspection.txt";
    const fileContent = await fs.writeFile(filePath, req.body.systemPrompt, "utf-8");
    res.status(200).end();
  } catch (err) {
    console.log(err);
    res.status(500).end();
  }
}

