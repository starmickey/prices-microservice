import { ArticleState, DataType } from './schema';

export default async function initialDataBaseConfig () {
  return ensureBasicArticleStatesAndDataTypes();
}

/**
 * Ensures that the required ArticleStates and DataTypes exist in the database.
 * If they don't exist or are marked as deleted, they will be created.
 * 
 * The required ArticleStates are:
 * - 'TAXED'
 * - 'UNTAXED'
 * - 'DELETED'
 * 
 * The required DataTypes are:
 * - 'STRING'
 * - 'INT'
 * - 'FLOAT'
 */
export async function ensureBasicArticleStatesAndDataTypes() {
  // List of required ArticleStates
  const articleStates = [
    { name: "TAXED", description: "Taxed state for articles" },
    { name: "UNTAXED", description: "Untaxed state for articles" },
    { name: "DELETED", description: "State for deleted articles" },
  ];

  // List of required DataTypes
  const dataTypes = [
    { name: "STRING", description: "String data type" },
    { name: "INT", description: "Integer data type" },
    { name: "FLOAT", description: "Floating point number data type" },
  ];

  // Ensure ArticleStates
  for (const state of articleStates) {
    let articleState = await ArticleState.findOne({ name: state.name });

    if (!articleState || articleState.deleteDate !== null) {
      // If state doesn't exist or is deleted, create a new one
      articleState = new ArticleState({
        name: state.name,
        description: state.description,
        deleteDate: null, // Ensure the state is not deleted
      });
      await articleState.save();
    }
  }

  // Ensure DataTypes
  for (const type of dataTypes) {
    let dataType = await DataType.findOne({ name: type.name });

    if (!dataType || dataType.deleteDate !== null) {
      // If data type doesn't exist or is deleted, create a new one
      dataType = new DataType({
        name: type.name,
        description: type.description,
        deleteDate: null, // Ensure the data type is not deleted
      });
      await dataType.save();
    }
  }
}
