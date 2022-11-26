---
{
  "title": "Hash Indexed Array",
  "timestamp": 1668876934000
}
---

If you have something dynamic that have to parse CSV files, or fetch data from JDBC or you have some sort of row-oriented data you may end up doing something like this:
```java
String[] fieldNames = fetchFields()
while (...) {
  Object[] fieldValues = fetchRow();
}
```

at some point you may have to do something with a specific set of column and you will end up doing something like
```java
int fieldIndex = indexOf(fieldNames, "fooField");
Object value = fieldValues[fieldIndex];
```

if those lookups are a lot, some people end up doing something like this (true story)
```java
ArrayList<HashMap<String, Object>> rows = new ArrayList<>();
String[] fieldNames = fetchFields()
while (...) {
  Object[] fieldValues = fetchRow();

  HashMap<String, Object> row = new HashMap<>();
  for (int i = 0; i < fieldNames.length; ++i) {
    row.put(fieldNames[i], fieldValues[i]);
  }
  rows.add(row);
}
```

at this point you are happy because you can just use row.get(fieldName) to lookup your value. \
but when you are going to production, with a lot of rows you'll probably end up noticing that you are spending a lot of time creating those HashMaps and you are using a lot more memory that you were expecting.

If you spend few seconds looking at the code, you'll probably notice that all the maps will have the same set of keys. so why should we spend time recomputing the hashmap?

We can just have a single map for the fieldNames, mapping the name to the field index. and store the rows as simple array of values. In this way we don't have the extra overhead of an hashmap per row.
```java
String[] fieldNames = fetchFields()
HashMap<String, Integer> fieldNames = new HashMap<>();
for (int i = 0; i < fieldNames.length; ++i) {
  fieldNames.put(fieldNames[i], i);
}

....
int fieldIndex = fieldNames.get(fieldIndex);
Object value = fieldValues[fieldIndex];
```

If you want to tune that HashMap for memory usage or improve the performance, a simple implementation is really few lines of code. since the map is fixed. you don't have to handle insert or delete or grow your table. you already know everything at build time.

```java
HashIndexedArray<String> fieldNames = new HashIndexedArray<>(new String[] { "a", "b", "c" });
```

a simple implementation for demonstration purposes can be as the one below.
where the core of the HashIndexArray are the table computation in the constructor,
the getIndex(key) function and an helper that returns the key from the index.
In this implementation you also keep the origial fieldNames array without having to create a copy or allocate nodes for each field.
```java
public class HashIndexedArray<K> extends AbstractSet<K> {
  private final int[] buckets;
  private final int[] table; // hash|next|hash|next|...
  private final K[] keys;

  public HashIndexedArray(final K[] keys) {
    this.keys = keys;

    this.buckets = new int[tableSizeFor(keys.length + 8)];
    Arrays.fill(this.buckets, -1);

    this.table = new int[keys.length << 1];
    final int mask = buckets.length - 1;
    for (int i = 0, n = keys.length; i < n; ++i) {
      final int hashCode = hash(keys[i]);
      final int targetBucket = hashCode & mask;
      final int tableIndex = (i << 1);
      this.table[tableIndex] = hashCode;
      this.table[tableIndex + 1] = buckets[targetBucket];
      this.buckets[targetBucket] = i;
    }
  }

  public int getIndex(final Object key) {
    final int hashCode = hash(key);
    int index = buckets[hashCode & (buckets.length - 1)];
    while (index >= 0) {
      final int tableIndex = (index << 1);
      if (hashCode == table[tableIndex] && keys[index].equals(key)) {
        return index;
      }
      index = table[tableIndex + 1];
    }
    return -1;
  }

  public K get(final int index) {
    return keys[index];
  }

  public int size() {
    return keys.length;
  }

  public K[] keySet() {
    return keys;
  }

  @Override
  @SuppressWarnings("unchecked")
  public boolean contains(final Object key) {
    return getIndex((K)key) >= 0;
  }

  @Override
  public Iterator<K> iterator() {
    return new ArrayIterator<>(keys);
  }

  private static int hash(final Object key) {
    int h = key.hashCode() & 0x7fffffff;
    h = ((h >>> 16) ^ h) * 0x45d9f3b;
    h = ((h >>> 16) ^ h) * 0x45d9f3b;
    h = (h >>> 16) ^ h;
    return h & 0x7fffffff;
  }

  private static int tableSizeFor(final int capacity) {
    final int MAXIMUM_CAPACITY = 1 << 30;
    final int n = BitUtil.nextPow2(capacity);
    return (n < 0) ? 1 : (n >= MAXIMUM_CAPACITY) ? MAXIMUM_CAPACITY : n;
  }

  @Override
  public String toString() {
    return Arrays.toString(keys);
  }
}
```