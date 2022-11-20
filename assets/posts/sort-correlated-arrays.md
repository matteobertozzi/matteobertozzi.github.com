---
{
  "title": "Sort Correlated Arrays",
  "timestamp": 1668279907000
}
---

Have you ever had an array where item N and N + 1 are related, \
and you want to sort that array by the key (item N)?
```
array = { (5, 50), (1, 10), (3, 30), (2, 20) }
sortByKey(array) -> [(1, 10), (2, 20), (3, 30), (5, 50)]
```

or maybe you had multiple arrays, and you wanted to sort all of them based on the "key array"
```
keys = { 5,  1,  3,  2  }
col1 = { 50, 10, 30, 20 }
col2 = { 51, 11, 33, 22 }

sortByKey(keys, col1, col2)
// keys=[1, 2, 3, 5], col1=[10, 20, 30, 50], col2=[11, 22, 33, 51]
```

Instead of having a sort function that takes in input an array, we will have a generic sort function with the array length, the item comparison function and the swap function as parameters.

```java
public static void demo1() {
  final int[] array = { 5, 50, 1, 10, 3, 30, 2, 20 };

  ArraySortUtil.sort(0, array.length / 2, // only half of the items are keys
    (a, b) -> Integer.compare(array[a * 2], array[b * 2]), // compare N and not N+1
    (a, b) -> { // swap both item N and N+1
      final int aIndex = a * 2;
      final int bIndex = b * 2;
      swap(array, aIndex, bIndex);
      swap(array, aIndex + 1, bIndex + 1);
    }
  );
  System.out.println(Arrays.toString(array)); // [1, 10, 2, 20, 3, 30, 5, 50]
}

public static void demo2() {
  final int[] keys = { 5,  1,  3,  2  };
  final int[] col1 = { 50, 10, 30, 20 };
  final int[] col2 = { 51, 11, 33, 22 };

  ArraySortUtil.sort(0, keys.length,
    (a, b) -> Integer.compare(keys[a], keys[b]), // compare the keys
    (a, b) -> { // swap the items from all 3 arrays
      swap(keys, a, b);
      swap(col1, a, b);
      swap(col2, a, b);
    }
  );
  System.out.println(Arrays.toString(keys)); // [1,  2,  3,  5 ]
  System.out.println(Arrays.toString(col1)); // [10, 20, 30, 50]
  System.out.println(Arrays.toString(col2)); // [11, 22, 33, 51]
}

// the swap function for the int[] array
public static void swap(final int[] values, final int aIndex, final int bIndex) {
  final int tmp = values[aIndex];
  values[aIndex] = values[bIndex];
  values[bIndex] = tmp;
}
```

Below the (heapsort) sort function implementation.
```java
public final class ArraySortUtil {
  private ArraySortUtil() {
    // no-op
  }

  public interface ArrayIndexComparator {
    int compare(int aIndex, int bIndex);
  }

  public interface ArrayIndexSwapper {
    void swap(int aIndex, int bIndex);
  }

  public static void sort(final int off, final int len,
      final ArrayIndexComparator comparator, final ArrayIndexSwapper swapper) {
    int i = len / 2 - 1;

    // heapify
    for (; i >= 0; --i) {
      int c = i * 2 + 1;
      int r = i;
      while (c < len) {
        if (c < len - 1 && comparator.compare(off + c, off + c + 1) < 0) {
          c += 1;
        }
        if (comparator.compare(off + r, off + c) >= 0) {
          break;
        }
        swapper.swap(off + r, off + c);
        r = c;
        c = r * 2 + 1;
      }
    }

    // sort
    for (i = len - 1; i > 0; --i) {
      int c = 1;
      int r = 0;
      swapper.swap(off, off + i);
      while (c < i) {
        if (c < i - 1 && comparator.compare(off + c, off + c + 1) < 0) {
          c += 1;
        }
        if (comparator.compare(off + r, off + c) >= 0) {
          break;
        }
        swapper.swap(off + r, off + c);
        r = c;
        c = r * 2 + 1;
      }
    }
  }
}
```