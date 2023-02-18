---
{
  "title": "Int Sequence Compression",
  "timestamp": 1667619961000,
  "tags": ["data-encoding"]
}
---

Time-series data, like sensor/device data, product/service usage, etc... is highly compressible.
Most of the values are the same or have the same pattern over time.

Time-series can be seen as an "array" of measurement where each item is the measurement in a specific interval of time.
```
10:20am [ 0 | 0 | 1 | 2 | 3 | 3 | 3 | 3 | 4 | 50 | 31 ] 10:30am
```

We use group measurements using different encodings (RLE, LIN, MIN).\
The header of the serialized items look like this:
![Encoding Header][img-base]

### Run-length encoding (RLE)
If a service is not used during the night we have a lots of measurements with value of zero. Most of the time the temperature in a room is stable, so we have long periods with the same value.

In those cases we can just store the value once and the number of times the value is repeated.

![RLE Sequence Encoding][img-rle]

### Linear Increments/Decrements (LIN)
When the data describes a ramp [1, 2, 3, 4] or [6, 4, 2, 0] we use the LIN encoding,
storing the starting value and the delta value (the increment or decrement between each value) and the length of the sequence.
![LIN Sequence Encoding][img-lin]

### Min Delta Value (MIN)
For the generic case, we try to group items taking the min value of the group and storing the measurements as deltas between the min value.
![MIN Sequence Encoding][img-min]

*A simple java implementation of serialization can be found here: [IntSeqCoding.java](https://github.com/matteobertozzi/dnaco-java/blob/main/dnaco-data/src/main/java/tech/dnaco/data/encoding/IntSeqCoding.java)*

[img-base]: ${blog.baseUrl}/assets/posts/imgs/int-seq-compression-base.png
[img-rle]: ${blog.baseUrl}/assets/posts/imgs/int-seq-compression-rle.png
[img-lin]: ${blog.baseUrl}/assets/posts/imgs/int-seq-compression-lin.png
[img-min]: ${blog.baseUrl}/assets/posts/imgs/int-seq-compression-min.png
