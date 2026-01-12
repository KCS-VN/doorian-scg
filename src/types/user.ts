import { z } from 'zod';

export const DataIndexURLSchema = z.object({
    highscore: z.number(),
    id: z.string(),
    lang: z.string(),
    msg: z.string(),
    name: z.string(),
    point: z.number(),
    soundOn: z.boolean(),
    tier: z.string(),
});

export type TDataIndexURL = z.infer<typeof DataIndexURLSchema>;
