import { SQL } from "drizzle-orm";
import { FieldSelection } from "./ModelTypes";

export type FindOptionsType = {
    where?: SQL;
    orderBy?: SQL | SQL[];
    limit?: number;
    offset?: number;
};