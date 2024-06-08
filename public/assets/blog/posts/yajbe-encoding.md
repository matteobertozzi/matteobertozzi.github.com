---
{
  "title": "Yet Another JSON Binary Encoding",
  "timestamp": 1676721393000,
  "tags": ["json", "binary", "data-encoding"]
}
---

YAJBE is a compact binary data format built to be a drop-in replacement for JSON (JavaScript Object Notation).

You can find the repository here: https://github.com/matteobertozzi/yajbe-data-format \
And a video with the presentation here: https://youtu.be/ilbsLXa7uT8

### Motivation for a new format
We have a lot of services exchanging or storing data using JSON, and most of them don't want to switch to a data format that requires a schema.

We wanted to remove the overhead of the JSON format (especially field names), but keeping the same data model flexibility (numbers, strings, arrays, maps/objects, and a few values such as false, true, and null).

The main languages we use are Java and Javascript/Typescript, so the idea was to replace the JsonMapper class from Jackson (Java) and the JSON.stringify()/parse() from javascript with the new one and everything will be faster _(the same will be true for other languages)_.
```java
ObjectMapper mapper = new JsonMapper() -> YajbeMapper()
byte[] encoded = mapper.writeValueAsBytes(obj)
MyObject obj = mapper.readValue(encoded, MyObject.class);
```
```typescript
JSON.stringify(): string -> YAJBE.encode(): Uint8Array
JSON.parse(string): T -> YAJBE.decode(Uint8Array): T
```

### Goals
* Remove the space-overhead of duplicate "field names" for list of objects.
* Reduce the space-overhead of Integer, boolean and other values.
* Support for "raw" binary data, avoiding the base64 encode.
* Faster encode/decode by moving to a binary format.
* Simple spec to be easy to implement in many languages.


### Specs
<img src="https://raw.githubusercontent.com/matteobertozzi/yajbe-data-format/main/specs/assets/encoding-head.png" width="256" align="right" />

As many other binary formats YAJBE is using an "header byte" to identify the type of the encoded data, followed by the data itself.

The layout of the header is not "fixed" as many other encoding, the choice we made was to be able to save a bit more space on small strings/bytes.

From the figure on the right you can see that:
 * **NULL** values are encoded as 0 and are using a full byte.
 * **Boolean** values are encoded as 2 for true, 3 for false.
 * **Floats** are have the header byte describing the type and then the 16/32/64 bits value.
 * **Arrays** or **Maps** smaller than 11 items requires a single byte for describing the length.
 * **Integers** between -23 and 24 (included) will be included as a single byte
 * **Strings** or **Bytes** smaller than 60 bytes requires a single byte for describing the length.
 * The _"UNSUSED"_ values can be used for custom types.

To know more details about the encoding visit the [specs](https://github.com/matteobertozzi/yajbe-data-format/tree/main/specs) folder on github.

### Implementations
 * **Java** implementation based on [Jackson](https://github.com/FasterXML/jackson) can be found in the [java/jackson-dataformat-yajbe](https://github.com/matteobertozzi/yajbe-data-format/tree/main/java/jackson-dataformat-yajbe) folder.
 * **Typescript** implementation can be found in the [typescript](https://github.com/matteobertozzi/yajbe-data-format/tree/main/typescript) folder.
 * _support for others languages is on the way_

### Cool "Benchmark" Charts
_We really don't want to provide benchmark saying we use less bytes than X or we are faster than Y. For our use cases we see that the java jackson encoder is faster than using JSON one. The output data is smaller and compress/decompress/decode faster. If you can use data with schemas there are better/faster alternatives. but as a drop-in replacement this one is good enough._

But for those of you who likes charts, here is one that does mean too much. \
Here you can see how much space can be saved using YAJBE instead of JSON or CBOR.

The file names are the DataSet that we use for tests and you can find them in the [test-data](https://github.com/matteobertozzi/yajbe-data-format/tree/main/test-data) folder.

As you may expect YAJBE most of the time is smaller than JSON and CBOR, mainly because we "strip" fieldNames, so for array of objects that is a huge saving. There are a couple of files like _"canada.json"_ and _"data_6.json"_ because those files contains lots of **floats**, and the json text version of numbers like "4.8", "3.75", "1126.11" is smaller than the binary 4bytes or 8bytes encoded version.

<img src="https://raw.githubusercontent.com/matteobertozzi/yajbe-data-format/main/specs/assets/chart-compression.png" />
