import type { NextApiRequest, NextApiResponse } from "next";
import fs from "fs/promises";

type ResponseData = {};

export default async function handler(req: NextApiRequest, res: NextApiResponse<ResponseData>) {
  try {
    await fs.unlink(`../sessions/${req.body.uuid}.json`);
    res.status(200).end();
  } catch (err) {
    console.log(err);
    res.status(500).end();
  }
}

