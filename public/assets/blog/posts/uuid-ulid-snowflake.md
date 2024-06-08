---
{
  "title": "UUID, ULID, Snowflake IDs",
  "timestamp": 1685264554000,
  "tags": ["unique-id", "uuid", "ulid", "snowflake-id"]
}
---

UUIDs, or Universally Unique Identifiers, are 128-bit identifiers used to uniquely identify objects. They are designed to be globally unique across different machines and networks, making them suitable for scenarios where uniqueness is critical.

## UUID v4
Version 4 are the most common UUIDs and they are basically secure random data. which provides good distribution and makes the IDs hard to guess compared to Sequential IDs.

![UUID v4][uuid-v4]

### UUID v7
Version 7 UUIDs incorporate a timestamp along with some random data. They are great when time-based locality is required, or when you need the timestamp information inside your tokens.

![UUID v7][uuid-v7]

## ULID
ULID, or Universally Unique Lexicographically Sortable Identifier, are 128-bit identifiers similar to UUIDv7, with a 48bits timestamp to make them sort by time, and 80bit rand data (there is no versioning as UUIDs)

![ULID][ulid]

## Twitter Snowflake ID
A Twitter Snowflake Id is an 8 bytes block of data designed to be globally unique.
It contains a timestamp that is useful to roughly sort posts by creation time, A worker Id to identify the worker or machine generating the id, and a sequence number to resolve collisions of ids generated in the same millisecond.

![Twitter Snowflake ID][twitter-snowflake]

## Instagram Snowflake ID
Instagram also had its own variant this time using all the 64bits, with the same timestamp component, a larger id to identify the logical shard, and a shorter sequence number to resolve collisions.

_just few changes to the layout to expand the range of the worker/shard, but the concept was the same: being able to create uncoordinated short unique identifiers._

![Instagram Snowflake ID][instagram-snowflake]

---

Depending on the layout of the ID, the sort order will be different and that will give different properties to the IDs.

# Rand-Based IDs
Random-based IDs like the UUID v4 NanoId, Cuid2 and others provide good random data distribution.

this means that if we generate multiple IDs and insert them into the database they will be scattered around rather than clustered around a specific region.

This is great if your database is distributed, as you'll be able to leverage all the nodes, by distributing data and computation across them.

However, for a traditional single-machine database using a standard B+Tree the random distribution will lead to fragmentation and increased disk I/O affecting query performance.

![Rand-Based IDs][rand-ids]

# Time-Based IDs
On the other hand,
Time-Based Ids like ULID, UUID version 7 Snowflake Ids, XIDs and more... have a great Time-based data locality. This means that when we generate multiple IDs within the same time window, all the data will be closely clustered together.

If we have a single database machine from a Disk I/O and cache point of view this is great because we have fewer blocks to scan and keep in memory. we may end up with more contention on the locks when inserting/updating but it should be better than doing long index lookups and disk I/Os and if you are used to auto-increments RowIds there's not much difference.

However, if you are using a distributed database, the time-based locality is going to create hotspots ending up using just one or few machines instead of all the machines available. There are various techniques to mitigate this problem but this is a topic for another time.

![Time-Based IDs][time-ids]

https://youtu.be/2MbFDR7qt5U

[uuid-v4]: ${blog.baseUrl}/assets/blog/posts/imgs/uuid-v4.png
[uuid-v7]: ${blog.baseUrl}/assets/blog/posts/imgs/uuid-v7.png
[ulid]: ${blog.baseUrl}/assets/blog/posts/imgs/ulid.png
[twitter-snowflake]: ${blog.baseUrl}/assets/blog/posts/imgs/twitter-snowflake.png
[instagram-snowflake]: ${blog.baseUrl}/assets/blog/posts/imgs/instagram-snowflake.png
[rand-ids]: ${blog.baseUrl}/assets/blog/posts/imgs/rand-ids-distribution.png
[time-ids]: ${blog.baseUrl}/assets/blog/posts/imgs/time-ids-distribution.png
