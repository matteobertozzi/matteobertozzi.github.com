---
{
  "title": "Composite Key in Key/Value Stores",
  "timestamp": 1679216248000,
  "tags": ["key-value stores", "composite key", "binary key"]
}
---

In a key/value store that provides only a raw interface _get(byte[] key), put(byte[] key, byte[] val)_
you have to find someway to encode keys that consists of two or more attributes.

```
[building]#[department]#[team]#[manager]
[country]#[region]#[state]#[county]#[city]#[neighborhood]
```

For the two keys above we are using the symbol **#** to separate the attributes.

This method works great for strings that don't contain the # symbol and for strings that don't contain numbers.
If you are using a key/value store (e.g. HBase, RocksDB, DynamoDB, ...) you probably want to take advantage of the sort order.

```java
Building#1, Building#2, Building#10, Building#20  // Expected order
Building#1, Building#10, Building#2, Building#20  // Order that we will get using strings
```

To resolve both problems, and have a **memcomparable** key, we can:
 * use a binary format
 * find a separator symbol and escape values that will contain that symbol
 * store integers as big-endian or as [sqlite4 varint](https://sqlite.org/src4/doc/trunk/www/varint.wiki) which are memcomparable.

For the implementation we use 0x0000 as key separator, and if the value contains a 0x00 we will escape it as 0x0001. The code will look like the one below. we have an add() method that allow us to add an attribute, if it is not the first attribute we add the key separator, then we write the attribute escaping the 0x00 values.
```java
private static final byte[] ZERO = new byte[] { 0, 0 };

public RowKeyBuilder add(final byte[] buf, final int off, final int len) {
  if (components++ > 0) key.add(ZERO);

  for (int i = 0; i < len; ++i) {
    final byte currentByte = buf[off + i];
    key.add(currentByte);
    if (currentByte == 0x00) {
      // replace 0x00 with 0x0001, 0x0000 is our key separator
      key.add(0x01);
    }
  }
  return this;
}
```

Wrapping the various methods, to make it easy to use it. we can have a builder that will be used as:
```java
final byte[] rawKey = RowKey.newKeyBuilder()
  .add("building")              // add a string attribute
  .addInt64(123)                // add an int64 attribute
  .add(new byte[] { 4, 0, 5 })  // add a byte attribute
  .drain();
```

To decode the key, we can split on the 0x0000 separator and read the attributes as:
```java
final RowKey key = new RowKey(rawKey);
final String strValue = dkey.getString(0);          // "building"
final long i64Value = dkey.getInt64(1);             // 123
final ByteArraySlice bytesValue = dkey.get(2);      // { 4, 0, 5 }
```

You can find the full source code on Github [RowKey.java](https://github.com/matteobertozzi/rednaco-java/blob/main/rednaco-core/src/main/java/io/github/matteobertozzi/rednaco/bytes/encoding/RowKey.java)

