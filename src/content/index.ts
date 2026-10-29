import "server-only";
import { z } from "zod";
import aboutData from "./about.json";

export const aboutContent = z.object({
  intro: z.string(),
  established: z.string(),
  paragraphs: z.array(z.string()).min(1),
}).strict().parse(aboutData);
