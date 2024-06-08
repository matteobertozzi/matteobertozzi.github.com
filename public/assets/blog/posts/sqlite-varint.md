---
{
  "title": "A better VarInt (Sqlite4)",
  "timestamp": 1674420961000,
  "tags": ["data-encoding"]
}
---

If you write data on disk, you are probably using [protobuf's varint](https://protobuf.dev/programming-guides/encoding/#varints)
to encode length fields and maybe other int values that you think are small.

but there's a better alternative that provides
 * Better space utilization (1byte can store up to 240 instead of 127)
 * Lexicographical and numeric ordering (which means you can use it as key for your kv-store)

The [Sqlite4 varint](https://sqlite.org/src4/doc/trunk/www/varint.wiki) is a bit more complex to implement, just because there is a bit of math:


_If the number is less than 67824 the first 3bytes are computed otherwise there will be a "header byte" describing how many bytes will follow and than the Nbytes in big-endian order._

***Encode***
 * If V<=240 then output a single by A0 equal to V.
 * If V<=2287 then output A0 as (V-240)/256 + 241 and A1 as (V-240)%256.
 * If V<=67823 then output A0 as 249, A1 as (V-2288)/256, and A2 as (V-2288)%256.
 * If V<=16777215 then output A0 as 250 and A1 through A3 as a big-endian 3-byte integer.
 * If V<=4294967295 then output A0 as 251 and A1..A4 as a big-endian 4-byte integer.
 * If V<=1099511627775 then output A0 as 252 and A1..A5 as a big-endian 5-byte integer.
 * If V<=281474976710655 then output A0 as 253 and A1..A6 as a big-endian 6-byte integer.
 * If V<=72057594037927935 then output A0 as 254 and A1..A7 as a big-endian 7-byte integer.
 * Otherwise then output A0 as 255 and A1..A8 as a big-endian 8-byte integer.


***Decode***
 * If A0 is between 0 and 240 inclusive, then the result is the value of A0.
 * If A0 is between 241 and 248 inclusive, then the result is 240+256*(A0-241)+A1.
 * If A0 is 249 then the result is 2288+256*A1+A2.
 * If A0 is 250 then the result is A1..A3 as a 3-byte big-endian integer.
 * If A0 is 251 then the result is A1..A4 as a 4-byte big-endian integer.
 * If A0 is 252 then the result is A1..A5 as a 5-byte big-endian integer.
 * If A0 is 253 then the result is A1..A6 as a 6-byte big-endian integer.
 * If A0 is 254 then the result is A1..A7 as a 7-byte big-endian integer.
 * If A0 is 255 then the result is A1..A8 as a 8-byte big-endian integer.

