---
{
  "title": "Group Row objects by Fields and Types",
  "timestamp": 1675584137000
}
---

Where you are dealing with user data that doesn't have a rigid input schema,
you end up with rows with fields (a, b, c), rows with fields (a, c), rows with fields (a, c, d) and so on.

If you have to write these rows to a database or something that requires a rigid schema,
you'll have to group with the same fields.

```typescript
const r = groupEntitiesBySchema([
  {a: 10, b: 'hello-10', d: new Date()},
  {a: 20, b: 'hello-20', d: new Date()},
  {a: 30, d: new Date()},
  {a: 40, d: new Date(), c: 'test-01'},
  {a: 50, d: new Date()},
  {a: 60, b: 'hello-50', d: new Date()},
  {a: 70, d: new Date(), c: 'test-02'},
]);
```
The result we want is something like this:
```typescript
[
  [
    {a: 10, b: 'hello-10', d: new Date()},
    {a: 20, b: 'hello-20', d: new Date()},
    {a: 60, b: 'hello-50', d: new Date()},
  ],
  [
    {a: 30, d: new Date()},
    {a: 50, d: new Date()},
  ],
  [
    {a: 40, d: new Date(), c: 'test-01'},
    {a: 70, d: new Date(), c: 'test-02'},
  ]
]
```

We can do it by simply iterate through the input, extract the field names
and add them to a map with the set of fields as key and the rows as value.
```typescript
function groupEntitiesBySchema(entities: {[key: string]: unknown}[]): RowsWithSchema[] {
  if (entities.length == 0) return [];

  // fast path for single entity
  if (entities.length == 1) {
    const entity = entities[0];
    const fields = Object.keys(entity).sort();
    const rowsBuilder = new RowsWithSchemaBuilder(fields, true);
    rowsBuilder.addRowMap(entity);
    return [rowsBuilder];
  }

  // aggregate rows by field
  const aggregatorMap = new Map<string, RowsWithSchemaBuilder>();
  for (const entity of entities) {
    const fields = Object.keys(entity).sort();
    // BODGE: in js we can't use Set as key, so we are going to sort the fields and join them
    const fieldsKey = fields.join('/');

    let rows = aggregatorMap.get(fieldsKey);
    if (!rows) {
      rows = new RowsWithSchemaBuilder(fields, true);
      aggregatorMap.set(fieldsKey, rows);
    }
    rows.addRowMap(entity);
  }

  return Array.from(aggregatorMap.values());
}
```

Since we are iterating through the input we can do a bit more. we can extract and check type compatibility
and avoid to write the redundant field names.
```typescript
interface RowsWithSchema {
  dataTypes: DataType[];  // [ type1, type2, type3 ]
  fields: string[];       // [ field1, field2, field3 ]
  rows: unknown[][];      // [ [row1.1, row1.2, row1.3], [row2.1, row2.2, row2.3] ]
}
```

To extract the DataType we can write something like
```typescript
enum DataType { NULL, BOOL, INT, FLOAT, BYTES, STRING, ARRAY, OBJECT, UTC_TIMESTAMP }

function getDataType(value: unknown): DataType {
  if (value === false || value === true) {
    return DataType.BOOL;
  } else if (value === null || value === undefined) {
    return DataType.NULL;
  } else switch (typeof value) {
    case "string":
      return DataType.STRING;
    case "number":
      return Number.isSafeInteger(value) ? DataType.INT : DataType.FLOAT;
    case "bigint":
      throw new Error('Unsupported DataType bigint');
    default:
      if (Array.isArray(value)) {
        return DataType.ARRAY;
      } else if (value instanceof Date) {
        return DataType.UTC_TIMESTAMP;
      } else if (value instanceof Uint8Array) {
        return DataType.BYTES;
      } else {
        return DataType.OBJECT;
      }
  }
}
```

Now that we are able to extract the DataType we should be able to check if types are compatible.
```typescript
enum ValueCompatibility { NOT_COMPATIBLE, NO_CHANGES, SUPER_TYPE, SUB_TYPE }
function checkValueCompatibility(schemaType: DataType, valueType: DataType): ValueCompatibility {
  if (schemaType == valueType) return ValueCompatibility.NO_CHANGES;

  switch (schemaType) {
    case DataType.NULL:
      // every type is compatible with null
      return ValueCompatibility.SUB_TYPE;
    case DataType.INT:
      // an int is compatible with the utc timestamp
      if (valueType == DataType.UTC_TIMESTAMP) return ValueCompatibility.SUB_TYPE;
      // an int can be upcasted to a float
      if (valueType == DataType.FLOAT) return ValueCompatibility.SUB_TYPE;
      // any other type is not compatible
      return ValueCompatibility.NOT_COMPATIBLE;
    case DataType.FLOAT:
      // an int can stay in a float column
      if (valueType == DataType.INT) return ValueCompatibility.SUPER_TYPE;
      // any other type is not compatible
      return ValueCompatibility.NOT_COMPATIBLE;
    case DataType.UTC_TIMESTAMP:
      // an utc timestamp is compatible with an int
      if (valueType == DataType.INT) return ValueCompatibility.SUPER_TYPE;
      // any other type is not compatible
      return ValueCompatibility.NOT_COMPATIBLE;
    case DataType.STRING:
      // any other type is not compatible
      return ValueCompatibility.NOT_COMPATIBLE;
    default:
      // any other type is not compatible
      return ValueCompatibility.NOT_COMPATIBLE;
  }
}
```

at this point we can implement the RowsWithSchemaBuilder that we used above
```typescript
class RowsWithSchemaBuilder implements RowsWithSchema {
  dataTypes: DataType[];
  fields: string[];
  rows: unknown[][];

  constructor(fields: string[], sortedFields: boolean = false) {
    this.fields = sortedFields ? fields : fields.sort();
    this.dataTypes = new Array<DataType>(fields.length).fill(DataType.NULL);
    this.rows = [];
  }

  addRowMap(row: {[key: string]: unknown}) {
    const fields = this.fields;
    const rowValues = new Array(fields.length);
    for (let i = 0, n = fields.length; i < n; ++i) {
      const value = row[fields[i]];
      const dataType = getDataType(value);
      this.updateDataType(i, dataType);
      rowValues[i] = value;
    }
    this.rows.push(rowValues);
  }

  updateDataType(fieldIndex: number, newDataType: DataType): void {
    const dataTypes = this.dataTypes;
    switch (checkValueCompatibility(dataTypes[fieldIndex], newDataType)) {
      case ValueCompatibility.NOT_COMPATIBLE:
        throw new Error(this.fields[fieldIndex]
            + ' types are not compatibile ' + DataType[dataTypes[fieldIndex]]
            + '/' + DataType[newDataType]);
      case ValueCompatibility.NO_CHANGES:
      case ValueCompatibility.SUPER_TYPE:
        break;
      case ValueCompatibility.SUB_TYPE:
        dataTypes[fieldIndex] = newDataType;
        break;
    }
  }
}
```

and the final result will be
```typescript
[
  {
    dataTypes: [ "INT", "STRING", "UTC_TIMESTAMP" ],
    fields: [ "a", "b", "d" ],
    rows: [
      [ 10, "hello-10", 2023-02-05T08:58:21.367Z ],
      [ 20, "hello-20", 2023-02-05T08:58:21.367Z ],
      [ 50, "hello-50", 2023-02-05T08:58:21.367Z ]
    ]
  }, {
    dataTypes: [ "INT", "UTC_TIMESTAMP" ],
    fields: [ "a", "d" ],
    rows: [ [ 30, 2023-02-05T08:58:21.367Z ], [ 40, 2023-02-05T08:58:21.367Z ] ]
  }, {
    dataTypes: [ "INT", "STRING", "UTC_TIMESTAMP" ],
    fields: [ "a", "c", "d" ],
    rows: [
      [ 30, "test-01", 2023-02-05T08:58:21.367Z ],
      [ 30, "test-02", 2023-02-05T08:58:21.367Z ]
    ]
  }
]
```