import type { Db, Document, IndexDescription } from "mongodb";

export interface MongoCollectionDefinition {
  name: string;
  validator: Document;
  indexes: readonly IndexDescription[];
}

export async function ensureCollection(
  db: Db,
  definition: MongoCollectionDefinition,
): Promise<void> {
  const exists = await db
    .listCollections({ name: definition.name }, { nameOnly: true })
    .hasNext();

  if (exists) {
    await db.command({
      collMod: definition.name,
      validator: definition.validator,
      validationLevel: "strict",
      validationAction: "error",
    });
  } else {
    await db.createCollection(definition.name, {
      validator: definition.validator,
      validationLevel: "strict",
      validationAction: "error",
    });
  }

  await db.collection(definition.name).createIndexes([...definition.indexes]);
}

