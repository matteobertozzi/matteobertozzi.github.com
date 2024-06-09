---
{
  "title": "Identify Frequent \"Words\"",
  "timestamp": 1678017891000,
  "tags": ["java", "data-structures"]
}
---

When you want to keep track of frequent items (e.g. strings) you end up implementing something to keep track of the frequency.

```javascript
function isFrequent(item) {
  int freq = incFrequency(item);
  return freq > 3; // true if seen more than 3 times
}
```

There are lots of different ways to implement that. The simples way to implement that will be using a map to keep track of the string/frequency, but that will end up storing every item even if not frequent.

To reduce the number of items kept in memory we can use a LRU. we still keep a map of the frequent items, if the item is not yet in the frequent map we add it to the LRU, if the item is already in the LRU we increment the frequency. once the frequency reached the minFrequency threshold we remove it from the LRU and add it to the frequent map.

```java
public class EnumWithLru {
  private final HashMap<String, Integer> indexMap = new HashMap<>();
  private final HashMap<String, Item> lruMap;
  private final ArrayDeque<Item> lru;
  private final int lruSize;
  private final int minFreq;

  public EnumWithLru(final int lruSize, final int minFreq) {
    this.lru = new ArrayDeque<>(lruSize);
    this.lruMap = new HashMap<>(lruSize * 2);
    this.lruSize = lruSize;
    this.minFreq = minFreq;
  }

  public int add(final String key) {
    // 1. check if the key is already indexed
    final Integer keyIndex = indexMap.get(key);
    if (keyIndex != null) return keyIndex;

    // 2. check if the key is already in the LRU
    final Item item = lruMap.get(key);
    if (item == null) {
      // the key was not in the LRU
      // and the LRU is full, evict the last recent item
      if (lruMap.size() == lruSize) {
        final Item evictItem = lru.removeLast();
        lruMap.remove(evictItem.key);
      }

      // add the new key in the LRU
      final Item newItem = new Item(key);
      lru.addFirst(newItem);
      lruMap.put(newItem.key, newItem);
      return -1;
    }

    // the key is already in the LRU
    lru.remove(item);
    if (item.freq++ >= minFreq) {
      // 3. the key was already seen 'minFreq' times.
      // add it to the indexed list and remove it from the LRU
      final int newIndex = indexMap.size();
      indexMap.put(item.key, newIndex);
      lruMap.remove(item.key);
    } else {
      // 5.move the key to the front of the LRU
      lru.addFirst(item);
    }
    return -1;
  }

  public static final class Item {
    String key;
    int freq;

    private Item(final String key) {
      this.key = key;
      this.freq = 0;
    }
  }
}
```

This implementation can be optimized in various ways, from reducing the number of hashtables to reducing the number of allocations and more. A faster implementation can be found [here](https://gist.github.com/matteobertozzi/4fba36aa66105472044ca2f00d0747bf).

You should note that the implementation above and the LRU approach, suffer from the "LRU size" problem. If the "repetition cycle" of the items is greater than the lruSize there will be no frequent item. e.g. lruSize = 2, input = ['aaa', 'bbb', 'ccc', 'ddd', 'eee', 'aaa', 'bbb', ...]

Depending on the data you can increase the LRU size if the number of items are bounded and the use of memory is ok for your size.

Another approach that will work with an unbounded number of words but keeping the use of memory controlled is using a count-min sketch. of course we may overestimate an item, but it is a good trade-off.

```java
public class EnumWithCountMinSketch {
  private final HashMap<String, Integer> indexedMap = new HashMap<>();
  private final int minFreq;

  private final int[][] sketch;
  private final int[] hashA;
  private final int depth;
  private final int width;

  public EnumWithCountMinSketch(final int width, final int depth, final int minFreq) {
    this.sketch = new int[depth][width];
    this.hashA = new int[depth];
    this.width = width; // eps = 2 / width
    this.depth = depth; // confidence = 1 - 1 / Math.pow(2, depth)
    this.minFreq = minFreq;

    // NOTE: you should pass a seed if you use it for serialization,
    // and you should use a proper hash function for strings (like xxHash)
    final Random rand = new Random();
    for (int i = 0; i < depth; i++) {
      hashA[i] = rand.nextInt(Integer.MAX_VALUE);
    }
  }

  public EnumWithCountMinSketch(final double eps, final double confidence, final int minFreq) {
    this((int) Math.ceil(2 / eps), (int) Math.ceil(-Math.log1p(-confidence) / Math.log(2)), seed, minFreq);
  }

  public int add(final String key) {
    // 1. check if the key is already indexed
    final int index = indexedMap.getOrDefault(key, -1);
    if (index >= 0) return index;

    // 2. add to the frequency table
    int minCount = Integer.MAX_VALUE;
    for (int i = 0; i < depth; i++) {
      final int hash = hash(key, i);
      sketch[i][hash]++;
      minCount = Math.min(minCount, sketch[i][hash]);
    }

    // 3. if the minCount is greater than minFreq add to the indexed map
    if (minCount >= minFreq) {
      indexedMap.put(key, indexedMap.size());
    }
    return -1;
  }

  private int hash(final String key, final int index) {
    // NOTE: use a proper hash function for strings (like xxHash)
    long hash = hashA[index];
    for (int j = 0; j < key.length(); j++) {
      hash = (hash ^ key.charAt(j)) * 0x5bd1e995;
      hash ^= hash >>> 23;
    }
    return (int) ((hash >>> 16) % width);
  }
}
```
_Note that the implementation above is just for reference. you should use at least a better hash function. (e.g. [xxHash](https://github.com/Cyan4973/xxHash), [MurmurHash](https://en.wikipedia.org/wiki/MurmurHash), ...)_