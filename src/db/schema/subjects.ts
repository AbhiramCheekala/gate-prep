import { mysqlTable, varchar, timestamp } from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";

export const subjects = mysqlTable("subjects", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: varchar("name", { length: 100 }).notNull().unique(),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at").onUpdateNow(),
});
