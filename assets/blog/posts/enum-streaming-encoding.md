---
{
  "title": "String/Enum Streaming Encoding",
  "timestamp": 1675513309000,
  "tags": ["data-encoding"]
}
---

When you write data on disk there are a lot of strings (especially enums) that are the same over and over, wasting disk space and increasing transfer time. generic compression (e.g. zstd, gzip, ...) helps but we can do better knowing our data and what we can compress.

_The assumption here is that we cannot sort or know the input strings before writing it, we are just streaming items and encoding it on the fly._

let say that we have these strings as input
```
aaa00
aaa10
bbb
aaa00
ccc
```
Line 2 can be ancoded with a "prefix" of "aaa", line 4 can be encoded as a reference to line 1.
So we have 4 states an input can be "same as last", "already present", "never seen before", "has a common prefix with the previous item".

We can keep track of previous seen values with a simple Map mapping the string and its position.
the enumMapping() function input does a few checks and returns what to write.

```typescript
export enum EnumMapState { SAME_AS_LAST = 0, PRESENT = 1, INLINE = 2, PREFIX = 3 }
export type EnumMapping = {
  state: EnumMapState;
  spaceToBeUsed: number;
  prefix?: number;
  nameLenBytes: number;
  nameBytes: Uint8Array | number[];
};

function uintEncodeLE(value: number) {
  if (value === 0) return [0];
  const buf: number[] = [];
  while (value != 0) {
    buf.push(value & 0xff);
    value >>= 8;
  }
  return buf;
}

export function enumMapping(nameMap: Map<string, number[]>, lastName: string, currentName: string): EnumMapping {
  // if same as before...
  if (currentName == lastName) {
    return { state: EnumMapState.SAME_AS_LAST, spaceToBeUsed: 0, nameLenBytes: 0, nameBytes: [] };
  }

  // if already seen... (use index)
  const nameId = nameMap.get(currentName);
  if (nameId) {
    return { state: EnumMapState.PRESENT, spaceToBeUsed: nameId.length, nameLenBytes: nameId.length, nameBytes: nameId };
  }

  // if we have space in the map add the item
  const idBytes = uintEncodeLE(nameMap.size); // we use the already encoded "index" to simplify the write
  nameMap.set(currentName, idBytes);

  // if we have some prefix (limit prefix to 0xff)...
  const namePrefix = Math.min(prefix(lastName, currentName), 0xff);
  if (namePrefix > 2) {
    const nameBytes = convertToUtf8(currentName.substring(namePrefix));
    const nameLenBytes = intBytesWidth(nameBytes.length);
    return { state: EnumMapState.PREFIX, spaceToBeUsed: (1 + nameLenBytes + nameBytes.length), prefix: namePrefix, nameLenBytes, nameBytes };
  }

  // fully inline
  const nameBytes = convertToUtf8(currentName);
  const nameLenBytes = intBytesWidth(nameBytes.length);
  return { state: EnumMapState.INLINE, spaceToBeUsed: (nameLenBytes + nameBytes.length), nameLenBytes, nameBytes };
}
```
We can wrap the method above in a class that has the Map and the lastName.
```typescript
export class EnumMapper {
  private nameMap: Map<string, number[]>;
  private lastName: string;

  constructor() {
    this.nameMap = new Map();
    this.lastName = '';
  }

  reset(): void {
    this.nameMap.clear();
    this.lastName = '';
  }

  map(currentName: string): EnumMapping {
    const mapping = enumMapping(this.nameMap, this.lastName, currentName);
    this.lastName = currentName;
    return mapping;
  }

  async write(writer: RemoteBytesWriter | BytesWriter, mapping: EnumMapping): Promise<void> {
    if (mapping.nameLenBytes > 0) {
      if (mapping.prefix) {
        await writer.writeUint8(mapping.prefix);
      }
      if (mapping.state !== EnumMapState.PRESENT) {
        await writer.writeUint(mapping.nameBytes.length, mapping.nameLenBytes);
      }
    }
    await writer.writeUint8Array(mapping.nameBytes);
  }
}
```
At this point we can use the class to encode the items.
```typescript
const writer = new BytesWriter();
const enumMapper = new EnumMapper();
let mapping;

const items = ['aaa00', 'aaa10', 'bbb', 'aaa00', 'ccc'];
for (const item of items) {
  mapping = enumMapper.map(item);
  const head = (mapping.state << 3) | (mapping.nameLenBytes);
  await writer.writeUint8(head);
  await enumMapper.write(writer, mapping);
}
```

Similarly we can implement a reader class.
```typescript
export class EnumMappingReader {
  private names: string[];
  private lastName: string;

  constructor() {
    this.names = [];
    this.lastName = '';
  }

  reset(): void {
    this.names = [];
    this.lastName = '';
  }

  async read(reader: RemoteBytesReader | BytesReader, state: EnumMapState, nameLenWidth: number): Promise<string> {
    switch (state) {
      case EnumMapState.SAME_AS_LAST:
        break;
      case EnumMapState.PRESENT: {
        const streamId = await reader.readUint(nameLenWidth);
        this.lastName = this.names[streamId];
        break;
      }
      case EnumMapState.INLINE: {
        const nameLength = await reader.readUint(nameLenWidth);
        const name = await reader.readUint8Array(nameLength);
        this.lastName = convertFromUtf8(name);
        this.names.push(this.lastName);
        break;
      }
      case EnumMapState.PREFIX: {
        const prefix = await reader.readUint8();
        const nameLength = await reader.readUint(nameLenWidth);
        const name = await reader.readUint8Array(nameLength);
        this.lastName = this.lastName.substring(0, prefix) + convertFromUtf8(name);
        this.names.push(this.lastName);
        break;
      }
    }
    return this.lastName;
  }
}
```

and use it
```typescript
const reader = new BytesReader();
const enumReader = new EnumMappingReader();
let mapping;

for (const item of items) {
  const head = await reader.readUint8();
  const state = (head >> 3) & 3;
  const nameLenBytes = head & 7;
  await enumReader.read(reader, state, nameLenBytes);
}
```